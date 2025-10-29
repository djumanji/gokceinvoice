import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    verifyEmail(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function verifyEmail(token: string) {
    try {
      const response = await fetch(`/api/auth/verify-email?token=${token}`);
      const data = await response.json();
      
      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('An unexpected error occurred');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-pink-500">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">Verifying your email address...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
              <p className="text-gray-600 text-center">Please wait while we verify your email...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Success!</strong> Your email has been verified successfully.
                </AlertDescription>
              </Alert>
              <Button onClick={() => setLocation('/dashboard')} className="w-full" size="lg">
                Go to Dashboard
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Verification Failed</strong>
                  <p className="mt-1">{errorMessage || 'The verification link may be expired or invalid.'}</p>
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button onClick={() => setLocation('/login')} className="w-full" variant="outline">
                  Back to Login
                </Button>
                <Button onClick={() => setLocation('/register')} className="w-full" variant="ghost">
                  Create New Account
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


