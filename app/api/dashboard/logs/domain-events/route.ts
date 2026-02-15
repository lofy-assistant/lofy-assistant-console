import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/database";
import DomainEvent from "@/lib/models/Domain_Event";

export interface DomainEventData {
  event_id: string;
  event_type: string;
  user_id: string;
  data: Record<string, unknown>;
  event_metadata: {
    correlation_id: string;
    causation_id?: string | null;
    source: string;
    user_message?: string;
  };
  created_at: Date;
}

export interface DomainEventsResponse {
  events: DomainEventData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const eventType = searchParams.get('eventType') || '';
    const userId = searchParams.get('userId') || '';
    const source = searchParams.get('source') || '';

    await connectMongo();

    // Build filter
    const filter: Record<string, unknown> = {};
    if (eventType) filter.event_type = eventType;
    if (userId) filter.user_id = userId;
    if (source) filter['event_metadata.source'] = source;

    // Get total count
    const total = await DomainEvent.countDocuments(filter);

    // Get paginated events
    const events = await DomainEvent.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const totalPages = Math.ceil(total / pageSize);

    const response: DomainEventsResponse = {
      events: events as DomainEventData[],
      total,
      page,
      pageSize,
      totalPages,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching domain events:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch domain events",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
