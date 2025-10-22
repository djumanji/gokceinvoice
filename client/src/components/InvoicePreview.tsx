import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface LineItem {
  description: string;
  quantity: number;
  price: number;
}

interface InvoicePreviewProps {
  invoiceNumber?: string;
  orderNumber?: string;
  projectNumber?: string;
  date?: string;
  clientName?: string;
  clientCompany?: string;
  clientAddress?: string;
  clientPhone?: string;
  lineItems: LineItem[];
  notes?: string;
  forProject?: string;
}

export function InvoicePreview({
  invoiceNumber = "000001",
  orderNumber,
  projectNumber,
  date,
  clientName,
  clientCompany,
  clientAddress,
  clientPhone,
  lineItems,
  notes,
  forProject,
}: InvoicePreviewProps) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const taxRate = 0.0;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return (
    <Card className="w-full">
      <CardContent className="p-8 space-y-6">
        {/* Header Section */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left: Company Details */}
          <div className="space-y-1">
            <h3 className="font-bold text-base">GKIZILDERE ENGINEERING OFFICE</h3>
            <p className="text-sm">Address: 18, Yavuz Gonnolu Sokak, Ortaköy</p>
            <p className="text-sm">Nicosia, North Cyprus</p>
            <p className="text-sm">Phone: +90 533 860 9480</p>
            <p className="text-sm">Tax Office ID: 232477</p>
          </div>

          {/* Right: Invoice Details */}
          <div className="space-y-1 text-right">
            <h2 className="text-2xl font-bold mb-3">INVOICE</h2>
            <p className="text-sm">
              <span className="font-medium">Date:</span>{" "}
              {date ? format(new Date(date), "dd.MM.yyyy") : format(new Date(), "dd.MM.yyyy")}
            </p>
            <p className="text-sm">
              <span className="font-medium">Invoice #:</span> {invoiceNumber}
            </p>
            {orderNumber && (
              <p className="text-sm">
                <span className="font-medium">ORDER #:</span> {orderNumber}
              </p>
            )}
            {projectNumber && (
              <p className="text-sm">
                <span className="font-medium">Cost/Project #:</span> {projectNumber}
              </p>
            )}
            {forProject && (
              <p className="text-sm">
                <span className="font-medium">For:</span> {forProject}
              </p>
            )}
          </div>
        </div>

        {/* Bill To Section */}
        <div className="text-right space-y-1">
          <p className="text-sm">
            <span className="font-medium">Bill To:</span> {clientName || "Client Name"}
          </p>
          {clientCompany && <p className="text-sm font-medium">{clientCompany}</p>}
          {clientAddress && <p className="text-sm">{clientAddress}</p>}
          {clientPhone && <p className="text-sm">Phone: {clientPhone}</p>}
        </div>

        <Separator />

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-4 font-medium text-sm border-b pb-2">
            <div className="col-span-6">DESCRIPTION</div>
            <div className="col-span-2 text-center">QUANTITY</div>
            <div className="col-span-2 text-right">UNIT RATE</div>
            <div className="col-span-2 text-right">AMOUNT</div>
          </div>

          {lineItems.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 text-sm py-2">
              <div className="col-span-6">{item.description || "Line item"}</div>
              <div className="col-span-2 text-center">{item.quantity.toFixed(2)}</div>
              <div className="col-span-2 text-right font-mono">€{item.price.toFixed(2)}</div>
              <div className="col-span-2 text-right font-mono font-medium">
                €{(item.quantity * item.price).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Bottom Section: Bank Details and Totals */}
        <div className="grid grid-cols-2 gap-8 mt-6">
          {/* Left: Bank Details */}
          <div className="space-y-1">
            <p className="text-sm font-medium mb-2">Bank Details For Payment:</p>
            <p className="text-sm">Swift CODE: TRWIBEB1XXX</p>
            <p className="text-sm">IBAN: BE72 9670 4186 0516</p>
            <p className="text-sm">Account Holder: Gökçe Kızıldere</p>
            <p className="text-sm">Bank Address: Wise, Rue du Trone 100,</p>
            <p className="text-sm">3rd Floor, Brussels, 1050, BELGIUM</p>
          </div>

          {/* Right: Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">SUBTOTAL</span>
              <span className="font-mono">€{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">TAX RATE</span>
              <span className="font-mono">{(taxRate * 100).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">SALES TAX</span>
              <span className="font-mono">€{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">OTHER</span>
              <span className="font-mono">€0.00</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-bold">
              <span>TOTAL</span>
              <span className="font-mono">€{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="text-sm text-muted-foreground border-t pt-4">
          <p>If you have any questions concerning this invoice,</p>
          <p>contact Gökçe Kızıldere, Whatsapp +90 533 860 94 80 or gkizildere@hotmail.com</p>
        </div>

        {notes && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-1">Notes:</p>
            <p className="text-sm text-muted-foreground">{notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
