import React, { useState, useEffect, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

export function ErrorBoundary({ children }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleReset = () => {
    setHasError(false);
    setError(null);
    window.location.reload();
  };

  if (hasError) {
    let errorMessage = "An unexpected error occurred.";
    
    try {
      if (error?.message) {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.includes('insufficient permissions')) {
          errorMessage = "Security Access Denied: You don't have permission to perform this action.";
        }
      }
    } catch (e) {
      // Not a JSON error
    }

    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020617] p-4">
        <Card className="max-w-md bg-[#0f172a] border-rose-500/50 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
              <AlertCircle className="w-6 h-6 text-rose-500" />
            </div>
            <CardTitle className="text-xl font-bold text-white">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <p className="text-[#94a3b8] text-sm">
              {errorMessage}
            </p>
            <Button 
              onClick={handleReset}
              className="w-full bg-[#3b82f6] hover:bg-[#2563eb]"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
