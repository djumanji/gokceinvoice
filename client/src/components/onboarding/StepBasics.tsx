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
  { value: "EUR", label: "EUR - Euro" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "TRY", label: "TRY - Turkish Lira" },
  { value: "AUD", label: "AUD - Australian Dollar" },
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
          <CardTitle className="text-3xl">Welcome to InvoiceHub!</CardTitle>
          <CardDescription className="text-lg">
            Let's get you set up in less than 3 minutes
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <Button
              type="submit"
              disabled={!isValid}
              className="w-full"
              size="lg"
            >
              Continue →
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Only 2 more steps to go!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
