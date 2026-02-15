'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserRank } from '@/app/api/dashboard/users/rank/route';

interface RankData {
  topCalendarEvents: UserRank[];
  topReminders: UserRank[];
  topMessageStreaks: UserRank[];
}

function RankItem({ rank, user }: { rank: number; user: UserRank }) {
  const displayName = user.name || user.email || user.user_id.slice(0, 8);
  
  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`
        flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm
        ${rank === 1 ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' : ''}
        ${rank === 2 ? 'bg-gray-400/20 text-gray-700 dark:text-gray-400' : ''}
        ${rank === 3 ? 'bg-orange-600/20 text-orange-700 dark:text-orange-400' : ''}
        ${rank > 3 ? 'bg-muted text-muted-foreground' : ''}
      `}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName}</p>
        {user.email && user.name && (
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        )}
      </div>
      <div className="text-sm font-semibold text-primary">
        {user.count.toLocaleString()}
      </div>
    </div>
  );
}

function RankCard({ 
  title, 
  description, 
  users, 
  loading 
}: { 
  title: string; 
  description: string; 
  users: UserRank[]; 
  loading: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {users.map((user, index) => (
          <RankItem key={user.user_id} rank={index + 1} user={user} />
        ))}
      </CardContent>
    </Card>
  );
}

export function UserRankAnalytics() {
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRankData() {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/users/rank');
        const result = await response.json();

        if (result.success && result.data) {
          setRankData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch user rank data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRankData();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <RankCard
        title="Top Calendar Events"
        description="Users with most calendar events"
        users={rankData?.topCalendarEvents || []}
        loading={loading}
      />
      <RankCard
        title="Top Reminders"
        description="Users with most reminders"
        users={rankData?.topReminders || []}
        loading={loading}
      />
      <RankCard
        title="Top Message Streaks"
        description="Longest consecutive days of messages"
        users={rankData?.topMessageStreaks || []}
        loading={loading}
      />
    </div>
  );
}
