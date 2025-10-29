import { useOnboardingGuard } from "@/hooks/use-onboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface OnboardingProgressBannerProps {
  currentStep: "clients" | "services" | "invoices";
}

export function OnboardingProgressBanner({ currentStep }: OnboardingProgressBannerProps) {
  const { isOnboardingComplete, clientCount, serviceCount, invoiceCount } = useOnboardingGuard();
  
  // Don't show if onboarding is complete
  if (isOnboardingComplete) return null;
  
  const stepConfig = {
    clients: {
      isComplete: clientCount > 0,
      nextStep: { title: "Add Your First Service", href: "/services" },
      message: "Great! You've added your first client.",
    },
    services: {
      isComplete: serviceCount > 0,
      nextStep: { title: "Create Your First Invoice", href: "/invoices/new" },
      message: "Excellent! Your service catalog is ready.",
    },
    invoices: {
      isComplete: invoiceCount > 0,
      nextStep: { title: "Go to Dashboard", href: "/dashboard" },
      message: "Perfect! You've created your first invoice.",
    },
  };
  
  const config = stepConfig[currentStep];
  
  // Only show banner if current step is complete
  if (!config.isComplete) return null;
  
  return (
    <Card className="p-4 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">{config.message}</p>
            <p className="text-sm text-green-700 dark:text-green-300">Ready for the next step?</p>
          </div>
        </div>
        <Link href={config.nextStep.href}>
          <Button className="gap-2">
            {config.nextStep.title}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

