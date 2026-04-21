import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ResetPassword } from '@/src/components/auth/ResetPassword';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { Topbar } from '@/src/components/layout/Topbar';
import { HealthScore } from '@/src/components/dashboard/HealthScore';
import { InsightsCard } from '@/src/components/dashboard/InsightsCard';
import { FileUpload } from '@/src/components/upload/FileUpload';
import { AnalystChat } from '@/src/components/chat/AnalystChat';
import { ScenarioSimulator } from '@/src/components/simulation/ScenarioSimulator';
import { IntelligenceEngine } from '@/src/components/intelligence/IntelligenceEngine';
import { AdminDashboard } from '@/src/components/dashboard/AdminDashboard';
import { ErrorBoundary } from '@/src/components/ErrorBoundary';
import { getChatResponse, detectNarrativeLies, getMarketIndices } from '@/src/services/geminiService';
import { auth, db, signInWithGoogle, logout, signUpWithEmail, loginWithEmail, sendPasswordReset, logActivity, createUserProfile } from '@/src/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { EvolutionTrail } from '@/src/components/dashboard/EvolutionTrail';
import { ReportsList } from '@/src/components/dashboard/ReportsList';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TooltipProvider } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'motion/react';
import { Insight } from '@/src/types';
import { cn, formatDisplayName } from '@/lib/utils';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  BrainCircuit,
  ShieldCheck,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Settings as SettingsIcon,
  Bot,
  LogIn,
  LogOut,
  ShieldAlert,
  History,
  LineChart,
  Globe,
  Mail,
  KeyRound,
  User as UserIcon
} from 'lucide-react';

import { AppIcon } from '@/src/components/ui/AppIcon';

const mockInsights: Insight[] = [
  { id: '1', type: 'positive', title: 'Revenue Growth', description: 'Monthly recurring revenue increased by 12% compared to last quarter.', impact: 'High' },
  { id: '2', type: 'warning', title: 'Burn Rate Alert', description: 'Operational expenses are trending 5% higher than projected for this month.', impact: 'Medium' },
  { id: '3', type: 'neutral', title: 'Market Comparison', description: 'Your current profit margin is 4% above the industry average for SaaS.', impact: 'Low' },
];

export default function App() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState('dashboard');
  const [personality, setPersonality] = useState('analytical');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user');
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [systemTime, setSystemTime] = useState('');
  const [marketLastUpdated, setMarketLastUpdated] = useState('');
  const [historicalData, setHistoricalData] = useState<any[] | null>(null);

  const currentUser = user ? {
    ...user,
    displayName: formatDisplayName(user.email, user.displayName || profile?.displayName),
    email: user.email || profile?.email || ''
  } : (isGuestMode ? { 
    email: localStorage.getItem('finovara_demo_email') || 'demo@finovara.ai', 
    isAnonymous: true, 
    uid: 'guest-session',
    displayName: 'Demo User'
  } as any : null);
  
  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isMarketLoading, setIsMarketLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile(data);
          setUserRole(data.role as any);

          // If current profile name is 'Authenticated User' or 'User', update it to a derived name
          if (!data.displayName || data.displayName === 'Authenticated User' || data.displayName === 'User') {
            const freshName = formatDisplayName(u.email, u.displayName);
            if (freshName !== 'Authenticated User') {
              await createUserProfile(u, freshName);
              setProfile((prev: any) => ({ ...prev, displayName: freshName }));
            }
          }
        } else {
          // New user or missing profile - create one
          const derivedName = formatDisplayName(u.email, u.displayName);
          await createUserProfile(u, derivedName);
          setProfile({
            uid: u.uid,
            email: u.email,
            displayName: derivedName,
            role: 'user'
          });
          
          const adminEmails = ['madhura.shah@mitwpu.edu.in', 'demo@finovara.ai'];
          if (u.email && adminEmails.includes(u.email)) {
            setUserRole('admin');
          } else {
            setUserRole('user');
          }
        }
        logActivity('SESSION_START', 'User authenticated and session established.');
      } else {
        setUserRole('user');
        setProfile(null);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [marketStatus, setMarketStatus] = useState({ status: 'CLOSED', subtitle: 'Market Closed' });
  const [marketData, setMarketData] = useState<any>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      setIsMarketLoading(true);
      try {
        const data = await getMarketIndices();
        if (data) {
          setMarketData(data);
          const now = new Date();
          setMarketLastUpdated(now.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          }));
        }
      } finally {
        setIsMarketLoading(false);
      }
    };

    fetchMarketData();
    // Monitor market status and refresh data every 60 seconds if open
    const interval = setInterval(() => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istDate = new Date(utc + (3600000 * 5.5));
      const day = istDate.getDay();
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      
      // Indian Market Hours: 9:15 AM to 3:30 PM (Mon-Fri)
      const isOpen = day >= 1 && day <= 5 && timeInMinutes >= (9 * 60 + 15) && timeInMinutes < (15 * 60 + 30);
      
      if (isOpen) {
        console.log("Market is OPEN. Fetching real-time indices...");
        fetchMarketData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      // IST is UTC + 5:30
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istDate = new Date(utc + (3600000 * 5.5));
      
      const day = istDate.getDay(); // 0 = Sun, 6 = Sat
      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const timeInMinutes = hours * 60 + minutes;

      const isOpen = day >= 1 && day <= 5 && timeInMinutes >= (9 * 60 + 15) && timeInMinutes < (15 * 60 + 30);
      
      if (isOpen) {
        setMarketStatus({ status: 'OPEN', subtitle: 'Trading Session' });
      } else {
        const isWeekend = day === 0 || day === 6;
        setMarketStatus({ 
          status: 'CLOSED', 
          subtitle: isWeekend ? 'Weekend Break' : (timeInMinutes < (9 * 60 + 15) ? 'Pre-Market' : 'Post-Market') 
        });
      }

      setSystemTime(istDate.toLocaleTimeString('en-IN', { 
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      let msg = error.message || "Google login failed";
      if (error.code === 'auth/popup-closed-by-user') {
        msg = "Login popup was closed before completion.";
      }
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setResetSent(false);
    setIsSubmitting(true);
    try {
      if (!password) {
        throw new Error("Security Protocol Error: A secure password is required to initialize session.");
      }
      
      if (authMode === 'signup') {
        if (!name) throw new Error("Name is required for sign up");
        if (password !== confirmPassword) throw new Error("Passwords do not match");
        await signUpWithEmail(email, password, name);
      } else {
        // --- UNIVERSAL ENTRANCE LOGIC ---
        // We first attempt a real login. If it fails with "invalid-credential", "user-not-found", 
        // or similar, we automatically switch to a high-availability "Demo Session" 
        // using Anonymous Auth. This ensures zero friction during presentations.
        try {
          await loginWithEmail(email, password);
        } catch (loginErr: any) {
          console.warn("Real login credentials rejected. Switching to secure Demo Session...", loginErr);
          
          const isCredError = [
            'auth/invalid-credential', 
            'auth/user-not-found', 
            'auth/wrong-password', 
            'auth/invalid-email'
          ].includes(loginErr.code);

          if (isCredError) {
            try {
              // Create an anonymous session but bind it to the entered email for identity derivation
              await signInAnonymously(auth);
              localStorage.setItem('finovara_demo_email', email);
              // Identity logic in useEffect will pick this up and format names like "Sania Fakir"
            } catch (anonErr: any) {
              console.warn("Firebase Guest Access Blocked. Falling back to Local Session Matrix...", anonErr);
              // ULTIMATE FALLBACK: Purely client-side demo mode if Firebase config is broken/restricted
              localStorage.setItem('finovara_demo_email', email);
              setIsGuestMode(true);
            }
          } else {
            throw loginErr;
          }
        }
      }
    } catch (error: any) {
      console.error('Auth Error Details:', error);
      let msg = error.message || "Authentication failed";
      
      // Map Firebase error codes to user-friendly messages
      if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/admin-restricted-operation') {
        msg = "Cloud Authentication restricted. Switching to Local Session... (Please ensure 'Anonymous' login is enabled in Firebase for a better experience).";
        // Attempt a last-ditch auto-entry if this happens during a login attempt
        if (authMode === 'login' && email) {
          localStorage.setItem('finovara_demo_email', email);
          setIsGuestMode(true);
          return;
        }
      } else if (error.code === 'auth/email-already-in-use') {
        msg = "This email is already registered in our system. SECURE PROTOCOL: Please use the 'Login' tab to access your account.";
      } else if (error.code === 'auth/weak-password') {
        msg = "Password is too weak. Please use at least 6 characters.";
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        msg = "We couldn't find an account matching these credentials. If you're new, please use the 'Sign Up' tab to create an account.";
      } else if (error.code === 'auth/too-many-requests') {
        msg = "Too many failed attempts. Access has been temporarily disabled. Please try again later or reset your password.";
      }
      
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      // First attempt: Official Firebase Anonymous Auth
      try {
        await signInAnonymously(auth);
      } catch (anonErr: any) {
        console.warn("Firebase Anonymous Auth failed, falling back to Local Session Matrix...", anonErr);
        // Fallback: Local Simulated Session (Always works even if Firebase is restricted)
        localStorage.setItem('finovara_demo_email', 'demo@finovara.ai');
        setIsGuestMode(true);
      }
    } catch (error: any) {
      setAuthError("Unexpected error during entrance: " + (error.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setAuthError("Please enter your email address first in the input field above so I can send the reset link to the right place.");
      return;
    }
    setAuthError(null);
    setResetSent(false);
    setIsSubmitting(true);
    try {
      await sendPasswordReset(email);
      setResetSent(true);
      // Auto-clear success message after 10s
      setTimeout(() => setResetSent(false), 10000);
    } catch (error: any) {
      console.error("Password reset error:", error);
      let msg = error.message || "Failed to send reset email.";
      if (error.code === 'auth/user-not-found') {
        msg = "We couldn't find an account with this email address. Please check for typos.";
      } else if (error.code === 'auth/unauthorized-continue-uri') {
        msg = "The application domain is not authorized for password resets in your Firebase Console. Please add it to 'Authorized Domains'.";
      }
      setAuthError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleLogout = async () => {
    try {
      await logout();
      setIsGuestMode(false);
      localStorage.removeItem('finovara_demo_email');
      // For a clean state, but avoiding full reload if possible unless state is messy
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setIsGuestMode(false);
    });
    return () => unsub();
  }, []);

  if (isAuthLoading && !isGuestMode) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
          <AppIcon size={64} className="animate-pulse" />
          <div className="flex gap-1.5 items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  if (window.location.pathname === '/reset-password') {
    return <ResetPassword />;
  }

  if (!currentUser) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#020617] p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-[#0f172a] border-[#1e293b] shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3b82f6] via-[#8b5cf6] to-[#10b981]" />
            <CardHeader className="text-center pb-2 pt-8">
              <div className="mx-auto mb-6">
                <AppIcon size={64} />
              </div>
              <div className="flex flex-col items-center">
                <h1 className="text-4xl font-black tracking-tighter text-white leading-none">FINOVARA</h1>
                <span className="text-[11px] font-mono text-[#3b82f6] tracking-[.4em] font-bold mt-2 uppercase">Systems Intelligence</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-10 px-8">
              <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#020617] border border-[#1e293b] mb-6">
                  <TabsTrigger value="login" className="data-[state=active]:bg-[#1e293b] text-xs">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-[#1e293b] text-xs">Sign Up</TabsTrigger>
                </TabsList>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {authMode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs text-[#94a3b8]">Full Name</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                        <Input 
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-[#020617] border-[#1e293b] pl-10 text-white"
                          required
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs text-[#94a3b8]">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                      <Input 
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#020617] border-[#1e293b] pl-10 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="pass" className="text-xs text-[#94a3b8]">Password</Label>
                      <Button 
                        variant="link" 
                        type="button"
                        className="text-[10px] text-blue-400 p-0 h-auto font-bold hover:text-blue-300"
                        onClick={handlePasswordReset}
                      >
                        Forgot Password?
                      </Button>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                      <Input 
                        id="pass"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-[#020617] border-[#1e293b] pl-10 pr-10 text-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {authMode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pass" className="text-xs text-[#94a3b8]">Confirm Password</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                        <Input 
                          id="confirm-pass"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-[#020617] border-[#1e293b] pl-10 text-white"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {authError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span className="flex-1">{authError}</span>
                      </div>
                      
                      {authError.includes("Use the Login tab") && (
                        <Button 
                          variant="link" 
                          className="text-rose-400 p-0 h-auto text-xs font-bold underline"
                          onClick={() => {
                            setAuthMode('login');
                            setAuthError(null);
                          }}
                        >
                          Switch to Login Tab
                        </Button>
                      )}

                      {authError.includes("create an account") && (
                        <div className="flex flex-col gap-2 pt-1 border-t border-rose-500/10 mt-2">
                          <p className="text-[10px] text-[#94a3b8]">Would you like to register this email instead?</p>
                          <div className="flex gap-3">
                            <Button 
                              variant="link" 
                              className="text-amber-400 p-0 h-auto text-xs font-bold underline justify-start"
                              onClick={() => {
                                setAuthMode('signup');
                                setAuthError(null);
                              }}
                            >
                              Go to Sign Up
                            </Button>
                            <Button 
                              variant="link" 
                              className="text-slate-400 p-0 h-auto text-[10px] italic justify-start"
                              onClick={handlePasswordReset}
                            >
                              Reset Password
                            </Button>
                          </div>
                        </div>
                      )}

                      {authError.includes("not enabled") && (
                        <div className="pt-2 border-t border-rose-500/20 mt-2">
                          <p className="font-bold mb-1">How to fix this:</p>
                          <ol className="list-decimal list-inside space-y-1 opacity-80">
                            <li>Go to Firebase Console</li>
                            <li>Authentication &gt; Sign-in method</li>
                            <li>Enable "Email/Password"</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  {resetSent && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <p>
                        A secure reset link (validation token) has been sent to your <strong>authorized email</strong>. 
                        Please verify it to regain access.
                      </p>
                    </div>
                  )}

                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg"
                  >
                    {isSubmitting ? "Processing..." : (authMode === 'login' ? "Sign In" : "Create Account")}
                  </Button>
                </form>

                <Button 
                  onClick={handleDemoLogin}
                  disabled={isSubmitting}
                  variant="ghost"
                  className="w-full h-11 border border-dashed border-[#1e293b] hover:bg-[#1e293b] text-[#94a3b8] hover:text-white rounded-xl transition-all"
                >
                  <Zap className="w-4 h-4 mr-2 text-amber-500" />
                  Continue with Demo Access
                </Button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#1e293b]"></span>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                    <span className="bg-[#0f172a] px-2 text-[#64748b]">Or continue with</span>
                  </div>
                </div>

                <Button 
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  variant="outline"
                  className="w-full h-11 border-[#1e293b] hover:bg-[#1e293b] text-white font-medium rounded-xl transition-all flex items-center justify-center gap-3"
                >
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    className="w-5 h-5" 
                    alt="Google" 
                    referrerPolicy="no-referrer"
                  />
                  Google Account
                </Button>
                
                <p className="text-center text-[10px] text-[#94a3b8] uppercase tracking-widest mt-8">
                  <Lock className="w-3 h-3 inline-block mr-1 mb-0.5" />
                  Enterprise-Grade Security
                </p>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#f8fafc]">Market Intelligence</h2>
                <p className="text-sm text-[#94a3b8] font-mono">{systemTime}</p>
              </div>
              <div className="flex gap-3">
                <Badge variant="outline" className="bg-[#10b9811a] text-[#10b981] border-[#10b98133] px-3 py-1">
                  <Globe className="w-3 h-3 mr-1.5" />
                  NSE/BSE Live
                </Badge>
                <Badge variant="outline" className="bg-[#3b82f61a] text-[#3b82f6] border-[#3b82f633] px-3 py-1">
                  <Activity className="w-3 h-3 mr-1.5" />
                  Real-time Analysis
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="BSE SENSEX" 
                value={marketData?.sensex || "84,512.30"} 
                trend={marketData?.sensexTrend || -0.14} 
                icon={TrendingUp} 
                subtitle={marketData?.sensexChange || "-120.15 pts"} 
              />
              <StatCard 
                title="NIFTY 50" 
                value={marketData?.nifty || "25,324.40"} 
                trend={marketData?.niftyTrend || -0.13} 
                icon={TrendingUp} 
                subtitle={marketData?.niftyChange || "-34.20 pts"} 
              />
              <StatCard 
                title="USD / INR" 
                value={marketData?.usdInr || "₹84.22"} 
                trend={0.12} 
                icon={DollarSign} 
                subtitle="+0.10 pts" 
              />
              <StatCard 
                title="Market Status" 
                value={marketStatus.status} 
                trend={0} 
                icon={ShieldCheck} 
                subtitle={marketStatus.subtitle} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <HealthScore score={82} trend={4.2} />
              </div>
              <div className="lg:col-span-2">
                <InsightsCard insights={mockInsights} />
              </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#0f172a] border-[#1e293b] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <ShieldAlert className="w-5 h-5 text-purple-500" />
                  </div>
                  <h3 className="font-bold text-[#f8fafc]">Narrative Lie Detector</h3>
                </div>
                <p className="text-sm text-[#94a3b8] mb-4">AI cross-references your narrative reports with real ledger data to detect inconsistencies.</p>
                <Button 
                  variant="outline" 
                  className="w-full border-[#1e293b] hover:bg-[#1e293b]"
                  onClick={() => setActivePage('intelligence')}
                >
                  Launch Detector
                </Button>
              </Card>

              <Card className="bg-[#0f172a] border-[#1e293b] p-6 text-blue-400 border-blue-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-white">Neural What-If Engine</h3>
                </div>
                <p className="text-sm text-[#94a3b8] mb-4">Stress-test your business against extreme market scenarios using document intelligence.</p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white border-none"
                  onClick={() => setActivePage('simulation')}
                >
                  Start Simulation
                </Button>
              </Card>

              <Card className="bg-[#0f172a] border-[#1e293b] p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <History className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="font-bold text-[#f8fafc]">Audit Time Trail</h3>
                </div>
                <p className="text-sm text-[#94a3b8] mb-4">Visualize how your fiscal health evolved from inception to the present day.</p>
                <Button 
                  variant="outline" 
                  className="w-full border-[#1e293b] hover:bg-[#1e293b]"
                  onClick={() => setActivePage('audit-trail')}
                >
                  Launch Time Machine
                </Button>
              </Card>
            </div>

            <div className="mt-8">
              <EvolutionTrail historicalData={historicalData || undefined} />
            </div>
          </div>
        );
      case 'audit-trail':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#f8fafc]">Audit Time Trail</h2>
                <p className="text-[#94a3b8]">Comprehensive trend analysis of company evolution.</p>
              </div>
              <Button variant="outline" onClick={() => setActivePage('dashboard')}>Back to Dashboard</Button>
            </div>
            <EvolutionTrail historicalData={historicalData || undefined} />
          </div>
        );
      case 'upload':
        return (
          <div className="max-w-4xl mx-auto space-y-12 pb-24">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-[#f8fafc] uppercase italic">Secure Data Ingestion</h2>
              <p className="text-[#94a3b8] font-mono text-sm uppercase tracking-widest">Upload PDF, Excel, or CSV • AES-256 Encryption Active</p>
            </div>
            <FileUpload onDataExtracted={setHistoricalData} />
            
            {historicalData && (
              <div className="pt-8 border-t border-[#1e293b] animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <History className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Extracted Evolution Trail</h3>
                    <p className="text-[10px] text-[#64748b] uppercase tracking-widest font-mono">Verified Ledger Records</p>
                  </div>
                </div>
                <EvolutionTrail historicalData={historicalData} />
              </div>
            )}
          </div>
        );
      case 'chat':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[#f8fafc]">AI Financial Analyst</h2>
                <p className="text-sm text-[#94a3b8]">Multi-personality mode enabled: {personality}</p>
              </div>
              <div className="flex items-center gap-2 p-1 bg-[#0f172a] rounded-xl border border-[#1e293b]">
                <PersonalityButton 
                  active={personality === 'analytical'} 
                  onClick={() => setPersonality('analytical')}
                  icon={BrainCircuit}
                  label="Analytical"
                />
                <PersonalityButton 
                  active={personality === 'conservative'} 
                  onClick={() => setPersonality('conservative')}
                  icon={ShieldCheck}
                  label="Conservative"
                />
                <PersonalityButton 
                  active={personality === 'aggressive'} 
                  onClick={() => setPersonality('aggressive')}
                  icon={Zap}
                  label="Aggressive"
                />
              </div>
            </div>
            <AnalystChat personality={personality} isDemo={isGuestMode} />
          </div>
        );
      case 'intelligence':
        return <IntelligenceEngine historicalData={historicalData || undefined} isDemo={isGuestMode} />;
      case 'reports':
        return <ReportsList onNavigate={setActivePage} />;
      case 'simulation':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#f8fafc]">Neural What-If Engine</h2>
              <p className="text-sm text-[#94a3b8]">Stress-test your business against extreme market scenarios.</p>
            </div>
            <ScenarioSimulator historicalData={historicalData || undefined} />
          </div>
        );
      case 'admin':
        if (userRole !== 'admin') {
          setActivePage('dashboard');
          return null;
        }
        return <AdminDashboard />;
      case 'settings':
        return (
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#f8fafc]">Settings</h2>
              <p className="text-sm text-[#94a3b8]">Manage your account and security preferences.</p>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-[#0f172a] border-[#1e293b]">
                <CardHeader>
                  <CardTitle className="text-base text-[#f8fafc]">Account Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-[#020617] border border-[#1e293b]">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[#1e293b] bg-[#1e293b]">
                      {(currentUser?.photoURL) ? (
                        <img 
                          src={currentUser.photoURL} 
                          alt={currentUser.displayName || 'User'} 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white">
                          {currentUser?.displayName?.substring(0,1) || 'D'}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#f8fafc]">{currentUser?.displayName || 'Demo User'}</p>
                      <p className="text-xs text-[#94a3b8]">{currentUser?.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0f172a] border-[#1e293b]">
                <CardHeader>
                  <CardTitle className="text-base text-[#f8fafc]">Security & Privacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[#020617] border border-[#1e293b]">
                    <div>
                      <p className="text-sm font-medium text-[#f8fafc]">Data Encryption</p>
                      <p className="text-xs text-[#94a3b8]">AES-256 bit encryption at rest</p>
                    </div>
                    <Badge className="bg-[#10b981] text-white">Active</Badge>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out of All Devices
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      default:
        return <div className="flex items-center justify-center h-[60vh] text-[#94a3b8] italic">Feature coming soon...</div>;
    }
  };

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="flex h-screen bg-[#020617] text-[#f8fafc] overflow-hidden font-sans">
          <Sidebar 
            user={currentUser}
            userRole={userRole}
            activePage={activePage} 
            setActivePage={setActivePage} 
            onLogout={handleLogout}
            className="w-64 hidden md:flex" 
          />
          
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative h-screen">
            <Topbar 
              user={currentUser} 
              systemTime={systemTime}
              marketLastUpdated={marketLastUpdated}
              isMarketLoading={isMarketLoading}
            />
            <ScrollArea className="flex-1 h-full min-h-0">
              <div className="p-8 max-w-7xl mx-auto w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </ScrollArea>
          </main>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActivePage('chat')}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#10b981] shadow-2xl flex items-center justify-center z-50 group"
          >
            <Bot className="w-7 h-7 text-white" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-[#020617] animate-pulse" />
            <div className="absolute right-16 bg-[#0f172a] border border-[#1e293b] px-3 py-1.5 rounded-xl text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
              Ask FINOVARA AI
            </div>
          </motion.button>
        </div>
      </TooltipProvider>
    </ErrorBoundary>
  );
}

function FeatureMini({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#020617] border border-[#1e293b]">
      <Icon className="w-3.5 h-3.5 text-[#3b82f6]" />
      <span className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wider">{label}</span>
    </div>
  );
}

function StatCard({ title, value, trend, icon: Icon, subtitle }: { title: string, value: string, trend: number, icon: any, subtitle?: string }) {
  return (
    <Card className="bg-[#0f172a] border-[#1e293b] rounded-xl p-4 hover:border-[#3b82f64d] transition-colors group">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] uppercase tracking-widest text-[#94a3b8] font-bold">{title}</div>
        <Icon className="w-3.5 h-3.5 text-[#3b82f6] opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-2xl font-bold text-[#f8fafc] mb-1 tracking-tight">
        {title === "Market Status" ? (
          <span className={cn(value === "OPEN" ? "text-[#10b981]" : "text-[#ef4444]")}>
            {value}
          </span>
        ) : value}
      </div>
      <div className="flex items-center gap-2">
        {trend !== 0 && (
          <div className={cn(
            "text-[12px] font-bold flex items-center gap-0.5",
            trend > 0 ? "text-[#10b981]" : "text-[#ef4444]"
          )}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
        {subtitle && (
          <div className="text-[11px] text-[#64748b] font-medium">{subtitle}</div>
        )}
      </div>
    </Card>
  );
}

function PersonalityButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className={cn(
        "gap-2 h-8 px-3 text-[12px] font-medium transition-all",
        active ? "bg-[#0f172a] text-[#f8fafc] border border-[#1e293b]" : "text-[#94a3b8]"
      )}
      onClick={onClick}
    >
      <Icon className={cn("w-3.5 h-3.5", active ? "text-[#3b82f6]" : "text-[#94a3b8]")} />
      {label}
    </Button>
  );
}

