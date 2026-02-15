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
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { XAxis, YAxis, CartesianGrid, Line, LineChart } from 'recharts';
import { ButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface ReminderDataPoint {
  date: string;
  count: number;
}

interface ReminderGraphData {
  dataPoints: ReminderDataPoint[];
  period: string;
  total: number;
}

type Period = 'day' | 'week' | 'month' | 'year' | 'all';

const chartConfig = {
  count: {
    label: 'Reminders',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const periodLabels = {
  day: 'Last 24 Hours',
  week: 'Last 7 Days',
  month: 'Last 30 Days',
  year: 'Last 12 Months',
  all: 'All Time'
};

export function ReminderGraph() {
  const [graphData, setGraphData] = useState<ReminderGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('week');
  const isMobile = useIsMobile();

  const fetchGraphData = async (selectedPeriod: Period) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dashboard/reminder/graph?period=${selectedPeriod}`);
      const result = await response.json();

      if (result.success && result.data) {
        setGraphData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch reminder graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphData(period);
  }, [period]);

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };

  if (loading) {
    return (
      <Card className="py-4">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] sm:h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!graphData || graphData.dataPoints.length === 0) {
    return (
      <Card className="py-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base sm:text-lg">
            Reminders Created Over Time
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            No reminder data available
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = graphData.dataPoints;
  const maxCount = Math.max(...chartData.map(d => d.count), 1);
  const peakPoint = chartData.reduce((max, current) =>
    current.count > max.count ? current : max
  , chartData[0]);

  return (
    <Card className="transition-all hover:shadow-md py-4 flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-base sm:text-lg">
              Reminders Created Over Time
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              {periodLabels[period]} • Total: {graphData.total.toLocaleString()} reminders
            </CardDescription>
          </div>
          <ButtonGroup className="self-start">
            <Button
              variant={period === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('day')}
              className="text-xs px-2 sm:px-3"
            >
              D
            </Button>
            <Button
              variant={period === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('week')}
              className="text-xs px-2 sm:px-3"
            >
              W
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('month')}
              className="text-xs px-2 sm:px-3"
            >
              M
            </Button>
            <Button
              variant={period === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('year')}
              className="text-xs px-2 sm:px-3"
            >
              Y
            </Button>
            <Button
              variant={period === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePeriodChange('all')}
              className="text-xs px-2 sm:px-3"
            >
              All
            </Button>
          </ButtonGroup>
        </div>
        {peakPoint.count > 0 && (
          <div className="flex items-center gap-2 text-xs sm:text-sm mt-2">
            <span className="text-muted-foreground">Peak:</span>
            <span className="font-semibold text-primary">
              {peakPoint.date} ({peakPoint.count} reminders)
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        <ChartContainer
          config={chartConfig}
          className="h-[200px] sm:h-[300px] w-full"
        >
          <LineChart
            data={chartData}
            margin={
              isMobile
                ? { top: 10, right: 10, left: -20, bottom: 0 }
                : { top: 10, right: 30, left: 0, bottom: 0 }
            }
          >
            <defs>
              <linearGradient
                id="reminderGradient"
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
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={
                isMobile 
                  ? Math.floor(chartData.length / 4)
                  : period === 'day' 
                    ? 2 
                    : period === 'all' || period === 'year'
                      ? Math.floor(chartData.length / 12)
                      : Math.floor(chartData.length / 7)
              }
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickFormatter={(value) => {
                if (isMobile && value.length > 8) {
                  return value.split(' ')[0];
                }
                return value;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              width={isMobile ? 30 : 40}
              domain={[0, maxCount]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Date: ${label}`}
                />
              }
              cursor={{
                stroke: 'var(--color-chart-1)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              dot={{
                fill: 'var(--color-chart-1)',
                strokeWidth: 2,
                r: chartData.length > 30 ? 0 : 3,
              }}
              activeDot={{
                r: isMobile ? 5 : 6,
                fill: 'var(--color-chart-1)',
                stroke: 'var(--background)',
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
