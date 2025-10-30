import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface Payment {
  id: string;
  amount: string;
  paymentDate: string;
  paymentMethod: string;
  transactionId?: string;
  notes?: string;
}

interface PaymentHistoryProps {
  invoiceId: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  check: "Check",
  paypal: "PayPal",
  stripe: "Stripe",
  other: "Other",
};

export default function PaymentHistory({ invoiceId }: PaymentHistoryProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: [`/api/invoices/${invoiceId}/payments`],
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return await apiRequest("DELETE", `/api/invoices/${invoiceId}/payments/${paymentId}`, {});
    },
    onSuccess: () => {
      toast({
        title: t("payments.deleted", "Payment Deleted"),
        description: t("payments.deletedSuccess", "Payment has been deleted successfully."),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/payments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setPaymentToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message || t("payments.deleteFailed", "Failed to delete payment"),
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("payments.history", "Payment History")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("common.loading", "Loading...")}</p>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("payments.history", "Payment History")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("payments.noPayments", "No payments recorded yet.")}</p>
        </CardContent>
      </Card>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{t("payments.history", "Payment History")}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {t("payments.totalPaid", "Total Paid")}: ${totalPaid.toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-start justify-between border rounded-lg p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">${parseFloat(payment.amount).toFixed(2)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {PAYMENT_METHOD_LABELS[payment.paymentMethod] || payment.paymentMethod}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(payment.paymentDate), "MMM dd, yyyy")}
                  </p>
                  {payment.transactionId && (
                    <p className="text-xs text-muted-foreground">
                      {t("payments.txn", "TXN")}: {payment.transactionId}
                    </p>
                  )}
                  {payment.notes && (
                    <p className="text-xs text-muted-foreground italic">{payment.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPaymentToDelete(payment.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!paymentToDelete} onOpenChange={() => setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("payments.deleteConfirm", "Delete Payment?")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                "payments.deleteConfirmDesc",
                "This will delete the payment record and update the invoice status. This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => paymentToDelete && deletePaymentMutation.mutate(paymentToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
