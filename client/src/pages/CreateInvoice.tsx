import { InvoiceForm } from "@/components/InvoiceForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function CreateInvoice() {
  const [, setLocation] = useLocation();

  // todo: remove mock functionality
  const mockClients = [
    { id: "1", name: "Acme Corporation" },
    { id: "2", name: "TechStart Inc" },
    { id: "3", name: "Design Studio" },
    { id: "4", name: "Global Solutions" },
    { id: "5", name: "Startup Labs" },
  ];

  const handleSubmit = (data: any, status: string) => {
    console.log("Creating invoice:", data, "with status:", status);
    setLocation("/invoices");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/invoices")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground">Fill in the details to create a new invoice</p>
        </div>
      </div>

      <InvoiceForm clients={mockClients} onSubmit={handleSubmit} />
    </div>
  );
}
