import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Mail } from "lucide-react";

interface SuccessStepProps {
  invoiceNumber: string;
  onGoToDashboard: () => void;
}

export function SuccessStep({ invoiceNumber, onGoToDashboard }: SuccessStepProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const confettiTimer = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(confettiTimer);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onGoToDashboard();
    }
  }, [countdown, onGoToDashboard]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl text-center">
        <CardContent className="py-12 px-8 space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>

          <h2 className="text-3xl font-bold">Congratulations! 🎉</h2>
          <p className="text-lg text-muted-foreground">
            You've created your first invoice!
          </p>

          <div className="rounded-lg border bg-muted p-6">
            <p className="text-sm text-muted-foreground mb-2">Your invoice is ready</p>
            <p className="text-2xl font-bold">{invoiceNumber}</p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
            <Button variant="outline" size="lg">
              <Mail className="mr-2 h-5 w-5" />
              Send Email
            </Button>
          </div>

          <div className="pt-4">
            <Button
              onClick={onGoToDashboard}
              size="lg"
              className="w-full"
            >
              Go to Dashboard
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Redirecting automatically in {countdown} seconds...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
