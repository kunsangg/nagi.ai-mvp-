"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, FileText, Map,
  BookOpen, Quote, Layers, Unlock, Lock
} from "lucide-react";
import { DitherGradient } from "@/components/ui";

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

const SF = "var(--font-system)";
const MONO = "var(--font-mono)";

export default function PaperPage() {
  const params = useParams();
  const router = useRouter();
  const [paper, setPaper] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [keyFindings, setKeyFindings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const idParam = params?.id;
  const id = Array.isArray(idParam)
    ? idParam.map(decodeURIComponent).join("/")
    : (idParam as string);

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
      const res = await fetch(
        `https://api.openalex.org/works/https://openalex.org/${openAlexId}`
      );
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
        id: openAlexId,
        title: work.title || "Untitled",
        abstract,
        authors: (work.authorships || [])
          .map((a: any) => a.author?.display_name)
          .filter(Boolean),
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
    } catch {
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

  if (isLoading) return (
    <div className="flex-1 w-full h-full flex items-center justify-center"
      style={{ background: "#050810", fontFamily: SF }}>
      <div style={{ color: "#3bc9db" }} className="text-[14px] animate-pulse">
        Loading paper…
      </div>
    </div>
  );

  if (!paper) return (
    <div className="flex-1 w-full h-full flex items-center justify-center"
      style={{ background: "#050810", fontFamily: SF }}>
      <div style={{ color: "#64748b" }} className="text-[14px]">Paper not found.</div>
    </div>
  );

  return (
    <div className="flex-1 w-full h-full overflow-y-auto" style={{ background: "#050810", fontFamily: SF }}>

      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-8 py-3"
        style={{ background: "rgba(5,8,16,0.85)", borderBottom: "1px solid #1a2535", backdropFilter: "blur(20px)" }}>
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: "#64748b" }}>
          <ArrowLeft size={15} /> Back to Search
        </button>
        <div className="flex items-center gap-3">
          {paper.isOpenAccess && paper.pdfUrl && (
            <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all hover:opacity-80"
              style={{ background: "rgba(59,201,219,0.08)", border: "1px solid rgba(59,201,219,0.2)", color: "#3bc9db" }}>
              <FileText size={13} /> View PDF
            </a>
          )}
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all hover:opacity-80"
              style={{ background: "#0d1520", border: "1px solid #1a2535", color: "#64748b" }}>
              <ExternalLink size={13} /> View Source
            </a>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative w-full h-[100vh] flex flex-col items-center justify-center overflow-hidden shrink-0">
        <DitherGradient 
          {...getGradientColorsForDomain(paper.domain, paper.field)}
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



      {/* ── Main content ── */}
      <main id="abstract-section" className="max-w-[860px] mx-auto px-8 py-12 flex flex-col gap-14">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Citations",   value: paper.citationCount?.toLocaleString() || "0" },
            { label: "References",  value: paper.referencesCount?.toLocaleString() || "—" },
            { label: "Published",   value: paper.publicationYear?.toString() || "—" },
            { label: "Language",    value: paper.language?.toUpperCase() || "—" },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-4"
              style={{ background: "#0d1520", border: "1px solid #1a2535" }}>
              <div className="text-[22px] font-bold tracking-tight mb-1"
                style={{ color: "#e2e8f0", letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#334155", fontFamily: MONO }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Nagi Tools */}
        <section>
          <SectionHeader emoji="海" title="Nagi Tools" color="#3bc9db" />
          <div className="grid grid-cols-2 gap-3 mt-5">
            {[
              { label: "Generate Research Map", icon: <Map size={14} />,      action: () => { window.location.href = `/map/${paper.id}`; }, color: "#3bc9db",  bg: "rgba(59,201,219,0.06)",  border: "rgba(59,201,219,0.2)"  },
              { label: "Literature Review",      icon: <BookOpen size={14} />, action: () => {},                                             color: "#f472b6",  bg: "rgba(244,114,182,0.06)", border: "rgba(244,114,182,0.2)" },
              { label: "Find Citations",         icon: <Quote size={14} />,    action: () => {},                                             color: "#34d399",  bg: "rgba(52,211,153,0.06)",  border: "rgba(52,211,153,0.2)"  },
              { label: "Compare Papers",         icon: <Layers size={14} />,   action: () => {},                                             color: "#fb923c",  bg: "rgba(251,146,60,0.06)",  border: "rgba(251,146,60,0.2)"  },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action}
                className="flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl text-[12px] font-semibold uppercase tracking-widest transition-all hover:opacity-80"
                style={{ background: btn.bg, border: `1px solid ${btn.border}`, color: btn.color, fontFamily: MONO }}>
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>
        </section>

        {/* Abstract */}
        {paper.abstract && (
          <section>
            <SectionHeader emoji="◎" title="Abstract" color="#8b5cf6" />
            <p className="mt-5 text-[15px] leading-[1.8]" style={{ color: "#94a3b8" }}>
              {paper.abstract}
            </p>
          </section>
        )}

        {/* AI Summary */}
        <section>
          <SectionHeader emoji="◈" title={isSummarizing ? "AI Summary  …" : "AI Summary"} color="#3bc9db" />
          <div className="mt-5">
            {isSummarizing ? (
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-3 rounded-lg animate-pulse"
                    style={{ background: "#0d1520", width: i === 1 ? "75%" : i === 2 ? "55%" : "100%" }} />
                ))}
              </div>
            ) : summary ? (
              <p className="text-[15px] leading-[1.8]" style={{ color: "#94a3b8" }}>{summary}</p>
            ) : (
              <p className="text-[14px]" style={{ color: "#334155" }}>
                AI Summarization is currently disabled. Please add a <code className="px-1 py-0.5 rounded text-[#3bc9db]" style={{ background: "#0d1520", fontFamily: MONO }}>GROQ_API_KEY</code> to your environment variables to enable this feature.
              </p>
            )}
          </div>

          {keyFindings.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[13px] font-semibold uppercase tracking-widest mb-5"
                style={{ color: "#334155", fontFamily: MONO }}>
                Key Findings
              </h3>
              <ul className="flex flex-col gap-4">
                {keyFindings.map((f, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="text-[13px] font-bold shrink-0 tabular-nums"
                      style={{ color: "#3bc9db", fontFamily: MONO }}>
                      {String(i + 1).padStart(2, "0")}.
                    </span>
                    <span className="text-[15px] leading-[1.7]" style={{ color: "#94a3b8" }}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Authors & Metadata */}
        <section>
          <SectionHeader emoji="◉" title="Authors & Metadata" color="#10b981" />

          {/* Authors as chips */}
          {paper.authors?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-5 mb-8">
              {paper.authors.map((a: string, i: number) => (
                <span key={i}
                  className="text-[13px] font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: "#0d1520", border: "1px solid #1a2535", color: "#94a3b8" }}>
                  {a}
                </span>
              ))}
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Cited By",   value: paper.citationCount?.toLocaleString() || "0" },
              { label: "References", value: paper.referencesCount?.toLocaleString() || "—" },
              { label: "Published",  value: paper.publicationYear?.toString() || "—" },
              { label: "Language",   value: paper.language?.toUpperCase() || "—" },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-4"
                style={{ background: "#0d1520", border: "1px solid #1a2535" }}>
                <div className="text-[20px] font-bold mb-1 tracking-tight"
                  style={{ color: "#e2e8f0", letterSpacing: "-0.02em" }}>
                  {s.value}
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "#334155", fontFamily: MONO }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Metadata table */}
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1a2535" }}>
            {[
              { label: "SOURCE",   value: paper.journal  },
              { label: "FIELD",    value: paper.field    },
              { label: "SUBFIELD", value: paper.subfield },
              { label: "DOMAIN",   value: paper.domain   },
              { label: "DOI",      value: paper.doi, link: paper.doi ? `https://doi.org/${paper.doi}` : undefined },
            ].filter(r => r.value).map((row, i, arr) => (
              <div key={row.label}
                className="flex items-center justify-between px-5 py-3.5"
                style={{
                  borderBottom: i < arr.length - 1 ? "1px solid #1a2535" : "none",
                  background: i % 2 === 0 ? "#0d1520" : "#050810",
                }}>
                <span className="text-[10px] font-semibold tracking-widest shrink-0"
                  style={{ color: "#334155", fontFamily: MONO }}>{row.label}</span>
                {row.link ? (
                  <a href={row.link} target="_blank" rel="noopener noreferrer"
                    className="text-[13px] font-medium flex items-center gap-1.5 hover:underline truncate max-w-[460px]"
                    style={{ color: "#3bc9db" }}>
                    {row.value} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="text-[13px] font-medium truncate max-w-[460px]"
                    style={{ color: "#94a3b8" }}>{row.value}</span>
                )}
              </div>
            ))}
          </div>

          {/* Topics */}
          {paper.topics?.length > 0 && (
            <div className="mt-8">
              <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-4"
                style={{ color: "#334155", fontFamily: MONO }}>
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {paper.topics.map((t: any, i: number) => (
                  <span key={i}
                    className="flex items-center gap-2 text-[12px] font-medium px-3 py-1.5 rounded-lg"
                    style={{ background: "#0d1520", border: "1px solid #1a2535", color: "#64748b" }}>
                    {t.displayName}
                    <span className="text-[10px] font-bold" style={{ color: "#3bc9db", fontFamily: MONO }}>
                      {Math.round(t.score * 100)}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

function SectionHeader({ emoji, title, color }: { emoji: string; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[16px]" style={{ color }}>{emoji}</span>
      <h2 className="text-[18px] font-semibold tracking-tight" style={{ color: "#e2e8f0", letterSpacing: "-0.01em" }}>
        {title}
      </h2>
    </div>
  );
}
