import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

export interface LlmTokenUsageRecord {
  id: string;
  user_id: string;
  call_type: string;
  model: string;
  tokens_system_prompt: number | null;
  tokens_session_context: number | null;
  tokens_conversation_history: number | null;
  tokens_tools_schema: number | null;
  tokens_total_input: number | null;
  tokens_total_output: number | null;
  created_at: Date;
}

export interface LlmTokenUsageResponse {
  records: LlmTokenUsageRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");
    const userId = searchParams.get("userId") || "";
    const model = searchParams.get("model") || "";
    const callType = searchParams.get("callType") || "";

    const where = {
      ...(userId ? { user_id: userId } : {}),
      ...(model ? { model: { contains: model, mode: "insensitive" as const } } : {}),
      ...(callType ? { call_type: { contains: callType, mode: "insensitive" as const } } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.llm_token_usage.count({ where }),
      prisma.llm_token_usage.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    // BigInt id must be serialized to string
    const records: LlmTokenUsageRecord[] = rows.map((r) => ({
      ...r,
      id: r.id.toString(),
    }));

    const response: LlmTokenUsageResponse = {
      records,
      total,
      page,
      pageSize,
      totalPages,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Error fetching LLM token usage:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch LLM token usage",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
