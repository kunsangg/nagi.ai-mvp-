"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Sidebar, Footer } from "@/components/layout";
import { PaperCard } from "@/components/ui/PaperCard";
import { Paper } from "@/types/paper";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<Paper[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Perform search
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim(), filters: {} }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to search");
      }
      setResults(data.papers || []);
      setTotalResults(data.totalResults || 0);
    } catch (err: any) {
      setError(err.message);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [q]);

  const handlePaperClick = (paper: Paper) => {
    sessionStorage.setItem(`paper_${paper.id}`, JSON.stringify(paper));
    window.location.href = `/paper/${paper.id}`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query !== q && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* Top Search Bar */}
      <div className="w-full sticky top-0 z-50 pt-8 pb-4 px-8 bg-[#06090f]/80 backdrop-blur-xl">
        <form onSubmit={handleSearchSubmit} className="max-w-[1200px] mx-auto flex items-center gap-3 bg-[#111213]/80 backdrop-blur-2xl border border-[#1f1f1f] rounded-2xl px-5 py-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
          <Search size={16} className="text-[#64748b] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers, authors, domains..."
            className="w-full bg-transparent text-white text-[14px] focus:outline-none transition-all font-sans"
          />
          {isLoading && <Loader2 size={14} className="text-[#3bc9db] animate-spin" />}
        </form>
      </div>

      <div className="w-full px-8 mt-6 pb-24 min-h-screen">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#1f1f1f] pb-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-[32px] text-white font-bold tracking-tight font-sans">
                {isLoading ? "Searching..." : `${totalResults.toLocaleString()} Research Papers`}
              </span>
              <span className="text-[14px] text-[#64748b] font-sans">
                Results for: <span className="text-white font-medium">{q || "None"}</span>
              </span>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="text-red-400 py-10 bg-red-400/10 rounded-xl px-6 border border-red-400/20 text-center">
              {error}
            </div>
          )}

          {/* Loading state (Skeletons) */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col bg-[#111213] border border-[#1f1f1f] rounded-xl overflow-hidden h-full">
                  <div className="w-full aspect-video bg-[#1a1b1b] animate-pulse" />
                  <div className="p-4 pt-4 flex flex-col gap-3">
                    <div className="h-4 bg-[#1a1b1b] rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-[#1a1b1b] rounded w-full animate-pulse" />
                    <div className="h-3 bg-[#1a1b1b] rounded w-1/2 animate-pulse mt-1" />
                    <div className="h-6 bg-[#1a1b1b] rounded w-24 animate-pulse mt-2" />
                    <div className="flex-1" />
                    <div className="flex gap-2 pt-3 border-t border-[#1f1f1f]">
                      <div className="h-5 bg-[#1a1b1b] rounded w-16 animate-pulse" />
                      <div className="h-5 bg-[#1a1b1b] rounded w-20 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Results Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((paper, index) => (
                <PaperCard key={paper.id} paper={paper} index={index} onClick={handlePaperClick} />
              ))}
            </div>
          )}

          {!isLoading && results.length === 0 && !error && (
            <div className="text-center py-20 text-[#64748b]">
              No papers found for this domain.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="w-full h-full flex overflow-hidden bg-transparent relative">
      <div className="z-20 relative">
        <Sidebar />
      </div>
      <Suspense fallback={<div className="flex-1 overflow-y-auto flex items-center justify-center"><Loader2 className="animate-spin text-[#3bc9db]" /></div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
