"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ExternalLink, FileText, ArrowLeft, Unlock, Lock, Map, BookOpen, Quote, Layers } from "lucide-react";

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

function getDomainImage(domain?: string, field?: string): string {
  if (domain && DOMAIN_IMAGES[domain]) return DOMAIN_IMAGES[domain];
  if (field && DOMAIN_IMAGES[field]) return DOMAIN_IMAGES[field];
  for (const key of Object.keys(DOMAIN_IMAGES)) {
    if (domain?.toLowerCase().includes(key.toLowerCase())) return DOMAIN_IMAGES[key];
    if (field?.toLowerCase().includes(key.toLowerCase())) return DOMAIN_IMAGES[key];
  }
  return DOMAIN_IMAGES["default"];
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

// ASCII animation component
function AsciiBackground() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [chars, setChars] = useState<{ char: string; x: number; y: number; opacity: number }[]>([]);

  useEffect(() => {
    const asciiChars = "アイウエオカキクケコサシスセソタチツテトナニヌネノ01アイ/imagine research paper abstract methodology findings citation".split("");
    const newChars = Array.from({ length: 200 }, (_, i) => ({
      char: asciiChars[Math.floor(Math.random() * asciiChars.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.15 + 0.03,
    }));
    setChars(newChars);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {chars.map((c, i) => (
        <span
          key={i}
          className="absolute text-[11px]"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            opacity: c.opacity,
            color: "#cad5e2",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {c.char}
        </span>
      ))}
    </div>
  );
}

export default function PaperPage() {
  const params = useParams();
  const router = useRouter();
  const [paper, setPaper] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [keyFindings, setKeyFindings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const id = params?.id as string;

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

  const mono = "'JetBrains Mono', 'Fira Code', monospace";

  if (isLoading) return (
    <div className="h-full w-full flex-1 overflow-y-auto min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(180deg, #06051d 0%, #061434 100%)", fontFamily: mono }}>
      <div className="text-[#cad5e2] text-sm animate-pulse">Loading paper...</div>
    </div>
  );

  if (!paper) return (
    <div className="h-full w-full flex-1 overflow-y-auto min-h-screen flex items-center justify-center" style={{ background: "#06051d", fontFamily: mono }}>
      <div className="text-[#cad5e2] text-sm">Paper not found.</div>
    </div>
  );

  const domainImg = getDomainImage(paper.domain, paper.field);

  return (
    <div className="h-full w-full flex-1 overflow-y-auto min-h-screen relative" style={{ background: "linear-gradient(180deg, #06051d 0%, #061434 100%)", fontFamily: mono }}>
      <AsciiBackground />

      {/* Nav */}
      <nav className="sticky top-0 z-40 flex items-center justify-between px-12 py-3" style={{ background: "#1d293d" }}>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#63b3ed] text-[14px] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={14} /> Back to Search
        </button>
        <div className="flex items-center gap-3">
          {paper.isOpenAccess && paper.pdfUrl && (
            <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2 rounded-full text-[13px] border transition-all hover:opacity-80"
              style={{ background: "rgba(115,62,10,0.2)", borderColor: "rgba(255,255,255,0.1)", color: "#fefce8" }}>
              <FileText size={13} /> Open PDF
            </a>
          )}
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2 rounded-full text-[13px] border transition-all hover:opacity-80"
              style={{ background: "rgba(0,79,59,0.2)", borderColor: "rgba(255,255,255,0.1)", color: "#00bc7d" }}>
              <ExternalLink size={13} /> View Paper
            </a>
          )}
        </div>
      </nav>

      {/* Hero image */}
      <div className="relative w-full h-[320px] overflow-hidden">
        <img src={domainImg} alt={paper.domain || ""} className="w-full h-full object-cover" style={{ opacity: 0.25, filter: "saturate(0.3) hue-rotate(200deg)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, #06051d 100%)" }} />
        <div className="absolute bottom-10 left-0 right-0 px-12 max-w-[860px] mx-auto">
          {(paper.domain || paper.field) && (
            <div className="text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: "#3bc9db" }}>
              ⬡ {paper.domain || paper.field}
            </div>
          )}
          <h1 className="text-[28px] font-normal text-white leading-snug" style={{ fontFamily: mono, maxWidth: "760px" }}>
            {stripHtml(paper.title)}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[860px] mx-auto px-12 pb-24 flex flex-col" style={{ gap: "64px" }}>

        {/* Badges + meta row */}
        <div className="flex items-center gap-3 flex-wrap -mt-4">
          {paper.isOpenAccess ? (
            <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] border"
              style={{ background: "rgba(0,79,59,0.2)", borderColor: "rgba(255,255,255,0.1)", color: "#00bc7d" }}>
              <Unlock size={10} /> Open Access
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] border"
              style={{ background: "rgba(139,8,54,0.2)", borderColor: "rgba(255,255,255,0.1)", color: "#fff1f2" }}>
              <Lock size={10} /> Closed Access
            </span>
          )}
          {paper.type && (
            <span className="px-4 py-1.5 rounded-full text-[12px] border capitalize"
              style={{ background: "rgba(115,62,10,0.2)", borderColor: "rgba(255,255,255,0.1)", color: "#fefce8" }}>
              {paper.type}
            </span>
          )}
          {paper.publicationYear && (
            <span className="text-[12px]" style={{ color: "#314062" }}>{paper.publicationYear}</span>
          )}
          {paper.journal && (
            <span className="text-[12px]" style={{ color: "#314062" }}>· {paper.journal}</span>
          )}
        </div>

        {/* Authors */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: "#f0b100", fontSize: 14 }}>◈</span>
            <h2 className="text-[20px] font-normal text-white" style={{ fontFamily: mono }}>Authors</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {paper.authors.map((a: string, i: number) => (
              <span key={i} className="text-[12px] px-3 py-1.5 rounded-lg border" style={{ background: "#0f1c36", borderColor: "#1d293d", color: "#cad5e2" }}>
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: "#f0b100", fontSize: 14 }}>◈</span>
            <h2 className="text-[20px] font-normal text-white" style={{ fontFamily: mono }}>Metrics</h2>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Cited By", value: paper.citationCount.toLocaleString() },
              { label: "References", value: paper.referencesCount?.toLocaleString() || "—" },
              { label: "Published", value: paper.publicationYear?.toString() || "—" },
              { label: "Language", value: paper.language?.toUpperCase() || "—" },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg px-4 py-4" style={{ background: "#1d293d" }}>
                <div className="text-[22px] font-normal text-white mb-1" style={{ fontFamily: mono }}>{stat.value}</div>
                <div className="text-[9px] uppercase tracking-[0.2em]" style={{ color: "#314062" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Nagi Features */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: "#3bc9db", fontSize: 14 }}>海</span>
            <h2 className="text-[20px] font-normal text-white" style={{ fontFamily: mono }}>Nagi Tools</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Generate Research Map", icon: <Map size={14} />, bg: "rgba(0,60,71,0.3)", border: "rgba(59,201,219,0.2)", color: "#3bc9db" },
              { label: "Literature Review", icon: <BookOpen size={14} />, bg: "rgba(139,8,54,0.2)", border: "rgba(255,255,255,0.1)", color: "#fff1f2" },
              { label: "Find Citations", icon: <Quote size={14} />, bg: "rgba(0,79,59,0.2)", border: "rgba(255,255,255,0.1)", color: "#00bc7d" },
              { label: "Compare Papers", icon: <Layers size={14} />, bg: "rgba(115,62,10,0.2)", border: "rgba(255,255,255,0.1)", color: "#fefce8" },
            ].map(btn => (
              <button key={btn.label}
                className="flex items-center justify-center gap-2 py-3 rounded-full text-[12px] uppercase tracking-[0.15em] border transition-all hover:opacity-80"
                style={{ background: btn.bg, borderColor: btn.border, color: btn.color, fontFamily: mono, boxShadow: "rgba(0,0,0,0.1) 0px 4px 6px -1px" }}>
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metadata */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: "#f0b100", fontSize: 14 }}>◈</span>
            <h2 className="text-[20px] font-normal text-white" style={{ fontFamily: mono }}>Metadata</h2>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid #1d293d" }}>
            {[
              { label: "Source", value: paper.journal },
              { label: "Field", value: paper.field },
              { label: "Subfield", value: paper.subfield },
              { label: "Domain", value: paper.domain },
              { label: "DOI", value: paper.doi, link: paper.doi ? `https://doi.org/${paper.doi}` : undefined },
            ].filter(r => r.value).map((row, i, arr) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: i < arr.length - 1 ? "1px solid #1d293d" : "none", background: i % 2 === 0 ? "#0f1c36" : "#06051d" }}>
                <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#314062", fontFamily: mono }}>{row.label}</span>
                {row.link ? (
                  <a href={row.link} target="_blank" rel="noopener noreferrer"
                    className="text-[12px] flex items-center gap-1 hover:underline" style={{ color: "#3bc9db", fontFamily: mono }}>
                    <span className="truncate max-w-[400px]">{row.value}</span>
                    <ExternalLink size={9} />
                  </a>
                ) : (
                  <span className="text-[12px]" style={{ color: "#cad5e2", fontFamily: mono }}>{row.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Topics */}
        {paper.topics && paper.topics.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: "#f0b100", fontSize: 14 }}>◈</span>
              <h2 className="text-[20px] font-normal text-white" style={{ fontFamily: mono }}>Topics</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {paper.topics.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg border"
                  style={{ background: "#0f1c36", borderColor: "#1d293d" }}>
                  <span className="text-[12px]" style={{ color: "#cad5e2", fontFamily: mono }}>{t.displayName}</span>
                  <span className="text-[11px] font-normal" style={{ color: "#3bc9db", fontFamily: mono }}>{Math.round(t.score * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span style={{ color: "#3bc9db", fontSize: 14 }}>海</span>
            <h2 className="text-[20px] font-normal text-white" style={{ fontFamily: mono }}>
              Plain English Summary
              {isSummarizing && <span className="text-[12px] ml-3 animate-pulse" style={{ color: "#314062" }}>generating...</span>}
            </h2>
          </div>
          {isSummarizing ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-3 rounded animate-pulse" style={{ background: "#1d293d", width: i === 1 ? "75%" : i === 2 ? "50%" : "100%" }} />
              ))}
            </div>
          ) : summary ? (
            <p className="text-[15px] leading-relaxed" style={{ color: "#cad5e2", fontFamily: mono, lineHeight: 1.9 }}>{summary}</p>
          ) : !paper.abstract ? (
            <p className="text-[13px]" style={{ color: "#314062", fontFamily: mono }}>No abstract available for this paper.</p>
          ) : null}
        </div>

        {/* Key Findings */}
        {keyFindings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: "#3bc9db", fontSize: 14 }}>海</span>
              <h2 className="text-[20px] font-normal text-white" style={{ fontFamily: mono }}>Key Findings</h2>
            </div>
            <ul className="flex flex-col gap-5">
              {keyFindings.map((f, i) => (
                <li key={i} className="flex gap-4">
                  <span className="text-[14px] font-normal shrink-0 mt-0.5" style={{ color: "#3bc9db", fontFamily: mono }}>{String(i + 1).padStart(2, "0")}.</span>
                  <span className="text-[14px] leading-relaxed" style={{ color: "#cad5e2", fontFamily: mono, lineHeight: 1.9 }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Abstract */}
        {paper.abstract && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span style={{ color: "#f0b100", fontSize: 14 }}>◈</span>
              <h2 className="text-[20px] font-normal text-white" style={{ fontFamily: mono }}>Abstract</h2>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "#314062", fontFamily: mono, lineHeight: 1.9 }}>{paper.abstract}</p>
          </div>
        )}

      </div>
    </div>
  );
}
