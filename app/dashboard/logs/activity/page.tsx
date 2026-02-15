import { DomainEventsLog } from "@/components/dashboard/logs/domain-events";

export default function Page() {
	return (
		<div className="p-4">
			<h1 className="text-lg font-bold mb-6">Logs — Activity</h1>
			<DomainEventsLog />
		</div>
	);
}
