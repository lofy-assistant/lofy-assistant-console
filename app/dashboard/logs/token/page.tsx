import { LlmTokenUsageLog } from "@/components/dashboard/logs/llm-token-usage";

export default function Page() {
	return (
		<div className="p-4">
			<h1 className="text-lg font-bold mb-6">Logs — Tokens</h1>
			<LlmTokenUsageLog />
		</div>
	);
}
