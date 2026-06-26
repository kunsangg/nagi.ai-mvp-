"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Mic, ArrowUp, Paperclip, Blocks, Folder, ChevronRight, Lock, Loader2, BookOpen, FileText, UserCircle2, MessageSquare } from "lucide-react";
import { KineticTextReveal } from "./KineticTextReveal";

const PLACEHOLDERS = [
  "Search papers on Large Language Models...",
  "Find influential papers about Quantum Computing...",
  "Explain diffusion models...",
  "Find papers by Geoffrey Hinton...",
  "Generate a research map for Agentic AI...",
  "Compare AlphaFold and RoseTTAFold...",
  "Latest research on Reinforcement Learning...",
  "Search authors, papers, topics, or ask a research question..."
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

  // Click outside attach menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Flatten suggestions for index mapping
  const flatSuggestions = SUGGESTIONS.flatMap(group => group.items);

  const handleSubmit = () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setLoadingStep(0);
    // Here we would typically trigger the actual search action
  };

  // Handle Textarea Keyboard Navigation
  const handleTextareaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatSuggestions.length) {
        setQuery(flatSuggestions[selectedIndex].label);
        // Using timeout to ensure query state updates before submit
        setTimeout(handleSubmit, 10);
      } else if (query.trim()) {
        handleSubmit();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatSuggestions.length - 1 ? prev + 1 : prev));
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
    <div className="w-full flex flex-col items-center">
      {/* Wordmark */}
      <div className="mb-8 flex flex-col items-center">
        <KineticTextReveal
          text="Research Beyond Search"
          splitBy="words"
          stagger={0.08}
          distance={15}
          staggerFrom="center"
          className="text-5xl md:text-6xl font-semibold tracking-tight text-white drop-shadow-md"
        />
        <p className="mt-3 text-zinc-300 text-base md:text-lg text-center max-w-[600px] leading-relaxed drop-shadow-md">
          Search millions of scientific papers, discover connections,<br className="hidden sm:block" /> and build AI-powered research maps.
        </p>
      </div>

      {/* Search Area */}
      <div className="w-full max-w-[736px] relative">
        {/* Box */}
        <div 
          className={`w-full bg-perplex-surface rounded-[16px] pt-4 pb-3 px-4 flex flex-col transition-all duration-500 ${
            isFocused 
              ? "border border-[#3bc9db]/50 ring-2 ring-[#3bc9db]/40 shadow-[0_0_100px_rgba(10,88,202,0.4),_0_0_40px_rgba(59,201,219,0.5)] bg-[#252828]" 
              : "border border-perplex-border shadow-sm hover:border-[#3b3d3d]"
          }`}
        >
          {/* Textarea */}
          <div className="relative w-full">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                // Delay blur to allow click on dropdown items
                setTimeout(() => setIsFocused(false), 200);
              }}
              onKeyDown={handleTextareaKeyDown}
              disabled={isLoading}
              className={`w-full bg-transparent text-base text-perplex-text focus:outline-none resize-none min-h-[44px] [font-family:inherit] transition-opacity duration-300 ${
                isLoading ? "opacity-50 cursor-not-allowed" : "opacity-100"
              }`}
              placeholder={isLoading ? LOADING_MESSAGES[loadingStep] : ""}
            />
            {/* Custom Fade Placeholder (Overlay) */}
            {!query && !isLoading && (
              <div 
                className={`absolute top-0 left-0 pointer-events-none text-[#6a6a6a] transition-opacity duration-300 ${
                  isFading ? "opacity-0" : "opacity-100"
                }`}
              >
                {PLACEHOLDERS[textIndex]}
              </div>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between mt-2">
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                disabled={isLoading}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  isMenuOpen ? "bg-[#2b2d2d] text-[#e8e8e6]" : "text-[#a0a0a0] hover:bg-[#2b2d2d] hover:text-[#e8e8e6]"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Plus size={18} className={`transition-transform duration-200 ${isMenuOpen ? "rotate-45" : "rotate-0"}`} />
              </button>

              {/* Attach Dropdown Menu */}
              {isMenuOpen && !isLoading && (
                <div className="absolute bottom-full left-0 mb-2 w-[240px] bg-[#202222] border border-[#2b2d2d] rounded-[16px] p-2 shadow-xl flex flex-col z-50">
                  <div 
                    className="relative group"
                    onMouseEnter={() => setActiveHover('upload')}
                    onMouseLeave={() => setActiveHover(null)}
                  >
                    <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#2b2d2d] text-sm text-[#e8e8e6] transition-colors">
                      <div className="flex items-center gap-3">
                        <Paperclip size={16} className="text-[#a0a0a0]" />
                        <span className="font-medium">Upload files or images</span>
                      </div>
                      <Lock size={12} className="text-[#a0a0a0]" />
                    </button>
                    
                    {/* Hover Popover */}
                    {activeHover === 'upload' && (
                      <div className="absolute top-0 left-[105%] w-[260px] bg-[#202222] border border-[#2b2d2d] rounded-[16px] p-4 shadow-xl z-50 cursor-default">
                        <h4 className="text-sm font-semibold text-[#e8e8e6] mb-1">Upload files</h4>
                        <p className="text-sm text-[#a0a0a0] leading-relaxed">
                          Attach and analyze any file or photo by <a href="#" className="text-[#3bc9db] hover:underline transition-colors font-medium">signing in</a>
                        </p>
                      </div>
                    )}
                  </div>

                  <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#2b2d2d] text-sm text-[#e8e8e6] transition-colors mt-0.5">
                    <div className="flex items-center gap-3">
                      <Blocks size={16} className="text-[#a0a0a0]" />
                      <span className="font-medium">Connectors</span>
                    </div>
                    <ChevronRight size={14} className="text-[#a0a0a0]" />
                  </button>

                  <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#2b2d2d] text-sm text-[#e8e8e6] transition-colors mt-0.5">
                    <div className="flex items-center gap-3">
                      <Folder size={16} className="text-[#a0a0a0]" />
                      <span className="font-medium">Spaces</span>
                    </div>
                    <ChevronRight size={14} className="text-[#a0a0a0]" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button disabled={isLoading} className={`text-[#a0a0a0] hover:text-perplex-text transition-colors ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}>
                <Mic size={18} />
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!query.trim() || isLoading}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  query.trim() && !isLoading
                    ? "bg-perplex-teal text-white hover:bg-perplex-teal-hover shadow-md shadow-perplex-teal/20" 
                    : "bg-[#2b2d2d] text-[#a0a0a0]"
                }`}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin text-perplex-teal" />
                ) : (
                  <ArrowUp size={16} className={query.trim() ? "animate-in fade-in zoom-in duration-200" : ""} />
                )}
              </button>
            </div>
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
                    const globalIndex = flatSuggestions.indexOf(item);
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
