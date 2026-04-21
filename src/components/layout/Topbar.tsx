import React from 'react';
import { Bell, Search, User as UserIcon, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User } from 'firebase/auth';
import { cn } from '@/lib/utils';

interface TopbarProps {
  user: User | null;
  systemTime?: string;
  marketLastUpdated?: string;
  isMarketLoading?: boolean;
}

export function Topbar({ user, systemTime, marketLastUpdated, isMarketLoading }: TopbarProps) {
  const displayName = user?.displayName || user?.email || localStorage.getItem('finovara_demo_email') || 'Guest User';
  const isAnonymous = user?.isAnonymous || false;

  return (
    <header className="h-16 border-b border-[#1e293b] bg-[#020617] flex items-center justify-between px-8 sticky top-0 z-10 backdrop-blur-md bg-opacity-80">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-black text-[#f8fafc] tracking-tighter">FINOVARA</h1>
          <span className="px-1.5 py-0.5 rounded bg-[#3b82f61a] border border-[#3b82f633] text-[9px] font-bold text-[#3b82f6] uppercase tracking-widest">
            Terminal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[10px] text-[#475569] font-mono uppercase tracking-widest font-bold">
            {isAnonymous ? 'Restricted Mode' : 'Operational'} 
          </p>
          {systemTime && <span className="text-[10px] text-[#334155] font-mono">| {systemTime} IST</span>}
          {marketLastUpdated && (
            <div className="flex items-center gap-1.5 ml-1 text-[10px] text-blue-500/80 font-mono">
              {isMarketLoading ? (
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              )}
              {isMarketLoading ? 'Refreshing...' : `Live: ${marketLastUpdated}`}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <Input 
            placeholder="Search reports, insights, or data..." 
            className="pl-10 h-9 bg-[#0f172a] border-[#1e293b] text-[13px] text-[#94a3b8] focus-visible:ring-1"
          />
        </div>
        
        <div className="flex items-center gap-3 pl-4 border-l border-[#1e293b]">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[11px] font-bold text-[#f8fafc] max-w-[150px] truncate">{displayName}</span>
            <span className="text-[9px] text-[#64748b] truncate max-w-[150px]">{user?.email}</span>
            {isAnonymous && <span className="text-[9px] text-amber-500 uppercase tracking-tighter">Universal Entrance</span>}
          </div>
          <Avatar className="w-8 h-8 border border-[#3b82f64d]">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
            <AvatarFallback className="bg-[#1e293b] text-[#f8fafc]">
              <UserIcon className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
