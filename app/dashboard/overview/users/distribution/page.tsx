"use client";

import { useEffect, useState } from "react";
import { UserDistributionData } from "@/app/api/dashboard/users/distribution/route";
import { UserDistributionTable } from "@/components/dashboard/users/user-distribution-table";
// import { UserGraph } from "@/components/dashboard/users/graph";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [data, setData] = useState<UserDistributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [q1Data, setQ1Data] = useState<{ name: string; value: number }[] | null>(null);
  // const [q2Data, setQ2Data] = useState<{ name: string; value: number }[] | null>(null);

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
          // try {
          //   const res = await fetch('/api/dashboard/users/aggregation');
          //   if (res.ok) {
          //     const json = await res.json()
          //     if (json.success) {
          //       setQ1Data(json.q1 ?? null)
          //       setQ2Data(json.q2 ?? null)
          //     }
          //   }
          // } catch {
          //   // Ignore chart fetch errors; chart will fallback to sample data
          // }
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
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/overview/users')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 mr-2"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back
          </Button>
          <h1 className="text-lg font-bold">User Distribution</h1>
        </div>
        <div className="flex items-center justify-center h-48">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/overview/users')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 mr-2"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Back
          </Button>
          <h1 className="text-lg font-bold">User Distribution</h1>
        </div>
        <Card className="p-6">
          <div className="text-destructive">Error: {error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/overview/users')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 mr-2"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Back
        </Button>
        <h1 className="text-lg font-bold">User Distribution</h1>
      </div>
      
      {/* <div className="mb-6">
        <UserGraph
          q1Data={q1Data ?? undefined} 
          q2Data={q2Data ?? undefined} 
        />
      </div> */}
      
      <UserDistributionTable data={data} />
    </div>
  );
}
