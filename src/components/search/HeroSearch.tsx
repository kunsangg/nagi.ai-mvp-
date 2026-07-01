"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, ChevronRight, Loader2, FileText, X, ExternalLink, Lock, Unlock, Filter, Search } from "lucide-react";
import { Paper, SearchFilters } from "@/types/paper";

const PLACEHOLDERS = [
  "Search papers, authors, topics...",
  "Find influential papers about Quantum Computing...",
  "Explore transformer architecture research...",
  "Discover papers on protein folding...",
];

const LOADING_MESSAGES = [
  "Searching papers...",
  "Ranking by relevance...",
  "Fetching metadata...",
  "Almost there...",
];

const PAPER_TYPES = [
  { label: "All", value: "" },
  { label: "Article", value: "article" },
  { label: "Review", value: "review" },
  { label: "Preprint", value: "preprint" },
  { label: "Book Chapter", value: "book-chapter" },
  { label: "Dissertation", value: "dissertation" },
];

const DOMAIN_IMAGES: Record<string, string> = {
  "Life Sciences": "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&q=80",
  "Health Sciences": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80",
  "Physical Sciences": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=80",
  "Social Sciences": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80",
  "Computer Science": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80",
  "Mathematics": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&q=80",
  "Engineering": "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=400&q=80",
  "Economics": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80",
  "Medicine": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80",
  "Biology": "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=400&q=80",
  "Chemistry": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&q=80",
  "Physics": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&q=80",
  "Psychology": "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=400&q=80",
  "Environmental Science": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80",
};

const GRADIENTS = [
  "from-indigo-500/20 to-purple-500/20",
  "from-emerald-500/20 to-teal-500/20",
  "from-blue-500/20 to-cyan-500/20",
  "from-orange-500/20 to-red-500/20",
  "from-pink-500/20 to-rose-500/20",
];

function getGradientForPaper(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function getDomainImage(domain?: string, field?: string): string | null {
  if (domain && DOMAIN_IMAGES[domain]) return DOMAIN_IMAGES[domain];
  if (field && DOMAIN_IMAGES[field]) return DOMAIN_IMAGES[field];
  for (const key of Object.keys(DOMAIN_IMAGES)) {
    if (domain?.toLowerCase().includes(key.toLowerCase())) return DOMAIN_IMAGES[key];
    if (field?.toLowerCase().includes(key.toLowerCase())) return DOMAIN_IMAGES[key];
  }
  return null;
}

function stripHtml(str?: string): string {
  if (!str) return "";
  return String(str).replace(/<[^>]*>/g, "");
}

export default function HeroSearch() {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [textIndex, setTextIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [results, setResults] = useState<Paper[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Panel state removed

  // Filters
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setIsFocused(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isLoading || query.length > 0 || isFocused) return;
    const id = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setTextIndex((p) => (p + 1) % PLACEHOLDERS.length);
        setIsFading(false);
      }, 300);
    }, 4000);
    return () => clearInterval(id);
  }, [isLoading, query.length, isFocused]);

  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => {
      setLoadingStep((p) => (p >= LOADING_MESSAGES.length - 1 ? p : p + 1));
    }, 1200);
    return () => clearInterval(id);
  }, [isLoading]);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current);
    suggestionsDebounceRef.current = setTimeout(async () => {
      setIsSuggestionsLoading(true);
      try {
        const res = await fetch(`https://api.openalex.org/autocomplete?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions((data.results || []).slice(0, 6).map((r: any) => r.display_name as string));
      } catch { setSuggestions([]); }
      finally { setIsSuggestionsLoading(false); }
    }, 300);
    return () => { if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current); };
  }, [query]);

  useEffect(() => { setSelectedIndex(-1); }, [query]);

  const handleSubmit = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim() || isLoading) return;
    setSuggestions([]);
    setIsFocused(false);
    setIsLoading(true);
    setLoadingStep(0);

    if (!hasSearched) {
      setIsAnimating(true);
      await new Promise(res => setTimeout(res, 400));
      setHasSearched(true);
      setIsAnimating(false);
    }

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim(), filters }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResults([]);
        setTotalResults(0);
        alert(`Search Error: ${data.error || 'Failed to search'}\n${data.details || ''}`);
        return;
      }
      setResults(data.papers || []);
      setTotalResults(data.totalResults || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaperClick = (paper: Paper) => {
    sessionStorage.setItem(`paper_${paper.id}`, JSON.stringify(paper));
    window.location.href = `/paper/${paper.id}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const chosen = suggestions[selectedIndex];
        setQuery(chosen);
        setSuggestions([]);
        handleSubmit(chosen);
      } else if (query.trim()) {
        handleSubmit();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((p) => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((p) => Math.max(p - 1, -1));
    } else if (e.key === "Escape") {
      setIsFocused(false);
      setSuggestions([]);
    }
  };

  return (
    <div className={`w-full flex flex-col transition-all duration-500 ease-out ${hasSearched ? "items-start pt-0" : "items-center justify-center flex-1"}`}>

      {/* Hero — only before search */}
      {!hasSearched && (
        <div className={`flex flex-col items-center mb-10 transition-all duration-400 ${isAnimating ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"}`}>
          <h1 className="text-[56px] font-black tracking-tight text-white leading-none mb-3 font-sans">
            NAGI <span className="text-[#3bc9db]">海</span>
          </h1>
          <p className="text-[#a0a0a0] text-sm tracking-widest uppercase font-medium">
            Navigate the ocean of research
          </p>
        </div>
      )}

      {/* Search Bar — Floating Pill */}
      <div className={`w-full transition-all duration-500 ease-out ${hasSearched ? "sticky top-6 z-50 mb-8" : "px-0 max-w-[760px] mx-auto"}`}>
        <div className="relative w-full max-w-[760px] mx-auto px-4 lg:px-0">
          <div className={`w-full flex items-center gap-3 transition-all duration-300 ${
            hasSearched
              ? "bg-[#111213]/80 backdrop-blur-2xl border border-[#2b2d2d] rounded-2xl px-5 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
              : isFocused
              ? "bg-[#161818]/95 border border-[#3bc9db]/80 shadow-[0_0_60px_rgba(59,201,219,0.5)] rounded-2xl px-5 py-3.5"
              : "bg-[#191a1a]/70 border border-[#2b2d2d]/60 backdrop-blur-md rounded-2xl px-5 py-3.5 hover:border-[#3b3d3d]"
          }`}>
            <Search size={16} className="text-[#a0a0a0] shrink-0" />
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className={`w-full bg-transparent text-white focus:outline-none transition-all font-sans ${hasSearched ? "text-[14px]" : "text-[15px]"} ${isLoading ? "opacity-40 cursor-not-allowed" : ""}`}
                placeholder={isLoading ? LOADING_MESSAGES[loadingStep] : ""}
              />
              {!query && !isLoading && (
                <div className={`absolute top-1/2 -translate-y-1/2 left-0 pointer-events-none text-[#a0a0a0] transition-opacity duration-300 font-sans ${hasSearched ? "text-[14px]" : "text-[15px]"} ${isFading ? "opacity-0" : "opacity-100"}`}>
                  {PLACEHOLDERS[textIndex]}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 rounded-lg transition-all ${showFilters ? "text-[#3bc9db] bg-[#3bc9db]/10" : "text-[#a0a0a0] hover:text-white"}`}
              >
                <Filter size={14} />
              </button>
              <button
                onClick={() => handleSubmit()}
                disabled={!query.trim() || isLoading}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  query.trim() && !isLoading
                    ? "bg-[#3bc9db] text-[#121314] hover:bg-[#4dd9eb]"
                    : "bg-[#2b2d2d] text-[#a0a0a0]"
                }`}
              >
                {isLoading
                  ? <Loader2 size={13} className="animate-spin" />
                  : <ArrowUp size={14} strokeWidth={2.5} />
                }
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="absolute top-[calc(100%+12px)] left-0 w-full z-50 bg-[#161818]/95 backdrop-blur-xl border border-[#2b2d2d] rounded-2xl p-5 flex flex-wrap gap-6 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <div className="text-[10px] text-[#a0a0a0] uppercase tracking-widest font-bold mb-3">Type</div>
                <div className="flex gap-2 flex-wrap">
                  {PAPER_TYPES.map((t) => (
                    <button key={t.value}
                      onClick={() => setFilters((f) => ({ ...f, type: t.value || undefined }))}
                      className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                        filters.type === (t.value || undefined)
                          ? "bg-[#3bc9db]/15 text-[#3bc9db] border-[#3bc9db]/30"
                          : "bg-[#1a1b1b] text-[#a0a0a0] border-[#2b2d2d] hover:text-white hover:border-[#3b3d3d]"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[#a0a0a0] uppercase tracking-widest font-bold mb-3">Open Access</div>
                <button
                  onClick={() => setFilters((f) => ({ ...f, openAccessOnly: !f.openAccessOnly }))}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all flex items-center gap-2 ${
                    filters.openAccessOnly
                      ? "bg-[#3bc9db]/15 text-[#3bc9db] border-[#3bc9db]/30"
                      : "bg-[#1a1b1b] text-[#a0a0a0] border-[#2b2d2d] hover:text-white hover:border-[#3b3d3d]"
                  }`}>
                  <Unlock size={11} /> Open Access Only
                </button>
              </div>
              <div>
                <div className="text-[10px] text-[#a0a0a0] uppercase tracking-widest font-bold mb-3">Year Range</div>
                <div className="flex items-center gap-2">
                  <input type="number" placeholder="From" min={1900} max={2025}
                    value={filters.yearFrom || ""}
                    onChange={(e) => setFilters((f) => ({ ...f, yearFrom: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-20 px-3 py-1.5 text-[12px] bg-[#1a1b1b] border border-[#2b2d2d] rounded-lg text-white focus:outline-none focus:border-[#3bc9db]/40 transition-colors" />
                  <span className="text-[#a0a0a0] text-xs">—</span>
                  <input type="number" placeholder="To" min={1900} max={2025}
                    value={filters.yearTo || ""}
                    onChange={(e) => setFilters((f) => ({ ...f, yearTo: e.target.value ? parseInt(e.target.value) : undefined }))}
                    className="w-20 px-3 py-1.5 text-[12px] bg-[#1a1b1b] border border-[#2b2d2d] rounded-lg text-white focus:outline-none focus:border-[#3bc9db]/40 transition-colors" />
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {isFocused && query.length >= 2 && !isLoading && (
            <div className="absolute top-[calc(100%+12px)] left-0 w-full z-50">
              <div className="bg-[#161818]/95 backdrop-blur-xl border border-[#2b2d2d] rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-150">
                {isSuggestionsLoading ? (
                  <div className="flex items-center gap-3 px-4 py-4 text-[#a0a0a0] text-[13px]">
                    <Loader2 size={14} className="animate-spin text-[#3bc9db]" />
                    <span>Finding papers...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <>
                    <div className="px-4 pt-3 pb-2 text-[10px] font-bold text-[#a0a0a0] uppercase tracking-widest">
                      Suggestions
                    </div>
                    {suggestions.map((title, idx) => (
                      <button key={idx}
                        onMouseDown={() => { setQuery(title); setSuggestions([]); handleSubmit(title); }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[14px] transition-all ${
                          selectedIndex === idx
                            ? "bg-[#202222] text-white"
                            : "text-[#a0a0a0] hover:bg-[#1a1c1c] hover:text-white"
                        }`}>
                        <FileText size={14} className={selectedIndex === idx ? "text-white" : "text-[#808080]"} shrink-0 />
                        <span className="truncate text-left font-medium">{title}</span>
                        <ChevronRight size={14} className="text-[#6a6a6a] shrink-0 ml-auto" />
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="px-4 py-4 text-[#a0a0a0] text-[13px]">No suggestions found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="w-full px-4 md:px-6 mt-6 pb-24">
          {/* Premium Header */}
          {!isLoading && totalResults > 0 && (
            <div className="max-w-[1200px] mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#2b2d2d] pb-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[24px] text-white font-bold tracking-tight font-sans">
                  {totalResults.toLocaleString()} Research Papers
                </span>
                <span className="text-[13px] text-[#a0a0a0] font-sans">
                  Search: <span className="text-white font-medium">{query}</span>
                </span>
              </div>
              <span className="text-[11px] text-[#808080] uppercase tracking-widest font-medium">
                Showing top 10 ranked papers
              </span>
            </div>
          )}

          {isLoading ? (
            /* Skeleton grid */
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col bg-[#111213] border border-[#2b2d2d] rounded-xl overflow-hidden h-full">
                  <div className="w-full aspect-video bg-[#1a1b1b] animate-pulse" />
                  <div className="p-4 pt-4 flex flex-col gap-3">
                    <div className="h-4 bg-[#1a1b1b] rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-[#1a1b1b] rounded w-full animate-pulse" />
                    <div className="h-3 bg-[#1a1b1b] rounded w-1/2 animate-pulse mt-1" />
                    <div className="h-6 bg-[#1a1b1b] rounded w-24 animate-pulse mt-2" />
                    <div className="flex-1" />
                    <div className="flex gap-2 pt-3 border-t border-[#2b2d2d]/50">
                      <div className="h-5 bg-[#1a1b1b] rounded w-16 animate-pulse" />
                      <div className="h-5 bg-[#1a1b1b] rounded w-20 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Premium Paper Grid */
            <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((paper, index) => (
                <div
                  key={paper.id}
                  onClick={() => handlePaperClick(paper)}
                  className="group flex flex-col cursor-pointer bg-[#111213] border border-[#2b2d2d] rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-[#3bc9db]/30 transition-all duration-300 h-full"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  {/* Image/Gradient Thumbnail (16:9) */}
                  <div className="relative w-full aspect-video overflow-hidden bg-[#1a1b1b] shrink-0">
                    {getDomainImage(paper.domain, paper.field) ? (
                      <img
                        src={getDomainImage(paper.domain, paper.field)!}
                        alt={paper.domain || paper.field || "Research"}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-70 group-hover:opacity-90"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${getGradientForPaper(paper.id)} opacity-50 transition-transform duration-700 group-hover:scale-105`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111213] via-[#111213]/20 to-transparent" />
                    
                    {/* Rank Badge */}
                    <div className="absolute top-3 left-3 flex items-center">
                      <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur-md px-2 py-1 rounded-md tracking-wider border border-white/10">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Paper Type Pill */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {paper.isOpenAccess && (
                        <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-md tracking-wider backdrop-blur-md">
                          OA
                        </span>
                      )}
                      {paper.type && (
                        <span className="text-[10px] font-medium bg-black/40 text-[#a0a0a0] border border-white/10 px-2 py-1 rounded-md capitalize backdrop-blur-md">
                          {paper.type.replace("-", " ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Metadata Content */}
                  <div className="flex flex-col flex-1 p-5 pt-4 gap-3">
                    {/* Title */}
                    <div className="text-[15px] font-bold text-white leading-snug group-hover:text-[#3bc9db] transition-colors line-clamp-2 font-sans">
                      {stripHtml(paper.title)}
                    </div>

                    {/* Authors & Venue & Year */}
                    <div className="flex flex-col gap-1.5">
                      {paper.authors && paper.authors.length > 0 && (
                        <div className="text-[12px] text-[#a0a0a0] font-sans line-clamp-1">
                          {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-[#808080] font-sans font-medium">
                        {paper.journal && (
                          <span className="truncate max-w-[180px]">{paper.journal}</span>
                        )}
                        {paper.journal && paper.publicationYear && <span>·</span>}
                        {paper.publicationYear && (
                          <span>{paper.publicationYear}</span>
                        )}
                      </div>
                    </div>

                    {/* Citation Count Badge */}
                    <div className="flex items-center mt-0.5">
                      <span className="inline-flex items-center text-[10px] font-bold bg-[#3bc9db]/10 text-[#3bc9db] border border-[#3bc9db]/20 px-2 py-1 rounded-md font-sans tracking-wide">
                        {paper.citationCount.toLocaleString()} Citations
                      </span>
                    </div>

                    {/* Abstract Preview */}
                    {paper.abstract && (
                      <div className="text-[12px] text-[#808080] leading-relaxed line-clamp-3 font-sans mt-1">
                        {paper.abstract}
                      </div>
                    )}

                    {/* Spacer to push tags to bottom */}
                    <div className="flex-1" />

                    {/* Research Tags */}
                    {paper.topics && paper.topics.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap pt-4 border-t border-[#2b2d2d]/50">
                        {paper.topics.slice(0, 2).map((t, i) => (
                          <span key={i} className="text-[9px] text-[#a0a0a0] bg-[#1a1b1b] border border-[#2b2d2d] px-2 py-1 rounded-md font-sans uppercase tracking-widest hover:text-white transition-colors">
                            {t.displayName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Panel moved to /paper/[id] */}
    </div>
  );
}
