import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { History, TrendingUp, ArrowUpRight, Clock, ShieldCheck } from 'lucide-react';

const data = [
  { year: '2018', revenue: 45, efficiency: 58, auditStatus: 'Initial' },
  { year: '2020', revenue: 90, efficiency: 62, auditStatus: 'Established' },
  { year: '2022', revenue: 180, efficiency: 72, auditStatus: 'Verified' },
  { year: '2023', revenue: 240, efficiency: 78, auditStatus: 'A+ Rated' },
  { year: '2024', revenue: 310, efficiency: 82, auditStatus: 'Top Tier' },
  { year: '2025', revenue: 450, efficiency: 89, auditStatus: 'Leader' },
  { year: '2026', revenue: 580, efficiency: 94, auditStatus: 'Impeccable' },
];

export function EvolutionTrail({ historicalData }: { historicalData?: any[] }) {
  const displayData = historicalData || data;
  
  return (
    <Card className="bg-[#0f172a] border-[#1e293b] overflow-hidden group">
      <CardHeader className="border-b border-[#1e293b] pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-[#f8fafc]">Audit Time Trail Machine</CardTitle>
              <CardDescription className="text-xs text-[#94a3b8] italic serif">
                Management Evolution & Reliability Trend Analysis
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[#64748b] font-mono">Status:</span>
            <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {historicalData ? 'Verified Document Trail' : 'Active Monitoring'}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 rounded-xl bg-[#020617] border border-[#1e293b]">
            <p className="text-[10px] uppercase tracking-widest text-[#64748b] mb-1">Reliability Growth</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-[#f8fafc]">
                {((displayData[displayData.length - 1].efficiency / displayData[0].efficiency - 1) * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-emerald-500 flex items-center gap-0.5 mb-1">
                <ArrowUpRight className="w-3 h-3" /> Growth Detected
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#020617] border border-[#1e293b]">
            <p className="text-[10px] uppercase tracking-widest text-[#64748b] mb-1">Audit Score Avg</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-[#f8fafc]">4.8/5</span>
              <span className="text-xs text-emerald-500 flex items-center gap-0.5 mb-1">
                <ShieldCheck className="w-3 h-3" /> {displayData[displayData.length - 1].auditStatus}
              </span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#020617] border border-[#1e293b]">
            <p className="text-[10px] uppercase tracking-widest text-[#64748b] mb-1">Trend Velocity</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-[#f8fafc]">High</span>
              <span className="text-xs text-blue-500 flex items-center gap-0.5 mb-1">
                <TrendingUp className="w-3 h-3" /> Sustained
              </span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full relative min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <AreaChart data={displayData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="year" 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                fontFamily="JetBrains Mono"
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `₹${value} Cr`}
                fontFamily="JetBrains Mono"
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                name="Revenue Growth"
              />
              <Area 
                type="monotone" 
                dataKey="efficiency" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEfficiency)" 
                name="Operational Efficiency"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 relative border-t border-[#1e293b] pt-6 overflow-x-auto">
          <div className="flex justify-between min-w-[600px] px-2">
            {displayData.map((item: any, idx: number) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                <p className="text-[10px] font-mono font-bold text-[#f8fafc]">{item.year}</p>
                <p className="text-[9px] text-[#94a3b8] italic serif leading-none text-center max-w-[80px]">{item.auditStatus}</p>
              </div>
            ))}
          </div>
          {/* Connecting line */}
          <div className="absolute top-[31px] left-[5%] right-[5%] h-[1px] bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0" />
        </div>
      </CardContent>
    </Card>
  );
}
