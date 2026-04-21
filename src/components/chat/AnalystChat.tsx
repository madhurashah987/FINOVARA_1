import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Bot, User, Sparkles, Paperclip, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '@/src/types';
import { cn } from '@/lib/utils';
import { getChatResponse } from '@/src/services/geminiService';
import Markdown from 'react-markdown';

export function AnalystChat({ personality = 'analytical', isDemo }: { personality?: string, isDemo?: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: '1', 
      role: 'assistant', 
      content: isDemo 
        ? "Hello! I'm the FINOVARA AI Analyst in **Demo Mode**. I can't analyze your data until you upload real financial statements. Once you upload, I can dive into your specific KPIs, risks, and projections!"
        : "Hello! I'm your FINOVARA AI Analyst. I've analyzed your latest Q3 statements. Would you like to discuss the 15% increase in operational costs or the projected cash flow for Q4?", 
      timestamp: Date.now() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages or typing state changes
  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (isDemo && (input.toLowerCase().includes('data') || input.toLowerCase().includes('explain') || input.toLowerCase().includes('my'))) {
       const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
       const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: "I'm sorry, in **Demo Mode** I don't have access to real user data for explanation. Please upload your own documents in the 'Upload' section to enable full intelligence features.", timestamp: Date.now() };
       setMessages(prev => [...prev, userMsg, aiMsg]);
       setInput('');
       return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: (m.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
        content: m.content
      }));
      history.push({ role: 'user', content: input });

      const response = await getChatResponse(history, personality);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Card className="h-[calc(100vh-16rem)] flex flex-col overflow-hidden border-[#1e293b] shadow-2xl bg-[#0f172a]/50 backdrop-blur-xl">
      <CardHeader className="border-b border-[#1e293b] bg-[#020617]/50 px-6 py-4 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
            <Bot className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-base text-white">AI Financial Analyst</CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-[#94a3b8] font-medium uppercase tracking-wider">Online • Powered by Gemini 3.1 Pro</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-[#94a3b8] hover:bg-[#1e293b]">
          <Maximize2 className="w-4 h-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden flex flex-col min-h-0 bg-[#020617]/20">
        <div className="flex-1 overflow-y-auto px-6 py-8 scroll-bar">
          <div className="space-y-8 max-w-3xl mx-auto pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex gap-4",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className={cn("h-8 w-8 shrink-0 border border-[#1e293b]", msg.role === 'assistant' ? "bg-blue-500/10" : "bg-[#1e293b]")}>
                    {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-blue-500" /> : <User className="w-4 h-4 text-[#94a3b8]" />}
                  </Avatar>
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-5 py-3.5 text-sm shadow-xl",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-tr-none font-medium" 
                      : "bg-[#0f172a] border border-[#1e293b] text-[#f8fafc] rounded-tl-none"
                  )}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <div className="markdown-body">
                        <Markdown>{msg.content}</Markdown>
                      </div>
                    </div>
                    <div className={cn(
                      "text-[10px] mt-3 opacity-40 font-mono",
                      msg.role === 'user' ? "text-right" : "text-left"
                    )}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex gap-4"
              >
                <Avatar className="h-8 w-8 shrink-0 border border-[#1e293b] bg-blue-500/10">
                  <Bot className="w-4 h-4 text-blue-500" />
                </Avatar>
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                </div>
              </motion.div>
            )}
            <div ref={scrollBottomRef} />
          </div>
        </div>
      </CardContent>

      <div className="p-4 border-t border-[#1e293b] bg-[#020617]/40 shrink-0">
        <div className="max-w-3xl mx-auto relative px-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Search fiscal patterns or ask for intelligence updates..."
            className="pr-24 h-12 rounded-xl bg-[#0f172a] border-[#1e293b] text-white focus-visible:ring-blue-500 placeholder:text-[#475569]"
          />
          <div className="absolute right-3 top-1.5 flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-[#64748b] hover:text-white">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button size="icon" className="h-9 w-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSend} disabled={!input.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-[10px] text-center text-[#475569] mt-3 uppercase tracking-widest font-mono font-bold">
          <Sparkles className="w-3 h-3 inline-block mr-1 text-blue-500" />
          Neural analysis enabled • verify complex fiscal decisions
        </p>
      </div>
    </Card>
  );
}
