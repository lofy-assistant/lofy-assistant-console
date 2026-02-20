"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

interface HourlyActivity {
  hour: number;
  messages: number;
}

interface MessageAnalytics {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  messagesThisWeek: number;
  averageResponseTimeMs: number | null;
  averageResponseTimeSeconds: number | null;
  hourlyActivity: HourlyActivity[];
}

const chartConfig = {
  messages: {
    label: "Messages",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function MessagesGraph() {
  const [analytics, setAnalytics] = useState<MessageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/dashboard/messages/graph");
      const result = await response.json();
      
      if (result.success && result.data) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch message analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Card className="py-4">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] sm:h-[280px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const chartData = analytics.hourlyActivity;
  
  // Find peak hour
  const peakHour = chartData.reduce((max, current) => 
    current.messages > max.messages ? current : max
  , chartData[0]);

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const peakHourLabel = formatHour(peakHour.hour);
  const totalMessages = chartData.reduce((sum, item) => sum + item.messages, 0);

  return (
    <Card className="transition-all hover:shadow-md py-4 flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Activity by Time of Day
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              See when you&apos;re most active throughout the day
            </CardDescription>
          </div>
          {totalMessages > 0 && (
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span className="text-muted-foreground">Peak:</span>
              <span className="font-semibold text-primary">
                {peakHourLabel}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer
          config={chartConfig}
          className="h-[200px] sm:h-[280px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={
              isMobile
                ? { top: 10, right: 10, left: -20, bottom: 0 }
                : { top: 10, right: 30, left: 0, bottom: 0 }
            }
          >
            <defs>
              <linearGradient
                id="messagesGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="var(--color-chart-1)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-chart-1)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              className="stroke-muted/50"
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={isMobile ? 5 : 2}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickFormatter={(value) =>
                isMobile
                  ? `${value}h`
                  : `${String(value).padStart(2, "0")}:00`
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 30 : 40}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const hour = payload?.[0]?.payload?.hour;
                    if (hour === undefined || hour === null) return "";
                    const period = hour >= 12 ? "PM" : "AM";
                    const displayHour =
                      hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                    return `${displayHour}:00 ${period}`;
                  }}
                />
              }
              cursor={{
                stroke: "var(--color-chart-1)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            <Area
              type="monotone"
              dataKey="messages"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              fill="url(#messagesGradient)"
              dot={false}
              activeDot={{
                r: isMobile ? 4 : 6,
                fill: "var(--color-chart-1)",
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ChartContainer>

        {/* Mobile-friendly time period indicators */}
        <div className="flex justify-between mt-2 px-2 text-[10px] sm:text-xs text-muted-foreground">
          <span>🌙 Night</span>
          <span>🌅 Morning</span>
          <span>☀️ Afternoon</span>
          <span>🌆 Evening</span>
        </div>
      </CardContent>
    </Card>
  );
}