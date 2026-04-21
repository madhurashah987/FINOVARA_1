import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShieldAlert, Search, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { detectNarrativeLies } from '@/src/services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

export function LieDetector() {
  const [narrative, setNarrative] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!narrative.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    
    // Mock data for comparison
    const mockData = {
      revenue: 10700000,
      expenses: 8200000,
      netMargin: 0.248,
      cashRunway: 18,
      growthRate: 0.125
    };

    try {
      const analysis = await detectNarrativeLies(narrative, mockData);
      setResult(analysis);
    } catch (error) {
      console.error(error);
      setResult("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-[#0f172a] border-[#1e293b]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <ShieldAlert className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-[#f8fafc]">Narrative Lie Detector</CardTitle>
              <CardDescription className="text-[#94a3b8]">
                Paste your management narrative or financial report text below to cross-reference with raw ledger data.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs text-[#94a3b8]">Report Narrative</Label>
            <Button 
              variant="link" 
              className="h-auto p-0 text-[10px] text-purple-400 font-bold uppercase tracking-wider hover:text-purple-300"
              onClick={() => setNarrative("We had a spectacular quarter! Revenue grew by over 25% and we have roughly 36 months of cash runway remaining thanks to our disciplined spending. Our growth is outpacing the industry average significantly.")}
            >
              Paste Example Narrative
            </Button>
          </div>
          <Textarea 
            placeholder="e.g., 'Our revenue grew by 25% this quarter and we have over 2 years of runway...'"
            className="min-h-[150px] bg-[#020617] border-[#1e293b] text-white placeholder:text-[#475569]"
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
          />
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing || !narrative.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Integrity...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Run Integrity Check
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-[#0f172a] border-[#1e293b] overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[#f8fafc] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg bg-[#020617] border border-[#1e293b] text-sm text-[#cbd5e1] leading-relaxed">
                  {result}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
