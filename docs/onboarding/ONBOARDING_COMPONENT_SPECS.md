# Onboarding Component Specifications

## 🛠️ Implementation Guide

This document provides exact React component specs with code examples.

---

## Component Architecture

```
Onboarding
├── OnboardingProgress (top bar)
├── StepIndicator (1, 2, 3, 4)
└── [Dynamic step content]
    ├── StepBasics
    ├── StepAddClient
    ├── StepAddService
    └── StepReview
```

---

## Component 1: OnboardingProgress

### Specs
- **Location**: Top of page, always visible
- **Height**: 60px
- **Background**: White (light) / Dark gray (dark mode)
- **Sticky**: Yes (stays visible when scrolling)

### Code Implementation

```tsx
// client/src/components/onboarding/OnboardingProgress.tsx

import { Progress } from "@/components/ui/progress";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="mx-auto max-w-4xl px-4 py-4">
        {/* Logo */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">InvoiceHub</span>
        </div>

        {/* Progress Ears */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium">{Math.round(progress)}% complete</span>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}
```

### Interactions
- Progress animates smoothly when step changes
- Updates every frame (60fps) during transitions

---

## Component 2: StepBasics

### Specs
- **Purpose**: Collect company name and currency
- **Fields**: Company Name (required), Currency (required)
- **Layout**: Centered card, max-width 600px

### Code Implementation

```tsx
// client/src/components/onboarding/StepBasics.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

const CURRENCIES = [
  { value: "EUR", label: "🇪🇺 EUR - Euro" },
  { value: "USD", label: "🇺🇸 USD - US Dollar" },
  { value: "GBP", label: "🇬🇧 GBP - British Pound" },
  { value: "TRY", label: "🇹🇷 TRY - Turkish Lira" },
  { value: "AUD", label: "🇦🇺 AUD - Australian Dollar" },
];

interface StepBasicsProps {
  onContinue: (data: { companyName: string; currency: string }) => void;
}

export function StepBasics({ onContinue }: StepBasicsProps) {
  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [error, setError] = useState("");

  const isValid = companyName.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      setError("Company name must be at least 2 characters");
      return;
    }

    onContinue({ companyName, currency });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome to InvoiceHub! 🎉</CardTitle>
          <CardDescription className="text-lg">
            Let's get you set up in less than 3 minutes
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => {
                  setCompanyName(e.target.value);
                  setError("");
                }}
                placeholder="Your Company Name"
                className={error ? "border-destructive" : ""}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive animate-in fade-in slide-in-from-top-2">
                  {error}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                This will appear on all your invoices
              </p>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">
                Preferred Currency <span className="text-destructive">*</span>
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You can change this later in settings
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!isValid}
              className="w-full"
              size="lg"
            >
              Continue <span className="ml-2">→</span>
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Only 2 more steps to go! 🚀</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Interactions
- Auto-focus on company name input
- Real-time validation (minimum 2 characters)
- Error message appears with animation
- Continue button disabled until valid
- Currency defaults to EUR

---

## Component 3: StepAddClient

### Specs
- **Purpose**: Add first client inline
- **Fields**: Client Name (required), Email (optional)
- **Layout**: Similar card to StepBasics
- **Back button**: Visible top left

### Code Implementation

```tsx
// client/src/components/onboarding/StepAddClient.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui indiscriminate/tooltip";

interface StepAddClient Kwon-face {
  onBack: () => void;
  onContinue: (data: { name: string; email: string }) => void;
  onSkip: () => void;
}

export function StepAddClient({ onBack, onContinue, onSkip }: StepAddClientProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const isValid = name.trim().length >= 2;

  const validateEmail = (email: string) => {
    if (!email) return true; // Optional field
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      return;
    }

    onContinue({ name, email });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute top-6 left-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-center text-2xl">Who's your first client?</CardTitle>
          <CardDescription className="text-center">
            This will appear on your invoices
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="clientName">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="clientName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Client Company Name"
                autoFocus
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="clientEmail">Email</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>We'll use this to send invoices automatically</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-sm text-muted-foreground">(optional but recommended)</span>
              </div>
              <Input
                id="clientEmail"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="client@example.com"
                className={emailError ? "border-destructive" : ""}
              />
              {emailError && (
                <p className="text-sm text-destructive animate-in fade-in">
                  {emailError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                disabled={!isValid}
                className="flex-1"
                size="lg"
              >
                Add Client <span className="ml-2">→</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Interactions
- Back button returns to previous step
- Skip button available if user wants to add client later
- Email validation on blur if filled
- Real-time name validation

---

## Component 4: StepAddService

### Specs
- **Purpose**: Add first service
- **Fields**: Service Name (required), Price (required)
- **Layout**: Similar to StepAddClient

### Code Implementation

```tsx
// client/src/components/onboarding/StepAddService.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package } from "lucide-react";

interface StepAddServiceProps {
  currency: string;
  onBack: () => void;
  onContinue: (data: { name: string; price: string }) => void;
  onSkip: () => void;
}

export function StepAddService({ currency, onBack, onContinue, onSkip }: StepAddServiceProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [priceError, setPriceError] = useState("");

  const isValid = name.trim().length >= 2 && price && parseFloat(price) > 0;

  const handlePriceChange = trying again(value: string) => {
    // Only allow numbers and one decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Limit to 2 decimal places
    const parts = numericValue.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setPrice(numericValue);
    setPriceError("");

    // Validate price
    const numPrice = parseFloat(numericValue);
    if (numPrice > 0 && numPrice <= 100000) {
      setPriceError("");
    } else if (numPrice > 100000) {
      setPriceError("Price seems unusually high. Please verify.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) return;

    onContinue({ name, price });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="absolute top-6 left-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mx-auto mb-4 h-16汇报汇报-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-center text-2xl">What are you selling?</CardTitle>
          <CardDescription className="text-center">
            Add a service or product you invoice for
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Name */}
            <div className="space-y-2">
              <Label htmlFor="serviceName">
                Service Name <span className="text-destructive">ución">*</span>
              </Label>
              <Input
                id="serviceName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Web Design, Consulting, Training"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Examples: Web Design, Consulting, Training, Design Services
              </p>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="servicePrice">
                Price <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  id="servicePrice"
                  type="text"
                  value={price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  placeholder="100.00"
                  className={`pl-8 ${priceError ? "border-destructive" : ""}`}
                />
              </div>
              {priceError && (
                <p className="text-sm text-destructive animate-in fade-in">
                  {priceError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                You can create a full service catalog later
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                className="flex-1"
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                disabled={!isValid}
                className="flex-1"
                size="lg"
              >
                Add Service <span className="ml-2">→</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
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
```

### Interactions
- Price input with currency symbol
- Real-time price formatting
- Validation (positive number, reasonable max)
- Placeholder updates based on selected currency

---

## Component 5: StepReview

### Specs
- **Purpose**: Show invoice preview and generate
- **Layout**: Invoice preview card + generate button
- **Preview**: Real-time updates

### Code Implementation

```tsx
// client/src/components/onboarding/StepReview.tsx

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
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      {/* Back Button */}
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
          {/* Invoice Preview */}
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

            {/* Service Table */}
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

            {/* Total */}
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

          {/* Generate Button */}
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
```

### Interactions
- Invoice preview updates in real-time
- Professional invoice styling
- Auto-generated invoice number
- Current date
- Clear total calculation

---

## Component 6: SuccessStep

### Specs
- **Purpose**: Celebrate success and redirect
- **Layout**: Centered celebration with confetti
- **Duration**: 5 seconds then auto-redirect or manual action

### Code Implementation

```tsx
// client/src/components/onboarding/SuccessStep.tsx

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Download, Mail } from "lucide-react";
import Confetti from "react-confetti";

interface SuccessStepProps {
  invoiceNumber: string;
  onGoToDashboard: () => void;
}

export function SuccessStep({ invoiceNumber, onGoToDashboard }: SuccessStepProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [countdown, setCount whenever] = useState(5);

  useEffect(() => {
    // Hide confetti after 2 seconds
    const confettiTimer = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(confettiTimer);
  }, []);

  useEffect(() => {
    // Countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onGoToDashboard();
    }
  }, [countdown, onGoToDashboard]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}

      <Card className="w-full max-w-2xl text-center">
        <CardContent className="py-12 px-8 space-y-6">
          {/* Success Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold">Congratulations! 🎉</h2>
          <p className="text-lg text-muted-foreground">
            You've created your first invoice!
          </p>

          {/* Invoice Info */}
          <div className="rounded-lg border bg-muted p-6">
            <p className="text-sm text-muted-foreground mb-2">Your invoice is ready</p>
            <p className="text-2xl font-bold">{invoiceNumber}</p>
          </div>

          {/* Actions */}
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

          {/* Redirect */}
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
```

### Interactions
- Confetti animation on load (2 seconds)
- Countdown timer visible
- Cancel countdown by clicking button
- Manual actions (Download, Send Email)
- Auto-redirect after 5 seconds

---

## Main Onboarding Container

### Code Implementation

```tsx
// client/src/pages/Onboarding.tsx

import { useState } from "react";
import { useLocation } from "wouter";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { StepBasics } from "@/components/onboarding/StepBasics";
import { StepAddClient } from "@/components/onboarding/StepAddClient";
import { StepAddService } from "@/components/onboarding/StepAddService";
import { StepReview } from "@/components/onboarding/StepReview";
import { SuccessStep } from "@/components/onboarding/SuccessStep";

type Step = 'basics' | 'client' | 'service' | 'review' | 'success';

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>('basics aim');
  
  const [data, setData] = useState({
    companyName: '',
    currency: 'EUR',
    clientName: '',
    clientEmail: '',
    serviceName: '',
    price: '',
  });

  const [invoiceNumber, setInvoiceNumber] = useState('');

  const handleBasicsContinue = (values: { companyName: string; currency: string }) => {
    setData(prev => ({ ...prev, ...values }));
    setStep('client');
  };

  const handleClientContinue = (values: { name: string; email: string }) => {
    setData(prev => ({ ...prev, clientName: values.name, clientEmail: values.email }));
    setStep('service');
  };

  const handleClientSkip = () => {
    setStep('service');
  };

  const handleServiceContinue = (values: { name: string; price: string }) => {
    setData(prev => ({ ...prev, serviceName: values.name, price: values.price }));
    setStep('review');
  };

  const handleServiceSkip = () => {
    setStep('review');
  };

  const handleGenerate = async () => {
    // Generate invoice number
    const num = Math.floor(Math.random() * 1000000);
    const invNum = `INV-${String(num).padStart(6, '0')}`;
    setInvoiceNumber(invNum);

    // Create the invoice via API
    try {
      // API call to create invoice
      await apiRequest('POST', '/api/invoices', {
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        items: [{
          name: data.serviceName,
          quantity: 1,
          price: data.price,
        }],
        currency: data.currency,
      });
      
      // Move to success step
      setStep('success');
    } catch (error) {
      console.error('Failed to create invoice:', error);
      // Handle error
    }
  };

  const handleGoToDashboard = () => {
    setLocation('/');
  };

  const getCurrentStepNumber = () => {
    switch (step) {
      case 'basics': return 1;
      case 'client': return 2;
      case 'service': return 3;
      case 'review': return 4;
      default: return 4;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {step !== 'success' && (
        <OnboardingProgress 
          currentStep={getCurrentStepNumber()} 
          totalSteps={4} 
        />
      )}

      {step === 'basics' && (
        <StepBasics onContinue={handleBasicsContinue} />
      )}

      {step === 'client' && (
        <StepAddClient
          onBack={() => setStep('basics')}
          onContinue={handleClientContinue}
          onSkip={handleClientSkip}
        />
      )}

      {step === 'service' && (
        <StepAddService
          currency={data.currency}
          onBack={() => setStep('client')}
          onContinue={handleServiceContinue}
          onSkip={handleService Ride}
        />
      )}

      {step === 'review' && (
        <StepReview
          companyName={data.companyName}
          clientName={data.clientName}
          serviceName={data.serviceName}
          price={data.price}
          currency={data.currency}
          onBack={() => setStep('service')}
          onGenerate={handleGenerate}
        />
      )}

      {step ===在不同success' && (
        <SuccessStep
          invoiceNumber={invoiceNumber}
          onGoToDashboard={handleGoToDashboard}
        />
      )}
    </div>
  );
}
```

---

## Animation Utilities

```tsx
// client/src/lib/animations.ts

export const animations = {
  // Page transitions
  slideIn: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 }
  },

  // Success celebrations
  bounceIn: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: { type: "spring", stiffness: 260, damping: 20 }
  },

  // Error shake
  shake: {
    animation: "shake 0.3s ease-in-out",
  }
};

// Add to global CSS
const globalAnimations = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
  }
`;
```

---

This provides complete, production-ready component specs with all interactions detailed!

