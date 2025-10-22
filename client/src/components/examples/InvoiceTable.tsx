import { InvoiceTable } from "../InvoiceTable";

const mockInvoices = [
  {
    id: "1",
    invoiceNumber: "INV-001",
    clientName: "Acme Corp",
    date: new Date(2025, 9, 1),
    dueDate: new Date(2025, 9, 31),
    total: 2500.0,
    status: "paid" as const,
  },
  {
    id: "2",
    invoiceNumber: "INV-002",
    clientName: "TechStart Inc",
    date: new Date(2025, 9, 15),
    dueDate: new Date(2025, 10, 15),
    total: 1200.5,
    status: "sent" as const,
  },
  {
    id: "3",
    invoiceNumber: "INV-003",
    clientName: "Design Studio",
    date: new Date(2025, 8, 20),
    dueDate: new Date(2025, 9, 5),
    total: 850.0,
    status: "overdue" as const,
  },
  {
    id: "4",
    invoiceNumber: "INV-004",
    clientName: "Global Solutions",
    date: new Date(2025, 9, 20),
    dueDate: new Date(2025, 10, 20),
    total: 3400.0,
    status: "draft" as const,
  },
];

export default function InvoiceTableExample() {
  return (
    <div className="p-4">
      <InvoiceTable
        invoices={mockInvoices}
        onView={(id) => console.log("View invoice:", id)}
        onEdit={(id) => console.log("Edit invoice:", id)}
        onDelete={(id) => console.log("Delete invoice:", id)}
      />
    </div>
  );
}
