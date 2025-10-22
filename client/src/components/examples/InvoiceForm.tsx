import { InvoiceForm } from "../InvoiceForm";

const mockClients = [
  {
    id: "1",
    name: "Adrian BRAND",
    email: "HEBETEC Engineering LTD.",
    phone: "+41 77 289 12 26",
    address: "Sagi 1, 3324 Hindelbank, Switzerland",
  },
  {
    id: "2",
    name: "TechStart Inc",
    email: "hello@techstart.io",
    phone: "+1 (555) 987-6543",
    address: "123 Tech Street, San Francisco, CA",
  },
  {
    id: "3",
    name: "Design Studio",
    email: "info@designstudio.com",
    address: "456 Creative Ave, New York, NY",
  },
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
