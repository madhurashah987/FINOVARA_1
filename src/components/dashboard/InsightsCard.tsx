import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Info, Zap } from 'lucide-react';
import { Insight } from '@/src/types';
import { cn } from '@/lib/utils';

interface InsightsCardProps {
  insights: Insight[];
}

const iconMap = {
  positive: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  negative: { icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
  warning: { icon: Info, color: "text-amber-500", bg: "bg-amber-500/10" },
  neutral: { icon: Zap, color: "text-primary", bg: "bg-primary/10" },
};

export function InsightsCard({ insights }: InsightsCardProps) {
  return (
    <Card className="h-full bg-[#0f172a] border-[#1e293b] rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-b from-[#3b82f61a] to-transparent pb-4">
        <CardTitle className="text-[12px] uppercase tracking-wider text-[#94a3b8]">
          AI Intelligence Pulse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight) => (
          <div key={insight.id} className="p-3 rounded-lg bg-white/5 border-l-[3px] border-[#3b82f6] transition-colors">
            <div className="flex flex-col gap-1">
              <h4 className="font-bold text-[13px] text-[#f8fafc]">
                {insight.title}:
              </h4>
              <p className="text-[13px] text-[#94a3b8] leading-tight">
                {insight.description}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
