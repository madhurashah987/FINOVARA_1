import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Lock, AlertCircle, CheckCircle2, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { verifyResetCode, confirmReset } from '@/src/lib/firebase';
import { cn } from '@/lib/utils';

export function ResetPassword() {
  const navigate = useNavigate();
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password Requirements
  const requirements = {
    length: password.length >= 8,
    number: /[0-9]/.test(password),
    uppercase: /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  
  const allMet = Object.values(requirements).every(Boolean);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('oobCode');
    
    if (!code) {
      setError("Invalid link. No configuration code detected.");
      setIsVerifying(false);
      return;
    }

    setOobCode(code);

    const verifyCode = async () => {
      try {
        const emailInfo = await verifyResetCode(code);
        setEmail(emailInfo);
        setIsValidCode(true);
      } catch (err: any) {
        console.error("Verification failed:", err);
        if (err.code === 'auth/expired-action-code') {
          setError("This link has expired. Please request a new password reset email.");
        } else if (err.code === 'auth/invalid-action-code') {
          setError("This link is invalid or has already been used.");
        } else {
          setError("Unable to verify reset link. Please try again later.");
        }
      } finally {
        setIsVerifying(false);
      }
    };

    verifyCode();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode || !allMet) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await confirmReset(oobCode, password);
      setIsSuccess(true);
      setTimeout(() => navigate('/'), 3000);
    } catch (err: any) {
      console.error("Reset failed:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
          <p className="text-[#94a3b8] font-mono text-sm">SECURE_LINK_VERIFICATION_IN_PROGRESS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md bg-[#0f172a] border-[#1e293b] text-white shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center">
          <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20 mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Security Protocol</CardTitle>
          <CardDescription className="text-[#94a3b8]">
            Reset password for {email || "authorized account"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-200">{error}</div>
            </div>
          )}

          {isSuccess ? (
            <div className="text-center space-y-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Credential Sync Successful</h3>
                <p className="text-sm text-[#94a3b8]">Your password has been updated. Redirecting to access terminal...</p>
              </div>
              <Button 
                onClick={() => navigate('/')} 
                className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-xl"
              >
                Enter Portal Now
              </Button>
            </div>
          ) : !isValidCode ? (
            <div className="space-y-6 text-center py-4">
              <p className="text-sm text-[#94a3b8]">This session token is no longer valid. Please return to the login interface to request a fresh authorization link.</p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/')} 
                className="w-full border-[#1e293b] text-[#f8fafc] hover:bg-[#1e293b] h-11 rounded-xl"
              >
                Back to Authentication
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-[#020617] border-[#1e293b] h-11 pr-10 focus-visible:ring-blue-500"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-[#64748b] hover:text-[#94a3b8]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-[#020617] border-[#1e293b] h-11 focus-visible:ring-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {/* Password Requirements Grid */}
              <div className="grid grid-cols-2 gap-2 p-4 bg-[#020617] border border-[#1e293b] rounded-xl">
                <Requirement label="8+ Characters" met={requirements.length} />
                <Requirement label="1+ Number" met={requirements.number} />
                <Requirement label="1+ Uppercase" met={requirements.uppercase} />
                <Requirement label="1+ Special" met={requirements.special} />
              </div>

              <Button
                type="submit"
                disabled={!allMet || isSubmitting}
                className={cn(
                  "w-full h-12 rounded-xl font-bold transition-all duration-300",
                  allMet ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20" : "bg-[#1e293b] cursor-not-allowed opacity-50"
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Update Passcode <ChevronRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      
      {/* Visual Identity Footer */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[#475569] font-mono text-[10px] tracking-widest uppercase">
        <ShieldCheck className="w-3 h-3 text-blue-500" />
        Zero-Trust Reset Protocol Enabled
      </div>
    </div>
  );
}

function Requirement({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-3 h-3 rounded-full flex items-center justify-center transition-colors shrink-0",
        met ? "bg-emerald-500" : "bg-[#1e293b]"
      )}>
        {met && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
      </div>
      <span className={cn(
        "text-[10px] font-medium transition-colors",
        met ? "text-emerald-400" : "text-[#475569]"
      )}>
        {label}
      </span>
    </div>
  );
}
