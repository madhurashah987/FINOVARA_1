import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HealthScoreProps {
  score: number;
  trend: number;
}

export function HealthScore({ score, trend }: HealthScoreProps) {
  return (
    <Card className="bg-[#0f172a] border-[#1e293b] rounded-xl p-4 flex flex-col items-center justify-center text-center h-full">
      <div className="text-[12px] uppercase tracking-wider text-[#94a3b8] mb-4">Financial Health Score</div>
      
      <div className="relative w-20 h-20 rounded-full border-[6px] border-[#1e293b] border-t-[#10b981] flex items-center justify-center text-xl font-extrabold text-[#10b981] mb-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
        {score}
      </div>
      
      <p className="text-[12px] font-bold text-[#10b981] uppercase tracking-tight">STABLE</p>
      
      <div className="mt-4 flex items-center gap-1 text-[12px] font-semibold text-[#10b981]">
        <ArrowUpRight className="w-3 h-3" />
        {trend}% vs LY
      </div>
    </Card>
  );
}

import { cn } from '@/lib/utils';
