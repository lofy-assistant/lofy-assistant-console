import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export interface EventStatsData {
  totalEvents: number;
  recentEvents: number;
  avgEventsPerActiveUser: number;
  eventsWithRecurrence: number;
  recurrencePercentage: number;
  recurrenceBreakdown: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
    other: number;
  };
}

// Parse RRULE string to extract frequency
function parseRecurrenceType(rrule: string | null): string {
  if (!rrule) return 'none';
  
  const freqMatch = rrule.match(/FREQ=(\w+)/i);
  if (!freqMatch) return 'other';
  
  const freq = freqMatch[1].toUpperCase();
  if (freq === 'DAILY') return 'daily';
  if (freq === 'WEEKLY') return 'weekly';
  if (freq === 'MONTHLY') return 'monthly';
  if (freq === 'YEARLY') return 'yearly';
  return 'other';
}

export async function GET(request: Request) {
  try {
    // Get days parameter from query string (default to 14)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '14', 10);

    // Get total calendar events count
    const totalEvents = await prisma.calendar_events.count();

    // Get events created in the last X days
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    const recentEvents = await prisma.calendar_events.count({
      where: {
        created_at: {
          gte: daysAgo
        }
      }
    });

    // Get count of users who have at least one event (active users)
    const activeUsersCount = await prisma.calendar_events.groupBy({
      by: ['user_id'],
      _count: true
    });

    const numActiveUsers = activeUsersCount.length;
    const avgEventsPerActiveUser = numActiveUsers > 0 
      ? Math.round((totalEvents / numActiveUsers) * 100) / 100 
      : 0;

    // Get all events with recurrence to analyze
    const eventsWithRecurrenceData = await prisma.calendar_events.findMany({
      where: {
        recurrence: {
          not: null
        }
      },
      select: {
        recurrence: true
      }
    });

    const eventsWithRecurrence = eventsWithRecurrenceData.length;
    const recurrencePercentage = totalEvents > 0 
      ? Math.round((eventsWithRecurrence / totalEvents) * 10000) / 100 
      : 0;

    // Parse and categorize recurrence types
    const recurrenceBreakdown = {
      daily: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0,
      other: 0
    };

    for (const event of eventsWithRecurrenceData) {
      const type = parseRecurrenceType(event.recurrence);
      if (type === 'daily') recurrenceBreakdown.daily++;
      else if (type === 'weekly') recurrenceBreakdown.weekly++;
      else if (type === 'monthly') recurrenceBreakdown.monthly++;
      else if (type === 'yearly') recurrenceBreakdown.yearly++;
      else recurrenceBreakdown.other++;
    }

    const stats: EventStatsData = {
      totalEvents,
      recentEvents,
      avgEventsPerActiveUser,
      eventsWithRecurrence,
      recurrencePercentage,
      recurrenceBreakdown,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching event stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch event statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
