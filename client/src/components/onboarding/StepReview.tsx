import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";

interface StepReviewProps {
  companyName: string;
  clientName: string;
  serviceName: string;
  price: string;
  currency: string;
  onBack: () => void;
  onGenerate: () => void;
}

export function StepReview({
  companyName,
  clientName,
  serviceName,
  price,
  currency,
  onBack,
  onGenerate,
}: StepReviewProps) {
  const currencySymbol = getCurrencySymbol(currency);
  const total = parseFloat(price);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute top-6 left-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-center text-2xl">
            Review and generate your first invoice!
          </CardTitle>
          <CardDescription className="text-center">
            Here's what your invoice will look like
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-white dark:bg-gray-950 p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold">INVOICE</h2>
              <p className="text-sm text-muted-foreground">
                #{generateInvoiceNumber()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">From:</p>
                <p className="text-base font-medium">{companyName}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">To:</p>
                <p className="text-base font-medium">{clientName}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-4">Date: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="border-t pt-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-semibold text-muted-foreground">
                      Service Details
                    </th>
                    <th className="text-right py-2 text-sm font-semibold text-muted-foreground">
                      Qty
                    </th>
                    <th className="text-right py-2 text-sm font-semibold text-muted-foreground">
                      Price
                    </th>
                    <th className="text-right py-2 text-sm font-semibold text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-4">{serviceName}</td>
                    <td className="text-right py-4">1</td>
                    <td className="text-right py-4">{currencySymbol}{parseFloat(price).toFixed(2)}</td>
                    <td className="text-right py-4 font-semibold">
                      {currencySymbol}{total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-end">
                <div className="text-right space-y-2">
                  <div className="text-lg font-bold">
                    TOTAL: {currencySymbol}{total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={onGenerate}
            size="lg"
            className="w-full text-lg h-14"
          >
            🎉 Generate My First Invoice
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            You can edit this anytime after creation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function generateInvoiceNumber(): string {
  const num = Math.floor(Math.random() * 1000000);
  return `INV-${String(num).padStart(6, '0')}`;
}

function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    EUR: "€",
    USD: "$",
    GBP: "£",
    TRY: "₺",
    AUD: "A$",
  };
  return symbols[currency] || currency;
}
