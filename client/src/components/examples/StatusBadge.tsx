import { StatusBadge } from "../StatusBadge";

export default function StatusBadgeExample() {
  return (
    <div className="flex gap-2 p-4 flex-wrap">
      <StatusBadge status="draft" />
      <StatusBadge status="sent" />
      <StatusBadge status="paid" />
      <StatusBadge status="overdue" />
    </div>
  );
}
