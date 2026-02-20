"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MemoryAggregation } from '@/app/api/dashboard/memories/aggregation/route';

export function MemoriesAggregation() {
	const [stats, setStats] = useState<MemoryAggregation | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function fetchStats() {
			try {
				setLoading(true);
				const res = await fetch('/api/dashboard/memories/aggregation');
				if (!res.ok) throw new Error('Failed to fetch memories analytics');
				const payload = await res.json();
				if (!payload.success) throw new Error(payload.error || 'Unknown error');
				if (!cancelled) setStats(payload.data as MemoryAggregation);
			} catch (err) {
				if (!cancelled) setError(err instanceof Error ? err.message : String(err));
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		fetchStats();

		return () => {
			cancelled = true;
		};
	}, []);

	if (loading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<CardTitle className="text-sm">Loading...</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="h-6 w-24 bg-muted animate-pulse rounded" />
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Error</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-destructive">{error}</div>
				</CardContent>
			</Card>
		);
	}

	if (!stats) return null;

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Total Memories</CardTitle>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						className="h-4 w-4 text-muted-foreground"
					>
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					</svg>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.totalMemories.toLocaleString()}</div>
					<p className="text-xs text-muted-foreground mt-1">Across all users</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Avg per User</CardTitle>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						className="h-4 w-4 text-muted-foreground"
					>
						<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
					</svg>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.avgMemoriesPerUser.toFixed(2)}</div>
					<p className="text-xs text-muted-foreground mt-1">Active users only</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Active Users</CardTitle>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						className="h-4 w-4 text-muted-foreground"
					>
						<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
						<circle cx="9" cy="7" r="4" />
						<path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
					</svg>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">
						{stats.usersWithMemories.toLocaleString()} / {stats.totalUsers.toLocaleString()}
					</div>
					<p className="text-xs text-muted-foreground mt-1">Users with memories</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Adoption Rate</CardTitle>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						className="h-4 w-4 text-muted-foreground"
					>
						<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
					</svg>
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold">{stats.percentageUsersWithMemories.toFixed(2)}%</div>
					<p className="text-xs text-muted-foreground mt-1">Users using memories</p>
				</CardContent>
			</Card>
		</div>
	);
}

export default MemoriesAggregation;

