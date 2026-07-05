"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Loader2, Plus, X, BookOpen, Sparkles,
  Download, Copy, Check, RefreshCw, FileText, ChevronDown,
  ExternalLink, AlertCircle,
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
  doi?: string;
}

interface ReviewSection {
  title: string;
  content: string;
}

interface Review {
  introduction: string;
  themes: ReviewSection[];
  keyFindings: string[];
  researchGaps: string[];
  conclusion: string;
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

function ReviewDoc({ review, papers, isGenerating }: {
  review: Review | null;
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
    if (!review) return "";
    let md = `# Literature Review\n\n`;
    md += `## Introduction\n\n${review.introduction}\n\n`;
    if (review.themes?.length) {
      md += `## Thematic Analysis\n\n`;
      review.themes.forEach(t => {
        md += `### ${t.title}\n\n${t.content}\n\n`;
      });
    }
    if (review.keyFindings?.length) {
      md += `## Key Findings\n\n`;
      review.keyFindings.forEach((f, i) => { md += `${i + 1}. ${f}\n`; });
      md += "\n";
    }
    if (review.researchGaps?.length) {
      md += `## Research Gaps\n\n`;
      review.researchGaps.forEach(g => { md += `- ${g}\n`; });
      md += "\n";
    }
    if (review.conclusion) {
      md += `## Conclusion\n\n${review.conclusion}\n\n`;
    }
    md += `## References\n\n`;
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

  async function copyPlain() {
    const plain = buildMarkdown()
      .replace(/#{1,6} /g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "");
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowExport(false);
  }

  function downloadMarkdown() {
    const blob = new Blob([buildMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "literature-review.md"; a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  }

  function downloadTxt() {
    const plain = buildMarkdown().replace(/#{1,6} /g, "").replace(/\*\*/g, "").replace(/\*/g, "");
    const blob = new Blob([plain], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "literature-review.txt"; a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  }

  if (isGenerating) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: "40px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Loader2 size={16} color="#3bc9db" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13, color: "#3bc9db", fontWeight: 500 }}>Generating literature review…</span>
        </div>
        {[100, 80, 90, 65, 75, 50, 85, 60, 70].map((w, i) => (
          <div key={i} style={{
            height: i % 3 === 0 ? 20 : 14, borderRadius: 6,
            background: "#0a0a0a", width: `${w}%`, animation: "pulse 1.5s ease-in-out infinite",
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
      </div>
    );
  }

  if (!review) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 16, padding: 40, textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: "rgba(59,201,219,0.07)", border: "1px solid rgba(59,201,219,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <BookOpen size={28} color="#3bc9db" style={{ opacity: 0.7 }} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", marginBottom: 8 }}>
            Your review will appear here
          </div>
          <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
            Add papers on the left, then click<br />
            <strong style={{ color: "#64748b" }}>Generate Review</strong> to get started
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
          <Sparkles size={14} color="#3bc9db" />
          <span style={{ fontSize: 12, color: "#3bc9db", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            AI Literature Review
          </span>
          <span style={{ fontSize: 11, color: "#334155" }}>
            · {papers.length} source{papers.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div style={{ position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setShowExport(s => !s)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: "rgba(59,201,219,0.08)", border: "1px solid rgba(59,201,219,0.2)",
              color: "#3bc9db", cursor: "pointer",
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
                { label: "Copy as Plain Text", icon: <Copy size={12} />, fn: copyPlain },
                { label: "Download .md", icon: <Download size={12} />, fn: downloadMarkdown },
                { label: "Download .txt", icon: <Download size={12} />, fn: downloadTxt },
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
      <div style={{ flex: 1, overflowY: "auto", padding: "48px 40px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {/* Title */}
          <div style={{ marginBottom: 48 }}>
            <div style={{
              fontSize: 11, color: "#334155",
              textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 16,
            }}>
              Literature Review
            </div>
            <h1 style={{
              fontSize: 36, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.2,
              letterSpacing: "-0.02em", marginBottom: 12,
            }}>
              Synthesis of {papers.length} Research Paper{papers.length !== 1 ? "s" : ""}
            </h1>
            <p style={{ fontSize: 13, color: "#334155" }}>
              Generated by Nagi AI · {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {/* Introduction */}
          {review.introduction && (
            <ReviewSect title="Introduction" color="#3bc9db">
              <DocParagraph text={review.introduction} />
            </ReviewSect>
          )}

          {/* Themes */}
          {review.themes?.length > 0 && (
            <ReviewSect title="Thematic Analysis" color="#a78bfa">
              {review.themes.map((theme, i) => (
                <div key={i} style={{ marginBottom: 28 }}>
                  <h3 style={{
                    fontSize: 15, fontWeight: 600, color: "#e2e8f0",
                    marginBottom: 12, letterSpacing: "-0.01em",
                  }}>
                    {theme.title}
                  </h3>
                  <DocParagraph text={theme.content} />
                </div>
              ))}
            </ReviewSect>
          )}

          {/* Key Findings */}
          {review.keyFindings?.length > 0 && (
            <ReviewSect title="Key Findings" color="#10b981">
              <ol style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {review.keyFindings.map((f, i) => (
                  <li key={i} style={{ display: "flex", gap: 14 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: "#10b981", minWidth: 24, paddingTop: 1,
                    }}>
                      {String(i + 1).padStart(2, "0")}.
                    </span>
                    <span style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.7 }}>
                      <CitedText text={f} />
                    </span>
                  </li>
                ))}
              </ol>
            </ReviewSect>
          )}

          {/* Research Gaps */}
          {review.researchGaps?.length > 0 && (
            <ReviewSect title="Research Gaps" color="#f59e0b">
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {review.researchGaps.map((g, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#f59e0b", fontSize: 16, lineHeight: 1.6, flexShrink: 0 }}>→</span>
                    <span style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.7 }}>{g}</span>
                  </li>
                ))}
              </ul>
            </ReviewSect>
          )}

          {/* Conclusion */}
          {review.conclusion && (
            <ReviewSect title="Conclusion" color="#f472b6">
              <DocParagraph text={review.conclusion} />
            </ReviewSect>
          )}

          {/* References */}
          <ReviewSect title="References" color="#475569">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {papers.map((p, i) => (
                <div key={i} style={{
                  display: "flex", gap: 12,
                  padding: "10px 14px", borderRadius: 8,
                  background: "#0a0a0a", border: "1px solid #1f1f1f",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#3bc9db", flexShrink: 0, paddingTop: 1 }}>
                    [{i + 1}]
                  </span>
                  <div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500, lineHeight: 1.4 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>
                      {p.authors?.join(", ")}
                      {p.journal && <span> · {p.journal}</span>}
                      {p.publicationYear && <span> · {p.publicationYear}</span>}
                    </div>
                    {p.doi && (
                      <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 10, color: "#334155", display: "inline-flex", alignItems: "center", gap: 3, marginTop: 3 }}>
                        DOI <ExternalLink size={9} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ReviewSect>

        </div>
      </div>
    </div>
  );
}

function ReviewSect({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ width: 3, height: 20, background: color, borderRadius: 2 }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.015em" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DocParagraph({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {text.split(/\n\n+/).map((para, i) => (
        <p key={i} style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.8, margin: 0 }}>
          <CitedText text={para} />
        </p>
      ))}
    </div>
  );
}

function CitedText({ text }: { text: string }) {
  const parts = text.split(/(\[\d+(?:,\s*\d+)*\])/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\[\d+(?:,\s*\d+)*\]$/.test(part) ? (
          <sup key={i} style={{ color: "#3bc9db", fontSize: "0.75em", fontWeight: 700 }}>{part}</sup>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();

  const [papers, setPapers] = useState<Paper[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  // If launched from a paper page — seed with that paper + related works
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
      // Load the center paper from sessionStorage or fetch
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
          doi: p.doi,
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
          doi: w.doi?.replace("https://doi.org/", ""),
        };
      }

      if (centerPaper) {
        setPapers([centerPaper]);

        // Fetch related works via OpenAlex
        const related = await fetch(
          `https://api.openalex.org/works?filter=cites:${id}&per_page=5&sort=cited_by_count:desc`
        );
        const relData = await related.json();
        const relatedPapers: Paper[] = (relData.results || []).map((w: any) => {
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
          return {
            id: w.id?.replace("https://openalex.org/", "") || "",
            title: w.title || "Untitled",
            authors: (w.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean),
            publicationYear: w.publication_year,
            citationCount: w.cited_by_count,
            journal: w.primary_location?.source?.display_name,
            abstract,
            doi: w.doi?.replace("https://doi.org/", ""),
          };
        });

        setPapers(p => [...p, ...relatedPapers]);
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
    if (papers.some(x => x.id === p.id || x.title === p.title)) return;
    setPapers(prev => [...prev, p]);
    setSearchQuery("");
    setSearchResults([]);
  }

  function removePaper(id: string) {
    setPapers(prev => prev.filter(p => p.id !== id));
  }

  async function generate() {
    if (!papers.length || isGenerating) return;
    setIsGenerating(true);
    setReview(null);
    setError("");
    try {
      const res = await fetch("/api/review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ papers }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setReview(data.review); }
    } catch {
      setError("Failed to generate review. Please try again.");
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
            <BookOpen size={14} color="#f472b6" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Literature Review</span>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={papers.length === 0 || isGenerating}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: papers.length > 0 && !isGenerating ? "rgba(59,201,219,0.12)" : "#0a0a0a",
            border: `1px solid ${papers.length > 0 && !isGenerating ? "rgba(59,201,219,0.3)" : "#1f1f1f"}`,
            color: papers.length > 0 && !isGenerating ? "#3bc9db" : "#334155",
            cursor: papers.length > 0 && !isGenerating ? "pointer" : "not-allowed",
            transition: "all 0.15s", textTransform: "uppercase", letterSpacing: "0.06em",
          }}>
          {isGenerating
            ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
            : <><Sparkles size={13} /> Generate Review</>
          }
        </button>
      </header>

      {/* Body — two panels */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left: Sources panel ── */}
        <aside style={{
          width: 300, flexShrink: 0, display: "flex", flexDirection: "column",
          background: "#111111", borderRight: "1px solid #1f1f1f", overflow: "hidden",
        }}>
          {/* Search */}
          <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid #1f1f1f" }}>
            <div style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Sources · {papers.length} paper{papers.length !== 1 ? "s" : ""}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 8,
              padding: "7px 10px",
            }}>
              {isSearching ? <Loader2 size={13} color="#3bc9db" style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} /> : <Search size={13} color="#475569" style={{ flexShrink: 0 }} />}
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search papers to add…"
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
                <Loader2 size={13} color="#3bc9db" style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 12, color: "#334155" }}>Loading related papers…</span>
              </div>
            ) : papers.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 12px" }}>
                <FileText size={28} color="#1f1f1f" style={{ margin: "0 auto 12px" }} />
                <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                  Search for papers above and add them to your review
                </div>
              </div>
            ) : (
              papers.map((p, i) => (
                <PaperCard key={p.id || i} paper={p} onRemove={() => removePaper(p.id)} />
              ))
            )}
          </div>

          {/* Generate CTA (bottom of panel) */}
          <div style={{ padding: 14, borderTop: "1px solid #1f1f1f", flexShrink: 0 }}>
            <button
              onClick={generate}
              disabled={papers.length === 0 || isGenerating}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 10,
                fontSize: 12, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
                background: papers.length > 0 && !isGenerating
                  ? "linear-gradient(135deg, rgba(59,201,219,0.15), rgba(244,114,182,0.1))"
                  : "#0a0a0a",
                border: `1px solid ${papers.length > 0 && !isGenerating ? "rgba(59,201,219,0.3)" : "#1f1f1f"}`,
                color: papers.length > 0 && !isGenerating ? "#3bc9db" : "#334155",
                cursor: papers.length > 0 && !isGenerating ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "all 0.15s",
              }}>
              {isGenerating
                ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
                : <><Sparkles size={13} /> Generate Review · {papers.length} paper{papers.length !== 1 ? "s" : ""}</>
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

        {/* ── Right: Review document ── */}
        <main style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <ReviewDoc review={review} papers={papers} isGenerating={isGenerating} />
        </main>
      </div>
    </div>
  );
}
