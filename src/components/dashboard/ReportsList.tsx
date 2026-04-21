import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Search, 
  Zap, 
  BrainCircuit, 
  History,
  ShieldCheck,
  TrendingUp,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportItem {
  id: string;
  title: string;
  type: 'Health Audit' | 'Truth Matrix' | 'Scenario Stress-Test' | 'Market Intelligence';
  date: string;
  status: 'Ready' | 'In Progress' | 'Archived';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  icon: any;
}

export function ReportsList({ onNavigate }: { onNavigate: (page: string) => void }) {
  const reports: ReportItem[] = [
    { 
      id: '1', 
      title: 'Quarterly Business Health Summary', 
      type: 'Health Audit' as any, 
      date: '2026-04-15', 
      status: 'Ready', 
      priority: 'High',
      icon: ShieldCheck
    },
    { 
      id: '2', 
      title: 'Spending Accuracy Audit', 
      type: 'Truth Matrix' as any, 
      date: '2026-04-18', 
      status: 'Ready', 
      priority: 'Critical',
      icon: Search
    },
    { 
      id: '3', 
      title: 'Cash Flow Safety Test', 
      type: 'Scenario Stress-Test' as any, 
      date: '2026-04-20', 
      status: 'Ready', 
      priority: 'Medium',
      icon: TrendingUp
    },
    { 
      id: '4', 
      title: 'Future Growth Forecast', 
      type: 'Market Intelligence' as any, 
      date: '2026-04-21', 
      status: 'In Progress', 
      priority: 'High',
      icon: BrainCircuit
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            INTELLIGENCE REPORTS
          </h2>
          <p className="text-[#94a3b8] font-mono text-sm uppercase tracking-widest mt-1">
            Archived Audits & Neural Assessments
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="border-[#1e293b] text-[#94a3b8] hover:bg-[#1e293b] h-9 text-xs">
             <History className="w-3.5 h-3.5 mr-2" />
             View Archive
           </Button>
           <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs">
             Generate New Audit
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticsCard 
          label="Total Reports" 
          value="12" 
          change="+2 this week" 
          icon={FileText} 
          color="text-blue-500" 
        />
        <AnalyticsCard 
          label="Truth Matches" 
          value="94%" 
          change="Accuracy rating" 
          icon={ShieldCheck} 
          color="text-emerald-500" 
        />
        <AnalyticsCard 
          label="Unresolved Risks" 
          value="3" 
          change="Requires attention" 
          icon={Zap} 
          color="text-rose-500" 
        />
        <AnalyticsCard 
          label="AI Computation" 
          value="24.8ms" 
          change="Avg latency" 
          icon={BrainCircuit} 
          color="text-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="bg-[#0f172a] border-[#1e293b] hover:bg-[#1e293b]/30 transition-colors group">
            <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#020617] border border-[#1e293b] flex items-center justify-center">
                  <report.icon className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-base">{report.title}</h3>
                    <Badge className={cn(
                      "text-[10px] px-2 py-0 h-4 border-none",
                      report.priority === 'Critical' ? "bg-rose-500 text-white" :
                      report.priority === 'High' ? "bg-amber-500 text-white" :
                      "bg-blue-500 text-white"
                    )}>
                      {report.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-[#64748b] text-[11px] font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {report.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {report.type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn(
                  "border-[#1e293b] text-[10px]",
                  report.status === 'Ready' ? "text-emerald-500 bg-emerald-500/5" : "text-amber-500 bg-amber-500/5"
                )}>
                  {report.status}
                </Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-[#94a3b8] hover:text-white" disabled={report.status !== 'Ready'}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button 
                    className="bg-[#1e293b] hover:bg-[#334155] text-white text-xs h-9 px-4 rounded-lg"
                    onClick={() => onNavigate('intelligence')}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="p-12 border-2 border-dashed border-[#1e293b] rounded-3xl bg-[#0f172a]/20 flex flex-col items-center justify-center text-center">
         <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
            <BrainCircuit className="w-8 h-8 text-blue-500" />
         </div>
         <h4 className="text-xl font-bold text-white mb-2">Generate Neural PDF Audit</h4>
         <p className="text-[#64748b] max-w-sm mb-6 text-sm">Create a comprehensive, branded PDF report containing all intelligence assessments, health scores, and manual truth verifications.</p>
         <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-bold">
            Initialize Master PDF Generation
         </Button>
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value, change, icon: Icon, color }: any) {
  return (
    <Card className="bg-[#0f172a] border-[#1e293b]">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <Icon className={cn("w-5 h-5", color)} />
          <span className="text-[10px] font-mono text-[#64748b]">{change}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-black text-white">{value}</span>
          <span className="text-[10px] text-[#64748b] uppercase font-bold tracking-tight">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
