import { EmptyState } from "../EmptyState";
import { FileText } from "lucide-react";

export default function EmptyStateExample() {
  return (
    <div className="p-4">
      <EmptyState
        icon={FileText}
        title="No invoices yet"
        description="Get started by creating your first invoice. Track payments and manage your billing effortlessly."
        actionLabel="Create Invoice"
        onAction={() => console.log("Create invoice clicked")}
      />
    </div>
  );
}
