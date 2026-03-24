'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { LlmTokenUsageRecord } from '@/app/api/dashboard/logs/token-usage/route';

interface LlmTokenUsageResponse {
  records: LlmTokenUsageRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function LlmTokenUsageLog() {
  const [data, setData] = useState<LlmTokenUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filters, setFilters] = useState({ userId: '', model: '', callType: '' });
  const [searchFilters, setSearchFilters] = useState({ userId: '', model: '', callType: '' });

  const pageSize = 50;

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (searchFilters.userId) params.append('userId', searchFilters.userId);
      if (searchFilters.model) params.append('model', searchFilters.model);
      if (searchFilters.callType) params.append('callType', searchFilters.callType);

      const response = await fetch(`/api/dashboard/logs/token-usage?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch token usage');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token usage');
    } finally {
      setLoading(false);
    }
  }, [page, searchFilters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSearch = () => {
    setSearchFilters(filters);
    setPage(1);
  };

  const handleReset = () => {
    setFilters({ userId: '', model: '', callType: '' });
    setSearchFilters({ userId: '', model: '', callType: '' });
    setPage(1);
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleString('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

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
            placeholder="Filter by user ID..."
            value={filters.userId}
            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Input
            placeholder="Filter by model..."
            value={filters.model}
            onChange={(e) => setFilters({ ...filters, model: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Input
            placeholder="Filter by call type..."
            value={filters.callType}
            onChange={(e) => setFilters({ ...filters, callType: e.target.value })}
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

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">User ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Call Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Model</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Input Tokens</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Output Tokens</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.records.map((record) => (
                <Fragment key={record.id}>
                  <tr
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === record.id ? null : record.id)}
                  >
                    <td className="px-4 py-3 text-xs font-mono whitespace-nowrap">
                      {formatDate(record.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                      {record.user_id.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs">
                        {record.call_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {record.model}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {record.tokens_total_input?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono">
                      {record.tokens_total_output?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedRow(expandedRow === record.id ? null : record.id);
                        }}
                      >
                        {expandedRow === record.id ? 'Hide' : 'Details'}
                      </Button>
                    </td>
                  </tr>
                  {expandedRow === record.id && (
                    <tr className="bg-muted/20">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-semibold text-xs uppercase text-muted-foreground">ID</span>
                              <p className="font-mono text-xs mt-1">{record.id}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-xs uppercase text-muted-foreground">User ID</span>
                              <p className="font-mono text-xs mt-1">{record.user_id}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="rounded-md bg-muted p-3">
                              <p className="text-xs text-muted-foreground mb-1">System Prompt</p>
                              <p className="font-mono font-semibold">
                                {record.tokens_system_prompt?.toLocaleString() ?? '—'}
                              </p>
                            </div>
                            <div className="rounded-md bg-muted p-3">
                              <p className="text-xs text-muted-foreground mb-1">Session Context</p>
                              <p className="font-mono font-semibold">
                                {record.tokens_session_context?.toLocaleString() ?? '—'}
                              </p>
                            </div>
                            <div className="rounded-md bg-muted p-3">
                              <p className="text-xs text-muted-foreground mb-1">Conversation History</p>
                              <p className="font-mono font-semibold">
                                {record.tokens_conversation_history?.toLocaleString() ?? '—'}
                              </p>
                            </div>
                            <div className="rounded-md bg-muted p-3">
                              <p className="text-xs text-muted-foreground mb-1">Tools Schema</p>
                              <p className="font-mono font-semibold">
                                {record.tokens_tools_schema?.toLocaleString() ?? '—'}
                              </p>
                            </div>
                            <div className="rounded-md bg-muted/60 border p-3">
                              <p className="text-xs text-muted-foreground mb-1">Total Input</p>
                              <p className="font-mono font-bold">
                                {record.tokens_total_input?.toLocaleString() ?? '—'}
                              </p>
                            </div>
                            <div className="rounded-md bg-muted/60 border p-3">
                              <p className="text-xs text-muted-foreground mb-1">Total Output</p>
                              <p className="font-mono font-bold">
                                {record.tokens_total_output?.toLocaleString() ?? '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {data?.records.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No token usage records found</div>
          )}
        </div>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(data.page - 1) * data.pageSize + 1} to{' '}
              {Math.min(data.page * data.pageSize, data.total)} of {data.total} records
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
              <span className="flex items-center px-3 text-sm">
                Page {data.page} of {data.totalPages}
              </span>
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
