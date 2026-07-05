"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Loader2, X, Sparkles, Download, Copy, Check,
  ChevronDown, Scale, FileText, AlertTriangle, Database, Activity, ShieldCheck
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

interface EvidenceItem {
  title: string;
  description: string;
}

interface ClaimItem {
  claim: string;
  support: string;
}

interface EvidenceData {
  verdict: string;
  dataSources: { source: string; description: string }[];
  keyMetrics: { metric: string; description: string }[];
  claims: ClaimItem[];
}

function DataCard({ title, description, color, icon }: { title: string; description: string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10,
      padding: 16, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: `rgba(${color}, 0.1)`,
          display: "flex", alignItems: "center", justifyContent: "center", color: `rgb(${color})`
        }}>
          {icon}
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{title}</div>
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, paddingLeft: 38 }}>
        {description}
      </div>
    </div>
  );
}

function EvidenceView({ data, paper, isGenerating }: {
  data: EvidenceData | null;
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
    let md = `# Empirical Evidence: ${paper.title}\n\n`;
    md += `## Verdict\n${data.verdict}\n\n`;
    
    if (data.dataSources.length > 0) {
      md += `## Data Sources & Population\n`;
      data.dataSources.forEach(d => md += `- **${d.source}**: ${d.description}\n`);
      md += "\n";
    }

    if (data.keyMetrics.length > 0) {
      md += `## Key Metrics\n`;
      data.keyMetrics.forEach(k => md += `- **${k.metric}**: ${k.description}\n`);
      md += "\n";
    }

    if (data.claims.length > 0) {
      md += `## Empirical Claims\n`;
      data.claims.forEach(c => {
        md += `### Claim: ${c.claim}\n**Support:** ${c.support}\n\n`;
      });
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
    a.href = url; a.download = "evidence-breakdown.md"; a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  }

  if (isGenerating) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: "40px", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Loader2 size={18} color="#22d3ee" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 14, color: "#22d3ee", fontWeight: 500 }}>Extracting empirical evidence…</span>
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
          background: "rgba(34,211,238,0.07)", border: "1px solid rgba(34,211,238,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Scale size={28} color="#22d3ee" style={{ opacity: 0.7 }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>
            Evidence Finder
          </div>
          <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
            Select a paper on the left to extract its datasets,<br />
            metrics, and empirical claims.
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
          <Sparkles size={14} color="#22d3ee" />
          <span style={{ fontSize: 12, color: "#22d3ee", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Evidence Breakdown
          </span>
        </div>
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setShowExport(s => !s)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)",
              color: "#22d3ee", cursor: "pointer",
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
          
          {/* Verdict */}
          <div style={{ marginBottom: 40, padding: 20, background: "rgba(34,211,238,0.05)", borderRadius: 12, border: "1px solid rgba(34,211,238,0.2)" }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#22d3ee", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Overall Verdict
            </h2>
            <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.7, margin: 0 }}>
              {data.verdict}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 40 }}>
            {/* Data Sources */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Database size={16} color="#38bdf8" />
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>Data & Sample Size</h2>
              </div>
              {data.dataSources.length > 0 ? data.dataSources.map((ds, i) => (
                <DataCard key={i} title={ds.source} description={ds.description} color="56, 189, 248" icon={<Database size={14} />} />
              )) : (
                <div style={{ fontSize: 13, color: "#64748b" }}>No specific data sources mentioned in the abstract.</div>
              )}
            </div>

            {/* Metrics */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Activity size={16} color="#a78bfa" />
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>Key Metrics</h2>
              </div>
              {data.keyMetrics.length > 0 ? data.keyMetrics.map((km, i) => (
                <DataCard key={i} title={km.metric} description={km.description} color="167, 139, 250" icon={<Activity size={14} />} />
              )) : (
                <div style={{ fontSize: 13, color: "#64748b" }}>No specific metrics mentioned.</div>
              )}
            </div>
          </div>

          {/* Claims */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <ShieldCheck size={16} color="#10b981" />
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>Empirical Claims</h2>
            </div>
            {data.claims.length > 0 ? data.claims.map((claim, i) => (
              <div key={i} style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #1f1f1f", fontSize: 15, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.5 }}>
                  "{claim.claim}"
                </div>
                <div style={{ padding: "14px 20px", background: "rgba(16,185,129,0.03)", display: "flex", gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.08em", paddingTop: 2 }}>
                    Support
                  </div>
                  <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, flex: 1 }}>
                    {claim.support}
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ fontSize: 13, color: "#64748b" }}>No specific empirical claims mentioned.</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EvidencePage() {
  const router = useRouter();
  const params = useParams();

  const [paper, setPaper] = useState<Paper | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [data, setData] = useState<EvidenceData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  const idParam = params?.id;
  const centerId = Array.isArray(idParam)
    ? idParam.map(decodeURIComponent).join("/")
    : (idParam as string | undefined);

  useEffect(() => {
    if (!centerId) return;
    seedFromPaper(centerId);
  }, [centerId]);

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
      const res = await fetch("/api/evidence", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paper: targetPaper }),
      });
      const result = await res.json();
      if (result.error) { setError(result.error); }
      else { setData(result.evidence); }
    } catch {
      setError("Failed to analyze evidence. Please try again.");
    }
    setIsGenerating(false);
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0a", overflow: "hidden" }}>
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
        background: "rgba(17,17,17,0.95)", borderBottom: "1px solid #1f1f1f",
        backdropFilter: "blur(20px)", zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "#64748b", background: "none", border: "none", cursor: "pointer",
            fontSize: 13,
          }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ width: 1, height: 16, background: "#1f1f1f" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Scale size={14} color="#22d3ee" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Evidence Finder</span>
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
            <div style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Focal Paper
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 8,
              padding: "7px 10px",
            }}>
              {isSearching ? <Loader2 size={13} color="#22d3ee" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} /> : <Search size={13} color="#475569" style={{ flexShrink: 0 }} />}
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search to find evidence..."
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  fontSize: 12, color: "#e2e8f0",
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
                marginTop: 8, background: "#0a0a0a", border: "1px solid #1f1f1f",
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
                    <div style={{ fontSize: 10, color: "#475569" }}>
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
                <Loader2 size={13} color="#22d3ee" style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 12, color: "#334155" }}>Loading paper…</span>
              </div>
            ) : paper ? (
               <div style={{
                  background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 10,
                  padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8
               }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4 }}>
                     {paper.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                  Search for a paper above to extract evidence
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
          <EvidenceView data={data} paper={paper} isGenerating={isGenerating} />
        </main>
      </div>
    </div>
  );
}
