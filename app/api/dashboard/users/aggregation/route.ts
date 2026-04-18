import { NextResponse } from "next/server";
import { prisma, connectMongo } from "@/lib/database";
import Message from "@/lib/models/Message";
import User from "@/lib/models/User";

export interface UserStatsData {
  totalUsers: number;
  usersWithCompleteRegistration: number;
  completionPercentage: number;
  inactiveUsers: number;
  newUsers: number;
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

    const stats: UserStatsData = {
      totalUsers,
      usersWithCompleteRegistration,
      completionPercentage: Math.round(completionPercentage * 100) / 100, // Round to 2 decimal places
      inactiveUsers: inactiveCount,
      newUsers,
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
