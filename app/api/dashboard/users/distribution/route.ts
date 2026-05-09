import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/database';
import User from '@/lib/models/User';
import { getCountryFromTimezone } from '@/lib/timezone-mapping';

export interface UserDistributionData {
  country: string;
  countryCode: string;
  continent: string;
  region: string;
  userCount: number;
  percentage: number;
}

export async function GET() {
  try {
    await connectMongo();

    // Fetch all users with their timezones
    const users = await User.find({}, { timezone: 1, _id: 0 }).lean();

    // Aggregate users by country
    const countryMap = new Map<string, {
      country: string;
      countryCode: string;
      continent: string;
      region: string;
      count: number;
    }>();

    let totalUsers = 0;
    let unmappedUsers = 0;

    users.forEach((user: { timezone?: string }) => {
      const countryData = getCountryFromTimezone(user.timezone);
      
      if (countryData) {
        totalUsers++;
        const key = countryData.code;
        
        if (countryMap.has(key)) {
          const existing = countryMap.get(key)!;
          existing.count++;
        } else {
          countryMap.set(key, {
            country: countryData.name,
            countryCode: countryData.code,
            continent: countryData.continent,
            region: countryData.region,
            count: 1,
          });
        }
      } else {
        unmappedUsers++;
      }
    });

    // Convert to array and calculate percentages
    const distribution: UserDistributionData[] = Array.from(countryMap.values()).map(item => ({
      country: item.country,
      countryCode: item.countryCode,
      continent: item.continent,
      region: item.region,
      userCount: item.count,
      percentage: totalUsers > 0 ? (item.count / totalUsers) * 100 : 0,
    }));

    // Sort by user count descending
    distribution.sort((a, b) => b.userCount - a.userCount);

    return NextResponse.json({
      success: true,
      data: distribution,
      metadata: {
        totalUsers,
        uniqueCountries: distribution.length,
        unmappedUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching user distribution:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch user distribution',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
