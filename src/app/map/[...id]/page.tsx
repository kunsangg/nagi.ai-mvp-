"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import * as d3 from "d3";
import {
  ArrowLeft, Plus, Trash2, Link2, MousePointer,
  Save, X, Search, Loader2, ZoomIn, ZoomOut, Maximize2
} from "lucide-react";

const NODE_COLORS = {
  center: "#3bc9db",
  reference: "#a78bfa",
  citing: "#fbbf24",
  related: "#94a3b8",
  custom: "#00bc7d",
};

const NODE_LABELS = {
  center: "Selected Paper",
  reference: "Referenced",
  citing: "Cites This",
  related: "Related",
  custom: "Added",
};

const EDGE_COLORS = {
  reference: "#a78bfa",
  citing: "#fbbf24",
  related: "#334155",
  custom: "#00bc7d",
};

type NodeType = "center" | "reference" | "citing" | "related" | "custom";
type EdgeType = "reference" | "citing" | "related" | "custom";

interface MapNode {
  id: string;
  title: string;
  year?: number;
  citations?: number;
  author?: string;
  field?: string;
  domain?: string;
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

type Tool = "select" | "connect" | "delete";

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

const mono = "'JetBrains Mono', 'Fira Code', monospace";

export default function MapPage() {
  const params = useParams();
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<MapNode, MapEdge> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [centerId, setCenterId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [connectSource, setConnectSource] = useState<MapNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Add paper
  const [showAddPaper, setShowAddPaper] = useState(false);
  const [addQuery, setAddQuery] = useState("");
  const [addResults, setAddResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam.map(decodeURIComponent).join("/") : (idParam as string);

  // --- Load map data ---
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

  // --- D3 render ---
  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;

    const container = svgRef.current.parentElement!;
    const W = container.clientWidth;
    const H = container.clientHeight;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", W).attr("height", H);

    // Grid background
    const defs = svg.append("defs");
    const pattern = defs.append("pattern")
      .attr("id", "grid").attr("width", 40).attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");
    pattern.append("path")
      .attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none").attr("stroke", "#1d293d").attr("stroke-width", 0.5);
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "url(#grid)");

    // Arrow markers
    const edgeTypes: EdgeType[] = ["reference", "citing", "related", "custom"];
    edgeTypes.forEach(type => {
      defs.append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10").attr("refX", 24)
        .attr("refY", 0).attr("markerWidth", 5).attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5")
        .attr("fill", EDGE_COLORS[type]);
    });

    const g = svg.append("g");
    gRef.current = g;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", event => g.attr("transform", event.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    const nodeRadius = (n: MapNode) => {
      if (n.type === "center") return 32;
      const max = Math.max(...nodes.map(x => x.citations || 0), 1);
      const scale = Math.log10((n.citations || 0) + 1) / Math.log10(max + 1);
      return 12 + scale * 16;
    };

    const simNodes: MapNode[] = nodes.map(n => ({ ...n }));
    const simEdges = edges.map(e => ({ ...e }));

    const simulation = d3.forceSimulation<MapNode>(simNodes)
      .force("link", d3.forceLink<MapNode, MapEdge>(simEdges)
        .id(d => d.id).distance(200).strength(0.3))
      .force("charge", d3.forceManyBody().strength(-700))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide().radius((d: any) => nodeRadius(d) + 24));
    simulationRef.current = simulation;

    // Edges
    const linkSel = g.append("g").selectAll("line")
      .data(simEdges).join("line")
      .attr("stroke", (d: any) => EDGE_COLORS[d.type as EdgeType])
      .attr("stroke-opacity", 0.5).attr("stroke-width", 1.5)
      .attr("marker-end", (d: any) => `url(#arrow-${d.type})`)
      .attr("cursor", "pointer")
      .on("click", (_, d: any) => {
        if (activeTool === "delete") {
          setEdges(prev => prev.filter(e =>
            !(getNodeId(e.source) === getNodeId(d.source) && getNodeId(e.target) === getNodeId(d.target))
          ));
        }
      });

    // Nodes
    const nodeSel = g.append("g").selectAll<SVGGElement, MapNode>("g")
      .data(simNodes).join("g")
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, MapNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      );

    // Node shadow glow
    nodeSel.append("circle")
      .attr("r", (d: MapNode) => nodeRadius(d) + 8)
      .attr("fill", (d: MapNode) => NODE_COLORS[d.type])
      .attr("opacity", 0.08);

    // Node body
    nodeSel.append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d: MapNode) => d.type === "center" ? NODE_COLORS[d.type] + "33" : "#0f1c36")
      .attr("stroke", (d: MapNode) => NODE_COLORS[d.type])
      .attr("stroke-width", (d: MapNode) => d.type === "center" ? 2.5 : 1.5)
      .on("mouseover", function (event, d) {
        d3.select(this).attr("fill", NODE_COLORS[d.type] + "44");
        setHoveredNode(d);
        setTooltipPos({ x: event.pageX, y: event.pageY });
      })
      .on("mousemove", event => setTooltipPos({ x: event.pageX, y: event.pageY }))
      .on("mouseout", function (_, d) {
        d3.select(this).attr("fill", d.type === "center" ? NODE_COLORS[d.type] + "33" : "#0f1c36");
        setHoveredNode(null);
      })
      .on("click", (_, d) => handleNodeClick(d));

    // Year inside node
    nodeSel.append("text")
      .text(d => d.year || "")
      .attr("text-anchor", "middle").attr("dy", "0.35em")
      .attr("font-size", d => d.type === "center" ? "11px" : "9px")
      .attr("font-family", mono)
      .attr("fill", d => d.type === "center" ? "#06051d" : NODE_COLORS[d.type])
      .attr("pointer-events", "none");

    // Title below node
    nodeSel.append("text")
      .text(d => truncate(d.title, 24))
      .attr("text-anchor", "middle")
      .attr("y", d => nodeRadius(d) + 16)
      .attr("font-size", "9px").attr("font-family", mono)
      .attr("fill", "#cad5e2").attr("pointer-events", "none");

    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      nodeSel.attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => simulation.stop();
  }, [nodes, edges]);

  function getNodeId(n: string | MapNode): string {
    return typeof n === "string" ? n : n.id;
  }

  function handleNodeClick(d: MapNode) {
    if (activeTool === "delete") {
      setNodes(prev => prev.filter(n => n.id !== d.id));
      setEdges(prev => prev.filter(e =>
        getNodeId(e.source) !== d.id && getNodeId(e.target) !== d.id
      ));
      setSelectedNode(null);
      return;
    }
    if (activeTool === "connect") {
      if (!connectSource) {
        setConnectSource(d);
      } else {
        if (connectSource.id !== d.id) {
          setEdges(prev => [...prev, { source: connectSource.id, target: d.id, type: "custom" }]);
        }
        setConnectSource(null);
      }
      return;
    }
    setSelectedNode(prev => prev?.id === d.id ? null : d);
  }

  // Search for papers to add
  useEffect(() => {
    if (addQuery.length < 2) { setAddResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: addQuery }),
        });
        const data = await res.json();
        setAddResults((data.papers || []).slice(0, 5));
      } catch { setAddResults([]); }
      finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [addQuery]);

  function addPaperToMap(paper: any) {
    const newNode: MapNode = {
      id: paper.id,
      title: paper.title,
      year: paper.publicationYear,
      citations: paper.citationCount,
      author: paper.authors?.[0],
      field: paper.field,
      domain: paper.domain,
      type: "custom",
      x: 400 + Math.random() * 200,
      y: 300 + Math.random() * 200,
    };
    if (nodes.find(n => n.id === newNode.id)) return;
    setNodes(prev => [...prev, newNode]);
    setEdges(prev => [...prev, { source: centerId, target: newNode.id, type: "custom" }]);
    setAddQuery("");
    setAddResults([]);
    setShowAddPaper(false);
  }

  function handleZoom(dir: "in" | "out" | "reset") {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    if (dir === "in") svg.transition().call(zoomRef.current.scaleBy, 1.3);
    else if (dir === "out") svg.transition().call(zoomRef.current.scaleBy, 0.7);
    else svg.transition().call(zoomRef.current.transform, d3.zoomIdentity);
  }

  const centerPaper = nodes.find(n => n.id === centerId);

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden"
      style={{ background: "#06051d", fontFamily: mono }}>

      {/* Top Nav */}
      <nav className="flex items-center justify-between px-6 py-2.5 shrink-0 z-20"
        style={{ background: "#1d293d", borderBottom: "1px solid #0f1c36" }}>

        {/* Left */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[12px] hover:opacity-70 transition-opacity"
            style={{ color: "#63b3ed" }}>
            <ArrowLeft size={13} /> Back
          </button>
          {centerPaper && (
            <span className="text-[11px] max-w-[300px] truncate" style={{ color: "#314062" }}>
              {truncate(centerPaper.title, 50)}
            </span>
          )}
        </div>

        {/* Center — stats */}
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest" style={{ color: "#314062" }}>
          <span><span className="text-white">{nodes.length}</span> papers</span>
          <span><span className="text-white">{edges.length}</span> connections</span>
        </div>

        {/* Right — mode toggle */}
        <div className="flex items-center gap-2">
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest border transition-all hover:opacity-80"
              style={{ background: "rgba(0,60,71,0.3)", borderColor: "rgba(59,201,219,0.2)", color: "#3bc9db" }}>
              <Plus size={12} /> Customize Map
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditMode(false); setActiveTool("select"); setConnectSource(null); setSelectedNode(null); }}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest border transition-all hover:opacity-80"
                style={{ background: "rgba(139,8,54,0.2)", borderColor: "rgba(255,255,255,0.1)", color: "#fff1f2" }}>
                <X size={12} /> Exit Edit
              </button>
              <button
                className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest border transition-all hover:opacity-80"
                style={{ background: "rgba(0,79,59,0.2)", borderColor: "rgba(255,255,255,0.1)", color: "#00bc7d" }}>
                <Save size={12} /> Save Map
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main canvas area */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Edit toolbar — left side */}
        {editMode && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
            {[
              { tool: "select" as Tool, icon: <MousePointer size={15} />, label: "Select" },
              { tool: "connect" as Tool, icon: <Link2 size={15} />, label: "Connect" },
              { tool: "delete" as Tool, icon: <Trash2 size={15} />, label: "Delete" },
            ].map(t => (
              <button key={t.tool}
                onClick={() => { setActiveTool(t.tool); setConnectSource(null); }}
                title={t.label}
                className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all"
                style={{
                  background: activeTool === t.tool ? "#314062" : "#0f1c36",
                  borderColor: activeTool === t.tool ? "#3bc9db" : "#1d293d",
                  color: activeTool === t.tool ? "#3bc9db" : "#314062",
                }}>
                {t.icon}
              </button>
            ))}
            <div style={{ height: 1, background: "#1d293d", margin: "4px 0" }} />
            <button
              onClick={() => setShowAddPaper(true)}
              title="Add Paper"
              className="w-9 h-9 rounded-lg flex items-center justify-center border transition-all"
              style={{ background: "rgba(0,79,59,0.2)", borderColor: "rgba(0,188,125,0.3)", color: "#00bc7d" }}>
              <Plus size={15} />
            </button>
          </div>
        )}

        {/* Zoom controls — bottom right */}
        <div className="absolute right-4 bottom-8 z-20 flex flex-col gap-2">
          {[
            { fn: () => handleZoom("in"), icon: <ZoomIn size={14} /> },
            { fn: () => handleZoom("out"), icon: <ZoomOut size={14} /> },
            { fn: () => handleZoom("reset"), icon: <Maximize2 size={14} /> },
          ].map((z, i) => (
            <button key={i} onClick={z.fn}
              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all hover:opacity-80"
              style={{ background: "#0f1c36", borderColor: "#1d293d", color: "#314062" }}>
              {z.icon}
            </button>
          ))}
        </div>

        {/* Legend — bottom left */}
        <div className="absolute left-16 bottom-6 z-20 flex items-center gap-5">
          {Object.entries(NODE_LABELS).map(([type, label]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: NODE_COLORS[type as NodeType] }} />
              <span className="text-[9px] uppercase tracking-widest" style={{ color: "#314062" }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Connect mode hint */}
        {activeTool === "connect" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full text-[11px] uppercase tracking-widest"
            style={{ background: "#1d293d", border: "1px solid #314062", color: connectSource ? "#fbbf24" : "#3bc9db" }}>
            {connectSource ? `Now click target node to connect` : "Click source node to start connection"}
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 size={20} className="animate-spin" style={{ color: "#3bc9db" }} />
              <div className="text-[12px] animate-pulse" style={{ color: "#3bc9db" }}>Building research map...</div>
              <div className="text-[10px] uppercase tracking-widest" style={{ color: "#314062" }}>
                Fetching citations · references · related works
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[13px]" style={{ color: "#ff2056" }}>Error: {error}</div>
            </div>
          )}
          {!isLoading && !error && (
            <svg ref={svgRef} className="w-full h-full" />
          )}
          {!isLoading && !error && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-widest" style={{ color: "#1d293d" }}>
              Scroll to zoom · Drag nodes · Click to select
            </div>
          )}
        </div>

        {/* Selected node panel */}
        {selectedNode && activeTool === "select" && (
          <div className="w-[280px] shrink-0 overflow-y-auto border-l z-10"
            style={{ background: "#06051d", borderColor: "#1d293d" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#1d293d" }}>
              <span className="text-[9px] uppercase tracking-widest"
                style={{ color: NODE_COLORS[selectedNode.type] }}>
                {NODE_LABELS[selectedNode.type]}
              </span>
              <button onClick={() => setSelectedNode(null)} style={{ color: "#314062" }}>
                <X size={13} />
              </button>
            </div>
            <div className="px-4 py-4 flex flex-col gap-4">
              <p className="text-[12px] text-white leading-snug">{selectedNode.title}</p>
              <div className="flex flex-col gap-2">
                {[
                  { label: "Author", value: selectedNode.author },
                  { label: "Year", value: selectedNode.year },
                  { label: "Citations", value: selectedNode.citations?.toLocaleString(), color: "#3bc9db" },
                  { label: "Field", value: selectedNode.field },
                ].filter(r => r.value).map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-widest" style={{ color: "#314062" }}>{row.label}</span>
                    <span className="text-[11px] truncate max-w-[160px]" style={{ color: row.color || "#cad5e2" }}>{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  onClick={() => { window.location.href = `/paper/${selectedNode.id}`; }}
                  className="w-full py-2 rounded-full text-[10px] uppercase tracking-widest border transition-all hover:opacity-80"
                  style={{ background: "rgba(0,79,59,0.2)", borderColor: "rgba(255,255,255,0.1)", color: "#00bc7d" }}>
                  View Full Paper
                </button>
                <button
                  onClick={() => { window.location.href = `/map/${selectedNode.id}`; }}
                  className="w-full py-2 rounded-full text-[10px] uppercase tracking-widest border transition-all hover:opacity-80"
                  style={{ background: "rgba(0,60,71,0.3)", borderColor: "rgba(59,201,219,0.2)", color: "#3bc9db" }}>
                  Map This Paper
                </button>
                {editMode && (
                  <button
                    onClick={() => {
                      setNodes(prev => prev.filter(n => n.id !== selectedNode.id));
                      setEdges(prev => prev.filter(e =>
                        getNodeId(e.source) !== selectedNode.id && getNodeId(e.target) !== selectedNode.id
                      ));
                      setSelectedNode(null);
                    }}
                    className="w-full py-2 rounded-full text-[10px] uppercase tracking-widest border transition-all hover:opacity-80"
                    style={{ background: "rgba(139,8,54,0.2)", borderColor: "rgba(255,255,255,0.1)", color: "#fff1f2" }}>
                    Remove Node
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      {hoveredNode && !selectedNode && (
        <div className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg"
          style={{
            left: tooltipPos.x + 14, top: tooltipPos.y - 10,
            background: "#1d293d", border: "1px solid #314062",
            color: "#cad5e2", fontFamily: mono, maxWidth: 220,
          }}>
          <div className="text-[11px] text-white mb-0.5">{truncate(hoveredNode.title, 50)}</div>
          <div className="text-[10px]" style={{ color: "#314062" }}>
            {hoveredNode.author} · {hoveredNode.year}
          </div>
          <div className="text-[9px] uppercase tracking-widest mt-1"
            style={{ color: NODE_COLORS[hoveredNode.type] }}>
            {NODE_LABELS[hoveredNode.type]}
          </div>
        </div>
      )}

      {/* Add Paper overlay */}
      {showAddPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(6,5,29,0.85)" }}
          onClick={() => { setShowAddPaper(false); setAddQuery(""); setAddResults([]); }}>
          <div className="w-[520px] rounded-xl overflow-hidden"
            style={{ background: "#0f1c36", border: "1px solid #1d293d" }}
            onClick={e => e.stopPropagation()}>

            {/* Search header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "#1d293d" }}>
              <Search size={14} style={{ color: "#314062" }} />
              <input
                autoFocus
                type="text"
                value={addQuery}
                onChange={e => setAddQuery(e.target.value)}
                placeholder="Search for a paper to add..."
                className="flex-1 bg-transparent text-[13px] text-white focus:outline-none"
                style={{ fontFamily: mono }}
              />
              {isSearching && <Loader2 size={13} className="animate-spin" style={{ color: "#3bc9db" }} />}
              <button onClick={() => { setShowAddPaper(false); setAddQuery(""); setAddResults([]); }}
                style={{ color: "#314062" }}>
                <X size={14} />
              </button>
            </div>

            {/* Results */}
            {addResults.length > 0 && (
              <div className="flex flex-col max-h-[360px] overflow-y-auto">
                {addResults.map((paper, i) => (
                  <button key={i}
                    onClick={() => addPaperToMap(paper)}
                    className="flex flex-col gap-1 px-5 py-3.5 text-left border-b transition-all hover:opacity-80"
                    style={{ borderColor: "#1d293d", background: i % 2 === 0 ? "#0f1c36" : "#06051d" }}>
                    <span className="text-[12px] text-white leading-snug line-clamp-2">{paper.title}</span>
                    <div className="flex items-center gap-2 text-[10px]" style={{ color: "#314062" }}>
                      <span>{paper.authors?.[0]}{paper.authors?.length > 1 ? " et al." : ""}</span>
                      <span>· {paper.publicationYear}</span>
                      <span style={{ color: "#3bc9db" }}>· {paper.citationCount?.toLocaleString()} citations</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {addQuery.length >= 2 && !isSearching && addResults.length === 0 && (
              <div className="px-5 py-6 text-[12px]" style={{ color: "#314062" }}>No papers found</div>
            )}

            {addQuery.length < 2 && (
              <div className="px-5 py-6 text-[11px] uppercase tracking-widest" style={{ color: "#314062" }}>
                Type at least 2 characters to search
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
