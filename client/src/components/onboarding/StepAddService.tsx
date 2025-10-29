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

  const handlePriceChange = (value: string) => {
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    const parts = numericValue.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setPrice(numericValue);
    setPriceError("");

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

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-center text-2xl">What are you selling?</CardTitle>
          <CardDescription className="text-center">
            Add a service or product you invoice for
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serviceName">
                Service Name <span className="text-destructive">*</span>
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
                Add Service →
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
