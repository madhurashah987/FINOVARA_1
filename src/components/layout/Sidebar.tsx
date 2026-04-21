import React from 'react';
import { LayoutDashboard, Upload, FileText, MessageSquare, TrendingUp, Settings, LogOut, Menu, ShieldAlert, History, ShieldCheck, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { AppIcon } from '@/src/components/ui/AppIcon';

import { User } from 'firebase/auth';

interface SidebarProps {
  user: User | null;
  userRole?: string;
  activePage: string;
  setActivePage: (page: string) => void;
  onLogout?: () => void;
  className?: string;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'intelligence', label: 'AI Intelligence', icon: BrainCircuit },
  { id: 'upload', label: 'Upload Data', icon: Upload },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'chat', label: 'AI Analyst', icon: MessageSquare },
  { id: 'simulation', label: 'Neural What-If', icon: TrendingUp },
];

const adminItems = [
  { id: 'admin', label: 'Admin Terminal', icon: ShieldCheck },
];

export function Sidebar({ user, userRole, activePage, setActivePage, onLogout, className }: SidebarProps) {
  const displayEmail = user?.email || localStorage.getItem('finovara_demo_email') || 'Guest User';

  return (
    <div className={cn("flex flex-col h-screen border-r bg-[#020617] text-card-foreground w-[220px]", className)}>
      <div className="p-6 flex items-center gap-3">
        <AppIcon size={32} />
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-tighter text-white leading-none">FINOVARA</h1>
          <span className="text-[10px] font-mono text-[#3b82f6] tracking-[.2em] font-bold mt-1">S Y S T E M S</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 py-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={activePage === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-10 px-3 text-[13px]",
                activePage === item.id ? "bg-[#0f172a] text-[#f8fafc] border border-[#1e293b] font-semibold" : "text-[#94a3b8] font-medium"
              )}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon className={cn("w-4 h-4", activePage === item.id ? "text-[#3b82f6]" : "text-[#94a3b8]")} />
              {item.label}
            </Button>
          ))}
          
          {userRole === 'admin' && (
            <>
              <div className="px-3 mt-6 mb-2">
                <span className="text-[10px] font-black text-[#475569] uppercase tracking-widest">Admin Control</span>
              </div>
              {adminItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activePage === item.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-10 px-3 text-[13px]",
                    activePage === item.id ? "bg-[#0f172a] text-[#f8fafc] border border-[#1e293b] font-semibold" : "text-[#94a3b8] font-medium"
                  )}
                  onClick={() => setActivePage(item.id)}
                >
                  <item.icon className={cn("w-4 h-4", activePage === item.id ? "text-blue-500" : "text-[#94a3b8]")} />
                  {item.label}
                </Button>
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto">
        <div className="mb-4 p-3 border border-[#1e293b] rounded-xl bg-[#0f172a] flex items-center gap-3">
          <Avatar className="w-8 h-8 rounded-lg border border-[#3b82f633]">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayEmail}`} />
            <AvatarFallback className="bg-[#1e293b] text-white text-[10px]">{displayEmail.substring(0,2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-white truncate">{displayEmail.split('@')[0]}</span>
            <span className="text-[9px] text-[#64748b] truncate">{user?.isAnonymous ? 'Demo User' : 'Verified'}</span>
          </div>
        </div>
        <Separator className="mb-4 bg-[#1e293b]" />
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start gap-3 h-10 px-3 text-[13px]",
            activePage === 'settings' ? "bg-[#0f172a] text-[#f8fafc] border border-[#1e293b] font-semibold" : "text-[#94a3b8] font-medium"
          )}
          onClick={() => setActivePage('settings')}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 h-10 px-3 text-destructive hover:text-destructive text-[13px]"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
