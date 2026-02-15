'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { DomainEventData } from '@/app/api/dashboard/logs/domain-events/route';

interface DomainEventsResponse {
  events: DomainEventData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function DomainEventsLog() {
  const [data, setData] = useState<DomainEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    eventType: '',
    userId: '',
    source: '',
  });
  const [searchFilters, setSearchFilters] = useState({
    eventType: '',
    userId: '',
    source: '',
  });

  const pageSize = 50;

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchFilters.eventType) params.append('eventType', searchFilters.eventType);
      if (searchFilters.userId) params.append('userId', searchFilters.userId);
      if (searchFilters.source) params.append('source', searchFilters.source);

      const response = await fetch(`/api/dashboard/logs/domain-events?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [page, searchFilters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSearch = () => {
    setSearchFilters(filters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters({ eventType: '', userId: '', source: '' });
    setSearchFilters({ eventType: '', userId: '', source: '' });
    setPage(1);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getEventTypeColor = (eventType: string) => {
    if (eventType.includes('Created')) return 'text-green-600 dark:text-green-400';
    if (eventType.includes('Updated')) return 'text-blue-600 dark:text-blue-400';
    if (eventType.includes('Deleted')) return 'text-red-600 dark:text-red-400';
    if (eventType.includes('Failed')) return 'text-orange-600 dark:text-orange-400';
    return 'text-foreground';
  };

  if (loading && !data) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="p-6">
        <div className="text-destructive">Error: {error}</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="Filter by event type..."
            value={filters.eventType}
            onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Input
            placeholder="Filter by user ID..."
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Input
            placeholder="Filter by source..."
            value={filters.source}
            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex-1">
              Search
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Events Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Event Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">User ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Correlation ID</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.events.map((event) => (
                <Fragment key={event.event_id}>
                  <tr
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedEvent(expandedEvent === event.event_id ? null : event.event_id)}
                  >
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap">
                      {formatDate(event.created_at)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-medium ${getEventTypeColor(event.event_type)}`}>
                      {event.event_type}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {event.user_id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
                        {event.event_metadata.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {event.event_metadata.correlation_id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedEvent(expandedEvent === event.event_id ? null : event.event_id);
                        }}
                      >
                        {expandedEvent === event.event_id ? 'Hide' : 'Details'}
                      </Button>
                    </td>
                  </tr>
                  {expandedEvent === event.event_id && (
                    <tr className="bg-muted/20">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-semibold">Event ID:</span>
                              <p className="font-mono text-xs text-muted-foreground mt-1">{event.event_id}</p>
                            </div>
                            <div>
                              <span className="font-semibold">User ID:</span>
                              <p className="font-mono text-xs text-muted-foreground mt-1">{event.user_id}</p>
                            </div>
                            <div>
                              <span className="font-semibold">Correlation ID:</span>
                              <p className="font-mono text-xs text-muted-foreground mt-1">
                                {event.event_metadata.correlation_id}
                              </p>
                            </div>
                            {event.event_metadata.causation_id && (
                              <div>
                                <span className="font-semibold">Causation ID:</span>
                                <p className="font-mono text-xs text-muted-foreground mt-1">
                                  {event.event_metadata.causation_id}
                                </p>
                              </div>
                            )}
                            {event.event_metadata.user_message && (
                              <div className="col-span-2">
                                <span className="font-semibold">User Message:</span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {event.event_metadata.user_message}
                                </p>
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-sm">Event Data:</span>
                            <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {data?.events.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No domain events found
            </div>
          )}
        </div>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((data.page - 1) * data.pageSize) + 1} to{' '}
              {Math.min(data.page * data.pageSize, data.total)} of {data.total} events
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  Page {data.page} of {data.totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(data.totalPages, page + 1))}
                disabled={page === data.totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
