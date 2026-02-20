import { MemoriesAggregation } from "@/components/dashboard/memories/aggregation"
import { MemoriesGraph } from "@/components/dashboard/memories/graph"

export default function Page() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-6">Overview — Memories</h1>
      <MemoriesAggregation />
      <div className="mt-4">
        <MemoriesGraph />
      </div>
    </div>
  );
}
