import { InvoiceForm } from "../InvoiceForm";

const mockClients = [
  { id: "1", name: "Acme Corporation" },
  { id: "2", name: "TechStart Inc" },
  { id: "3", name: "Design Studio" },
];

export default function InvoiceFormExample() {
  return (
    <div className="p-4">
      <InvoiceForm
        clients={mockClients}
        onSubmit={(data, status) => {
          console.log("Invoice submitted:", data, "Status:", status);
        }}
      />
    </div>
  );
}
