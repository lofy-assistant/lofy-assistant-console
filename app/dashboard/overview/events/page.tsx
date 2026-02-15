import { EventsAggregation } from '@/components/dashboard/events/aggregation';
import { EventGraph } from '@/components/dashboard/events/graph';

export default function Page() {
	return (
		<div className="p-4">
			<h1 className="text-xl font-semibold mb-6">Overview — Calendar Events</h1>
			<div className="space-y-6">
				<EventsAggregation />
				<EventGraph />
			</div>
		</div>
	);
}
