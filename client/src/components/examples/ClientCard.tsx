import { ClientCard } from "../ClientCard";

export default function ClientCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <ClientCard
        id="1"
        name="Acme Corporation"
        email="contact@acme.com"
        phone="+1 (555) 123-4567"
        totalInvoices={12}
        outstandingAmount={3200.0}
        onEdit={(id) => console.log("Edit client:", id)}
        onViewInvoices={(id) => console.log("View invoices for client:", id)}
      />
      <ClientCard
        id="2"
        name="TechStart Inc"
        email="hello@techstart.io"
        phone="+1 (555) 987-6543"
        totalInvoices={8}
        outstandingAmount={1500.5}
        onEdit={(id) => console.log("Edit client:", id)}
        onViewInvoices={(id) => console.log("View invoices for client:", id)}
      />
      <ClientCard
        id="3"
        name="Design Studio"
        email="info@designstudio.com"
        totalInvoices={5}
        outstandingAmount={0}
        onEdit={(id) => console.log("Edit client:", id)}
        onViewInvoices={(id) => console.log("View invoices for client:", id)}
      />
    </div>
  );
}
