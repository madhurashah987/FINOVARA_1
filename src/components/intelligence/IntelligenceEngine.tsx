import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  ShieldCheck, 
  Search, 
  History, 
  Zap, 
  Activity, 
  MessageSquare, 
  Lock, 
  AlertTriangle,
  BrainCircuit,
  TrendingUp,
  Target,
  FileText
} from 'lucide-react';
import { detectNarrativeLies, calculateFinancialHealthScore, explainFinancials } from '@/src/services/geminiService';
import Markdown from 'react-markdown';
import { cn, formatDisplayName } from '@/lib/utils';
import jsPDF from 'jspdf';
import { auth } from '@/src/lib/firebase';

export function IntelligenceEngine({ historicalData, isDemo }: { historicalData?: any[], isDemo?: boolean }) {
  const [activeTab, setActiveTab] = useState('health');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Lie Detector State
  const [narrative, setNarrative] = useState('');
  const [lieAnalysis, setLieAnalysis] = useState<string | null>(null);
  
  // Health Score State
  const [healthData, setHealthData] = useState<any>(null);
  
  // Explanation State
  const [explanation, setExplanation] = useState<string | null>(null);
  const [activePersona, setActivePersona] = useState<'Beginner' | 'Analyst' | 'CEO'>('Analyst');

  const runHealthAudit = async () => {
    setIsProcessing(true);
    const score = await calculateFinancialHealthScore(historicalData || { simulated: true });
    setHealthData(score);
    setIsProcessing(false);
  };

  const runLieDetection = async () => {
    if (!narrative) return;
    setIsProcessing(true);
    const analysis = await detectNarrativeLies(narrative, historicalData || { simulated: true });
    setLieAnalysis(analysis);
    setIsProcessing(false);
  };

  const runExplanation = async (persona: 'Beginner' | 'Analyst' | 'CEO') => {
    setActivePersona(persona);
    if (isDemo) {
      setExplanation("> **RESTRICTED ACCESS**\n\nAI Multi-Personality Explanation is only available for **verified uploaded data**. This demo environment uses hardcoded archetypes which are not authorized for deep recursive AI analysis.\n\n*Please upload your own statements to unlock this module.*");
      return;
    }
    setIsProcessing(true);
    const result = await explainFinancials(historicalData || { simulated: true }, persona);
    setExplanation(result);
    setIsProcessing(false);
  };

  const downloadPDFReport = () => {
    let content = '';
    let title = '';
    
    if (activeTab === 'explanation' && explanation) {
      content = explanation;
      title = `${activePersona} PERSPECTIVE ANALYSIS`;
    } else if (activeTab === 'health' && healthData) {
      content = `OVERALL HEALTH SCORE: ${healthData.overallScore}/100\n\nSTRENGTHS:\n${healthData.strengths.join('\n')}\n\nWEAKNESSES:\n${healthData.weaknesses.join('\n')}`;
      title = 'FINANCIAL HEALTH AUDIT';
    } else if (activeTab === 'narrative' && lieAnalysis) {
      content = lieAnalysis;
      title = 'NARRATIVE TRUTH MATRIX';
    }

    if (!content) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('FINOVARA AI', margin, 25);
    
    doc.setFontSize(8);
    doc.text('ADVANCED ANALYTICS SUBSYSTEM', margin, 32);
    
    // Identity
    const userName = formatDisplayName(auth.currentUser?.email, auth.currentUser?.displayName);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(`ANALYST ID: ${userName}`, margin, 55);
    doc.text(`TIMESTAMP: ${new Date().toLocaleString()}`, margin, 62);
    doc.text(`MODULE: ${title}`, margin, 69);
    
    doc.line(margin, 75, pageWidth - margin, 75);
    
    // Body
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('NEURAL ANALYSIS RESULTS', margin, 90);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    const cleanContent = content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '');
      
    const splitText = doc.splitTextToSize(cleanContent, contentWidth);
    doc.text(splitText, margin, 105);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('F-AI-INTELLIGENCE-REPORT-V2', margin, doc.internal.pageSize.getHeight() - 10);
    
    doc.save(`Finovara_Intelligence_${activeTab}_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-blue-500" />
            ADVANCED AI INTELLIGENCE ENGINE
          </h2>
          <p className="text-[#94a3b8] font-mono text-sm uppercase tracking-widest mt-1">
            Analyzing, Validating, and Simulating at Scale
          </p>
        </div>
        <div className="flex gap-2">
          {((activeTab === 'health' && healthData) || (activeTab === 'explanation' && explanation) || (activeTab === 'narrative' && lieAnalysis)) && (
            <Button 
              size="sm" 
              onClick={downloadPDFReport}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 px-4 rounded-xl shadow-lg shadow-blue-900/20"
            >
              <FileText className="w-4 h-4" />
              Download Report
            </Button>
          )}
          <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 px-3 py-1">
            <Lock className="w-3 h-3 mr-1.5" />
            Security Mode Active
          </Badge>
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-3 py-1">
            <Activity className="w-3 h-3 mr-1.5" />
            Reality Sync Verified
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#0f172a] border border-[#1e293b] p-1 h-auto flex-wrap justify-start">
          <TabsTrigger value="health" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2 py-2">
            <Zap className="w-4 h-4" />
            Health Score
          </TabsTrigger>
          <TabsTrigger value="narrative" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2 py-2">
            <Search className="w-4 h-4" />
            Narrative Lie Detector
          </TabsTrigger>
          <TabsTrigger value="explanation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2 py-2">
            <MessageSquare className="w-4 h-4" />
            Multi-Personality Explanation
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white gap-2 py-2">
            <History className="w-4 h-4" />
            Audit Time Machine
          </TabsTrigger>
        </TabsList>

        {/* FINANCIAL HEALTH SCORE */}
        <TabsContent value="health" className="mt-6 space-y-6 outline-none">
          {!healthData ? (
            <div className="flex flex-col items-center justify-center p-20 bg-[#0f172a] border-2 border-dashed border-[#1e293b] rounded-3xl text-center">
              <Activity className="w-12 h-12 text-[#1e293b] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Ready for Performance Audit</h3>
              <p className="text-[#64748b] max-w-md mb-8">Evaluate overall performance across revenue growth, profit margins, and stability metrics.</p>
              <Button 
                onClick={runHealthAudit} 
                className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl font-bold"
                disabled={isProcessing}
              >
                {isProcessing ? "Calculating Score..." : "Execute Health Score Module"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-4 bg-[#0f172a] border-[#1e293b]">
                <CardHeader>
                  <CardTitle className="text-white">Fisc-AI Health Score</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center pt-4 pb-8 text-center">
                  <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80" cy="80" r="70"
                        stroke="#1e293b" fill="transparent" strokeWidth="8"
                      />
                      <circle
                        cx="80" cy="80" r="70"
                        stroke="#3b82f6" fill="transparent" strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 70}
                        strokeDashoffset={2 * Math.PI * 70 * (1 - healthData.overallScore / 100)}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-white">{healthData.overallScore}</span>
                      <span className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest italic">Score / 100</span>
                    </div>
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1 text-xs">
                    {healthData.overallScore > 80 ? 'EXCEPTIONAL STABILITY' : healthData.overallScore > 60 ? 'HEALTHY GROWTH' : 'NEEDS OPTIMIZATION'}
                  </Badge>
                </CardContent>
              </Card>

              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[#0f172a] border-[#1e293b]">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                       <Target className="w-4 h-4 text-emerald-500" />
                       Performance Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {healthData.strengths.map((str: string, i: number) => (
                      <div key={i} className="flex gap-3 text-sm text-[#94a3b8]">
                        <span className="text-emerald-500">✓</span>
                        {str}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-[#0f172a] border-[#1e293b]">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                       <AlertTriangle className="w-4 h-4 text-rose-500" />
                       Critical Weaknesses
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {healthData.weaknesses.map((weak: string, i: number) => (
                      <div key={i} className="flex gap-3 text-sm text-[#94a3b8]">
                        <span className="text-rose-500">⚠</span>
                        {weak}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="md:col-span-2 bg-[#0f172a] border-[#1e293b]">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">Metric Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <MetricProgress label="Revenue Growth" value={healthData.metrics.revenueGrowth} color="bg-blue-500" />
                    <MetricProgress label="Profit Margins" value={healthData.metrics.profitMargins} color="bg-emerald-500" />
                    <MetricProgress label="Debt Efficiency" value={healthData.metrics.debtLevel} color="bg-amber-500" />
                    <MetricProgress label="Market Stability" value={healthData.metrics.stability} color="bg-purple-500" />
                  </CardContent>
                </Card>
              </div>
              <Button onClick={() => setHealthData(null)} variant="ghost" className="lg:col-span-12 text-[#64748b]">Recalculate Audit</Button>
            </div>
          )}
        </TabsContent>

        {/* NARRATIVE LIE DETECTOR */}
        <TabsContent value="narrative" className="mt-6 space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#0f172a] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-white">Narrative Submission</CardTitle>
                <CardDescription className="text-[#64748b]">Input claims to verify against financial reality</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <textarea 
                  className="w-full h-40 bg-[#020617] border border-[#1e293b] rounded-2xl p-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none font-mono"
                  placeholder="e.g., 'We observed a 40% growth in net profit this quarter despite rising operational costs...'"
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                />
                <Button 
                  onClick={runLieDetection} 
                  className="w-full bg-blue-600 hover:bg-blue-700 h-11 rounded-xl font-bold"
                  disabled={isProcessing || !narrative}
                >
                  {isProcessing ? "Scanning Narrative..." : "Execute Lie Detector"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#0f172a] border-[#1e293b]">
              <CardHeader>
                <CardTitle className="text-white">Truth Matrix Analysis</CardTitle>
                <CardDescription className="text-[#64748b]">Verdict and Evidence breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                   {lieAnalysis ? (
                     <div className="markdown-body prose-invert text-sm">
                       <Markdown>{lieAnalysis}</Markdown>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center p-12 text-center">
                        <ShieldCheck className="w-8 h-8 text-[#1e293b] mb-4" />
                        <p className="text-[10px] text-[#64748b] uppercase font-bold tracking-widest">Awaiting Narrative Input</p>
                     </div>
                   )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MULTI-PERSONALITY EXPLANATION */}
        <TabsContent value="explanation" className="mt-6 outline-none">
          <Card className="bg-[#0f172a] border-[#1e293b]">
            <CardHeader className="border-b border-[#1e293b]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-white">Explanation Mode Sync</CardTitle>
                  <CardDescription className="text-[#64748b]">Select style for personalized intelligence relay</CardDescription>
                </div>
                <div className="flex bg-[#020617] p-1 rounded-xl border border-[#1e293b]">
                  {(['Beginner', 'Analyst', 'CEO'] as const).map((persona) => (
                    <button
                      key={persona}
                      onClick={() => runExplanation(persona)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                        activePersona === persona ? "bg-blue-600 text-white shadow-lg" : "text-[#64748b] hover:text-white"
                      )}
                    >
                      {persona}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              {isProcessing && activeTab === 'explanation' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Zap className="w-8 h-8 text-blue-500 animate-pulse mb-4" />
                  <p className="text-sm text-[#94a3b8] font-mono italic">Context switching to {activePersona} mode...</p>
                </div>
              ) : explanation ? (
                <div className="markdown-body prose-invert max-w-none">
                  <Markdown>{explanation}</Markdown>
                </div>
              ) : (
                <div className="text-center py-20 bg-blue-500/5 rounded-3xl border border-blue-500/10">
                  <p className="text-[#64748b] text-sm">Select a persona to generate a high-context explanation of the financial matrix.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT TIME MACHINE */}
        <TabsContent value="audit" className="mt-6 outline-none">
           <Card className="bg-[#0f172a] border-[#1e293b]">
             <CardHeader>
               <CardTitle className="text-white flex items-center gap-3">
                 <History className="w-6 h-6 text-blue-500" />
                 Audit Trail Time Machine
               </CardTitle>
               <CardDescription className="text-[#64748b]">Temporal analysis of anomalies and structural spikes</CardDescription>
             </CardHeader>
             <CardContent className="p-0">
                <div className="border-y border-[#1e293b] p-8 flex flex-col items-center justify-center text-center bg-[#020617]/50">
                   <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6">
                      <Zap className="w-8 h-8 text-blue-500" />
                   </div>
                   <h3 className="text-xl font-bold text-white mb-2">Temporal Anomaly Engine</h3>
                   <p className="text-[#64748b] max-w-lg text-sm mb-6 font-mono leading-relaxed">
                     [SYTEM_INITIALIZED] Analyzing historical multi-period data points. This module scans for sudden spikes, debt accumulation patterns, and growth deviations.
                   </p>
                   <Badge className="bg-[#1e293b] text-[#94a3b8] px-4 py-1.5 font-mono text-[10px] uppercase">
                     Module Sync Required (Coming in V2.1)
                   </Badge>
                </div>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricProgress({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest">{label}</span>
        <span className="text-sm font-black text-white">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-[#020617] rounded-full overflow-hidden border border-[#1e293b]">
        <div 
          className={cn("h-full transition-all duration-1000", color)} 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
}
