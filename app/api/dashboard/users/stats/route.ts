import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export interface UserStatsData {
  totalUsers: number;
  usersWithCompleteRegistration: number;
  completionPercentage: number;
}

export async function GET() {
  try {
    // Get total users count
    const totalUsers = await prisma.users.count();

    // Get users with complete registration (have pin OR email)
    const usersWithCompleteRegistration = await prisma.users.count({
      where: {
        OR: [
          { pin: { not: null } },
          { email: { not: null } }
        ]
      }
    });

    // Calculate completion percentage
    const completionPercentage = totalUsers > 0 
      ? (usersWithCompleteRegistration / totalUsers) * 100 
      : 0;

    const stats: UserStatsData = {
      totalUsers,
      usersWithCompleteRegistration,
      completionPercentage: Math.round(completionPercentage * 100) / 100, // Round to 2 decimal places
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
