import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/database';
import Message from '@/lib/models/Message';

export interface HourlyActivity {
  hour: number;
  messages: number;
}

export interface MessageGraph {
  hourlyActivity: HourlyActivity[];
}

export async function GET() {
  try {
    await connectMongo();

    // Calculate hourly activity in UTC+8 timezone
    const hourlyActivityData = await Message.aggregate([
      {
        $project: {
          // Add 8 hours to convert UTC to UTC+8
          localTime: { $add: ['$created_at', 8 * 60 * 60 * 1000] }
        }
      },
      {
        $project: {
          hour: { $hour: '$localTime' }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Create array with all 24 hours (0-23), filling in zeros for hours with no messages
    const hourlyActivity: HourlyActivity[] = Array.from({ length: 24 }, (_, hour) => {
      const data = hourlyActivityData.find(item => item._id === hour);
      return {
        hour,
        messages: data ? data.count : 0
      };
    });

    const graphData: MessageGraph = {
      hourlyActivity,
    };

    return NextResponse.json({
      success: true,
      data: graphData,
    });
  } catch (error) {
    console.error('Error fetching message graph data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch message graph data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
