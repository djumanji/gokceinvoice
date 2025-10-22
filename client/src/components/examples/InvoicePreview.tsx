import { InvoicePreview } from "../InvoicePreview";

const mockLineItems = [
  {
    description: "Engineering Services (TimeSheet-2-September)",
    quantity: 7.0,
    price: 300.0,
  },
];

export default function InvoicePreviewExample() {
  return (
    <div className="p-4">
      <InvoicePreview
        invoiceNumber="000034"
        orderNumber="0025091"
        projectNumber="0299505"
        date="2025-09-30"
        forProject="Bracha Bridge"
        clientName="Adrian BRAND"
        clientCompany="HEBETEC Engineering LTD."
        clientAddress="Sagi 1, 3324 Hindelbank, Switzerland"
        clientPhone="+41 77 289 12 26"
        lineItems={mockLineItems}
      />
    </div>
  );
}
