import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { connectMongo } from "@/lib/database";
import Message from "@/lib/models/Message";
import DomainEvent from "@/lib/models/Domain_Event";
import User from "@/lib/models/User";

export interface UserStatsData {
  totalUsers: number;
  usersWithCompleteRegistration: number;
  completionPercentage: number;
  inactiveUsers: number;
  newUsers: number;
  avgTimeToFirstActionSeconds: number;
  usersWithFirstAction: number;
  usersWithoutFirstAction: number;
}

export async function GET(request: Request) {
  try {
    // Get days parameter from query string (default to 14)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '14', 10);

    // Get total users count
    const totalUsers = await prisma.users.count();

    // Get users with complete registration (have pin OR email)
    const usersWithCompleteRegistration = await prisma.users.count({
      where: {
        OR: [{ pin: { not: null } }, { email: { not: null } }],
      },
    });

    // Calculate completion percentage
    const completionPercentage =
      totalUsers > 0 ? (usersWithCompleteRegistration / totalUsers) * 100 : 0;

    // Get inactive users (users whose LAST message is older than X days ago)
    await connectMongo();
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    // Use aggregation to find users whose most recent message is within the X day window
    // (users who have been inactive for at least X days)
    const inactiveUsersResult = await Message.aggregate([
      {
        // Only consider messages from users (not assistant)
        $match: { role: "user" }
      },
      {
        // Group by user_id and get their latest message timestamp
        $group: {
          _id: "$user_id",
          lastMessageDate: { $max: "$created_at" }
        }
      },
      {
        // Filter to users whose last message is at or before the threshold
        $match: {
          lastMessageDate: { $lte: daysAgo }
        }
      },
      {
        // Count the results
        $count: "inactiveCount"
      }
    ]);

    const inactiveCount = inactiveUsersResult.length > 0 ? inactiveUsersResult[0].inactiveCount : 0;

    // Get new users (users created within the last X days) from Mongo `users` collection
    // Note: Mongo users collection stores timestamps as `created_at` (snake_case)
    const newUsers = await User.countDocuments({ created_at: { $gte: daysAgo } });

    // connected to MongoDB via `connectMongo()` above

    // total users in Mongo (use for computing usersWithoutFirstAction)
    const mongoTotalUsers = await User.countDocuments();

    // --- Time to first action (server-side Mongo aggregation) ---
    // Aggregate domain events to get earliest event per user, join with Mongo `users` collection
    // to obtain `createdAt`, compute per-user delta, then compute total and average.
    let usersWithFirstAction = 0;
    let totalDeltaMs = 0;
    try {
      const firstActionAgg = await DomainEvent.aggregate([
        // group to get earliest domain event per user
        { $group: { _id: "$user_id", firstActionDate: { $min: "$created_at" } } },
        // join with users collection in Mongo (users collection stores `user_id` and `createdAt`)
        { $lookup: { from: "users", localField: "_id", foreignField: "user_id", as: "user" } },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: false } },
        // compute delta in milliseconds (firstAction - user.created_at)
        { $project: { deltaMs: { $subtract: ["$firstActionDate", "$user.created_at"] } } },
        // only consider non-negative deltas (ignore anomalous events before creation)
        { $match: { deltaMs: { $gte: 0 } } },
        // accumulate count and total delta
        { $group: { _id: null, usersWithFirstAction: { $sum: 1 }, totalDeltaMs: { $sum: "$deltaMs" } } }
      ]).allowDiskUse(true);

      if (firstActionAgg && firstActionAgg.length > 0) {
        usersWithFirstAction = firstActionAgg[0].usersWithFirstAction || 0;
        totalDeltaMs = firstActionAgg[0].totalDeltaMs || 0;
      }
    } catch (aggErr) {
      console.error("Time-to-first-action aggregation failed:", aggErr);
      // fallback to zero values so the rest of the stats still return
      usersWithFirstAction = 0;
      totalDeltaMs = 0;
    }

    const usersWithoutFirstAction = Math.max(0, mongoTotalUsers - usersWithFirstAction);
    const avgTimeToFirstActionSeconds = usersWithFirstAction > 0 ? Math.round((totalDeltaMs / usersWithFirstAction) / 1000) : 0;

    const stats: UserStatsData = {
      totalUsers,
      usersWithCompleteRegistration,
      completionPercentage: Math.round(completionPercentage * 100) / 100, // Round to 2 decimal places
      inactiveUsers: inactiveCount,
      newUsers,
      avgTimeToFirstActionSeconds,
      usersWithFirstAction,
      usersWithoutFirstAction,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
