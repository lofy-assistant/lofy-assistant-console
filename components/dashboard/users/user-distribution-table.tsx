'use client';

import { UserDistributionData } from '@/app/api/dashboard/users/distribution/route';
import { useState } from 'react';
import { Card } from '@/components/ui/card';

interface UserDistributionTableProps {
  data: UserDistributionData[];
}

type SortField = 'country' | 'region' | 'continent' | 'userCount' | 'percentage';
type SortDirection = 'asc' | 'desc';

function SortIcon({ field, sortField, sortDirection }: { field: SortField; sortField: SortField; sortDirection: SortDirection }) {
  if (sortField !== field) {
    return <span className="text-muted-foreground ml-1">↕</span>;
  }
  return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
}

export function UserDistributionTable({ data }: UserDistributionTableProps) {
  const [sortField, setSortField] = useState<SortField>('userCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue: string | number = a[sortField];
    const bValue: string | number = b[sortField];

    if (typeof aValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue as string)
        : (bValue as string).localeCompare(aValue);
    } else {
      return sortDirection === 'asc' 
        ? aValue - (bValue as number)
        : (bValue as number) - aValue;
    }
  });

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <p className="pb-5 pt-2 text-center text-sm font-semibold">User x Country Distribution</p>
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-muted"
                onClick={() => handleSort('country')}
              >
                Country <SortIcon field="country" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-muted"
                onClick={() => handleSort('region')}
              >
                Region <SortIcon field="region" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th 
                className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-muted"
                onClick={() => handleSort('continent')}
              >
                Continent <SortIcon field="continent" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-muted"
                onClick={() => handleSort('userCount')}
              >
                User Count <SortIcon field="userCount" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th 
                className="px-4 py-3 text-right text-sm font-semibold cursor-pointer hover:bg-muted"
                onClick={() => handleSort('percentage')}
              >
                % of Total <SortIcon field="percentage" sortField={sortField} sortDirection={sortDirection} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sortedData.map((row) => (
              <tr 
                key={row.countryCode}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 text-sm font-medium">{row.country}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{row.region}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{row.continent}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{row.userCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-right font-mono">{row.percentage.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    </Card>
  );
}
