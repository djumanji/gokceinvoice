import { useState } from "react";
import { useLocation } from "wouter";
import { StepCompanyDetails } from "@/components/onboarding/StepCompanyDetails";
import { StepBankAccount } from "@/components/onboarding/StepBankAccount";
import { StepFirstClient } from "@/components/onboarding/StepFirstClient";
import { StepReviewConfirm } from "@/components/onboarding/StepReviewConfirm";
import { StepComplete } from "@/components/onboarding/StepComplete";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type Step = 'company' | 'bank' | 'client' | 'review' | 'complete';

interface BankAccountData {
  accountHolderName: string;
  bankName: string;
  iban: string;
  swiftCode: string;
  currency: string;
  isDefault: boolean;
}

interface OnboardingData {
  company: {
    companyName: string;
    address: string;
    phone: string;
    currency: string;
  };
  bankAccounts: BankAccountData[];
  client: {
    name: string;
    company: string;
    email: string;
    phone: string;
    address: string;
    projectName: string;
  };
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('company');
  const [data, setData] = useState<OnboardingData>({
    company: {
      companyName: '',
      address: '',
      phone: '',
      currency: 'EUR'
    },
    bankAccounts: [],
    client: {
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      projectName: ''
    }
  });

  const handleCompanySubmit = async (values: OnboardingData['company']) => {
    try {
      // Save company details to user profile
      await apiRequest('PATCH', '/api/users/profile', {
        companyName: values.companyName,
        address: values.address,
        phone: values.phone,
      });

      setData(prev => ({ ...prev, company: values }));
      setStep('bank');
    } catch (error) {
      console.error('Failed to save company details:', error);
      toast({
        title: "Error",
        description: "Failed to save company details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBankSubmit = async (bankAccounts: BankAccountData[]) => {
    try {
      // Create all bank accounts
      for (const account of bankAccounts) {
        await apiRequest('POST', '/api/bank-accounts', {
          accountHolderName: account.accountHolderName,
          bankName: account.bankName,
          iban: account.iban || undefined,
          swiftCode: account.swiftCode || undefined,
          accountNumber: undefined,
          currency: account.currency,
          isDefault: account.isDefault,
        });
      }

      setData(prev => ({ ...prev, bankAccounts }));
      setStep('client');
    } catch (error) {
      console.error('Failed to save bank accounts:', error);
      toast({
        title: "Error",
        description: "Failed to save bank account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClientSubmit = async (values: OnboardingData['client']) => {
    try {
      // Create client with project name in notes
      await apiRequest('POST', '/api/clients', {
        name: values.name,
        email: values.email,
        company: values.company,
        phone: values.phone,
        address: values.address,
        notes: `Project: ${values.projectName}`,
      });

      setData(prev => ({ ...prev, client: values }));
      setStep('review');
    } catch (error) {
      console.error('Failed to save client:', error);
      toast({
        title: "Error",
        description: "Failed to save client details. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleComplete = () => {
    setStep('complete');
  };

  const handleNavigate = (path: string) => {
    sessionStorage.setItem('onboarding-just-completed', 'true');
    setTimeout(() => {
      setLocation(path);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-background">
      {step === 'company' && (
        <StepCompanyDetails
          initialData={data.company}
          onContinue={handleCompanySubmit}
        />
      )}

      {step === 'bank' && (
        <StepBankAccount
          currency={data.company.currency}
          onBack={() => setStep('company')}
          onContinue={handleBankSubmit}
        />
      )}

      {step === 'client' && (
        <StepFirstClient
          onBack={() => setStep('bank')}
          onContinue={handleClientSubmit}
        />
      )}

      {step === 'review' && (
        <StepReviewConfirm
          data={data}
          onBack={() => setStep('client')}
          onEdit={(section: 'company' | 'bank' | 'client') => setStep(section)}
          onComplete={handleComplete}
        />
      )}

      {step === 'complete' && (
        <StepComplete onNavigate={handleNavigate} />
      )}
    </div>
  );
}
