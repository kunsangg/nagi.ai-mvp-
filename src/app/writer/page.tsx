"use client";

import { useState } from "react";
import { ArrowLeft, Save, Sparkles, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Link, ChevronDown, CheckCircle2, Send, Paperclip, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";

export default function NagiWriterPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Chat state
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  const handleCopilotSubmit = async () => {
    if (!chatInput.trim() || isGenerating) return;
    
    const command = chatInput;
    setChatInput("");
    setIsGenerating(true);
    setChatMessage("");

    try {
      const res = await fetch("/api/writer-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, currentText: content })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.updatedText) {
          setContent(data.updatedText);
        }
        if (data.message) {
          setChatMessage(data.message);
        }
      } else {
        console.error("Failed to generate content");
        setChatMessage("Sorry, I encountered an error. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setChatMessage("Sorry, I encountered an error. Please try again.");
    } finally {
      setIsGenerating(false);
      setTimeout(() => setChatMessage(""), 5000); // clear message after 5s
    }
  };

  const insertCitation = (citation: string) => {
    const spacer = content.length > 0 && !content.endsWith(" ") ? " " : "";
    setContent(prev => prev + spacer + citation);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] font-sans overflow-hidden">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 h-14 shrink-0 bg-[#0a0a0a] border-b border-[#1f1f1f]">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[#64748b] hover:text-white transition-colors bg-transparent border-none cursor-pointer text-[13px]">
            <ArrowLeft size={14} /> Back
          </button>
          <div className="w-px h-4 bg-[#1f1f1f]" />
          <div className="text-[13px] text-[#94a3b8]">Projects / Stanford Neuro Lab / <span className="text-[#e2e8f0]">Draft 1</span></div>
        </div>

        <div className="flex items-center gap-3">
          {/* Removed Save block per user request */}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Editor Area (Modern Dark Theme) */}
        <div className="flex-1 flex flex-col bg-[#111111] relative">
          
          {/* Professional Toolbar */}
          <div className="w-full bg-[#111111] border-b border-[#1f1f1f] px-4 py-2 flex items-center justify-center shrink-0 z-10 shadow-sm">
            <div className="flex items-center gap-3 bg-[#0a0a0a] border border-[#1f1f1f] rounded-md px-2 py-1">
              <button className="flex items-center gap-1 bg-transparent border-none text-[#e2e8f0] text-[13px] font-medium cursor-pointer hover:bg-[#1f1f1f] px-2 py-1 rounded">
                Heading 1 <ChevronDown size={14} className="opacity-70" />
              </button>
              <div className="w-px h-4 bg-[#1f1f1f]" />
              <div className="flex gap-1">
                <button className="bg-transparent border-none text-[#e2e8f0] p-1.5 cursor-pointer rounded hover:bg-[#1f1f1f]"><Bold size={14} /></button>
                <button className="bg-transparent border-none text-[#94a3b8] p-1.5 cursor-pointer rounded hover:bg-[#1f1f1f]"><Italic size={14} /></button>
                <button className="bg-transparent border-none text-[#94a3b8] p-1.5 cursor-pointer rounded hover:bg-[#1f1f1f]"><Link size={14} /></button>
              </div>
              <div className="w-px h-4 bg-[#1f1f1f]" />
              <div className="flex gap-1">
                <button className="bg-transparent border-none text-[#e2e8f0] p-1.5 cursor-pointer rounded hover:bg-[#1f1f1f]"><AlignLeft size={14} /></button>
                <button className="bg-transparent border-none text-[#94a3b8] p-1.5 cursor-pointer rounded hover:bg-[#1f1f1f]"><AlignCenter size={14} /></button>
                <button className="bg-transparent border-none text-[#94a3b8] p-1.5 cursor-pointer rounded hover:bg-[#1f1f1f]"><AlignRight size={14} /></button>
              </div>
            </div>
          </div>

          {/* Scrolling Paper Container */}
          <div className="flex-1 overflow-y-auto px-8 py-12 pb-32 flex justify-center relative">
            {isGenerating && (
              <div className="absolute inset-0 bg-[#111111]/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-[#3bc9db] bg-[#0a0a0a] px-4 py-2 rounded-full border border-[#1f1f1f]">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-[13px] font-medium">Nagi Research Assistant is writing...</span>
                </div>
              </div>
            )}
            
            {/* The "Paper" Container */}
            <div className="w-full max-w-[800px] min-h-[1056px] relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your paper here..."
                className="w-full h-full bg-transparent border-none outline-none resize-none text-[#e2e8f0] text-[18px] leading-[1.8] placeholder:text-[#475569] font-sans"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Assistant */}
        <aside className="w-[340px] bg-[#0a0a0a] border-l border-[#1f1f1f] flex flex-col shrink-0 relative">
          
          <div className="px-5 py-4 border-b border-[#1f1f1f] flex items-center gap-2">
            <span className="text-[14px] font-semibold text-[#e2e8f0]">Nagi Research Assistant</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
            
            {/* Auto-suggested citations */}
            <div>
              <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-3">
                Suggested Citations
              </div>
              <div className="flex flex-col gap-3">
                {[
                  { title: "Deep Learning for Healthcare", author: "Esteva et al.", year: 2019, key: "[Esteva et al., 2019]" },
                  { title: "AI in medical imaging", author: "Litjens et al.", year: 2017, key: "[Litjens et al., 2017]" }
                ].map((paper, i) => (
                  <div key={i} className="bg-[#111111] border border-[#1f1f1f] rounded-md p-3 hover:border-[#3bc9db]/30 transition-colors">
                    <div className="text-[13px] font-semibold text-[#e2e8f0] mb-1 leading-snug">{paper.title}</div>
                    <div className="text-[11px] text-[#64748b] mb-3">{paper.author} · {paper.year}</div>
                    <button 
                      onClick={() => insertCitation(paper.key)}
                      className="text-[11px] text-[#e2e8f0] bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#2a2a2a] transition-colors px-2 py-1 rounded cursor-pointer font-medium"
                    >
                      Insert Citation
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Gap Analysis Context */}
            <div>
              <div className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-3">
                From Gap Analysis
              </div>
              <div className="bg-[#111111] border border-[#1f1f1f] border-l-2 border-l-[#3bc9db] rounded-md p-3">
                <p className="text-[12px] text-[#cbd5e1] leading-relaxed m-0 mb-3">
                  You noted that prior work ignored longitudinal effects. Consider adding a paragraph here addressing how your methodology tracks patients over 5 years.
                </p>
                <button 
                  onClick={() => {
                    setChatInput("Write a paragraph addressing how our methodology tracks patients over 5 years, highlighting longitudinal effects.");
                  }}
                  className="text-[11px] text-black bg-[#e2e8f0] hover:bg-white transition-colors border-none px-2.5 py-1 rounded cursor-pointer font-medium"
                >
                  Use as Prompt
                </button>
              </div>
            </div>

          </div>

          {/* AI Message Popover */}
          {chatMessage && (
            <div className="absolute bottom-[80px] left-4 right-4 bg-[#111111] border border-[#1f1f1f] p-3 rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2">
              <p className="text-[13px] text-[#e2e8f0] m-0 leading-relaxed">{chatMessage}</p>
            </div>
          )}

          {/* Chatbot Interface at the bottom */}
          <div className="p-4 border-t border-[#1f1f1f] bg-[#0a0a0a]">
            <div className="flex items-center gap-2 bg-[#111111] border border-[#1f1f1f] rounded-lg p-2 focus-within:border-[#3bc9db]/50 transition-colors">
              <button className="text-[#64748b] hover:text-[#e2e8f0] transition-colors bg-transparent border-none p-1 cursor-pointer">
                <Paperclip size={16} />
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Nagi Research Assistant to write..."
                disabled={isGenerating}
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#e2e8f0] placeholder:text-[#64748b] disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCopilotSubmit();
                }}
              />
              <button 
                onClick={handleCopilotSubmit}
                disabled={!chatInput.trim() || isGenerating}
                className="bg-[#e2e8f0] hover:bg-white text-black border-none p-1.5 rounded-md cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
