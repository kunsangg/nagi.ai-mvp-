"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Loader2, X, Sparkles, Download, Copy, Check,
  ChevronDown, Layers, FileText, CheckCircle2, AlertCircle
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

interface ComparisonDimension {
  name: string;
  synthesis: string;
  paperDetails: Record<string, string[]>; // key is paper ID
}

interface ComparisonData {
  summary: string;
  matrix: {
    dimensions: string[];
    papers: Record<string, string[]>;
  };
  dimensions: ComparisonDimension[];
  practicalImplications: string[];
}

function PaperCard({ paper, onRemove }: { paper: Paper; onRemove: () => void }) {
  return (
    <div style={{
      background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 10,
      padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start",
      transition: "border-color 0.15s",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4, marginBottom: 4 }}>
          {paper.title}
        </div>
        <div style={{ fontSize: 10, color: "#475569", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {paper.authors?.[0] && (
            <span>{paper.authors[0]}{paper.authors.length > 1 ? " et al." : ""}</span>
          )}
          {paper.publicationYear && <span>· {paper.publicationYear}</span>}
          {paper.citationCount !== undefined && (
            <span style={{ color: "#3bc9db" }}>· {paper.citationCount.toLocaleString()} cit.</span>
          )}
        </div>
      </div>
      <button onClick={onRemove} style={{
        background: "none", border: "none", cursor: "pointer",
        color: "#334155", flexShrink: 0, padding: 2,
        borderRadius: 4, transition: "color 0.1s",
      }}
        onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
        onMouseLeave={e => (e.currentTarget.style.color = "#334155")}
      >
        <X size={13} />
      </button>
    </div>
  );
}

function ComparisonView({ data, papers, isGenerating }: {
  data: ComparisonData | null;
  papers: Paper[];
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
    if (!data) return "";
    let md = `# Paper Comparison\n\n`;
    md += `## Overall Summary\n\n${data.summary}\n\n`;
    
    md += `## At a Glance\n\n| Paper | ${data.matrix.dimensions.join(" | ")} |\n|---|${data.matrix.dimensions.map(() => "---|").join("")}\n`;
    papers.forEach(p => {
      const vals = data.matrix.papers[p.id] || [];
      md += `| ${p.title} | ${vals.join(" | ")} |\n`;
    });
    md += "\n";

    data.dimensions.forEach(dim => {
      md += `## ${dim.name}\n_${dim.synthesis}_\n\n`;
      papers.forEach(p => {
        const details = dim.paperDetails[p.id] || [];
        if (details.length > 0) {
          md += `### ${p.title}\n`;
          details.forEach(d => md += `- ${d}\n`);
          md += "\n";
        } else {
          md += `### ${p.title}\nNo details provided.\n\n`;
        }
      });
    });

    if (data.practicalImplications && data.practicalImplications.length > 0) {
      md += `## Practical Implications\n\n`;
      data.practicalImplications.forEach(imp => md += `- ${imp}\n`);
      md += "\n";
    }

    md += `## Papers Compared\n\n`;
    papers.forEach((p, i) => {
      const authors = p.authors?.join(", ") || "Unknown";
      md += `[${i + 1}] ${authors}. "${p.title}". ${p.journal || ""}${p.publicationYear ? `, ${p.publicationYear}` : ""}.\n`;
    });
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
    a.href = url; a.download = "paper-comparison.md"; a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  }

  if (isGenerating) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: "40px", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Loader2 size={18} color="#fb923c" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 14, color: "#fb923c", fontWeight: 500 }}>Analyzing and comparing papers…</span>
        </div>
        <div style={{ width: "100%", maxWidth: 600, display: "flex", flexDirection: "column", gap: 16 }}>
          {[100, 80, 90, 65, 75, 50].map((w, i) => (
            <div key={i} style={{
              height: i % 2 === 0 ? 24 : 14, borderRadius: 6,
              background: "#0a0a0a", width: `${w}%`, animation: "pulse 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, padding: 40, textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "rgba(251,146,60,0.07)", border: "1px solid rgba(251,146,60,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Layers size={28} color="#fb923c" style={{ opacity: 0.7 }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>
            Compare Multiple Papers
          </div>
          <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
            Add at least two papers on the left, then click<br />
            <strong style={{ color: "#64748b" }}>Compare</strong> to get started
          </div>
        </div>
      </div>
    );
  }

  // Dimension Colors
  const dimColors = ["#3bc9db", "#a78bfa", "#10b981", "#f59e0b", "#f472b6"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Doc header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 40px", borderBottom: "1px solid #1f1f1f", flexShrink: 0,
        background: "rgba(10,15,26,0.8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sparkles size={14} color="#fb923c" />
          <span style={{ fontSize: 12, color: "#fb923c", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            AI Comparison
          </span>
          <span style={{ fontSize: 11, color: "#334155" }}>
            · {papers.length} papers
          </span>
        </div>
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setShowExport(s => !s)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: "rgba(251,146,60,0.08)", border: "1px solid rgba(251,146,60,0.2)",
              color: "#fb923c", cursor: "pointer",
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
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          
          {/* Summary */}
          <div style={{ marginBottom: 40, padding: 24, background: "#0a0a0a", borderRadius: 12, border: "1px solid #1f1f1f" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <Layers size={16} color="#fb923c" /> Overall Summary
            </h2>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>
              {data.summary}
            </p>
          </div>

          {/* At a Glance Matrix */}
          <div style={{ marginBottom: 50 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 3, height: 20, background: "rgba(59, 201, 219, 0.1)", color: "#3bc9db", border: "1px solid rgba(59, 201, 219, 0.2)", borderRadius: 2 }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#e2e8f0" }}>At a Glance</h3>
            </div>
            <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid #1f1f1f" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#111111", borderBottom: "1px solid #1f1f1f" }}>
                    <th style={{ padding: "12px 16px", color: "#64748b", fontWeight: 600, width: "25%" }}>Paper</th>
                    {data.matrix.dimensions.map((dim, i) => (
                      <th key={i} style={{ padding: "12px 16px", color: "#64748b", fontWeight: 600 }}>{dim}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {papers.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < papers.length - 1 ? "1px solid #1f1f1f" : "none", background: "#0a0a0a" }}>
                      <td style={{ padding: "12px 16px", color: "#e2e8f0", fontWeight: 500 }}>
                         {p.title.length > 50 ? p.title.slice(0, 47) + "..." : p.title}
                      </td>
                      {(data.matrix.papers[p.id] || []).map((val, j) => (
                        <td key={j} style={{ padding: "12px 16px", color: "#94a3b8" }}>{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dimensions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 50 }}>
            {data.dimensions.map((dim, i) => {
              const color = dimColors[(i + 1) % dimColors.length]; // skip the matrix color
              return (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 3, height: 20, background: color, borderRadius: 2 }} />
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: "#e2e8f0" }}>{dim.name}</h3>
                  </div>
                  <div style={{ background: "rgba(10,15,26,0.5)", border: "1px solid #1f1f1f", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Synthesis</div>
                    <p style={{ fontSize: 14, color: "#cbd5e1", margin: 0, lineHeight: 1.6 }}>{dim.synthesis}</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(papers.length, 3)}, minmax(0, 1fr))`, gap: 16 }}>
                    {papers.map(p => {
                      const bullets = dim.paperDetails[p.id] || ["Information not explicitly stated."];
                      return (
                        <div key={p.id} style={{
                          background: "#111111", border: "1px solid #1f1f1f", borderRadius: 10,
                          padding: 16, display: "flex", flexDirection: "column"
                        }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 12, borderBottom: "1px solid #1f1f1f", paddingBottom: 8 }}>
                            {p.title.length > 50 ? p.title.slice(0, 47) + "..." : p.title}
                          </div>
                          <ul style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, flex: 1, margin: 0, paddingLeft: 16 }}>
                            {bullets.map((b, bi) => <li key={bi} style={{ marginBottom: 6 }}>{b}</li>)}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Practical Implications */}
          {data.practicalImplications && data.practicalImplications.length > 0 && (
            <div style={{ marginTop: 50, marginBottom: 40, padding: 24, background: "rgba(251,146,60,0.05)", borderRadius: 12, border: "1px solid rgba(251,146,60,0.2)" }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#fb923c", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} color="#fb923c" /> Key Takeaways & Implications
              </h2>
              <ul style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.7, margin: 0, paddingLeft: 20 }}>
                {data.practicalImplications.map((imp, i) => (
                  <li key={i} style={{ marginBottom: 10 }}>{imp}</li>
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

export default function ComparePage() {
  const router = useRouter();
  const params = useParams();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [data, setData] = useState<ComparisonData | null>(null);
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
        setPapers([centerPaper]);
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

  function addPaper(p: Paper) {
    if (papers.length >= 4) {
        alert("Maximum 4 papers can be compared at once.");
        return;
    }
    if (papers.some(x => x.id === p.id || x.title === p.title)) return;
    setPapers(prev => [...prev, p]);
    setSearchQuery("");
    setSearchResults([]);
  }

  function removePaper(id: string) {
    setPapers(prev => prev.filter(p => p.id !== id));
    // If we drop below 2 papers, clear the comparison
    if (papers.length <= 2) {
        setData(null);
    }
  }

  async function generate() {
    if (papers.length < 2 || isGenerating) return;
    setIsGenerating(true);
    setData(null);
    setError("");
    try {
      const res = await fetch("/api/compare", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ papers }),
      });
      const result = await res.json();
      if (result.error) { setError(result.error); }
      else { setData(result.comparison); }
    } catch {
      setError("Failed to compare papers. Please try again.");
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
            <Layers size={14} color="#fb923c" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Compare Papers</span>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={papers.length < 2 || isGenerating}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: papers.length >= 2 && !isGenerating ? "rgba(251,146,60,0.12)" : "#0a0a0a",
            border: `1px solid ${papers.length >= 2 && !isGenerating ? "rgba(251,146,60,0.3)" : "#1f1f1f"}`,
            color: papers.length >= 2 && !isGenerating ? "#fb923c" : "#334155",
            cursor: papers.length >= 2 && !isGenerating ? "pointer" : "not-allowed",
            transition: "all 0.15s", textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
          {isGenerating
            ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Comparing…</>
            : <><Sparkles size={13} /> Compare</>
          }
        </button>
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
              Papers to Compare · {papers.length}/4
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 8,
              padding: "7px 10px", opacity: papers.length >= 4 ? 0.5 : 1,
            }}>
              {isSearching ? <Loader2 size={13} color="#fb923c" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} /> : <Search size={13} color="#475569" style={{ flexShrink: 0 }} />}
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={papers.length >= 4 ? "Max 4 papers reached" : "Search to add paper..."}
                disabled={papers.length >= 4}
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
                  <button key={i} onClick={() => addPaper(p)}
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
                      {papers.some(x => x.id === p.id)
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
                <Loader2 size={13} color="#fb923c" style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 12, color: "#334155" }}>Loading paper…</span>
              </div>
            ) : papers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 12px" }}>
                <FileText size={28} color="#1f1f1f" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                  Search for papers above and add them to compare
                </div>
              </div>
            ) : (
              papers.map((p, i) => (
                <PaperCard key={p.id || i} paper={p} onRemove={() => removePaper(p.id)} />
              ))
            )}
            
            {papers.length === 1 && (
               <div style={{ textAlign: "center", padding: "16px", marginTop: "16px", border: "1px dashed #1f1f1f", borderRadius: 8 }}>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Add at least one more paper to enable comparison.
                  </div>
               </div>
            )}
          </div>

          {/* Generate CTA (bottom of panel) */}
          <div style={{ padding: 14, borderTop: "1px solid #1f1f1f", flexShrink: 0 }}>
            <button
              onClick={generate}
              disabled={papers.length < 2 || isGenerating}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 10,
                fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
                background: papers.length >= 2 && !isGenerating
                  ? "linear-gradient(135deg, rgba(251,146,60,0.15), rgba(244,114,182,0.1))"
                  : "#0a0a0a",
                border: `1px solid ${papers.length >= 2 && !isGenerating ? "rgba(251,146,60,0.3)" : "#1f1f1f"}`,
                color: papers.length >= 2 && !isGenerating ? "#fb923c" : "#334155",
                cursor: papers.length >= 2 && !isGenerating ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
              }}>
              {isGenerating
                ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Comparing…</>
                : <><Sparkles size={13} /> Compare Papers</>
              }
            </button>
            {error && (
              <div style={{
                marginTop: 10, padding: "8px 10px", borderRadius: 8,
                background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                display: "flex", gap: 6, alignItems: "flex-start",
              }}>
                <AlertCircle size={12} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: "#f87171", lineHeight: 1.5 }}>{error}</span>
              </div>
            )}
          </div>
        </aside>

        {/* ── Right: Comparison document ── */}
        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <ComparisonView data={data} papers={papers} isGenerating={isGenerating} />
        </main>
      </div>
    </div>
  );
}
