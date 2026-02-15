import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export interface ReminderStatsData {
  totalReminders: number;
  avgRemindersPerActiveUser: number;
  recurringReminders: number;
  recurrencePercentage: number;
  missedReminders: number;
  missedReminderRate: number;
  avgLeadTimeHours: number;
  statusBreakdown: {
    pending: number;
    completed: number;
    missed: number;
    other: number;
  };
}

export async function GET() {
  try {
    // Get total reminders count
    const totalReminders = await prisma.reminders.count();

    // Get count of users who have at least one reminder (active users)
    const activeUsersCount = await prisma.reminders.groupBy({
      by: ['user_id'],
      _count: true
    });

    const numActiveUsers = activeUsersCount.length;
    const avgRemindersPerActiveUser = numActiveUsers > 0 
      ? Math.round((totalReminders / numActiveUsers) * 100) / 100 
      : 0;

    // Get count of recurring reminders
    const recurringReminders = await prisma.reminders.count({
      where: {
        recurrence: {
          not: null
        }
      }
    });

    const recurrencePercentage = totalReminders > 0 
      ? Math.round((recurringReminders / totalReminders) * 10000) / 100 
      : 0;

    // Get missed reminders (status != 'completed' and reminder_time < NOW())
    const now = new Date();
    const missedReminders = await prisma.reminders.count({
      where: {
        AND: [
          {
            status: {
              not: 'completed'
            }
          },
          {
            reminder_time: {
              lt: now
            }
          }
        ]
      }
    });

    const missedReminderRate = totalReminders > 0 
      ? Math.round((missedReminders / totalReminders) * 10000) / 100 
      : 0;

    // Calculate average lead time (reminder_time - created_at)
    const remindersWithTimes = await prisma.reminders.findMany({
      select: {
        reminder_time: true,
        created_at: true
      }
    });

    let totalLeadTimeMs = 0;
    for (const reminder of remindersWithTimes) {
      const leadTime = reminder.reminder_time.getTime() - reminder.created_at.getTime();
      totalLeadTimeMs += leadTime;
    }

    const avgLeadTimeMs = remindersWithTimes.length > 0 
      ? totalLeadTimeMs / remindersWithTimes.length 
      : 0;
    
    // Convert to hours and round to 2 decimal places
    const avgLeadTimeHours = Math.round((avgLeadTimeMs / (1000 * 60 * 60)) * 100) / 100;

    // Get status breakdown
    const statusGroups = await prisma.reminders.groupBy({
      by: ['status'],
      _count: true
    });

    const statusBreakdown = {
      pending: 0,
      completed: 0,
      missed: 0,
      other: 0
    };

    for (const group of statusGroups) {
      const status = group.status.toLowerCase();
      const count = group._count;
      
      if (status === 'pending') {
        statusBreakdown.pending = count;
      } else if (status === 'completed') {
        statusBreakdown.completed = count;
      } else if (status === 'missed') {
        statusBreakdown.missed = count;
      } else {
        statusBreakdown.other += count;
      }
    }

    const stats: ReminderStatsData = {
      totalReminders,
      avgRemindersPerActiveUser,
      recurringReminders,
      recurrencePercentage,
      missedReminders,
      missedReminderRate,
      avgLeadTimeHours,
      statusBreakdown,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching reminder stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch reminder statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
