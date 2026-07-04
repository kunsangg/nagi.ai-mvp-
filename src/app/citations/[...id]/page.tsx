"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Quote, ExternalLink, Loader2, ChevronDown,
  ArrowUpRight, ArrowDownLeft, FileText, Filter, SortDesc,
  BookOpen, Copy, Check, Search, X, Users, Calendar,
  TrendingUp, Hash, ChevronLeft, ChevronRight,
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
  doi?: string;
  isOpenAccess?: boolean;
  abstract?: string;
  type?: string;
  topics?: { displayName: string; score: number }[];
}

interface SourcePaper {
  id: string;
  title: string;
  authors?: string[];
  publicationYear?: number;
  citationCount?: number;
  journal?: string;
  doi?: string;
  domain?: string;
  field?: string;
  referencesCount?: number;
}

type TabType = "cited_by" | "references";
type SortType = "citations" | "year_desc" | "year_asc";

export default function CitationsPage() {
  const params = useParams();
  const router = useRouter();

  const idParam = params?.id;
  const centerId = Array.isArray(idParam)
    ? idParam.map(decodeURIComponent).join("/")
    : (idParam as string);

  const [source, setSource] = useState<SourcePaper | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("cited_by");
  const [sortBy, setSortBy] = useState<SortType>("citations");
  const [page, setPage] = useState(1);
  const [searchFilter, setSearchFilter] = useState("");
  const [copiedDoi, setCopiedDoi] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const perPage = 25;
  const totalPages = Math.ceil(totalCount / perPage);

  // Load source paper
  useEffect(() => {
    if (!centerId) return;
    const stored = sessionStorage.getItem(`paper_${centerId}`);
    if (stored) {
      const p = JSON.parse(stored);
      setSource(p);
      setIsLoading(false);
    } else {
      fetchSourcePaper(centerId);
    }
  }, [centerId]);

  async function fetchSourcePaper(id: string) {
    try {
      const res = await fetch(`https://api.openalex.org/works/https://openalex.org/${id}`);
      const w = await res.json();
      const primaryTopic = w.topics?.[0];
      setSource({
        id,
        title: w.title || "Untitled",
        authors: (w.authorships || []).map((a: any) => a.author?.display_name).filter(Boolean),
        publicationYear: w.publication_year,
        citationCount: w.cited_by_count || 0,
        journal: w.primary_location?.source?.display_name,
        doi: w.doi?.replace("https://doi.org/", ""),
        domain: primaryTopic?.domain?.display_name,
        field: primaryTopic?.field?.display_name,
        referencesCount: w.referenced_works_count || 0,
      });
    } catch {}
    setIsLoading(false);
  }

  // Load citations / references
  const fetchPapers = useCallback(async () => {
    if (!centerId) return;
    setIsLoadingPapers(true);
    try {
      const res = await fetch(
        `/api/citations?id=${encodeURIComponent(centerId)}&type=${activeTab}&page=${page}&per_page=${perPage}`
      );
      const data = await res.json();
      setPapers(data.papers || []);
      setTotalCount(data.totalCount || 0);
    } catch {
      setPapers([]);
    }
    setIsLoadingPapers(false);
  }, [centerId, activeTab, page]);

  useEffect(() => {
    if (!isLoading) fetchPapers();
  }, [fetchPapers, isLoading]);

  // Reset page on tab switch
  useEffect(() => { setPage(1); }, [activeTab]);

  // Client-side sort & filter
  const displayPapers = papers
    .filter(p => {
      if (!searchFilter) return true;
      const q = searchFilter.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.authors?.some(a => a.toLowerCase().includes(q)) ||
        p.journal?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "citations") return (b.citationCount || 0) - (a.citationCount || 0);
      if (sortBy === "year_desc") return (b.publicationYear || 0) - (a.publicationYear || 0);
      if (sortBy === "year_asc") return (a.publicationYear || 0) - (b.publicationYear || 0);
      return 0;
    });

  async function copyDoi(doi: string) {
    await navigator.clipboard.writeText(`https://doi.org/${doi}`);
    setCopiedDoi(doi);
    setTimeout(() => setCopiedDoi(null), 2000);
  }

  // --- Year histogram data ---
  const yearCounts: Record<number, number> = {};
  papers.forEach(p => {
    if (p.publicationYear) {
      yearCounts[p.publicationYear] = (yearCounts[p.publicationYear] || 0) + 1;
    }
  });
  const years = Object.keys(yearCounts).map(Number).sort();
  const maxCount = Math.max(...Object.values(yearCounts), 1);

  if (isLoading) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000000", fontFamily: SF }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Loader2 size={18} color="#3bc9db" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 13, color: "#3bc9db", fontWeight: 500 }}>Loading paper…</span>
        </div>
      </div>
    );
  }

  if (!source) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000000", fontFamily: SF }}>
        <span style={{ fontSize: 14, color: "#64748b" }}>Paper not found.</span>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#000000", fontFamily: SF, overflow: "hidden" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: transparent; } 
        ::-webkit-scrollbar-thumb { background: #1f1f1f; border-radius: 2px; }
      `}</style>

      {/* ── Top bar ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", height: 48, flexShrink: 0,
        background: "rgba(10,15,26,0.95)", borderBottom: "1px solid #1f1f1f",
        backdropFilter: "blur(20px)", zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => router.back()} style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "#64748b", background: "none", border: "none", cursor: "pointer", fontSize: 13,
          }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ width: 1, height: 16, background: "#1f1f1f" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Quote size={14} color="#34d399" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Find Citations</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#334155", fontFamily: MONO }}>
          {totalCount.toLocaleString()} {activeTab === "cited_by" ? "citing" : "referenced"} papers
        </div>
      </header>

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* ── Source paper hero ── */}
        <div style={{
          padding: "20px 32px", borderBottom: "1px solid #1f1f1f", flexShrink: 0,
          background: "linear-gradient(180deg, rgba(10,15,26,0.9) 0%, #000000 100%)",
        }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ fontSize: 10, color: "#334155", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
              Source Paper
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", lineHeight: 1.3, letterSpacing: "-0.015em", marginBottom: 10 }}>
              {source.title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12, color: "#64748b", marginBottom: 14 }}>
              {source.authors && source.authors.length > 0 && (
                <span>{source.authors.slice(0, 3).join(", ")}{source.authors.length > 3 ? " et al." : ""}</span>
              )}
              {source.journal && <><span style={{ color: "#1f1f1f" }}>·</span><span>{source.journal}</span></>}
              {source.publicationYear && <><span style={{ color: "#1f1f1f" }}>·</span><span>{source.publicationYear}</span></>}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "Cited by", value: source.citationCount?.toLocaleString() || "0", icon: <ArrowUpRight size={11} />, color: "#3bc9db" },
                { label: "References", value: source.referencesCount?.toLocaleString() || "0", icon: <ArrowDownLeft size={11} />, color: "#a78bfa" },
                { label: "Year", value: source.publicationYear?.toString() || "—", icon: <Calendar size={11} />, color: "#f59e0b" },
              ].map(s => (
                <div key={s.label} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 8,
                  background: "#0a0a0a", border: "1px solid #1f1f1f",
                }}>
                  <span style={{ color: s.color, display: "flex" }}>{s.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", fontFamily: MONO }}>{s.value}</span>
                  <span style={{ fontSize: 10, color: "#475569", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab bar + controls ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", borderBottom: "1px solid #1f1f1f", flexShrink: 0,
          background: "rgba(10,15,26,0.6)",
        }}>
          <div style={{ display: "flex" }}>
            {([
              { id: "cited_by" as TabType, label: "Cited By", icon: <ArrowUpRight size={13} />, count: source.citationCount, color: "#3bc9db" },
              { id: "references" as TabType, label: "References", icon: <ArrowDownLeft size={13} />, count: source.referencesCount, color: "#a78bfa" },
            ] as const).map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "12px 20px", fontSize: 12, fontWeight: 600,
                  background: "none", border: "none", cursor: "pointer",
                  borderBottom: `2px solid ${activeTab === tab.id ? tab.color : "transparent"}`,
                  color: activeTab === tab.id ? tab.color : "#475569",
                  transition: "all 0.12s", fontFamily: SF,
                }}>
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{
                    fontSize: 10, fontFamily: MONO, fontWeight: 700,
                    padding: "1px 6px", borderRadius: 4,
                    background: activeTab === tab.id ? `${tab.color}15` : "#0a0a0a",
                    color: activeTab === tab.id ? tab.color : "#334155",
                  }}>
                    {tab.count.toLocaleString()}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search filter */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 7,
              padding: "5px 10px",
            }}>
              <Search size={12} color="#475569" />
              <input
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Filter results…"
                style={{
                  background: "none", border: "none", outline: "none",
                  fontSize: 11, color: "#e2e8f0", fontFamily: SF, width: 120,
                }}
              />
              {searchFilter && (
                <button onClick={() => setSearchFilter("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", padding: 0 }}>
                  <X size={10} />
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortType)}
              style={{
                background: "#0a0a0a", border: "1px solid #1f1f1f", borderRadius: 7,
                padding: "5px 10px", fontSize: 11, color: "#94a3b8", fontFamily: MONO,
                outline: "none", cursor: "pointer", appearance: "none",
                paddingRight: 24,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
              }}
            >
              <option value="citations">Most Cited</option>
              <option value="year_desc">Newest First</option>
              <option value="year_asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>

          {/* Main list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 32px" }}>
            <div style={{ maxWidth: 860, margin: "0 auto" }}>
              {isLoadingPapers ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 20 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{
                      height: 72, borderRadius: 10, background: "#0a0a0a", border: "1px solid #1f1f1f",
                      animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.08}s`,
                      opacity: 0.5,
                    }} />
                  ))}
                  <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }`}</style>
                </div>
              ) : displayPapers.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <Quote size={32} color="#1f1f1f" style={{ margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 14, color: "#334155" }}>
                    {searchFilter ? "No matching papers found" : "No citations found"}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {displayPapers.map((paper, i) => {
                    const isExpanded = expandedId === paper.id;
                    return (
                      <div key={paper.id || i}
                        style={{
                          background: "#111111", border: `1px solid ${isExpanded ? "#1e3a5f" : "#1f1f1f"}`,
                          borderRadius: 10, overflow: "hidden",
                          transition: "border-color 0.15s",
                        }}
                      >
                        <div
                          onClick={() => setExpandedId(isExpanded ? null : paper.id)}
                          style={{ padding: "14px 16px", cursor: "pointer", display: "flex", gap: 14 }}
                        >
                          {/* Rank number */}
                          <div style={{
                            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                            background: "#0a0a0a", border: "1px solid #1f1f1f",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 700, color: "#475569", fontFamily: MONO,
                          }}>
                            {(page - 1) * perPage + i + 1}
                          </div>

                          {/* Content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.45,
                              letterSpacing: "-0.01em", marginBottom: 6,
                            }}>
                              {paper.title}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11, color: "#475569" }}>
                              {paper.authors && paper.authors.length > 0 && (
                                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                                  <Users size={10} />
                                  {paper.authors[0]}{paper.authors.length > 1 ? ` +${paper.authors.length - 1}` : ""}
                                </span>
                              )}
                              {paper.journal && (
                                <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {paper.journal}
                                </span>
                              )}
                              {paper.publicationYear && <span>{paper.publicationYear}</span>}
                            </div>
                          </div>

                          {/* Citation badge */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                            <div style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "3px 8px", borderRadius: 6,
                              background: "rgba(59,201,219,0.07)", border: "1px solid rgba(59,201,219,0.15)",
                            }}>
                              <TrendingUp size={10} color="#3bc9db" />
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#3bc9db", fontFamily: MONO }}>
                                {paper.citationCount?.toLocaleString()}
                              </span>
                            </div>
                            {paper.isOpenAccess && (
                              <span style={{ fontSize: 9, color: "#10b981", fontFamily: MONO, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                                Open Access
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div style={{
                            padding: "0 16px 14px 58px",
                            borderTop: "1px solid #1f1f1f",
                            paddingTop: 14,
                          }}>
                            {paper.abstract && (
                              <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7, marginBottom: 12 }}>
                                {paper.abstract}{paper.abstract.length >= 295 ? "…" : ""}
                              </p>
                            )}

                            {paper.topics && paper.topics.length > 0 && (
                              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                                {paper.topics.map((t, j) => (
                                  <span key={j} style={{
                                    fontSize: 9, padding: "2px 7px", borderRadius: 4,
                                    background: "#0a0a0a", border: "1px solid #1f1f1f",
                                    color: "#475569", fontFamily: MONO,
                                  }}>
                                    {t.displayName}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <button
                                onClick={(e) => { e.stopPropagation(); window.location.href = `/paper/${paper.id}`; }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 5,
                                  padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                                  background: "rgba(59,201,219,0.07)", border: "1px solid rgba(59,201,219,0.2)",
                                  color: "#3bc9db", cursor: "pointer",
                                }}>
                                <BookOpen size={11} /> View Paper
                              </button>
                              {paper.doi && (
                                <>
                                  <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 5,
                                      padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                                      background: "#0a0a0a", border: "1px solid #1f1f1f",
                                      color: "#64748b", textDecoration: "none", cursor: "pointer",
                                    }}>
                                    <ExternalLink size={11} /> DOI
                                  </a>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); copyDoi(paper.doi!); }}
                                    style={{
                                      display: "flex", alignItems: "center", gap: 5,
                                      padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                                      background: "#0a0a0a", border: "1px solid #1f1f1f",
                                      color: copiedDoi === paper.doi ? "#10b981" : "#64748b", cursor: "pointer",
                                    }}>
                                    {copiedDoi === paper.doi ? <Check size={11} /> : <Copy size={11} />}
                                    {copiedDoi === paper.doi ? "Copied!" : "Copy DOI"}
                                  </button>
                                </>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); window.location.href = `/citations/${paper.id}`; }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 5,
                                  padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                                  background: "#0a0a0a", border: "1px solid #1f1f1f",
                                  color: "#64748b", cursor: "pointer",
                                }}>
                                <Quote size={11} /> Its Citations
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && !isLoadingPapers && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  padding: "24px 0 16px",
                }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: "#0a0a0a", border: "1px solid #1f1f1f",
                      color: page <= 1 ? "#1f1f1f" : "#64748b",
                      cursor: page <= 1 ? "not-allowed" : "pointer",
                    }}>
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <span style={{ fontSize: 12, color: "#475569", fontFamily: MONO }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      background: "#0a0a0a", border: "1px solid #1f1f1f",
                      color: page >= totalPages ? "#1f1f1f" : "#64748b",
                      cursor: page >= totalPages ? "not-allowed" : "pointer",
                    }}>
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Right sidebar: year distribution ── */}
          {years.length > 1 && !isLoadingPapers && (
            <aside style={{
              width: 220, flexShrink: 0, borderLeft: "1px solid #1f1f1f",
              padding: 20, overflowY: "auto",
              background: "rgba(10,15,26,0.6)",
            }}>
              <div style={{ fontSize: 10, color: "#334155", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                Year Distribution
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {years.map(y => {
                  const count = yearCounts[y];
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={y} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#475569", fontFamily: MONO, width: 32, textAlign: "right", flexShrink: 0 }}>
                        {y}
                      </span>
                      <div style={{ flex: 1, height: 14, borderRadius: 3, background: "#0a0a0a", overflow: "hidden" }}>
                        <div style={{
                          width: `${pct}%`, height: "100%", borderRadius: 3,
                          background: activeTab === "cited_by"
                            ? "linear-gradient(90deg, rgba(59,201,219,0.3), rgba(59,201,219,0.6))"
                            : "linear-gradient(90deg, rgba(167,139,250,0.3), rgba(167,139,250,0.6))",
                          transition: "width 0.3s ease",
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: "#475569", fontFamily: MONO, width: 20, flexShrink: 0 }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Quick stats */}
              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 10, color: "#334155", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
                  Quick Stats
                </div>
                {[
                  { label: "Total", value: totalCount.toLocaleString() },
                  { label: "This page", value: displayPapers.length.toString() },
                  { label: "Avg cit.", value: papers.length ? Math.round(papers.reduce((s, p) => s + (p.citationCount || 0), 0) / papers.length).toLocaleString() : "—" },
                  { label: "Median year", value: papers.length ? papers.map(p => p.publicationYear || 0).filter(Boolean).sort()[ Math.floor(papers.filter(p => p.publicationYear).length / 2)]?.toString() || "—" : "—" },
                ].map(s => (
                  <div key={s.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "6px 10px", borderRadius: 6,
                    background: "#0a0a0a", border: "1px solid #1f1f1f",
                  }}>
                    <span style={{ fontSize: 10, color: "#475569", fontFamily: MONO, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", fontFamily: MONO }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
