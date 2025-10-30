import { useState } from "react";
import { useLocation } from "wouter";
import { StepCompanyDetails } from "@/components/onboarding/StepCompanyDetails";
import { StepBankAccount } from "@/components/onboarding/StepBankAccount";
import { StepFirstClient } from "@/components/onboarding/StepFirstClient";
import { StepReviewConfirm } from "@/components/onboarding/StepReviewConfirm";
import { StepComplete } from "@/components/onboarding/StepComplete";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
      // Create all bank accounts in parallel for faster execution
      const accountPromises = bankAccounts.map(account => {
        const payload: any = {
          accountHolderName: account.accountHolderName,
          bankName: account.bankName,
          currency: account.currency,
          isDefault: account.isDefault,
        };
        
        // Only include optional fields if they have non-empty values
        // Convert empty strings to undefined to avoid sending them
        if (account.iban && account.iban.trim()) {
          payload.iban = account.iban.trim();
        }
        if (account.swiftCode && account.swiftCode.trim()) {
          payload.swiftCode = account.swiftCode.trim();
        }
        
        return apiRequest('POST', '/api/bank-accounts', payload);
      });

      // Wait for all bank accounts to be created, handle partial failures gracefully
      const results = await Promise.allSettled(accountPromises);
      const failures = results.filter(r => r.status === 'rejected');

      if (failures.length > 0) {
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        console.error('Some bank accounts failed to create:', failures);
        toast({
          title: t("onboarding.partialSuccess"),
          description: `${successCount} of ${bankAccounts.length} accounts created successfully`,
          variant: failures.length === bankAccounts.length ? "destructive" : "default",
        });

        // Continue if at least one succeeded
        if (successCount === 0) {
          throw new Error('Failed to create any bank accounts');
        }
      }

      setData(prev => ({ ...prev, bankAccounts }));
      setStep('client');
    } catch (error: any) {
      console.error('Failed to save bank accounts:', error);
      const errorMessage = error?.message || error?.error || "Failed to save bank account. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
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

  const handleNavigate = async (path: string) => {
    sessionStorage.setItem('onboarding-just-completed', 'true');
    
    // Invalidate auth and onboarding queries to force fresh fetch
    // This ensures ProtectedRoute gets the latest auth state
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
    queryClient.invalidateQueries({ queryKey: ["/api/services"] });
    
    // Small delay to allow cache invalidation to propagate
    setTimeout(() => {
      setLocation(path);
    }, 100);
  };

  const handleSkipOnboarding = async () => {
    try {
      // To skip onboarding, we need to set a minimal companyName and create a dummy client
      // This allows the user to bypass onboarding while still having valid data
      await apiRequest('PATCH', '/api/users/profile', {
        companyName: 'Company', // Minimal value to mark onboarding as complete
      });
      
      // Create a dummy client to satisfy onboarding requirements
      await apiRequest('POST', '/api/clients', {
        name: 'Client',
        email: 'client@example.com',
        company: '',
        phone: '',
        address: '',
      });
      
      // Invalidate queries to refresh onboarding status
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      // Navigate to dashboard
      setTimeout(() => {
        setLocation('/dashboard');
      }, 100);
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to skip onboarding. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {step === 'company' && (
        <StepCompanyDetails
          initialData={data.company}
          onContinue={handleCompanySubmit}
          onSkip={handleSkipOnboarding}
        />
      )}

      {step === 'bank' && (
        <>
          <StepBankAccount
            key="bank-step"
            currency={data.company.currency}
            onBack={() => {
              console.log('onBack callback called');
              setStep((prev) => {
                console.log('setStep called with prev:', prev);
                return 'company';
              });
            }}
            onContinue={handleBankSubmit}
          />
        </>
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
