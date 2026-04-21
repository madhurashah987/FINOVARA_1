import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  Play, 
  RotateCcw, 
  TrendingUp, 
  Info, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  Save, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  Wallet,
  Activity,
  Zap,
  Table as TableIcon
} from 'lucide-react';
import { runNeuralSimulation } from '@/src/services/geminiService';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Constants for baseline if no data is uploaded
const DEFAULT_BASELINE = {
  monthlyRevenue: 250000,
  operatingCostsPct: 65,
  fixedCosts: 45000
};

interface Scenario {
  name: string;
  revenueGrowth: number;
  operatingCostsPct: number;
  fixedCosts: number;
  duration: number;
}

const PRESETS: Record<string, Scenario> = {
  'base': { name: 'Base Case', revenueGrowth: 12, operatingCostsPct: 65, fixedCosts: 45000, duration: 12 },
  'best': { name: 'Best Case', revenueGrowth: 35, operatingCostsPct: 55, fixedCosts: 40000, duration: 12 },
  'worst': { name: 'Worst Case', revenueGrowth: -10, operatingCostsPct: 80, fixedCosts: 50000, duration: 12 },
};

export function ScenarioSimulator({ historicalData }: { historicalData?: any[] }) {
  // Scenario State
  const [scenarioName, setScenarioName] = useState("Provisional Forecast");
  const [revenueGrowth, setRevenueGrowth] = useState(12);
  const [opCostsPct, setOpCostsPct] = useState(65);
  const [fixedCosts, setFixedCosts] = useState(45000);
  const [duration, setDuration] = useState(12);

  // UI State
  const [isSimulating, setIsSimulating] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);

  // Identify internal baseline from provided historical data or defaults
  const baseline = useMemo(() => {
    if (historicalData && historicalData.length > 0) {
      const latest = historicalData[historicalData.length - 1];
      return {
        monthlyRevenue: latest.revenue || 250000,
        operatingCostsPct: opCostsPct, // Use user starting point or derived
        fixedCosts: latest.fixedCosts || 45000
      };
    }
    return DEFAULT_BASELINE;
  }, [historicalData]);

  // Real-time calculation engine
  const projection = useMemo(() => {
    const results = [];
    let currentRev = baseline.monthlyRevenue;
    const monthlyGrowth = 1 + (revenueGrowth / 100 / 12);

    for (let i = 0; i < duration; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthLabel = date.toLocaleString('default', { month: 'short' });
      
      const rev = currentRev * Math.pow(monthlyGrowth, i);
      const variableCosts = rev * (opCostsPct / 100);
      const profit = rev - variableCosts - fixedCosts;
      
      results.push({
        month: monthLabel,
        revenue: Math.round(rev),
        profit: Math.round(profit),
        costs: Math.round(variableCosts + fixedCosts),
        cashFlow: Math.round(profit) // Simplified
      });
    }
    return results;
  }, [revenueGrowth, opCostsPct, fixedCosts, duration, baseline]);

  // KPIs
  const totals = useMemo(() => {
    const last = projection[projection.length - 1];
    const firstProfit = projection[0].profit;
    const lastProfit = last.profit;
    const profitChange = ((lastProfit - firstProfit) / Math.abs(firstProfit)) * 100;
    
    // Break-even: Revenue * (1 - OpCosts%) = FixedCosts
    const breakEvenRev = Math.round(fixedCosts / (1 - opCostsPct / 100));

    return {
      finalRevenue: last.revenue,
      finalProfit: last.profit,
      profitChange: profitChange.toFixed(1),
      breakEven: breakEvenRev,
      avgCashFlow: Math.round(projection.reduce((acc, curr) => acc + curr.cashFlow, 0) / projection.length)
    };
  }, [projection, fixedCosts, opCostsPct]);

  const applyPreset = (key: string) => {
    const p = PRESETS[key];
    setRevenueGrowth(p.revenueGrowth);
    setOpCostsPct(p.operatingCostsPct);
    setFixedCosts(p.fixedCosts);
    setDuration(p.duration);
    setScenarioName(p.name);
  };

  const runAiAnalysis = async () => {
    setIsSimulating(true);
    const summary = await runNeuralSimulation(projection.slice(0, 3), {
      revenueGrowth,
      operatingCostsPct: opCostsPct,
      fixedCosts,
      duration
    });
    if (summary) setAiSummary(summary.summary);
    setIsSimulating(false);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 animate-in fade-in duration-700 pb-24">
        <div className="flex items-center justify-between bg-[#0f172a] p-4 rounded-xl border border-[#1e293b]">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <Input 
                value={scenarioName} 
                onChange={(e) => setScenarioName(e.target.value)}
                className="bg-transparent border-none text-xl font-bold p-0 h-auto focus-visible:ring-0 text-white w-64"
              />
              <p className="text-[10px] text-[#64748b] font-mono uppercase tracking-widest">Future Shock Simulation Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Select onValueChange={applyPreset}>
              <SelectTrigger className="w-40 bg-[#020617] border-[#1e293b] h-9 text-xs">
                <SelectValue placeholder="Load Preset" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f172a] border-[#1e293b]">
                <SelectItem value="base">System Base Case</SelectItem>
                <SelectItem value="best">Optimized (Best Case)</SelectItem>
                <SelectItem value="worst">Critical (Worst Case)</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-9 border-[#1e293b] hover:bg-[#1e293b] gap-2 px-4 font-bold text-xs uppercase tracking-wider">
              <Save className="w-3.5 h-3.5" />
              Store Scenario
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Assumptions */}
          <Card className="lg:col-span-4 bg-[#0f172a] border-[#1e293b] shadow-xl">
            <CardHeader className="border-b border-[#1e293b] bg-[#020617]/30 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white text-base">Scenario Assumptions</CardTitle>
                  <CardDescription className="text-xs text-[#64748b]">Adjust variables to visualize fiscal impact</CardDescription>
                </div>
                <Badge variant="outline" className="text-[9px] border-[#1e293b] text-[#94a3b8]">REAL-TIME</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
              {/* Revenue Growth */}
              <div className="space-y-4">
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Revenue Growth (%)</label>
                    <Tooltip>
                      <TooltipTrigger><Info className="w-3 h-3 text-[#475569]" /></TooltipTrigger>
                      <TooltipContent className="bg-[#0f172a] border-[#1e293b] text-xs max-w-xs">
                        Expected annual increase in gross sales. Impacts top-line revenue momentum.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input 
                    type="number" 
                    value={revenueGrowth} 
                    onChange={(e) => setRevenueGrowth(Number(e.target.value))}
                    className="w-16 h-7 text-xs bg-[#020617] border-[#1e293b] text-blue-400 font-bold px-2"
                  />
                </div>
                <Slider 
                  value={[revenueGrowth]} 
                  onValueChange={(val) => setRevenueGrowth(val[0])} 
                  max={100} min={-50} step={1}
                />
              </div>

              {/* Operating Costs */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Operating Costs (%)</label>
                    <Tooltip>
                      <TooltipTrigger><Info className="w-3 h-3 text-[#475569]" /></TooltipTrigger>
                      <TooltipContent className="bg-[#0f172a] border-[#1e293b] text-xs">
                        Variable costs as a % of revenue (COGS, commissions, etc). Impacts gross margin.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input 
                    type="number" 
                    value={opCostsPct} 
                    onChange={(e) => setOpCostsPct(Number(e.target.value))}
                    className="w-16 h-7 text-xs bg-[#020617] border-[#1e293b] text-emerald-400 font-bold px-2"
                  />
                </div>
                <Slider 
                  value={[opCostsPct]} 
                  onValueChange={(val) => setOpCostsPct(val[0])} 
                  max={95} min={5} step={1}
                />
              </div>

              {/* Fixed Costs */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Monthly Fixed Costs ($)</label>
                    <Tooltip>
                      <TooltipTrigger><Info className="w-3 h-3 text-[#475569]" /></TooltipTrigger>
                      <TooltipContent className="bg-[#0f172a] border-[#1e293b] text-xs">
                        Rent, salaries, and non-variable overhead. Impacts break-even volume.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input 
                    type="number" 
                    value={fixedCosts} 
                    onChange={(e) => setFixedCosts(Number(e.target.value))}
                    className="w-24 h-7 text-xs bg-[#020617] border-[#1e293b] text-amber-500 font-bold px-2"
                  />
                </div>
                <Slider 
                  value={[fixedCosts]} 
                  onValueChange={(val) => setFixedCosts(val[0])} 
                  max={500000} min={1000} step={1000}
                />
              </div>

              {/* Forecast Period */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Forecast Period (Months)</label>
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400">{duration}m</Badge>
                </div>
                <Slider 
                  value={[duration]} 
                  onValueChange={(val) => setDuration(val[0])} 
                  max={36} min={3} step={1}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Driver Analysis</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-[#1e293b] text-[#94a3b8]">LIVE INSIGHT</Badge>
                </div>
                <div className="p-3 rounded-lg bg-[#020617] border border-[#1e293b]">
                  <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                    <span className="text-emerald-500 font-bold">Insight:</span> {revenueGrowth > 15 ? "Profit increases primarily due to aggressive revenue scaling." : opCostsPct < 60 ? "Superior margins are the key driver for this scenario's profitability." : "Maintain stable operations; growth and costs are currently balanced."}
                  </p>
                </div>
              </div>

              <Separator className="bg-[#1e293b]" />

              <div className="space-y-4">
                <Button 
                  onClick={runAiAnalysis}
                  disabled={isSimulating}
                  className="w-full bg-[#020617] border border-[#1e293b] hover:bg-[#1e293b] text-white gap-2 h-12"
                >
                  {isSimulating ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <Sparkles className="w-4 h-4 text-blue-500" />}
                  Generate AI Executive Narrative
                </Button>
                {aiSummary && (
                  <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 animate-in slide-in-from-top-2">
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      Neural Summary
                    </p>
                    <ScrollArea className="h-24">
                      <p className="text-[11px] text-[#94a3b8] italic leading-relaxed pr-2">"{aiSummary}"</p>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Panel: Results */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KPICard 
                title="Proj. Monthly Rev" 
                value={`₹${(totals.finalRevenue / 1000).toFixed(1)}k`} 
                subValue="+12.4% vs Base"
                positive={true}
                icon={TrendingUp}
              />
              <KPICard 
                title="Proj. Net Profit" 
                value={`₹${(totals.finalProfit / 1000).toFixed(1)}k`} 
                subValue={`${totals.profitChange}% Delta`}
                positive={Number(totals.profitChange) > 0}
                icon={Wallet}
              />
              <KPICard 
                title="Avg. Cash Flow" 
                value={`₹${(totals.avgCashFlow / 1000).toFixed(1)}k`} 
                subValue="Stable OpEx"
                positive={totals.avgCashFlow > 0}
                icon={Activity}
              />
              <KPICard 
                title="Break-even Rev" 
                value={`₹${(totals.breakEven / 1000).toFixed(1)}k`} 
                subValue="Target Volume"
                positive={true}
                icon={Target}
              />
            </div>

            {/* Main Visualizer */}
            <Card className="flex-1 bg-[#020617] border-[#1e293b] overflow-hidden">
               <CardHeader className="border-b border-[#1e293b] py-3 bg-[#0f172a]/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-white uppercase tracking-widest">Financial Trajectory Analysis</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 opacity-50">
                      <div className="w-2 h-2 rounded-full border border-dashed border-blue-500/50" />
                      <span className="text-[9px] text-[#64748b] font-bold uppercase">±5% Sensitivity</span>
                    </div>
                    <div className="flex items-center gap-1.5 grayscale opacity-50">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-[9px] text-[#64748b] font-bold uppercase">Revenue</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-100">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[9px] text-[#64748b] font-bold uppercase">Net Profit</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[380px] w-full relative min-h-[380px]">
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <AreaChart data={projection}>
                      <defs>
                        <linearGradient id="simRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="simProf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'JetBrains Mono' }}
                        tickFormatter={(v) => `₹${v/1000}k`}
                      />
                      <ChartTooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#1e293b',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: '#f8fafc'
                        }} 
                        itemStyle={{ padding: '2px 0' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill="url(#simRev)" 
                        name="Revenue" 
                        animationDuration={500}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fill="url(#simProf)" 
                        name="Net Profit" 
                        animationDuration={700}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 p-4 rounded-xl border border-[#1e293b] bg-[#0f172a]/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Sensitivity Index</p>
                      <p className="text-sm font-bold text-white">High Revenue Leverage</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-wider">Profit/Rev Ratio</p>
                    <p className="text-sm font-mono font-bold text-emerald-500">{(totals.finalProfit / totals.finalRevenue * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projection Details Ledger */}
            <Card className="bg-[#0f172a] border-[#1e293b] overflow-hidden">
              <CardHeader className="border-b border-[#1e293b] py-3 bg-[#020617]/40 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <TableIcon className="w-3.5 h-3.5 text-blue-500" />
                    Neural Projection Ledger
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-500">AUDIT READY</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-72">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[#0f172a] border-b border-[#1e293b] z-10">
                      <tr>
                        <th className="px-6 py-3 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Month</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Revenue</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Op. Costs</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Net Profit</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-[#64748b] uppercase tracking-wider">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e293b]">
                      {projection.map((row, i) => (
                        <tr key={i} className="hover:bg-[#1e293b]/20 transition-colors">
                          <td className="px-6 py-3 text-xs font-mono font-bold text-white">{row.month}</td>
                          <td className="px-6 py-3 text-xs font-mono text-[#94a3b8]">₹{(row.revenue / 1000).toFixed(1)}k</td>
                          <td className="px-6 py-3 text-xs font-mono text-rose-400">₹{(row.costs / 1000).toFixed(1)}k</td>
                          <td className="px-6 py-3 text-xs font-mono font-black text-emerald-500">₹{(row.profit / 1000).toFixed(1)}k</td>
                          <td className="px-6 py-3">
                            <Badge variant="outline" className="text-[9px] font-mono border-emerald-500/20 text-emerald-500">
                              {((row.profit / row.revenue) * 100).toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

function KPICard({ title, value, subValue, positive, icon: Icon }: any) {
  return (
    <Card className="bg-[#0f172a] border-[#1e293b] p-4 group hover:border-[#3b82f633] transition-all cursor-default shadow-lg">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2 rounded-lg bg-[#020617] border border-[#1e293b] group-hover:border-[#3b82f633]">
          <Icon className="w-4 h-4 text-[#64748b] group-hover:text-blue-500 transition-colors" />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
          positive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
        )}>
          {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {subValue}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">{title}</p>
        <p className="text-xl font-black text-white">{value}</p>
      </div>
    </Card>
  );
}
