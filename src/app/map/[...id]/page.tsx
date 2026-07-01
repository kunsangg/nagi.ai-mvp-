"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import * as d3 from "d3";
import {
  ArrowLeft, Plus, Trash2, Link2, MousePointer,
  Save, X, Search, Loader2, ZoomIn, ZoomOut,
  Maximize2, BookOpen, Map, ExternalLink
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
type NodeType = "center" | "reference" | "citing" | "related" | "custom";
type EdgeType = "reference" | "citing" | "related" | "custom";
type Tool = "select" | "connect" | "delete";

interface MapNode {
  id: string;
  title: string;
  year?: number;
  citations?: number;
  author?: string;
  field?: string;
  type: NodeType;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface MapEdge {
  source: string | MapNode;
  target: string | MapNode;
  type: EdgeType;
}

// ── Constants ──────────────────────────────────────────────
const NODE_W = 200;
const NODE_H = 80;

const TYPE_CONFIG: Record<NodeType, { border: string; badge: string; badgeText: string; glow: string }> = {
  center:    { border: "#3bc9db", badge: "#3bc9db22", badgeText: "#3bc9db", glow: "rgba(59,201,219,0.15)" },
  reference: { border: "#a78bfa", badge: "#a78bfa22", badgeText: "#a78bfa", glow: "rgba(167,139,250,0.1)" },
  citing:    { border: "#fbbf24", badge: "#fbbf2422", badgeText: "#fbbf24", glow: "rgba(251,191,36,0.1)"  },
  related:   { border: "#64748b", badge: "#64748b22", badgeText: "#94a3b8", glow: "rgba(100,116,139,0.08)" },
  custom:    { border: "#00bc7d", badge: "#00bc7d22", badgeText: "#00bc7d", glow: "rgba(0,188,125,0.1)"  },
};

const EDGE_COLORS: Record<EdgeType, string> = {
  reference: "#a78bfa",
  citing:    "#fbbf24",
  related:   "#334155",
  custom:    "#00bc7d",
};

const NODE_LABELS: Record<NodeType, string> = {
  center:    "Selected Paper",
  reference: "Referenced By This",
  citing:    "Cites This Paper",
  related:   "Related Work",
  custom:    "Added",
};

const mono = "'JetBrains Mono','Fira Code',monospace";

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function getNodeId(n: string | MapNode): string {
  return typeof n === "string" ? n : n.id;
}

// ── Component ──────────────────────────────────────────────
export default function MapPage() {
  const params = useParams();
  const router = useRouter();
  const svgRef    = useRef<SVGSVGElement>(null);
  const zoomRef   = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simRef    = useRef<d3.Simulation<MapNode, MapEdge> | null>(null);

  const [nodes,     setNodes]     = useState<MapNode[]>([]);
  const [edges,     setEdges]     = useState<MapEdge[]>([]);
  const [centerId,  setCenterId]  = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState("");

  const [editMode,      setEditMode]      = useState(false);
  const [activeTool,    setActiveTool]    = useState<Tool>("select");
  const [selectedNode,  setSelectedNode]  = useState<MapNode | null>(null);
  const [connectSource, setConnectSource] = useState<MapNode | null>(null);

  const [showAdd,     setShowAdd]     = useState(false);
  const [addQuery,    setAddQuery]    = useState("");
  const [addResults,  setAddResults]  = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const idParam = params?.id;
  const id = Array.isArray(idParam)
    ? idParam.map(decodeURIComponent).join("/")
    : (idParam as string);

  // ── Fetch map data ──
  useEffect(() => {
    if (!id) return;
    fetch(`/api/map?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setIsLoading(false); return; }
        setNodes(data.nodes);
        setEdges(data.edges);
        setCenterId(data.center);
        setIsLoading(false);
      })
      .catch(() => { setError("Failed to load map"); setIsLoading(false); });
  }, [id]);

  // ── D3 render ──
  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;

    const el        = svgRef.current;
    const container = el.parentElement!;
    const W         = container.clientWidth;
    const H         = container.clientHeight;

    d3.select(el).selectAll("*").remove();

    const svg = d3.select(el).attr("width", W).attr("height", H);
    const defs = svg.append("defs");

    // ── Dot-grid background (n8n style) ──
    const dotPat = defs.append("pattern")
      .attr("id", "dots").attr("width", 24).attr("height", 24)
      .attr("patternUnits", "userSpaceOnUse");
    dotPat.append("circle")
      .attr("cx", 1).attr("cy", 1).attr("r", 1)
      .attr("fill", "#1e2a3a");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "url(#dots)");

    // ── Arrow markers ──
    (Object.keys(EDGE_COLORS) as EdgeType[]).forEach(type => {
      defs.append("marker")
        .attr("id",          `arr-${type}`)
        .attr("viewBox",     "0 -4 8 8")
        .attr("refX",        8)
        .attr("refY",        0)
        .attr("markerWidth", 5)
        .attr("markerHeight",5)
        .attr("orient",      "auto")
        .append("path")
        .attr("d",    "M0,-4L8,0L0,4")
        .attr("fill", EDGE_COLORS[type]);
    });

    // ── Zoom ──
    const g    = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on("zoom", ev => g.attr("transform", ev.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    // ── Simulation ──
    const simNodes: MapNode[] = nodes.map(n => ({ ...n }));
    const simEdges = edges.map(e => ({ ...e }));

    const sim = d3.forceSimulation<MapNode>(simNodes)
      .force("link", d3.forceLink<MapNode, MapEdge>(simEdges)
        .id(d => d.id).distance(280).strength(0.35))
      .force("charge",    d3.forceManyBody().strength(-900))
      .force("center",    d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide().radius(130));
    simRef.current = sim;

    // ── Edges (bezier curves) ──
    const linkG = g.append("g");
    const linkSel = linkG.selectAll<SVGPathElement, MapEdge>("path")
      .data(simEdges).join("path")
      .attr("fill",         "none")
      .attr("stroke",       (d: any) => EDGE_COLORS[d.type as EdgeType])
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end",   (d: any) => `url(#arr-${d.type})`)
      .attr("cursor",       "pointer")
      .on("click", (_ev, d: any) => {
        if (activeTool !== "delete") return;
        setEdges(prev => prev.filter(e =>
          !(getNodeId(e.source) === getNodeId(d.source) &&
            getNodeId(e.target) === getNodeId(d.target))
        ));
      });

    // ── Nodes (n8n-style rectangles) ──
    const nodeG   = g.append("g");
    const nodeSel = nodeG.selectAll<SVGGElement, MapNode>("g")
      .data(simNodes).join("g")
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, MapNode>()
        .on("start", (ev, d) => {
          if (!ev.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag",  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on("end",   (ev, d) => {
          if (!ev.active) sim.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      )
      .on("click", (_ev, d) => handleNodeClick(d));

    // Glow shadow
    nodeSel.append("rect")
      .attr("x",      -NODE_W / 2 - 4).attr("y",      -NODE_H / 2 - 4)
      .attr("width",   NODE_W + 8).attr("height", NODE_H + 8)
      .attr("rx", 10)
      .attr("fill",   (d: MapNode) => TYPE_CONFIG[d.type].glow)
      .attr("filter", "blur(6px)");

    // Card body
    nodeSel.append("rect")
      .attr("x",       -NODE_W / 2).attr("y",       -NODE_H / 2)
      .attr("width",    NODE_W).attr("height",  NODE_H)
      .attr("rx",       8)
      .attr("fill",     "#111827")
      .attr("stroke",   (d: MapNode) => TYPE_CONFIG[d.type].border)
      .attr("stroke-width", (d: MapNode) => d.type === "center" ? 2 : 1)
      .on("mouseover", function (_ev, d) {
        d3.select(this).attr("fill", "#1a2333");
      })
      .on("mouseout", function () {
        d3.select(this).attr("fill", "#111827");
      });

    // Left accent bar
    nodeSel.append("rect")
      .attr("x",      -NODE_W / 2).attr("y",      -NODE_H / 2)
      .attr("width",   3).attr("height",  NODE_H)
      .attr("rx",      2)
      .attr("fill",   (d: MapNode) => TYPE_CONFIG[d.type].border);

    // Type badge (top-left inside card)
    nodeSel.append("rect")
      .attr("x",      -NODE_W / 2 + 14).attr("y", -NODE_H / 2 + 8)
      .attr("width",   60).attr("height", 16)
      .attr("rx",      4)
      .attr("fill",   (d: MapNode) => TYPE_CONFIG[d.type].badge);

    nodeSel.append("text")
      .text((d: MapNode) => NODE_LABELS[d.type].toUpperCase())
      .attr("x",           -NODE_W / 2 + 44)
      .attr("y",           -NODE_H / 2 + 20)
      .attr("text-anchor", "middle")
      .attr("font-size",   "7px")
      .attr("font-family", mono)
      .attr("fill",        (d: MapNode) => TYPE_CONFIG[d.type].badgeText)
      .attr("pointer-events", "none");

    // Title (wrapped, 2 lines max)
    nodeSel.each(function (d: MapNode) {
      const g    = d3.select(this);
      const text = g.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size",   d.type === "center" ? "11px" : "10px")
        .attr("font-family", "'Inter',system-ui,sans-serif")
        .attr("fill",        "#e2e8f0")
        .attr("pointer-events", "none");

      const words    = truncate(d.title, 60).split(" ");
      const line1    = words.slice(0, Math.ceil(words.length / 2)).join(" ");
      const line2    = words.slice(Math.ceil(words.length / 2)).join(" ");
      const hasTwo   = line2.length > 0;

      text.append("tspan")
        .text(line1)
        .attr("x", 0)
        .attr("y", hasTwo ? -4 : 4);

      if (hasTwo) {
        text.append("tspan")
          .text(line2)
          .attr("x", 0)
          .attr("dy", "1.3em");
      }
    });

    // Year + citations (bottom row)
    nodeSel.append("text")
      .text((d: MapNode) => [d.year, d.citations ? `${d.citations.toLocaleString()} citations` : ""].filter(Boolean).join("  ·  "))
      .attr("x",           0)
      .attr("y",           NODE_H / 2 - 10)
      .attr("text-anchor", "middle")
      .attr("font-size",   "8px")
      .attr("font-family", mono)
      .attr("fill",        "#475569")
      .attr("pointer-events", "none");

    // Connection dots (n8n port style)
    [-1, 1].forEach(side => {
      nodeSel.append("circle")
        .attr("cx",   (NODE_W / 2) * side)
        .attr("cy",   0)
        .attr("r",    4)
        .attr("fill", "#1e2a3a")
        .attr("stroke", "#334155")
        .attr("stroke-width", 1.5);
    });

    // ── Tick ──
    sim.on("tick", () => {
      linkSel.attr("d", (d: any) => {
        const sx = d.source.x, sy = d.source.y;
        const tx = d.target.x, ty = d.target.y;
        const mx = (sx + tx) / 2;
        // Offset the control point by 40px perpendicular for a gentle curve
        return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
      });
      nodeSel.attr("transform", (d: any) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { sim.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  // ── Node click handler ──
  function handleNodeClick(d: MapNode) {
    if (activeTool === "delete") {
      setNodes(p => p.filter(n => n.id !== d.id));
      setEdges(p => p.filter(e =>
        getNodeId(e.source) !== d.id && getNodeId(e.target) !== d.id
      ));
      setSelectedNode(null);
      return;
    }
    if (activeTool === "connect") {
      if (!connectSource) { setConnectSource(d); return; }
      if (connectSource.id !== d.id) {
        setEdges(p => [...p, { source: connectSource.id, target: d.id, type: "custom" }]);
      }
      setConnectSource(null);
      return;
    }
    setSelectedNode(p => p?.id === d.id ? null : d);
  }

  // ── Add-paper search ──
  useEffect(() => {
    if (addQuery.length < 2) { setAddResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res  = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: addQuery }),
        });
        const data = await res.json();
        setAddResults((data.papers || []).slice(0, 6));
      } catch { setAddResults([]); }
      finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [addQuery]);

  function addPaperToMap(paper: any) {
    const n: MapNode = {
      id:        paper.id,
      title:     paper.title,
      year:      paper.publicationYear,
      citations: paper.citationCount,
      author:    paper.authors?.[0],
      field:     paper.field,
      type:      "custom",
      x:         300 + Math.random() * 300,
      y:         200 + Math.random() * 300,
    };
    if (nodes.find(x => x.id === n.id)) return;
    setNodes(p => [...p, n]);
    setEdges(p => [...p, { source: centerId, target: n.id, type: "custom" }]);
    setAddQuery(""); setAddResults([]); setShowAdd(false);
  }

  function zoom(dir: "in" | "out" | "fit") {
    if (!svgRef.current || !zoomRef.current) return;
    const s = d3.select(svgRef.current);
    if (dir === "in")  s.transition().duration(250).call(zoomRef.current.scaleBy, 1.3);
    if (dir === "out") s.transition().duration(250).call(zoomRef.current.scaleBy, 0.77);
    if (dir === "fit") s.transition().duration(400).call(zoomRef.current.transform, d3.zoomIdentity.translate(0, 0).scale(1));
  }

  const centerPaper = nodes.find(n => n.id === centerId);

  // ── Render ──
  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden select-none"
      style={{ background: "#0a0f1a", fontFamily: mono }}>

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-5 py-2.5 shrink-0 z-30"
        style={{ background: "#111827", borderBottom: "1px solid #1e2a3a" }}>

        {/* Left */}
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[12px] shrink-0 hover:opacity-70 transition-opacity"
            style={{ color: "#64748b" }}>
            <ArrowLeft size={13} /> Back
          </button>
          <div className="w-px h-4 shrink-0" style={{ background: "#1e2a3a" }} />
          {centerPaper && (
            <span className="text-[11px] truncate max-w-[280px]" style={{ color: "#475569" }}>
              {truncate(centerPaper.title, 55)}
            </span>
          )}
        </div>

        {/* Center */}
        <div className="flex items-center gap-6 shrink-0">
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "#1e2a3a" }}>
            <span style={{ color: "#e2e8f0" }}>{nodes.length}</span> nodes
          </span>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "#1e2a3a" }}>
            <span style={{ color: "#e2e8f0" }}>{edges.length}</span> edges
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          {editMode && (
            <>
              <button onClick={() => setShowAdd(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] border transition-all hover:opacity-80"
                style={{ background: "rgba(0,79,59,0.2)", borderColor: "rgba(0,188,125,0.3)", color: "#00bc7d" }}>
                <Plus size={12} /> Add Paper
              </button>
              <button
                onClick={() => { setEditMode(false); setActiveTool("select"); setConnectSource(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] border transition-all hover:opacity-80"
                style={{ background: "#1e2a3a", borderColor: "#334155", color: "#94a3b8" }}>
                <X size={12} /> Done
              </button>
            </>
          )}
          {!editMode && (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] border transition-all hover:opacity-80"
              style={{ background: "rgba(0,60,71,0.3)", borderColor: "rgba(59,201,219,0.25)", color: "#3bc9db" }}>
              <Plus size={12} /> Edit Map
            </button>
          )}
        </div>
      </header>

      {/* ── Canvas + panels ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left toolbar (edit mode) */}
        {editMode && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5"
            style={{ background: "#111827", border: "1px solid #1e2a3a", borderRadius: 10, padding: 6 }}>
            {([
              { t: "select"  as Tool, icon: <MousePointer size={14} />, tip: "Select"  },
              { t: "connect" as Tool, icon: <Link2        size={14} />, tip: "Connect" },
              { t: "delete"  as Tool, icon: <Trash2       size={14} />, tip: "Delete"  },
            ] as const).map(({ t, icon, tip }) => (
              <button key={t} title={tip}
                onClick={() => { setActiveTool(t); setConnectSource(null); }}
                className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                style={{
                  background:   activeTool === t ? "#1e2a3a" : "transparent",
                  color:        activeTool === t ? "#3bc9db" : "#475569",
                  border:       `1px solid ${activeTool === t ? "#3bc9db44" : "transparent"}`,
                }}>
                {icon}
              </button>
            ))}
          </div>
        )}

        {/* Connect hint banner */}
        {activeTool === "connect" && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full text-[11px] pointer-events-none"
            style={{ background: "#111827", border: `1px solid ${connectSource ? "#fbbf24" : "#3bc9db"}`, color: connectSource ? "#fbbf24" : "#3bc9db" }}>
            {connectSource ? "Now click the target node" : "Click a source node to start"}
          </div>
        )}

        {/* SVG canvas */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 size={18} className="animate-spin" style={{ color: "#3bc9db" }} />
              <p className="text-[12px] animate-pulse" style={{ color: "#3bc9db" }}>Building research map…</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "#1e2a3a" }}>
                citations · references · related works
              </p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[13px]" style={{ color: "#ef4444" }}>Error: {error}</p>
            </div>
          )}
          {!isLoading && !error && <svg ref={svgRef} className="w-full h-full" />}
        </div>

        {/* Right detail panel */}
        {selectedNode && (
          <aside className="w-72 shrink-0 overflow-y-auto z-10"
            style={{ background: "#111827", borderLeft: "1px solid #1e2a3a" }}>

            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid #1e2a3a" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full"
                  style={{ background: TYPE_CONFIG[selectedNode.type].border }} />
                <span className="text-[9px] uppercase tracking-widest"
                  style={{ color: TYPE_CONFIG[selectedNode.type].badgeText }}>
                  {NODE_LABELS[selectedNode.type]}
                </span>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ color: "#334155" }}>
                <X size={13} />
              </button>
            </div>

            {/* Panel body */}
            <div className="px-4 py-4 flex flex-col gap-5">
              <p className="text-[12px] leading-relaxed" style={{ color: "#e2e8f0" }}>
                {selectedNode.title}
              </p>

              {/* Meta rows */}
              <div className="flex flex-col gap-2.5"
                style={{ borderTop: "1px solid #1e2a3a", paddingTop: 12 }}>
                {[
                  { label: "Author",    value: selectedNode.author },
                  { label: "Year",      value: selectedNode.year?.toString() },
                  { label: "Citations", value: selectedNode.citations?.toLocaleString(), color: "#3bc9db" },
                  { label: "Field",     value: selectedNode.field },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-2">
                    <span className="text-[9px] uppercase tracking-widest shrink-0 mt-0.5"
                      style={{ color: "#334155" }}>{row.label}</span>
                    <span className="text-[11px] text-right"
                      style={{ color: row.color ?? "#64748b" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2" style={{ borderTop: "1px solid #1e2a3a", paddingTop: 12 }}>
                <button onClick={() => { window.location.href = `/paper/${selectedNode.id}`; }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-[11px] border transition-all hover:opacity-80"
                  style={{ background: "rgba(0,79,59,0.15)", borderColor: "rgba(0,188,125,0.25)", color: "#00bc7d" }}>
                  <BookOpen size={12} /> View Full Paper
                </button>
                <button onClick={() => { window.location.href = `/map/${selectedNode.id}`; }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-[11px] border transition-all hover:opacity-80"
                  style={{ background: "rgba(0,60,71,0.2)", borderColor: "rgba(59,201,219,0.2)", color: "#3bc9db" }}>
                  <Map size={12} /> Map This Paper
                </button>
                {editMode && (
                  <button onClick={() => {
                    setNodes(p => p.filter(n => n.id !== selectedNode!.id));
                    setEdges(p => p.filter(e =>
                      getNodeId(e.source) !== selectedNode!.id &&
                      getNodeId(e.target) !== selectedNode!.id
                    ));
                    setSelectedNode(null);
                  }}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-md text-[11px] border transition-all hover:opacity-80"
                    style={{ background: "rgba(139,8,54,0.15)", borderColor: "rgba(239,68,68,0.2)", color: "#f87171" }}>
                    <Trash2 size={12} /> Remove Node
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <footer className="flex items-center justify-between px-5 py-2 shrink-0 z-20"
        style={{ background: "#111827", borderTop: "1px solid #1e2a3a" }}>

        {/* Legend */}
        <div className="flex items-center gap-5">
          {(Object.keys(NODE_LABELS) as NodeType[]).map(type => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: TYPE_CONFIG[type].border }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: "#334155" }}>
                {NODE_LABELS[type]}
              </span>
            </div>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          {([
            { fn: () => zoom("out"), icon: <ZoomOut  size={13} /> },
            { fn: () => zoom("in"),  icon: <ZoomIn   size={13} /> },
            { fn: () => zoom("fit"), icon: <Maximize2 size={13} /> },
          ]).map((z, i) => (
            <button key={i} onClick={z.fn}
              className="w-7 h-7 flex items-center justify-center rounded transition-all hover:opacity-80"
              style={{ background: "#1e2a3a", color: "#475569" }}>
              {z.icon}
            </button>
          ))}
          <span className="text-[9px] ml-2 uppercase tracking-widest" style={{ color: "#1e2a3a" }}>
            scroll · drag · click
          </span>
        </div>
      </footer>

      {/* ── Add paper modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(10,15,26,0.85)" }}
          onClick={() => { setShowAdd(false); setAddQuery(""); setAddResults([]); }}>
          <div className="w-[540px] rounded-xl overflow-hidden shadow-2xl"
            style={{ background: "#111827", border: "1px solid #1e2a3a" }}
            onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-3.5"
              style={{ borderBottom: "1px solid #1e2a3a" }}>
              <Search size={13} style={{ color: "#334155" }} />
              <input autoFocus type="text" value={addQuery}
                onChange={e => setAddQuery(e.target.value)}
                placeholder="Search papers to add to map…"
                className="flex-1 bg-transparent text-[13px] text-white focus:outline-none"
                style={{ fontFamily: mono }} />
              {isSearching
                ? <Loader2 size={13} className="animate-spin" style={{ color: "#3bc9db" }} />
                : <button onClick={() => { setShowAdd(false); setAddQuery(""); setAddResults([]); }}
                    style={{ color: "#334155" }}><X size={13} /></button>
              }
            </div>

            {/* Modal results */}
            <div className="max-h-80 overflow-y-auto">
              {addResults.map((p, i) => (
                <button key={i} onClick={() => addPaperToMap(p)}
                  className="w-full flex flex-col gap-1 px-5 py-3 text-left transition-all hover:opacity-80"
                  style={{
                    borderBottom: "1px solid #1e2a3a",
                    background: i % 2 === 0 ? "#111827" : "#0d1520",
                  }}>
                  <span className="text-[12px] leading-snug line-clamp-2" style={{ color: "#e2e8f0" }}>
                    {p.title}
                  </span>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: "#334155" }}>
                    <span>{p.authors?.[0]}{p.authors?.length > 1 ? " et al." : ""}</span>
                    {p.publicationYear && <span>· {p.publicationYear}</span>}
                    <span style={{ color: "#3bc9db" }}>· {p.citationCount?.toLocaleString()} citations</span>
                  </div>
                </button>
              ))}
              {addQuery.length >= 2 && !isSearching && !addResults.length && (
                <p className="px-5 py-5 text-[12px]" style={{ color: "#334155" }}>No results found</p>
              )}
              {addQuery.length < 2 && (
                <p className="px-5 py-5 text-[11px] uppercase tracking-widest" style={{ color: "#1e2a3a" }}>
                  Type to search
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
