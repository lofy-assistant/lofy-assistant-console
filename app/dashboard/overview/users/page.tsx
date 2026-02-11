'use client';

import { useEffect, useState } from 'react';
import { UserDistributionData } from '@/app/api/dashboard/users/distribution/route';
import { UserDistributionTable } from '@/components/dashboard/users/user-distribution-table';
import { Card } from '@/components/ui/card';

export default function Page() {
  const [data, setData] = useState<UserDistributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/users/distribution');

        if (!response.ok) {
          throw new Error('Failed to fetch user distribution data');
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Detailed Breakdown</h1>
        <div className="flex items-center justify-center h-48">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Detailed Breakdown</h1>
        <Card className="p-6">
          <div className="text-destructive">Error: {error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">User Distribution by Country</h1>
      <UserDistributionTable data={data} />
    </div>
  );
}
