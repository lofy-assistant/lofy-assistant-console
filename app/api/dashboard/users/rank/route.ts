import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { connectMongo } from "@/lib/database";
import Message from "@/lib/models/Message";
import User from "@/lib/models/User";

export interface UserRank {
  user_id: string;
  name: string | null;
  email: string | null;
  count: number;
}

export interface RankData {
  topCalendarEvents: UserRank[];
  topReminders: UserRank[];
  topMessageStreaks: UserRank[];
}

// Convert UTC date to local date string in user's timezone
function getLocalDateString(utcDate: Date, timezone: string): string {
  try {
    // Use Intl.DateTimeFormat to convert to local timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = formatter.formatToParts(utcDate);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    
    return `${year}-${month}-${day}`;
  } catch {
    // Fallback to UTC if timezone is invalid
    const date = new Date(utcDate);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }
}

// Calculate longest streak of consecutive days for a user's messages
function calculateLongestStreak(messages: { created_at: Date }[], timezone: string): number {
  if (messages.length === 0) return 0;

  // Get unique dates in user's local timezone
  const uniqueDates = new Set(
    messages.map(msg => getLocalDateString(msg.created_at, timezone))
  );

  const dateArray = Array.from(uniqueDates).sort();
  
  if (dateArray.length === 0) return 0;

  let currentStreak = 1;
  let maxStreak = 1;

  for (let i = 1; i < dateArray.length; i++) {
    const prevDate = new Date(dateArray[i - 1]);
    const currDate = new Date(dateArray[i]);
    
    // Calculate difference in days
    const diffTime = currDate.getTime() - prevDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      // Reset streak
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export async function GET() {
  try {
    // Fetch top 10 users with most calendar events
    const topCalendarEventsRaw = await prisma.$queryRaw<Array<{
      user_id: string;
      name: string | null;
      email: string | null;
      event_count: bigint;
    }>>`
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        COUNT(ce.id) as event_count
      FROM users u
      LEFT JOIN calendar_events ce ON u.id = ce.user_id
      GROUP BY u.id, u.name, u.email
      HAVING COUNT(ce.id) > 0
      ORDER BY event_count DESC
      LIMIT 10
    `;

    const topCalendarEvents: UserRank[] = topCalendarEventsRaw.map(row => ({
      user_id: row.user_id,
      name: row.name,
      email: row.email,
      count: Number(row.event_count),
    }));

    // Fetch top 10 users with most reminders
    const topRemindersRaw = await prisma.$queryRaw<Array<{
      user_id: string;
      name: string | null;
      email: string | null;
      reminder_count: bigint;
    }>>`
      SELECT 
        u.id as user_id,
        u.name,
        u.email,
        COUNT(r.id) as reminder_count
      FROM users u
      LEFT JOIN reminders r ON u.id = r.user_id
      GROUP BY u.id, u.name, u.email
      HAVING COUNT(r.id) > 0
      ORDER BY reminder_count DESC
      LIMIT 10
    `;

    const topReminders: UserRank[] = topRemindersRaw.map(row => ({
      user_id: row.user_id,
      name: row.name,
      email: row.email,
      count: Number(row.reminder_count),
    }));

    // Fetch message streaks from MongoDB
    await connectMongo();

    // Get user messages with role="user"
    const userMessages = await Message.aggregate([
      {
        $match: { role: 'user' }
      },
      {
        $group: {
          _id: "$user_id",
          messages: {
            $push: { created_at: "$created_at" }
          }
        }
      }
    ]);

    // Get timezones from MongoDB User collection
    const mongoUsers = await User.find({}, { user_id: 1, timezone: 1 }).lean();
    const userTimezoneMap = new Map(
      mongoUsers.map(u => [u.user_id, u.timezone || 'UTC'])
    );

    // Calculate streaks for each user using their timezone
    const userStreaks = userMessages
      .map(user => {
        const timezone = userTimezoneMap.get(user._id) || 'UTC';
        
        return {
          user_id: user._id,
          streak: calculateLongestStreak(user.messages, timezone),
        };
      })
      .filter(user => user.streak > 0)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 10);

    // Get user details from PostgreSQL for the top streak users
    const streakUserIds = userStreaks.map(u => u.user_id);
    
    const streakUsers = await prisma.users.findMany({
      where: {
        id: {
          in: streakUserIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
      }
    });

    const streakUserMap = new Map(streakUsers.map(u => [u.id, u]));

    const topMessageStreaks: UserRank[] = userStreaks.map(streak => {
      const user = streakUserMap.get(streak.user_id);
      return {
        user_id: streak.user_id,
        name: user?.name || null,
        email: user?.email || null,
        count: streak.streak,
      };
    });

    const rankData: RankData = {
      topCalendarEvents,
      topReminders,
      topMessageStreaks,
    };

    return NextResponse.json({
      success: true,
      data: rankData,
    });
  } catch (error) {
    console.error("Error fetching user rank data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user rank data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
