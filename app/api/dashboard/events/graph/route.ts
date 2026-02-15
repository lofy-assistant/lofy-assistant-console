import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export interface EventDataPoint {
  date: string;
  count: number;
}

export interface EventGraphData {
  dataPoints: EventDataPoint[];
  period: string;
  total: number;
}

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

function getDateRange(period: Period): { start: Date; groupFormat: string } {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case 'day':
      // Last 24 hours, group by hour
      start.setHours(now.getHours() - 24);
      return { start, groupFormat: 'hour' };
    case 'week':
      // Last 7 days, group by day
      start.setDate(now.getDate() - 7);
      return { start, groupFormat: 'day' };
    case 'month':
      // Last 30 days, group by day
      start.setDate(now.getDate() - 30);
      return { start, groupFormat: 'day' };
    case 'year':
      // Last 12 months, group by month
      start.setMonth(now.getMonth() - 12);
      return { start, groupFormat: 'month' };
    case 'all':
      // All time, group by month
      start.setFullYear(2020, 0, 1); // Start from 2020
      return { start, groupFormat: 'month' };
    default:
      // Default to last 7 days
      start.setDate(now.getDate() - 7);
      return { start, groupFormat: 'day' };
  }
}

function formatDate(date: Date, format: string): string {
  switch (format) {
    case 'hour':
      return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:00`;
    case 'day':
      return `${date.getMonth() + 1}/${date.getDate()}`;
    case 'month':
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    default:
      return date.toISOString().split('T')[0];
  }
}

function generateDateLabels(period: Period, start: Date, end: Date): string[] {
  const labels: string[] = [];
  const current = new Date(start);
  const { groupFormat } = getDateRange(period);

  while (current <= end) {
    labels.push(formatDate(current, groupFormat));
    
    switch (groupFormat) {
      case 'hour':
        current.setHours(current.getHours() + 1);
        break;
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
    }
  }

  return labels;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'week') as Period;

    const { start, groupFormat } = getDateRange(period);
    const end = new Date();

    // Fetch all calendar events in the date range
    const events = await prisma.calendar_events.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end
        }
      },
      select: {
        created_at: true
      },
      orderBy: {
        created_at: 'asc'
      }
    });

    // Group events by the appropriate time period
    const groupedData = new Map<string, number>();
    
    for (const event of events) {
      const key = formatDate(event.created_at, groupFormat);
      groupedData.set(key, (groupedData.get(key) || 0) + 1);
    }

    // Generate all date labels in the range
    const allLabels = generateDateLabels(period, start, end);
    
    // Create data points with zero-filled values
    const dataPoints: EventDataPoint[] = allLabels.map(label => ({
      date: label,
      count: groupedData.get(label) || 0
    }));

    const graphData: EventGraphData = {
      dataPoints,
      period,
      total: events.length
    };

    return NextResponse.json({
      success: true,
      data: graphData,
    });
  } catch (error) {
    console.error("Error fetching event graph data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch event graph data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
