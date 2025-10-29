import { useState } from "react";
import { useLocation } from "wouter";
import { StepBasics } from "@/components/onboarding/StepBasics";
import { StepAddClient } from "@/components/onboarding/StepAddClient";
import { StepAddService } from "@/components/onboarding/StepAddService";
import { StepReview } from "@/components/onboarding/StepReview";
import { SuccessStep } from "@/components/onboarding/SuccessStep";
import { apiRequest } from "@/lib/queryClient";

type Step = 'basics' | 'client' | 'service' | 'review' | 'success';

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>('basics');
  
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
    const num = Math.floor(Math.random() * 1000000);
    const invNum = `INV-${String(num).padStart(6, '0')}`;
    setInvoiceNumber(invNum);

    try {
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
      
      setStep('success');
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  const handleGoToDashboard = () => {
    sessionStorage.setItem('onboarding-just-completed', 'true');
    setTimeout(() => {
      setLocation('/');
    }, 200);
  };

  return (
    <div className="min-h-screen bg-background">
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
          onSkip={handleServiceSkip}
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

      {step === 'success' && (
        <SuccessStep
          invoiceNumber={invoiceNumber}
          onGoToDashboard={handleGoToDashboard}
        />
      )}
    </div>
  );
}