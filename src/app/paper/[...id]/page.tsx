"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExternalLink, FileText, ArrowLeft, Unlock, Lock, Map, BookOpen, Quote, Layers, Box, Users } from "lucide-react";
import { DitherGradient } from "@/components/ui";

const DOMAIN_IMAGES: Record<string, string> = {
  "Life Sciences": "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80",
  "Health Sciences": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
  "Physical Sciences": "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80",
  "Social Sciences": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
  "Computer Science": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  "Mathematics": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80",
  "Engineering": "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=800&q=80",
  "Economics": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  "Medicine": "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80",
  "Biology": "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=800&q=80",
  "Chemistry": "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80",
  "Physics": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80",
  "default": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80",
};

function getDomainImage(domain?: string, field?: string): string | null {
  if (domain && DOMAIN_IMAGES[domain]) return DOMAIN_IMAGES[domain];
  if (field && DOMAIN_IMAGES[field]) return DOMAIN_IMAGES[field];
  for (const key of Object.keys(DOMAIN_IMAGES)) {
    if (domain?.toLowerCase().includes(key.toLowerCase())) return DOMAIN_IMAGES[key];
    if (field?.toLowerCase().includes(key.toLowerCase())) return DOMAIN_IMAGES[key];
  }
  return null;
}

function getGradientColorsForDomain(domain?: string, field?: string) {
  const categoryStr = `${domain || ''} ${field || ''}`.toLowerCase();
  
  if (
    categoryStr.includes('life') || 
    categoryStr.includes('health') || 
    categoryStr.includes('biology') || 
    categoryStr.includes('medicine') ||
    categoryStr.includes('psychology')
  ) {
    // Ocean to Forest
    return {
      colorFrom: "#0ea5e9", // Sky 500
      colorMid: "#14b8a6",  // Teal 500
      colorTo: "#22c55e",   // Green 500
    };
  }
  
  if (
    categoryStr.includes('social') || 
    categoryStr.includes('economic') || 
    categoryStr.includes('environment') || 
    categoryStr.includes('chemistry')
  ) {
    // Sunset Fire
    return {
      colorFrom: "#f59e0b", // Amber 500
      colorMid: "#f97316",  // Orange 500
      colorTo: "#ef4444",   // Red 500
    };
  }

  // Default
  return {
    colorFrom: "#4f46e5",
    colorMid: "#a855f7",
    colorTo: "#ec4899",
  };
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

// AsciiBackground moved to @/components/ui

export default function PaperPage() {
  const params = useParams();
  const router = useRouter();
  const [paper, setPaper] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [keyFindings, setKeyFindings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam.map(decodeURIComponent).join("/") : (idParam as string);

  useEffect(() => {
    if (!id) return;
    const stored = sessionStorage.getItem(`paper_${id}`);
    if (stored) {
      const p = JSON.parse(stored);
      setPaper(p);
      setIsLoading(false);
      if (p.abstract) generateSummary(p);
    } else {
      fetchPaper(id);
    }
  }, [id]);

  const fetchPaper = async (openAlexId: string) => {
    try {
      const fullId = openAlexId.startsWith("W") ? openAlexId : openAlexId;
      const res = await fetch(`https://api.openalex.org/works/https://openalex.org/${fullId}`);
      const work = await res.json();

      let abstract = "";
      if (work.abstract_inverted_index) {
        const inv = work.abstract_inverted_index;
        const max = Math.max(...(Object.values(inv).flat() as number[]));
        const words = new Array(max + 1).fill("");
        for (const [word, positions] of Object.entries(inv)) {
          for (const pos of positions as number[]) words[pos] = word;
        }
        abstract = words.join(" ").trim();
      }

      const primaryTopic = work.topics?.[0];
      const p = {
        id: fullId,
        title: work.title || "Untitled",
        abstract,
        authors: (work.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean),
        publicationYear: work.publication_year,
        citationCount: work.cited_by_count || 0,
        doi: work.doi?.replace("https://doi.org/", ""),
        journal: work.primary_location?.source?.display_name,
        openAlexId: work.id,
        pdfUrl: work.open_access?.oa_url || work.best_oa_location?.pdf_url,
        type: work.type,
        language: work.language,
        isOpenAccess: work.open_access?.is_oa || false,
        referencesCount: work.referenced_works_count || 0,
        topics: (work.topics || []).map((t: any) => ({
          id: t.id,
          displayName: t.display_name,
          score: t.score,
          subfield: t.subfield ? { displayName: t.subfield.display_name } : undefined,
          field: t.field ? { displayName: t.field.display_name } : undefined,
          domain: t.domain ? { displayName: t.domain.display_name } : undefined,
        })),
        field: primaryTopic?.field?.display_name,
        subfield: primaryTopic?.subfield?.display_name,
        domain: primaryTopic?.domain?.display_name,
      };

      setPaper(p);
      setIsLoading(false);
      if (p.abstract) generateSummary(p);
    } catch (e) {
      setIsLoading(false);
    }
  };

  const generateSummary = async (p: any) => {
    if (!p.abstract) return;
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: p.title, abstract: p.abstract }),
      });
      const data = await res.json();
      setSummary(data.summary || "");
      setKeyFindings(data.keyFindings || []);
    } catch {}
    finally { setIsSummarizing(false); }
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      setScrolled(target.scrollTop > window.innerHeight * 0.5);
    };
    
    const container = document.getElementById("paper-scroll-container");
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [paper]);

  const mono = "'JetBrains Mono', 'Fira Code', monospace";

  if (isLoading) return (
    <div className="h-full w-full flex-1 overflow-y-auto min-h-screen flex items-center justify-center" style={{ background: "#06051d", fontFamily: mono }}>
      <div className="text-[#cad5e2] text-sm animate-pulse">Loading paper...</div>
    </div>
  );

  if (!paper) return (
    <div className="h-full w-full flex-1 overflow-y-auto min-h-screen flex items-center justify-center" style={{ background: "#06051d", fontFamily: mono }}>
      <div className="text-[#cad5e2] text-sm">Paper not found.</div>
    </div>
  );

  const domainImg = getDomainImage(paper.domain, paper.field);
  const gradientColors = getGradientColorsForDomain(paper.domain, paper.field);

  return (
    <div id="paper-scroll-container" className="flex-1 w-full h-full overflow-y-auto bg-[#06051d] text-[#cad5e2]" style={{ fontFamily: mono }}>
      
      {/* Sticky Nav */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-300 ${scrolled ? 'bg-[#06051d]/90 backdrop-blur-md border-b border-[#1d293d] opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'}`}>
        <button onClick={() => window.location.href = '/'} className="flex items-center gap-2 text-[12px] text-[#ff6b6b] hover:opacity-80 transition-opacity">
          <ArrowLeft size={14} /> Back to Search
        </button>
        <div className="flex gap-4">
          {paper.isOpenAccess && paper.pdfUrl && (
            <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-[#cad5e2] hover:text-white transition-colors">
              <FileText size={14} /> View PDF
            </a>
          )}
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[12px] text-[#f59f00] hover:opacity-80 transition-opacity">
              <ExternalLink size={14} /> View Source
            </a>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full h-[100vh] flex flex-col items-center justify-center overflow-hidden shrink-0">
        <DitherGradient 
          {...gradientColors}
          className="absolute inset-0" 
        />
        
        <div className="relative z-10 flex flex-col items-center w-full px-12 text-center">
          {/* Domain Badge */}
          <div className="px-3 py-1 mb-8 text-xs text-white/80 border border-white/20 rounded-full bg-white/5 backdrop-blur-sm">
            {paper.domain || paper.field || "Research"}
          </div>
          
          {/* Main Title */}
          <h1 className="text-white text-[48px] md:text-[60px] lg:text-[68px] font-bold tracking-tight leading-[1.1] max-w-[900px] text-balance" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
            {stripHtml(paper.title)}
          </h1>
          
          {/* Subtitle / Authors */}
          <p className="mt-6 text-[16px] md:text-[18px] text-white/80 max-w-[700px] font-light leading-relaxed" style={{ fontFamily: "'Inter', 'Roboto', sans-serif" }}>
            {paper.authors ? (Array.isArray(paper.authors) ? paper.authors.join(", ") : paper.authors) : (paper.abstract ? paper.abstract.substring(0, 150) + "..." : "Explore this research paper's findings, methodology, and citations.")}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center items-center gap-4 mt-12">
            {paper.isOpenAccess && paper.pdfUrl && (
              <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer" 
                 className="flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[14px] font-medium border border-white/30 text-white bg-white/10 backdrop-blur-md hover:bg-white hover:text-black transition-all duration-300 ease-out">
                <FileText size={16} /> Read PDF
              </a>
            )}
            {paper.doi && (
              <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" 
                 className="flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[14px] font-medium border border-white/30 text-white bg-white/10 backdrop-blur-md hover:bg-white hover:text-black transition-all duration-300 ease-out">
                <ExternalLink size={16} /> View DOI
              </a>
            )}
            <button 
              onClick={() => {
                document.getElementById('abstract-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 px-6 py-2.5 rounded-full text-[14px] font-medium border border-white/30 text-white bg-white/10 backdrop-blur-md hover:bg-white hover:text-black transition-all duration-300 ease-out">
              <BookOpen size={16} /> Explore
            </button>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="max-w-[860px] mx-auto px-6 py-24 flex flex-col gap-24 relative z-10">

        {/* Nagi Tools Section */}
        <section>
          <div className="mb-6 flex items-center gap-3">
            <span className="text-[#3bc9db] text-xl">海</span>
            <h2 className="text-[20px] text-white tracking-wider font-semibold">Nagi Tools</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Generate Research Map */}
            <button className="group flex items-center justify-center gap-3 py-4 px-6 rounded-full border border-[#0c8599]/40 bg-[#0b2b2f]/40 hover:bg-[#0b2b2f]/80 transition-all text-[#22b8cf] text-[13px] tracking-widest uppercase">
              <Map size={16} className="opacity-80 group-hover:scale-110 transition-transform" />
              Generate Research Map
            </button>
            
            {/* Literature Review */}
            <button className="group flex items-center justify-center gap-3 py-4 px-6 rounded-full border border-[#a61e4d]/40 bg-[#340c24]/40 hover:bg-[#340c24]/80 transition-all text-[#fcc2d7] text-[13px] tracking-widest uppercase">
              <BookOpen size={16} className="opacity-80 group-hover:scale-110 transition-transform" />
              Literature Review
            </button>
            
            {/* Find Citations */}
            <button className="group flex items-center justify-center gap-3 py-4 px-6 rounded-full border border-[#08a045]/40 bg-[#0a291a]/40 hover:bg-[#0a291a]/80 transition-all text-[#20c997] text-[13px] tracking-widest uppercase">
              <Quote size={16} className="opacity-80 group-hover:scale-110 transition-transform" />
              Find Citations
            </button>
            
            {/* Compare Papers */}
            <button className="group flex items-center justify-center gap-3 py-4 px-6 rounded-full border border-[#e8590c]/30 bg-[#2b1008]/40 hover:bg-[#2b1008]/80 transition-all text-[#ffd8a8] text-[13px] tracking-widest uppercase">
              <Layers size={16} className="opacity-80 group-hover:scale-110 transition-transform" />
              Compare Papers
            </button>
          </div>
        </section>

        {/* Abstract Section */}
        {paper.abstract && (
          <section id="abstract-section" className="scroll-mt-32">
            <div className="mb-8 flex items-center gap-3">
              <div className="w-5 h-5 rounded flex items-center justify-center bg-[#2b0a3d] text-[#e599f7] border border-[#501e6e]">
                <BookOpen size={12} />
              </div>
              <h2 className="text-[20px] text-white tracking-wide">Abstract</h2>
            </div>
            <div className="space-y-6 text-[14px] leading-relaxed text-[#cad5e2]">
              <p>{paper.abstract}</p>
            </div>
          </section>
        )}

        {/* AI Summary Section */}
        <section>
          <div className="mb-8 flex items-center gap-3">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-[#061434] text-[#3bc9db] border border-[#1d293d]">
              <Box size={12} />
            </div>
            <h2 className="text-[20px] text-white tracking-wide">AI Summary {isSummarizing && <span className="animate-pulse opacity-50 ml-2">...</span>}</h2>
          </div>
          <div className="space-y-6 text-[14px] leading-relaxed text-[#cad5e2]">
            {isSummarizing ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-3 rounded animate-pulse" style={{ background: "#1d293d", width: i === 1 ? "75%" : i === 2 ? "50%" : "100%" }} />
                ))}
              </div>
            ) : summary ? (
              <p>{summary}</p>
            ) : (
              <p className="opacity-50">Summary not available.</p>
            )}

            {keyFindings.length > 0 && (
              <div className="mt-8">
                <h3 className="text-[16px] text-white mb-4">Key Findings</h3>
                <ul className="flex flex-col gap-4">
                  {keyFindings.map((f, i) => (
                    <li key={i} className="flex gap-4">
                      <span className="text-[14px] font-normal shrink-0 mt-0.5 text-[#3bc9db]">{String(i + 1).padStart(2, "0")}.</span>
                      <span className="text-[14px] leading-relaxed text-[#cad5e2]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Metadata & Authors Section */}
        <section>
          <div className="mb-8 flex items-center gap-3">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-[#002b1f] text-[#00bc7d] border border-[#004f3b]">
              <Users size={12} />
            </div>
            <h2 className="text-[20px] text-white tracking-wide">Authors & Metadata</h2>
          </div>
          
          <div className="space-y-12 text-[14px] leading-relaxed text-[#cad5e2]">
            {/* Authors */}
            <div>
              <div className="flex flex-wrap gap-2">
                {paper.authors.map((a: string, i: number) => (
                  <span key={i} className="text-[12px] px-3 py-1.5 rounded-lg border bg-[#0f1c36] border-[#1d293d] text-[#cad5e2]">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[
                { label: "Cited By", value: paper.citationCount.toLocaleString() },
                { label: "References", value: paper.referencesCount?.toLocaleString() || "—" },
                { label: "Published", value: paper.publicationYear?.toString() || "—" },
                { label: "Language", value: paper.language?.toUpperCase() || "—" },
              ].map(stat => (
                <div key={stat.label} className="rounded-lg px-4 py-4 border border-[#1d293d]" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="text-[22px] font-normal text-white mb-1">{stat.value}</div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-[#314062]">{stat.label}</div>
                </div>
              ))}
            </div>
            
            {/* Metadata Table */}
            <div className="rounded-lg overflow-hidden border border-[#1d293d]">
              {[
                { label: "Source", value: paper.journal },
                { label: "Field", value: paper.field },
                { label: "Subfield", value: paper.subfield },
                { label: "Domain", value: paper.domain },
                { label: "DOI", value: paper.doi, link: paper.doi ? `https://doi.org/${paper.doi}` : undefined },
              ].filter(r => r.value).map((row, i, arr) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3 border-b border-[#1d293d] last:border-0 bg-[#0f1c36] even:bg-[#06051d]">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#314062]">{row.label}</span>
                  {row.link ? (
                    <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-[12px] flex items-center gap-1 hover:underline text-[#3bc9db]">
                      <span className="truncate max-w-[400px]">{row.value}</span>
                      <ExternalLink size={9} />
                    </a>
                  ) : (
                    <span className="text-[12px] text-[#cad5e2]">{row.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
