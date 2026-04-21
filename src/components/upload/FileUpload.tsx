import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File as FileIcon, X, CheckCircle2, AlertCircle, FileText, BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDisplayName } from '@/lib/utils';
import { analyzeFinancialDocuments, extractHistoricalData } from '@/src/services/geminiService';
import Markdown from 'react-markdown';
import jsPDF from 'jspdf';
import { auth } from '@/src/lib/firebase';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Table as TableIcon, ChevronDown } from 'lucide-react';

export function FileUpload({ onDataExtracted }: { onDataExtracted?: (data: any[]) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<{ id: string; name: string; size: string; status: 'uploading' | 'complete' | 'error'; progress: number }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results when they appear
  useEffect(() => {
    if (analysisResult && resultRef.current) {
      // Use a small timeout to ensure layout has shifted and result is fully in DOM before scrolling
      const timeoutId = setTimeout(() => {
        resultRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest' 
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [analysisResult]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files) as File[];
    handleFiles(droppedFiles);
  }, []);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files) as File[];
      handleFiles(selectedFiles);
      // Reset input value to allow selecting the same file again
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleFiles = (newFiles: File[]) => {
    // Clear previous results when new files are added
    setAnalysisResult(null);
    const newFormattedFiles = newFiles.map(file => ({
      id: Math.random().toString(36).substring(7) + Date.now(),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      status: 'uploading' as const,
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFormattedFiles]);

    // Simulate upload individually for each new file
    newFormattedFiles.forEach((fileObj) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.random() * 25;
        
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress: 100, status: 'complete' } : f));
        } else {
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress: currentProgress } : f));
        }
      }, 400);
    });
  };

  const triggerAnalysis = async () => {
    if (files.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const fileNames = files.map(f => f.name);
      
      const [result, historical] = await Promise.all([
        analyzeFinancialDocuments(fileNames),
        onDataExtracted ? extractHistoricalData(fileNames) : Promise.resolve(null)
      ]);

      setAnalysisResult(result);
      if (historical && onDataExtracted) {
        onDataExtracted(historical);
      }
    } catch (error) {
      console.error("Analysis Failed:", error);
      setAnalysisResult("System encountered an error during neural processing. Please verify document integrity and retry.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!analysisResult) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    
    // Header
    doc.setFillColor(15, 23, 42); // #0f172a
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('FINOVARA', margin, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('EXECUTIVE INTELLIGENCE REPORT', margin, 32);
    
    // User details
    const userName = formatDisplayName(auth.currentUser?.email, auth.currentUser?.displayName);
    const date = new Date().toLocaleDateString();
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PREPARED FOR:', margin, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(userName, margin + 35, 55);
    
    doc.setFont('helvetica', 'bold');
    doc.text('REPORT DATE:', margin, 62);
    doc.setFont('helvetica', 'normal');
    doc.text(date, margin + 35, 62);
    
    doc.setFont('helvetica', 'bold');
    doc.text('DOCUMENTS:', margin, 69);
    doc.setFont('helvetica', 'normal');
    const fileNamesTxt = files.map(f => f.name).join(', ');
    const splitFiles = doc.splitTextToSize(fileNamesTxt, contentWidth - 35);
    doc.text(splitFiles, margin + 35, 69);
    
    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, 75, pageWidth - margin, 75);
    
    // Content body
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('AI EXECUTIVE SUMMARY', margin, 87);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    
    // Simple markdown cleaning for PDF (removing asterisks for bolding, etc)
    const cleanContent = analysisResult
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '');
      
    const splitText = doc.splitTextToSize(cleanContent, contentWidth);
    doc.text(splitText, margin, 100);
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 15, doc.internal.pageSize.getHeight() - 10);
      doc.text('SYSTEM_GEN_CODE: F-INTELLIGENCE-SCAN-VERIFIED', margin, doc.internal.pageSize.getHeight() - 10);
    }
    
    doc.save(`Finovara_Intelligence_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleInputChange} 
        className="hidden" 
        multiple 
        accept=".pdf,.xlsx,.xls,.csv"
      />
      <Card 
        className={cn(
          "border-2 border-dashed transition-all duration-200 cursor-pointer group relative overflow-hidden",
          isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/5"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={handleFileClick}
      >
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className={cn(
            "w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            isDragging && "bg-primary/20 text-primary"
          )}>
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-[#f8fafc]">Upload Financial Statements</h3>
          <p className="text-[#94a3b8] text-sm max-w-xs mb-8">
            Click anywhere or drag and drop your PDF, Excel, or CSV files here.
          </p>
          <Button variant="outline" className="gap-2 pointer-events-none border-[#1e293b]">
            <FileIcon className="w-4 h-4" />
            Select Files
          </Button>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest flex items-center gap-2">
              <TableIcon className="w-3 h-3" />
              Ingestion Queue ({files.length})
            </h4>
            {files.length > 3 && (
              <span className="text-[9px] text-blue-500 font-bold uppercase animate-pulse">Scroll for More ↓</span>
            )}
          </div>
          <ScrollArea className={cn(
            "w-full transition-all duration-300",
            files.length > 3 ? "h-[280px]" : "h-auto"
          )}>
            <div className="space-y-3 pr-4">
              <AnimatePresence>
                {files.map((file) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-xl border border-[#1e293b] bg-[#0f172a] flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#020617] flex items-center justify-center shrink-0 border border-[#1e293b]">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate pr-4 text-[#f8fafc]">{file.name}</p>
                        <span className="text-xs text-[#94a3b8] font-mono">{file.size}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={file.progress} className="h-1.5 flex-1" />
                        <span className="text-[10px] font-bold tabular-nums w-8 text-right text-[#94a3b8]">
                          {Math.round(file.progress)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                      {file.status === 'complete' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : file.status === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-rose-500" />
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter((f) => f.id !== file.id)); }}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      )}

      {files.length > 0 && files.every(f => f.status === 'complete') && !analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4"
        >
          <Button 
            disabled={isAnalyzing}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            onClick={triggerAnalysis}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                SYSTEM SCANNING DOCUMENTS...
              </>
            ) : (
              <>
                <BrainCircuit className="w-5 h-5" />
                ANALYZE ALL DOCUMENTS
              </>
            )}
          </Button>
        </motion.div>
      )}

      {analysisResult && (
        <motion.div
          ref={resultRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-8 scroll-mt-24"
        >
          <Card className="bg-[#020617] border-[#3b82f64d] shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">AI Executive Intelligence Report</h3>
                  <p className="text-[10px] text-[#cbd5e1] uppercase tracking-widest font-mono font-bold">Status: Analysis Verified</p>
                </div>
              </div>
              
              <div className="prose prose-invert prose-sm max-w-none text-slate-50 leading-relaxed relative">
                <ScrollArea className="h-80 pr-4">
                  <div className="markdown-body font-medium">
                    <Markdown>{analysisResult}</Markdown>
                  </div>
                </ScrollArea>
                <div className="absolute -bottom-2 right-0 flex items-center gap-1 text-[9px] text-[#64748b] font-bold uppercase tracking-widest bg-[#020617] px-2 py-0.5 rounded border border-[#1e293b]">
                  <ChevronDown className="w-3 h-3 animate-bounce" />
                  Scroll for details
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-[#1e293b] text-xs h-9 hover:bg-[#1e293b]"
                  onClick={() => setAnalysisResult(null)}
                >
                  Clear Results
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9"
                  onClick={handleDownloadPDF}
                >
                  Download Intelligence Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
