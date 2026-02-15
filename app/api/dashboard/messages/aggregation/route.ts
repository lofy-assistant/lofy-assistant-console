import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/database';
import Message from '@/lib/models/Message';

export interface MessageAggregation {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  messagesThisWeek: number;
  averageResponseTimeMs: number | null;
  averageResponseTimeSeconds: number | null;
}

export async function GET() {
  try {
    await connectMongo();

    // Get total messages and breakdown by role
    const totalMessages = await Message.countDocuments();
    const userMessages = await Message.countDocuments({ role: 'user' });
    const assistantMessages = await Message.countDocuments({ role: 'assistant' });

    // Get messages from this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const messagesThisWeek = await Message.countDocuments({
      created_at: { $gte: oneWeekAgo }
    });

    // Calculate average response time
    // Fetch all messages sorted by user_id and created_at
    const messages = await Message.find({})
      .sort({ user_id: 1, created_at: 1 })
      .select('user_id role created_at')
      .lean();

    let totalResponseTime = 0;
    let responseCount = 0;

    // Group messages by user_id and calculate response times
    const messagesByUser: Record<string, Array<{ role: string; created_at: Date }>> = {};
    
    for (const msg of messages) {
      if (!messagesByUser[msg.user_id]) {
        messagesByUser[msg.user_id] = [];
      }
      messagesByUser[msg.user_id].push({
        role: msg.role,
        created_at: msg.created_at
      });
    }

    // Calculate response times for each user's conversation
    for (const userId in messagesByUser) {
      const userMessages = messagesByUser[userId];
      
      for (let i = 0; i < userMessages.length - 1; i++) {
        const current = userMessages[i];
        const next = userMessages[i + 1];
        
        // Find user message followed by assistant message
        if (current.role === 'user' && next.role === 'assistant') {
          const responseTime = next.created_at.getTime() - current.created_at.getTime();
          totalResponseTime += responseTime;
          responseCount++;
        }
      }
    }

    const averageResponseTimeMs = responseCount > 0 ? totalResponseTime / responseCount : null;
    const averageResponseTimeSeconds = averageResponseTimeMs ? averageResponseTimeMs / 1000 : null;

    const aggregation: MessageAggregation = {
      totalMessages,
      userMessages,
      assistantMessages,
      messagesThisWeek,
      averageResponseTimeMs,
      averageResponseTimeSeconds,
    };

    return NextResponse.json({
      success: true,
      data: aggregation,
    });
  } catch (error) {
    console.error('Error fetching message aggregation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch message aggregation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
