"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Mic, ArrowUp, Paperclip, Blocks, Folder, ChevronRight, Lock, Loader2, BookOpen, FileText, UserCircle2, MessageSquare, Search, Monitor, AudioLines, ChevronDown } from "lucide-react";
import { KineticTextReveal } from "./KineticTextReveal";

const PLACEHOLDERS = [
  "Search papers, authors, topics, or ask a research question...",
  "Find influential papers about Quantum Computing...",
  "Generate a research map for Agentic AI...",
  "Compare AlphaFold and RoseTTAFold..."
];

const LOADING_MESSAGES = [
  "Searching papers...",
  "Finding influential authors...",
  "Analyzing citation network...",
  "Preparing research workspace..."
];

const SUGGESTIONS = [
  { group: "Topics", items: [
    { type: "topic", label: "Large Language Models", icon: <BookOpen size={15} /> },
    { type: "topic", label: "Quantum Computing", icon: <BookOpen size={15} /> }
  ]},
  { group: "Papers", items: [
    { type: "paper", label: "Attention Is All You Need", icon: <FileText size={15} /> }
  ]},
  { group: "Authors", items: [
    { type: "author", label: "Geoffrey Hinton", icon: <UserCircle2 size={15} /> }
  ]},
  { group: "Conferences", items: [
    { type: "conference", label: "NeurIPS", icon: <MessageSquare size={15} /> },
    { type: "conference", label: "ICML", icon: <MessageSquare size={15} /> }
  ]}
];

export default function HeroSearch() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // New Interactive States
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [textIndex, setTextIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on load
  useEffect(() => {
    // Slight delay ensures the layout is ready
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus on '/'
      if (e.key === "/" && document.activeElement !== textareaRef.current) {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      // Blur on Escape
      if (e.key === "Escape") {
        textareaRef.current?.blur();
        setIsFocused(false);
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Smooth Placeholder Rotation
  useEffect(() => {
    if (isLoading || query.length > 0 || isFocused) return; // Pause rotation if active

    const intervalId = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setTextIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setIsFading(false);
      }, 300); // 300ms fade transition
    }, 4000); // 4 seconds interval

    return () => clearInterval(intervalId);
  }, [isLoading, query.length, isFocused]);

  // Loading Experience Simulation
  useEffect(() => {
    if (!isLoading) return;

    const intervalId = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev >= LOADING_MESSAGES.length - 1) {
          clearInterval(intervalId);
          return prev;
        }
        return prev + 1;
      });
    }, 1500); // Change loading message every 1.5s

    return () => clearInterval(intervalId);
  }, [isLoading]);

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingStep(0);
    
    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn(`Search API returned an error (${response.status}):`, data);
        return;
      }

      console.log("Semantic Scholar Search Results:", data);
    } catch (error) {
      console.log("Failed to perform search:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Textarea Keyboard Navigation
  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < SUGGESTIONS.flatMap(g => g.items).length) {
        setQuery(SUGGESTIONS.flatMap(g => g.items)[selectedIndex].label);
        setTimeout(handleSubmit, 10);
      } else if (query.trim()) {
        handleSubmit();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < SUGGESTIONS.flatMap(g => g.items).length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      textareaRef.current?.blur();
      setIsFocused(false);
    }
  };

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  return (
    <div className="w-full flex flex-col items-center mb-6">
      {/* Wordmark */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center gap-3">
          <KineticTextReveal
            text="Nagi"
            splitBy="words"
            stagger={0.08}
            distance={15}
            staggerFrom="center"
            className="text-5xl md:text-6xl font-semibold tracking-tight text-white drop-shadow-md"
          />
          <KineticTextReveal
            text="海"
            splitBy="words"
            stagger={0.08}
            distance={15}
            delay={0.1}
            staggerFrom="center"
            className="text-5xl md:text-6xl font-semibold tracking-tight text-[#3bc9db] drop-shadow-[0_0_20px_rgba(59,201,219,0.7)]"
          />
        </div>
        <p className="mt-3 text-zinc-300 text-base md:text-lg text-center max-w-[600px] leading-relaxed drop-shadow-md">
          Search millions of scientific papers, discover connections,<br className="hidden sm:block" /> and build AI-powered research maps.
        </p>
      </div>

      {/* Search Area */}
      <div className="w-full max-w-[736px] relative">
        {/* Box */}
        <div 
          className={`w-full rounded-[20px] p-2 pl-5 flex items-center transition-all duration-300 ease-out ${
            isFocused 
              ? "border border-[#3bc9db]/40 shadow-[0_4px_24px_rgba(59,201,219,0.15)] bg-[#191a1a]/95" 
              : "border border-[#2b2d2d]/60 shadow-md hover:border-[#3b3d3d] bg-[#191a1a]/70 backdrop-blur-md"
          }`}
        >
          {/* Input Area */}
          <div className="relative flex-1 flex items-center h-10">
            <input
              type="text"
              ref={textareaRef as any}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Delay blur to allow click on dropdown items
                setTimeout(() => setIsFocused(false), 200);
              }}
              onKeyDown={handleTextareaKeyDown}
              disabled={isLoading}
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              className={`w-full bg-transparent text-[15px] text-white focus:outline-none [font-family:inherit] transition-opacity duration-300 ${
                isLoading ? "opacity-50 cursor-not-allowed" : "opacity-100"
              }`}
              placeholder={isLoading ? LOADING_MESSAGES[loadingStep] : ""}
            />
            {/* Custom Fade Placeholder (Overlay) */}
            {!query && !isLoading && (
              <div 
                className={`absolute top-[50%] -translate-y-[50%] left-0 pointer-events-none text-[#8a8a8a] text-[15px] transition-opacity duration-300 ${
                  isFading ? "opacity-0" : "opacity-100"
                }`}
              >
                {PLACEHOLDERS[textIndex]}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex items-center ml-3">
            <button 
              onClick={handleSubmit}
              disabled={!query.trim() || isLoading}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                query.trim() && !isLoading
                  ? "bg-perplex-teal text-white hover:bg-perplex-teal-hover shadow-lg shadow-perplex-teal/20 scale-100" 
                  : "bg-transparent text-[#a0a0a0] scale-95 opacity-50"
              }`}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-perplex-teal" />
              ) : (
                <ArrowUp size={18} className={query.trim() ? "animate-in fade-in zoom-in duration-200 stroke-[2.5]" : "stroke-[2]"} />
              )}
            </button>
          </div>
        </div>

        {/* Premium Search Suggestions Dropdown */}
        {isFocused && query.length > 0 && !isLoading && (
          <div className="absolute top-[100%] left-0 w-full mt-2 z-50">
            <div className="w-full backdrop-blur-xl bg-[#191a1a]/95 border border-[#2b2d2d] rounded-[16px] shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {SUGGESTIONS.map((group, groupIdx) => (
                <div key={group.group} className={`${groupIdx > 0 ? "mt-2 pt-2 border-t border-[#2b2d2d]/50" : ""}`}>
                  <div className="px-3 mb-1.5 flex items-center text-xs font-semibold text-[#808080] uppercase tracking-wider">
                    {group.group}
                  </div>
                  {group.items.map((item) => {
                    const globalIndex = SUGGESTIONS.flatMap(g => g.items).indexOf(item);
                    const isSelected = selectedIndex === globalIndex;
                    return (
                      <button
                        key={item.label}
                        onClick={() => {
                          setQuery(item.label);
                          handleSubmit();
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                          isSelected
                            ? "bg-[#252828] text-[#e8e8e6] border border-[#3b3d3d] shadow-sm"
                            : "text-[#a0a0a0] hover:bg-[#202222] hover:text-[#e8e8e6] border border-transparent"
                        }`}
                      >
                        <div className={`flex items-center justify-center p-1.5 rounded-lg ${
                          isSelected ? "bg-[#303333] text-perplex-teal" : "bg-[#202222] text-[#808080]"
                        }`}>
                          {item.icon}
                        </div>
                        <span className="font-medium text-left flex-1">{item.label}</span>
                        <span className="text-[11px] text-[#6a6a6a] capitalize tracking-wide bg-[#202222] px-2 py-0.5 rounded-md border border-[#2b2d2d]">
                          {item.type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
