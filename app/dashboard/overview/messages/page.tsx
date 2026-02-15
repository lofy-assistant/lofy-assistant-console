import { MessageGraph } from "@/components/dashboard/messages/graph";
import { MessageAggregation } from "@/components/dashboard/messages/aggregation";

export default function Page() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-6">Overview — Messages</h1>
      <MessageAggregation />
      <div className="mt-4">
        <MessageGraph />
      </div>
    </div>
  );
}
