"use client";

import { useEffect, useState } from "react";
import { UserDistributionData } from "@/app/api/dashboard/users/distribution/route";
import { UserDistributionTable } from "@/components/dashboard/users/user-distribution-table";
import { Card } from "@/components/ui/card";
import { ChartOnboardingPie } from "@/components/dashboard/users/pie-chart-legend";
import { UserStats } from "@/components/dashboard/users/stats";

export default function Page() {
  const [data, setData] = useState<UserDistributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q1Data, setQ1Data] = useState<{ name: string; value: number }[] | null>(null);
  const [q2Data, setQ2Data] = useState<{ name: string; value: number }[] | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard/users/distribution");

        if (!response.ok) {
          throw new Error("Failed to fetch user distribution data");
        }

        const result = await response.json();

        if (result.success) {
          setData(result.data);
          
          // Fetch chart-aggregated data
          try {
            const res = await fetch('/api/dashboard/users/chart')
            if (res.ok) {
              const json = await res.json()
              if (json.success) {
                setQ1Data(json.q1 ?? null)
                setQ2Data(json.q2 ?? null)
              }
            }
          } catch {
            // Ignore chart fetch errors; chart will fallback to sample data
          }
        } else {
          throw new Error(result.error || "Unknown error");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Learn about the users.</h1>
        <div className="flex items-center justify-center h-48">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Learn about the users.</h1>
        <Card className="p-6">
          <div className="text-destructive">Error: {error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-lg font-bold mb-6">Learn about the users.</h1>
      <div className="mb-6">
        <UserStats />
      </div>
      <div className="mb-6">
        <ChartOnboardingPie 
          q1Data={q1Data ?? undefined} 
          q2Data={q2Data ?? undefined} 
        />
      </div>
      <UserDistributionTable data={data} />
    </div>
  );
}
