import { NextResponse } from 'next/server';
import { prisma, ensureDbConnections } from '@/lib/database';
import { getSessionFromCookie } from '@/lib/session';

export interface MemoryAggregation {
	totalMemories: number;
	avgMemoriesPerUser: number;
	usersWithMemories: number;
	totalUsers: number;
	percentageUsersWithMemories: number;
}

export async function GET() {
	try {
		await ensureDbConnections();

		const session = await getSessionFromCookie();
		if (!session) {
			return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
		}

		// Total memories across all users
		const totalMemoriesResult = await prisma.memories.count();

		// Count distinct users with at least 1 memory
		const usersWithMemoriesResult: Array<{ count: bigint }> = await prisma.$queryRaw`
			SELECT COUNT(DISTINCT user_id) as count
			FROM memories
		`;
		const usersWithMemories = Number(usersWithMemoriesResult?.[0]?.count ?? 0);

		// Total users in the system
		const totalUsers = await prisma.users.count();

		// Calculate average memories per user (only active users with memories)
		const avgMemoriesPerUser = usersWithMemories > 0 
			? totalMemoriesResult / usersWithMemories 
			: 0;

		// Calculate percentage of users using memories feature
		const percentageUsersWithMemories = totalUsers > 0 
			? (usersWithMemories / totalUsers) * 100 
			: 0;

		const aggregation: MemoryAggregation = {
			totalMemories: totalMemoriesResult,
			avgMemoriesPerUser: Math.round(avgMemoriesPerUser * 100) / 100, // 2 decimal places
			usersWithMemories,
			totalUsers,
			percentageUsersWithMemories: Math.round(percentageUsersWithMemories * 100) / 100, // 2 decimal places
		};

		return NextResponse.json({ success: true, data: aggregation });
	} catch (error) {
		console.error('Error fetching memories aggregation:', error);
		return NextResponse.json(
			{
				success: false,
				error: 'Failed to fetch memories aggregation',
				details: error instanceof Error ? error.message : 'Unknown error',
			},
			{ status: 500 }
		);
	}
}

