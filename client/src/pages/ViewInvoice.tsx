import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, Printer, FileDown, Link2, DollarSign } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { InvoicePreview } from "@/components/InvoicePreview";
import { InvoiceStatusBadge } from "@/components/invoice/InvoiceStatusBadge";
import { SendLinkModal } from "@/components/invoice/SendLinkModal";
import RecordPaymentModal from "@/components/RecordPaymentModal";
import PaymentHistory from "@/components/PaymentHistory";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useState } from "react";
import type { Client } from "@shared/schema";

export default function ViewInvoice() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const params = useParams();
  const invoiceId = params.id;
  const [, setLocation] = useLocation();
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch invoice
  const { data: invoice, isLoading } = useQuery({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: async () => {
      return await apiRequest("GET", `/api/invoices/${invoiceId}`);
    },
  });

  // Fetch line items
  const { data: lineItems = [] } = useQuery({
    queryKey: ["/api/invoices", invoiceId, "line-items"],
    queryFn: async () => {
      return await apiRequest("GET", `/api/invoices/${invoiceId}/line-items`);
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      return await apiRequest("GET", "/api/auth/me");
    },
  });

  const client = clients.find((c) => c.id === invoice?.clientId);

  // PDF Download function
  const downloadPDF = async () => {
    try {
      const previewElement = document.querySelector('.invoice-preview-container');
      if (!previewElement) {
        toast({
          title: "Error",
          description: "Invoice preview not found",
          variant: "destructive",
        });
        return;
      }

      const canvas = await html2canvas(previewElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const invoiceNumber = invoice?.invoiceNumber || '000001';
      pdf.save(`invoice-${invoiceNumber}.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: `Invoice ${invoiceNumber} has been downloaded`,
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Copy shareable link function
  const copyShareableLink = () => {
    if (!client) {
      toast({
        title: "Error",
        description: "Client not found",
        variant: "destructive",
      });
      return;
    }

    setShowSendModal(true);
  };

  // Check if editing is allowed based on invoice status
  const canEdit = !invoice?.status || invoice.status === "draft" || invoice.status === "sent";

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("invoice.notFound")}</p>
          <Button onClick={() => setLocation("/invoices")} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => setLocation("/invoices")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
          {invoice?.status && <InvoiceStatusBadge status={invoice.status as any} />}
        </div>
        <div className="flex gap-2">
          {/* Show Record Payment button if invoice is not fully paid */}
          {invoice?.status !== 'paid' && invoice?.status !== 'cancelled' && invoice?.status !== 'refunded' && (
            <Button onClick={() => setShowPaymentModal(true)} variant="default">
              <DollarSign className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setLocation(`/invoices/edit/${invoiceId}`)} variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          <Button onClick={downloadPDF} variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={copyShareableLink} variant="outline">
            <Link2 className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="invoice-preview-container">
                <InvoicePreview
                  invoiceNumber={invoice.invoiceNumber}
                  date={invoice.date}
                  orderNumber={invoice.orderNumber}
                  projectNumber={invoice.projectNumber}
                  forProject={invoice.forProject}
                  clientName={client?.name}
                  clientCompany={client?.company}
                  clientAddress={client?.address}
                  clientPhone={client?.phone}
                  lineItems={(lineItems || []).map((item: any) => ({
                    description: item.description || '',
                    quantity: parseFloat(item.quantity) || 0,
                    price: parseFloat(item.price) || 0,
                  }))}
                  taxRate={parseFloat(invoice.taxRate)}
                  notes={invoice.notes}
                  // Company data
                  companyName={user?.companyName}
                  companyAddress={user?.address}
                  companyPhone={user?.phone}
                  companyTaxId={user?.taxOfficeId}
                  // Bank details
                  swiftCode={user?.swiftCode}
                  iban={user?.iban}
                  accountHolderName={user?.accountHolderName}
                  bankAddress={user?.bankAddress}
                  // Footer contact
                  userName={user?.name}
                  userPhone={user?.phone}
                  userEmail={user?.email}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Payment History */}
          <PaymentHistory invoiceId={invoiceId!} />
        </div>
      </div>

      {/* Send Link Modal */}
      {client && invoice && (
        <SendLinkModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          clientEmail={client.email}
          clientName={client.name}
          invoiceNumber={invoice.invoiceNumber}
          total={parseFloat(invoice.total)}
          shareableUrl={`${window.location.origin}/invoices/view/${invoice.id}`}
        />
      )}

      {/* Record Payment Modal */}
      {invoice && (
        <RecordPaymentModal
          invoiceId={invoiceId!}
          invoiceTotal={parseFloat(invoice.total)}
          amountPaid={parseFloat(invoice.amountPaid || '0')}
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
        />
      )}
    </div>
  );
}

