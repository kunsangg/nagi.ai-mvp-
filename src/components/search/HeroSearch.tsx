"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Mic, ArrowUp, Paperclip, Blocks, Folder, ChevronRight, Lock, Loader2, BookOpen, FileText, UserCircle2, MessageSquare, Search, Monitor, AudioLines, ChevronDown } from "lucide-react";
import { KineticTextReveal } from "@/components/ui";
import { Paper } from "@/types/paper";

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
  const [results, setResults] = useState<Paper[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const suggestionsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  
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

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    if (suggestionsDebounceRef.current) {
      clearTimeout(suggestionsDebounceRef.current);
    }

    suggestionsDebounceRef.current = setTimeout(async () => {
      setIsSuggestionsLoading(true);
      try {
        const res = await fetch(
          `https://api.openalex.org/autocomplete?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        const titles = (data.results || []).slice(0, 6).map((r: any) => r.display_name as string);
        setSuggestions(titles);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 300);

    return () => {
      if (suggestionsDebounceRef.current) {
        clearTimeout(suggestionsDebounceRef.current);
      }
    };
  }, [query]);

  const handleSubmit = async () => {
    if (!query.trim() || isLoading) return;
    setSuggestions([]);
    setIsFocused(false);
    setIsLoading(true);
    setLoadingStep(0);
    
    try {
      console.log(`[Frontend] Sending search request to /api/search with query: "${query.trim()}"`);
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
      setResults(data.papers || []);
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
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        setQuery(suggestions[selectedIndex]);
        setSuggestions([]);
        setTimeout(handleSubmit, 10);
      } else if (query.trim()) {
        handleSubmit();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      textareaRef.current?.blur();
      setIsFocused(false);
      setSuggestions([]);
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
        {isFocused && query.length >= 2 && !isLoading && (
          <div className="absolute top-[100%] left-0 w-full mt-2 z-50">
            <div className="w-full backdrop-blur-xl bg-[#191a1a]/95 border border-[#2b2d2d] rounded-[16px] shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {isSuggestionsLoading ? (
                <div className="flex items-center gap-2 px-3 py-3 text-[#6a6a6a] text-sm">
                  <Loader2 size={13} className="animate-spin" />
                  <span>Finding papers...</span>
                </div>
              ) : suggestions.length > 0 ? (
                <>
                  <div className="px-3 mb-1.5 text-xs font-semibold text-[#808080] uppercase tracking-wider">
                    Papers
                  </div>
                  {suggestions.map((title, idx) => (
                    <button
                      key={idx}
                      onMouseDown={() => {
                        setQuery(title);
                        setSuggestions([]);
                        setTimeout(handleSubmit, 10);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                        selectedIndex === idx
                          ? "bg-[#252828] text-[#e8e8e6] border border-[#3b3d3d]"
                          : "text-[#a0a0a0] hover:bg-[#202222] hover:text-[#e8e8e6] border border-transparent"
                      }`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className={`flex items-center justify-center p-1.5 rounded-lg ${
                        selectedIndex === idx ? "bg-[#303333] text-[#3bc9db]" : "bg-[#202222] text-[#808080]"
                      }`}>
                        <FileText size={13} />
                      </div>
                      <span className="font-medium text-left flex-1 truncate">{title}</span>
                      <ChevronRight size={13} className="text-[#6a6a6a] shrink-0" />
                    </button>
                  ))}
                </>
              ) : (
                <div className="px-3 py-3 text-[#6a6a6a] text-sm">
                  No suggestions found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="w-full max-w-[736px] mt-4 flex flex-col gap-2">
          {results.map((paper, index) => (
            <div
              key={paper.id}
              className="group p-4 rounded-xl bg-[#1e2020]/80 border border-[#2b2d2d] hover:border-[#3bc9db]/30 hover:bg-[#202424]/90 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-[#e8e8e6] font-medium text-sm leading-snug group-hover:text-white transition-colors">
                    {paper.title}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="text-[#6a6a6a] text-xs">
                      {paper.authors.slice(0, 2).join(", ")}{paper.authors.length > 2 ? " et al." : ""}
                    </span>
                    {paper.publicationYear && (
                      <>
                        <span className="text-[#3b3d3d]">·</span>
                        <span className="text-[#6a6a6a] text-xs">{paper.publicationYear}</span>
                      </>
                    )}
                    {paper.journal && (
                      <>
                        <span className="text-[#3b3d3d]">·</span>
                        <span className="text-[#3bc9db]/70 text-xs truncate max-w-[200px]">{paper.journal}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#2b2d2d] border border-[#3b3d3d]">
                    <span className="text-[#3bc9db] text-xs font-semibold">
                      #{index + 1}
                    </span>
                  </div>
                  <span className="text-[#6a6a6a] text-[11px]">
                    {paper.citationCount.toLocaleString()} citations
                  </span>
                </div>
              </div>
              {paper.abstract && (
                <p className="mt-2 text-[#808080] text-xs leading-relaxed line-clamp-2">
                  {paper.abstract}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
