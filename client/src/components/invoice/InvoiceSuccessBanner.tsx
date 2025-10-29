import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, Link2, FileDown, Eye } from "lucide-react";

interface InvoiceSuccessBannerProps {
  invoiceNumber: string;
  onCopyLink: () => void;
  onDownloadPDF: () => void;
  onViewInvoice: () => void;
}

export function InvoiceSuccessBanner({
  invoiceNumber,
  onCopyLink,
  onDownloadPDF,
  onViewInvoice,
}: InvoiceSuccessBannerProps) {
  return (
    <Alert className="mb-6 bg-green-50 border-green-200">
      <CheckCircle className="h-5 w-5 text-green-600" />
      <AlertTitle>Invoice Saved!</AlertTitle>
      <AlertDescription>
        Invoice #{invoiceNumber} has been saved as draft.
      </AlertDescription>
      <div className="flex gap-2 mt-4">
        <Button onClick={onCopyLink} size="sm">
          <Link2 className="w-4 h-4 mr-2" />
          Copy Share Link
        </Button>
        <Button onClick={onDownloadPDF} variant="outline" size="sm">
          <FileDown className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
        <Button onClick={onViewInvoice} variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-2" />
          View Invoice
        </Button>
      </div>
    </Alert>
  );
}
