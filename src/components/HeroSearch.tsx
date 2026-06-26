"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Mic, ArrowUp, Paperclip, Blocks, Folder, ChevronRight, Lock } from "lucide-react";
import { KineticTextReveal } from "./KineticTextReveal";

const PLACEHOLDERS = [
  "Ask a research question, topic, or hypothesis...",
  "Find recent papers on quantum computing...",
  "Summarize the latest research on CRISPR...",
  "What are the implications of AGI?",
  "Explain diffusion models in simple terms...",
  "Search for clinical trials on Alzheimer's...",
  "Find the latest discoveries in astrophysics...",
  "Compare different agentic AI frameworks..."
];

export default function HeroSearch() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Typewriter state
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    if (isWaiting) return;

    const currentString = PLACEHOLDERS[textIndex];
    let timeoutId: NodeJS.Timeout;

    if (!isDeleting) {
      if (charIndex < currentString.length) {
        timeoutId = setTimeout(() => {
          setCharIndex((prev) => prev + 1);
        }, 40); // Typing speed
      } else {
        setIsWaiting(true);
        timeoutId = setTimeout(() => {
          setIsWaiting(false);
          setIsDeleting(true);
        }, 2500); // Pause at end of sentence
      }
    } else {
      if (charIndex > 0) {
        timeoutId = setTimeout(() => {
          setCharIndex((prev) => prev - 1);
        }, 20); // Deleting speed (faster)
      } else {
        setIsDeleting(false);
        let nextIndex = Math.floor(Math.random() * PLACEHOLDERS.length);
        while (nextIndex === textIndex) {
          nextIndex = Math.floor(Math.random() * PLACEHOLDERS.length);
        }
        setTextIndex(nextIndex);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [charIndex, isDeleting, isWaiting, textIndex]);

  useEffect(() => {
    // Click outside logic
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

  return (
    <div className="w-full flex flex-col items-center mt-[12vh]">
      {/* Wordmark */}
      <div className="mb-8 flex flex-col items-center">
        <KineticTextReveal
          text="Research Beyond Search"
          splitBy="words"
          stagger={0.08}
          distance={15}
          staggerFrom="center"
          className="text-5xl md:text-6xl font-semibold tracking-tight text-white"
        />
        <p className="mt-3 text-zinc-400 text-base md:text-lg text-center max-w-[600px] leading-relaxed">
          Search millions of scientific papers, discover connections,<br className="hidden sm:block" /> and build AI-powered research maps.
        </p>
      </div>

      {/* Search Area */}
      <div className="w-full max-w-[736px]">
        {/* Box */}
        <div className="w-full bg-perplex-surface border border-perplex-border rounded-[16px] pt-4 pb-3 px-4 shadow-sm flex flex-col">
          {/* Textarea */}
          <div className="relative w-full">
            <textarea
              className="w-full bg-transparent text-base text-perplex-text focus:outline-none placeholder:text-[#6a6a6a] resize-none min-h-[44px] [font-family:inherit]"
              placeholder={PLACEHOLDERS[textIndex].substring(0, charIndex) + (charIndex < PLACEHOLDERS[textIndex].length ? "|" : "")}
            />
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between mt-2">
            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
                  isMenuOpen ? "bg-[#2b2d2d] text-[#e8e8e6]" : "text-[#a0a0a0] hover:bg-[#2b2d2d] hover:text-[#e8e8e6]"
                }`}
              >
                <Plus size={18} className={`transition-transform duration-200 ${isMenuOpen ? "rotate-45" : "rotate-0"}`} />
              </button>

              {/* Attach Dropdown Menu */}
              {isMenuOpen && (
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
              <button className="text-[#a0a0a0] hover:text-perplex-text transition-colors">
                <Mic size={18} />
              </button>
              <button className="w-8 h-8 rounded-full bg-[#2b2d2d] text-[#a0a0a0] flex items-center justify-center hover:bg-[#343737] transition-colors">
                <ArrowUp size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
