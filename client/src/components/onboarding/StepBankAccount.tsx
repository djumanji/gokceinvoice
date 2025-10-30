import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Plus, Trash2 } from "lucide-react";

interface BankAccountData {
  accountHolderName: string;
  bankName: string;
  iban: string;
  swiftCode: string;
  currency: string;
  isDefault: boolean;
}

interface StepBankAccountProps {
  currency: string;
  onBack: () => void;
  onContinue: (accounts: BankAccountData[]) => void;
}

export function StepBankAccount({ currency, onBack, onContinue }: StepBankAccountProps) {
  const [accounts, setAccounts] = useState<BankAccountData[]>([
    {
      accountHolderName: '',
      bankName: '',
      iban: '',
      swiftCode: '',
      currency: currency,
      isDefault: true,
    }
  ]);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});

  const validate = () => {
    const newErrors: Record<number, Record<string, string>> = {};

    accounts.forEach((account, index) => {
      const accountErrors: Record<string, string> = {};

      if (account.accountHolderName.length < 2) {
        accountErrors.accountHolderName = "Account holder name required";
      }
      if (account.bankName.length < 2) {
        accountErrors.bankName = "Bank name required";
      }
      if (!account.iban && !account.swiftCode) {
        accountErrors.iban = "Either IBAN or SWIFT code is required";
        accountErrors.swiftCode = "Either IBAN or SWIFT code is required";
      }

      if (Object.keys(accountErrors).length > 0) {
        newErrors[index] = accountErrors;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onContinue(accounts);
    }
  };

  const addAccount = () => {
    setAccounts([...accounts, {
      accountHolderName: '',
      bankName: '',
      iban: '',
      swiftCode: '',
      currency: currency,
      isDefault: false,
    }]);
  };

  const removeAccount = (index: number) => {
    if (accounts.length > 1) {
      setAccounts(accounts.filter((_, i) => i !== index));
    }
  };

  const updateAccount = (index: number, field: keyof BankAccountData, value: string) => {
    const updated = [...accounts];
    updated[index] = { ...updated[index], [field]: value };
    setAccounts(updated);

    // Clear error for this field
    if (errors[index]) {
      const updatedErrors = { ...errors };
      delete updatedErrors[index][field];
      setErrors(updatedErrors);
    }
  };

  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Back button clicked, calling onBack');
    // Force immediate callback
    if (onBack) {
      onBack();
    } else {
      console.error('onBack is not defined!');
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 relative" style={{ overflow: 'visible' }}>
      <button
        type="button"
        onClick={handleBack}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="absolute top-8 left-8 z-[9999] cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium px-3 py-2 min-h-8 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1"
        style={{ pointerEvents: 'auto', position: 'fixed' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-2xl relative">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Add Your Bank Account</CardTitle>
          <CardDescription>
            Step 2 of 4 - For receiving invoice payments (at least one required)
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {accounts.map((account, index) => (
              <div key={account.accountHolderName + index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">
                    Bank Account {index + 1}
                    {account.isDefault && (
                      <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </h3>
                  {accounts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAccount(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Account Holder Name *</Label>
                  <Input
                    value={account.accountHolderName}
                    onChange={(e) => updateAccount(index, 'accountHolderName', e.target.value)}
                    placeholder="John Doe"
                    className={errors[index]?.accountHolderName ? "border-destructive" : ""}
                  />
                  {errors[index]?.accountHolderName && (
                    <p className="text-sm text-destructive">{errors[index]?.accountHolderName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Bank Name *</Label>
                  <Input
                    value={account.bankName}
                    onChange={(e) => updateAccount(index, 'bankName', e.target.value)}
                    placeholder="Bank of America"
                    className={errors[index]?.bankName ? "border-destructive" : ""}
                  />
                  {errors[index]?.bankName && (
                    <p className="text-sm text-destructive">{errors[index].bankName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>IBAN</Label>
                    <Input
                      value={account.iban}
                      onChange={(e) => updateAccount(index, 'iban', e.target.value)}
                      placeholder="DE89370400440532013000"
                      className={errors[index]?.iban ? "border-destructive" : ""}
                    />
                    {errors[index]?.iban && (
                      <p className="text-sm text-destructive">{errors[index].iban}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>SWIFT Code</Label>
                    <Input
                      value={account.swiftCode}
                      onChange={(e) => updateAccount(index, 'swiftCode', e.target.value)}
                      placeholder="DEUTDEFF"
                      className={errors[index]?.swiftCode ? "border-destructive" : ""}
                    />
                    {errors[index]?.swiftCode && (
                      <p className="text-sm text-destructive">{errors[index].swiftCode}</p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  * At least one of IBAN or SWIFT Code is required
                </p>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addAccount}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Bank Account
            </Button>

            <Button type="submit" className="w-full" size="lg">
              Continue to Client Details →
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Step 2 of 4</p>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
