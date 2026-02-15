import { RemindersAggregation } from '@/components/dashboard/reminders/aggregation';
import { ReminderGraph } from '@/components/dashboard/reminders/graph';

export default function Page() {
	return (
		<div className="p-4">
			<h1 className="text-xl font-semibold mb-6">Overview — Reminders</h1>
			<div className="space-y-6">
				<RemindersAggregation />
				<ReminderGraph />
			</div>
		</div>
	);
}
