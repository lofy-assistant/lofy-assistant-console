import { MessagesGraph } from "@/components/dashboard/messages/graph";
import { MessagesAggregation } from "@/components/dashboard/messages/aggregation";

export default function Page() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-6">Overview — Messages</h1>
      <MessagesAggregation />
      <div className="mt-4">
        <MessagesGraph />
      </div>
    </div>
  );
}
