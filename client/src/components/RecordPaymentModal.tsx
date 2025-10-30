import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

interface RecordPaymentModalProps {
  invoiceId: string;
  invoiceTotal: number;
  amountPaid: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "check", label: "Check" },
  { value: "paypal", label: "PayPal" },
  { value: "stripe", label: "Stripe" },
  { value: "other", label: "Other" },
];

export default function RecordPaymentModal({
  invoiceId,
  invoiceTotal,
  amountPaid,
  open,
  onOpenChange,
}: RecordPaymentModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const remainingAmount = invoiceTotal - amountPaid;

  const [amount, setAmount] = useState(remainingAmount.toFixed(2));
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", `/api/invoices/${invoiceId}/payments`, data);
    },
    onSuccess: () => {
      toast({
        title: t("payments.recorded", "Payment Recorded"),
        description: t("payments.recordedSuccess", "Payment has been recorded successfully."),
      });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/payments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error", "Error"),
        description: error.message || t("payments.recordFailed", "Failed to record payment"),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setAmount(remainingAmount.toFixed(2));
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMethod("bank_transfer");
    setTransactionId("");
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({
        title: t("common.error", "Error"),
        description: t("payments.invalidAmount", "Please enter a valid payment amount"),
        variant: "destructive",
      });
      return;
    }

    if (paymentAmount > remainingAmount + 0.01) {
      toast({
        title: t("common.error", "Error"),
        description: t("payments.exceedsRemaining", "Payment amount exceeds remaining balance"),
        variant: "destructive",
      });
      return;
    }

    recordPaymentMutation.mutate({
      amount: paymentAmount,
      paymentDate: new Date(paymentDate),
      paymentMethod,
      transactionId: transactionId || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("payments.recordPayment", "Record Payment")}</DialogTitle>
          <DialogDescription>
            {t("payments.recordPaymentDesc", "Record a payment received for this invoice")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("payments.invoiceTotal", "Invoice Total")}:</span>
              <span className="font-medium">${invoiceTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("payments.alreadyPaid", "Already Paid")}:</span>
              <span className="font-medium">${amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">{t("payments.remaining", "Remaining")}:</span>
              <span className="font-semibold">${remainingAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t("payments.paymentAmount", "Payment Amount")}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">{t("payments.paymentDate", "Payment Date")}</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">{t("payments.paymentMethod", "Payment Method")}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {t(`payments.methods.${method.value}`, method.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transactionId">{t("payments.transactionId", "Transaction ID")} (Optional)</Label>
            <Input
              id="transactionId"
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder={t("payments.transactionIdPlaceholder", "e.g., TXN123456")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("payments.notes", "Notes")} (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("payments.notesPlaceholder", "Additional payment notes")}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={recordPaymentMutation.isPending}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={recordPaymentMutation.isPending}>
              {recordPaymentMutation.isPending
                ? t("payments.recording", "Recording...")
                : t("payments.recordPayment", "Record Payment")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
