"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Loader2, X, Sparkles, Download, Copy, Check,
  ChevronDown, SearchX, FileText, AlertTriangle, Compass
} from "lucide-react";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, Menlo, monospace";

interface Paper {
  id: string;
  title: string;
  authors?: string[];
  publicationYear?: number;
  citationCount?: number;
  journal?: string;
  abstract?: string;
}

interface GapItem {
  title: string;
  description: string;
}

interface GapsData {
  summary: string;
  limitations: GapItem[];
  unexploredAreas: GapItem[];
  futureQuestions: string[];
}

function GapCard({ gap, color, icon }: { gap: GapItem, color: string, icon: React.ReactNode }) {
  return (
    <div style={{
      background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10,
      padding: 20, display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: `rgba(${color}, 0.1)`,
          display: "flex", alignItems: "center", justifyContent: "center", color: `rgb(${color})`
        }}>
          {icon}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{gap.title}</div>
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, paddingLeft: 42 }}>
        {gap.description}
      </div>
    </div>
  );
}

function GapsView({ data, paper, isGenerating }: {
  data: GapsData | null;
  paper: Paper | null;
  isGenerating: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function buildMarkdown(): string {
    if (!data || !paper) return "";
    let md = `# Research Gaps: ${paper.title}\n\n`;
    md += `## Summary\n${data.summary}\n\n`;
    
    if (data.limitations.length > 0) {
      md += `## Known Limitations\n`;
      data.limitations.forEach(l => md += `### ${l.title}\n${l.description}\n\n`);
    }

    if (data.unexploredAreas.length > 0) {
      md += `## Unexplored Areas\n`;
      data.unexploredAreas.forEach(u => md += `### ${u.title}\n${u.description}\n\n`);
    }

    if (data.futureQuestions.length > 0) {
      md += `## Future Research Questions\n`;
      data.futureQuestions.forEach(q => md += `- ${q}\n`);
      md += "\n";
    }

    return md;
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(buildMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowExport(false);
  }

  function downloadMarkdown() {
    const blob = new Blob([buildMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "research-gaps.md"; a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  }

  if (isGenerating) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: "40px", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Loader2 size={18} color="#60a5fa" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 14, color: "#60a5fa", fontWeight: 500 }}>Analyzing paper for research gaps…</span>
        </div>
        <div style={{ width: "100%", maxWidth: 600, display: "flex", flexDirection: "column", gap: 16 }}>
          {[100, 80, 90, 65].map((w, i) => (
            <div key={i} style={{
              height: 14, borderRadius: 6,
              background: "#0a0a0a", width: `${w}%`, animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !paper) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, padding: 40, textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <SearchX size={28} color="#60a5fa" style={{ opacity: 0.7 }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>
            Find Research Gaps
          </div>
          <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
            Select a paper on the left to analyze its limitations<br />
            and discover unanswered questions.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Doc header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 40px", borderBottom: "1px solid #1f1f1f", flexShrink: 0,
        background: "rgba(10,15,26,0.8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={14} color="#60a5fa" />
          <span style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600, fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Gap Analysis
          </span>
        </div>
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setShowExport(s => !s)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)",
              color: "#60a5fa", cursor: "pointer",
            }}>
            {copied ? <Check size={13} /> : <Download size={13} />}
            {copied ? "Copied!" : "Export"}
            <ChevronDown size={11} />
          </button>
          {showExport && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
              background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10,
              padding: 4, minWidth: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
              {[
                { label: "Copy as Markdown", icon: <Copy size={12} />, fn: copyMarkdown },
                { label: "Download .md", icon: <Download size={12} />, fn: downloadMarkdown },
              ].map((item, i) => (
                <button key={i} onClick={item.fn} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", borderRadius: 7, background: "none", border: "none",
                  color: "#94a3b8", fontSize: 12, cursor: "pointer", textAlign: "left",
                  transition: "background 0.1s, color 0.1s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#0a0a0a"; (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "40px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", marginBottom: 16, lineHeight: 1.3 }}>
            {paper.title}
          </h1>
          
          {/* Summary */}
          <div style={{ marginBottom: 40, padding: 20, background: "#0a0a0a", borderRadius: 12, border: "1px solid #1f1f1f" }}>
            <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>
              {data.summary}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40 }}>
            {/* Limitations */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <AlertTriangle size={16} color="#ef4444" />
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>Known Limitations</h2>
              </div>
              {data.limitations.length > 0 ? data.limitations.map((lim, i) => (
                <GapCard key={i} gap={lim} color="239, 68, 68" icon={<AlertTriangle size={16} />} />
              )) : (
                <div style={{ fontSize: 13, color: "#64748b" }}>No specific limitations identified.</div>
              )}
            </div>

            {/* Unexplored Areas */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Compass size={16} color="#3bc9db" />
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>Unexplored Areas</h2>
              </div>
              {data.unexploredAreas.length > 0 ? data.unexploredAreas.map((area, i) => (
                <GapCard key={i} gap={area} color="59, 201, 219" icon={<Compass size={16} />} />
              )) : (
                <div style={{ fontSize: 13, color: "#64748b" }}>No specific unexplored areas identified.</div>
              )}
            </div>
          </div>

          {/* Future Questions */}
          {data.futureQuestions.length > 0 && (
            <div style={{ padding: 24, background: "rgba(96,165,250,0.05)", borderRadius: 12, border: "1px solid rgba(96,165,250,0.2)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#60a5fa", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} color="#60a5fa" /> Future Research Questions
              </h2>
              <ul style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
                {data.futureQuestions.map((q, i) => (
                  <li key={i} style={{ marginBottom: 10 }}>{q}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function GapsPage() {
  const router = useRouter();
  const params = useParams();

  const [paper, setPaper] = useState<Paper | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [data, setData] = useState<GapsData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  // If launched from a paper page — seed with that paper
  const idParam = params?.id;
  const centerId = Array.isArray(idParam)
    ? idParam.map(decodeURIComponent).join("/")
    : (idParam as string | undefined);

  useEffect(() => {
    if (!centerId) return;
    seedFromPaper(centerId);
  }, [centerId]);

  // Auto-generate gaps when a paper is selected/seeded
  useEffect(() => {
    if (paper && !data && !isGenerating) {
      generate(paper);
    }
  }, [paper]);

  async function seedFromPaper(id: string) {
    setIsSeeding(true);
    try {
      let centerPaper: Paper | null = null;
      const stored = sessionStorage.getItem(`paper_${id}`);
      if (stored) {
        const p = JSON.parse(stored);
        centerPaper = {
          id: p.id,
          title: p.title,
          authors: p.authors,
          publicationYear: p.publicationYear,
          citationCount: p.citationCount,
          journal: p.journal,
          abstract: p.abstract,
        };
      } else {
        const r = await fetch(`https://api.openalex.org/works/https://openalex.org/${id}`);
        const w = await r.json();
        let abstract = "";
        if (w.abstract_inverted_index) {
          const inv = w.abstract_inverted_index;
          const max = Math.max(...(Object.values(inv).flat() as number[]));
          const words = new Array(max + 1).fill("");
          for (const [word, positions] of Object.entries(inv)) {
            for (const pos of positions as number[]) words[pos] = word;
          }
          abstract = words.join(" ").trim();
        }
        centerPaper = {
          id,
          title: w.title || "Untitled",
          authors: (w.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean),
          publicationYear: w.publication_year,
          citationCount: w.cited_by_count,
          journal: w.primary_location?.source?.display_name,
          abstract,
        };
      }

      if (centerPaper) {
        setPaper(centerPaper);
      }
    } catch (e) {
      console.error("Failed to seed from paper", e);
    }
    setIsSeeding(false);
  }

  // Search with debounce
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const r = await fetch("/api/search", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        });
        const d = await r.json();
        setSearchResults((d.papers || []).slice(0, 6));
      } catch { setSearchResults([]); }
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  function selectPaper(p: Paper) {
    if (paper?.id === p.id) return;
    setPaper(p);
    setData(null);
    setSearchQuery("");
    setSearchResults([]);
  }

  async function generate(targetPaper: Paper) {
    if (isGenerating) return;
    setIsGenerating(true);
    setData(null);
    setError("");
    try {
      const res = await fetch("/api/gaps", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper: targetPaper }),
      });
      const result = await res.json();
      if (result.error) { setError(result.error); }
      else { setData(result.gaps); }
    } catch {
      setError("Failed to analyze gaps. Please try again.");
    }
    setIsGenerating(false);
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#000000", fontFamily: SF, overflow: "hidden" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: transparent; } 
        ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }
      `}</style>

      {/* Top bar */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 48, flexShrink: 0,
        background: "rgba(10,15,26,0.95)", borderBottom: "1px solid #1f1f1f",
        backdropFilter: "blur(20px)", zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "#64748b", background: "none", border: "none", cursor: "pointer",
            fontSize: 13, fontFamily: SF,
          }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ width: 1, height: 16, background: "#1f1f1f" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SearchX size={14} color="#60a5fa" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Research Gap Finder</span>
          </div>
        </div>
      </header>

      {/* Body — two panels */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left: Sources panel ── */}
        <aside style={{
          width: 320, flexShrink: 0, display: "flex", flexDirection: "column",
          background: "#111111", borderRight: "1px solid #1f1f1f", overflow: "hidden",
        }}>
          {/* Search */}
          <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #1f1f1f" }}>
            <div style={{ fontSize: 10, color: "#334155", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Focal Paper
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 8,
              padding: "7px 10px",
            }}>
              {isSearching ? <Loader2 size={13} color="#60a5fa" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} /> : <Search size={13} color="#475569" style={{ flexShrink: 0 }} />}
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search to analyze a paper..."
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontSize: 12, color: "#e2e8f0", fontFamily: SF,
                }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 0 }}>
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div style={{
                marginTop: 8, background: "#000000", border: "1px solid #1f1f1f",
                borderRadius: 8, overflow: "hidden", maxHeight: 280, overflowY: "auto",
              }}>
                {searchResults.map((p, i) => (
                  <button key={i} onClick={() => selectPaper(p)}
                    style={{
                      width: "100%", textAlign: "left", padding: "9px 12px",
                      borderBottom: i < searchResults.length - 1 ? "1px solid #0a0a0a" : "none",
                      background: "none", border: "none", cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#0a0a0a")}
                    onMouseLeave={e => (e.currentTarget.style.background = "none")}
                  >
                    <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.4, marginBottom: 3 }}>
                      {paper?.id === p.id
                        ? <><Check size={10} color="#10b981" style={{ display: "inline", marginRight: 4 }} />{p.title}</>
                        : p.title
                      }
                    </div>
                    <div style={{ fontSize: 10, color: "#475569", fontFamily: MONO }}>
                      {p.authors?.[0]}{p.authors && p.authors.length > 1 ? " et al." : ""} · {p.publicationYear}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Paper list */}
          <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {isSeeding ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8 }}>
                <Loader2 size={13} color="#60a5fa" style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 12, color: "#334155" }}>Loading paper…</span>
              </div>
            ) : paper ? (
               <div style={{
                  background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 10,
                  padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8
               }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4 }}>
                     {paper.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", fontFamily: MONO, display: "flex", gap: 8, flexWrap: "wrap" }}>
                     {paper.authors?.[0] && (
                     <span>{paper.authors[0]}{paper.authors.length > 1 ? " et al." : ""}</span>
                     )}
                     {paper.publicationYear && <span>· {paper.publicationYear}</span>}
                  </div>
               </div>
            ) : (
              <div style={{ textAlign: "center", padding: "32px 12px" }}>
                <FileText size={28} color="#1f1f1f" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                  Search for a paper above to analyze gaps
                </div>
              </div>
            )}
            
            {error && (
              <div style={{
                marginTop: 10, padding: "8px 10px", borderRadius: 8,
                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                display: "flex", gap: 6, alignItems: "flex-start",
              }}>
                <AlertTriangle size={12} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: "#f87171", lineHeight: 1.5 }}>{error}</span>
              </div>
            )}
          </div>
        </aside>

        {/* ── Right: Document ── */}
        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <GapsView data={data} paper={paper} isGenerating={isGenerating} />
        </main>
      </div>
    </div>
  );
}
