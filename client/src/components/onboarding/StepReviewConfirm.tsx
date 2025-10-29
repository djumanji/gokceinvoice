import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Edit } from "lucide-react";

interface OnboardingData {
  company: {
    companyName: string;
    address: string;
    phone: string;
    currency: string;
  };
  bankAccounts: Array<{
    accountHolderName: string;
    bankName: string;
    iban?: string;
    swiftCode?: string;
    currency: string;
    isDefault: boolean;
  }>;
  client: {
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
    projectName: string;
  };
}

interface StepReviewConfirmProps {
  data: OnboardingData;
  onBack: () => void;
  onEdit: (section: 'company' | 'bank' | 'client') => void;
  onComplete: () => void;
}

export function StepReviewConfirm({ data, onBack, onEdit, onComplete }: StepReviewConfirmProps) {
  const handleBack = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onBack();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="absolute top-8 left-8 z-50 cursor-pointer"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Review Your Information</CardTitle>
          <CardDescription>
            Step 4 of 4 - Please verify everything is correct
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Company Details */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Company Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit('company')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Company Name:</span>{" "}
                {data.company.companyName}
              </div>
              <div>
                <span className="font-medium">Address:</span>{" "}
                {data.company.address}
              </div>
              <div>
                <span className="font-medium">Phone:</span>{" "}
                {data.company.phone}
              </div>
              <div>
                <span className="font-medium">Currency:</span>{" "}
                {data.company.currency}
              </div>
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">
                Bank Account{data.bankAccounts.length > 1 ? 's' : ''}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit('bank')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            <div className="space-y-4">
              {data.bankAccounts.map((account, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{account.bankName}</span>
                    {account.isDefault && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <div>Holder: {account.accountHolderName}</div>
                  {account.iban && <div>IBAN: {account.iban}</div>}
                  {account.swiftCode && <div>SWIFT: {account.swiftCode}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Client Details */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">First Client</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit('client')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Contact:</span>{" "}
                {data.client.name}
              </div>
              <div>
                <span className="font-medium">Company:</span>{" "}
                {data.client.company}
              </div>
              <div>
                <span className="font-medium">Email:</span>{" "}
                {data.client.email}
              </div>
              <div>
                <span className="font-medium">Phone:</span>{" "}
                {data.client.phone}
              </div>
              <div>
                <span className="font-medium">Address:</span>{" "}
                {data.client.address}
              </div>
              <div>
                <span className="font-medium">Project:</span>{" "}
                {data.client.projectName}
              </div>
            </div>
          </div>

          <Button
            onClick={onComplete}
            className="w-full"
            size="lg"
          >
            Complete Setup →
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Step 4 of 4</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
