"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import * as d3 from "d3";
import {
  ArrowLeft, Plus, Trash2, Link2, MousePointer,
  X, Search, Loader2, ZoomIn, ZoomOut,
  Maximize2, BookOpen, Map, LayoutGrid,
  Square, Circle, Diamond, Type
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────
type NodeType = "center" | "reference" | "citing" | "related" | "custom";
type EdgeType = "reference" | "citing" | "related" | "custom";
type Tool = "select" | "connect" | "delete";
type NodeShape = "rect" | "circle" | "diamond";

interface MapNode {
  id: string;
  title: string;
  year?: number;
  citations?: number;
  author?: string;
  field?: string;
  type: NodeType;
  shape?: NodeShape;
  color?: string;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
}

interface MapEdge {
  id?: string;
  source: string | MapNode;
  target: string | MapNode;
  type: EdgeType;
  label?: string;
}

// ── Visual config ──────────────────────────────────────────
const NODE_W = 220;
const NODE_H = 90;

const TYPE_CFG: Record<NodeType, {
  border: string; accent: string; badge: string; label: string
}> = {
  center:    { border: "#3bc9db", accent: "#3bc9db", badge: "#3bc9db18", label: "SELECTED PAPER"   },
  reference: { border: "#0284c7", accent: "#0284c7", badge: "#0284c718", label: "REFERENCED BY THIS" },
  citing:    { border: "#0ea5e9", accent: "#0ea5e9", badge: "#0ea5e918", label: "CITES THIS PAPER"  },
  related:   { border: "#38bdf8", accent: "#38bdf8", badge: "#38bdf818", label: "RELATED WORK"       },
  custom:    { border: "#22d3ee", accent: "#22d3ee", badge: "#22d3ee18", label: "CUSTOM NODE"        },
};

const EDGE_COLOR: Record<EdgeType, string> = {
  reference: "#0284c7",
  citing:    "#0ea5e9",
  related:   "#0284c7",
  custom:    "#22d3ee",
};

const NODE_LABEL: Record<NodeType, string> = Object.fromEntries(
  Object.entries(TYPE_CFG).map(([k, v]) => [k, v.label])
) as Record<NodeType, string>;

// ── Layout positions ───────────────────────────────────────
function assignPositions(nodes: any[], centerId: string, W: number, H: number): MapNode[] {
  const cx = W / 2;
  const cy = H / 2;
  const result: MapNode[] = [];

  const byType: Record<string, any[]> = {
    center: [], reference: [], citing: [], related: [], custom: []
  };
  nodes.forEach(n => byType[n.type]?.push(n));

  // Center
  byType.center.forEach(n => result.push({ ...n, x: cx, y: cy }));

  // Helper for linear vertical layout with a slight arc
  const placeNodes = (list: any[], xOffset: number, arcAmount: number) => {
    const spacingY = 140; // Spacious 140px vertical space to prevent any overlapping
    const totalH = (list.length - 1) * spacingY;
    const startY = cy - totalH / 2;

    list.forEach((n, i) => {
      const y = startY + i * spacingY;
      // Parabola for arc effect: 0 at center, `arcAmount` at ends
      const distFromCenter = list.length > 1 ? Math.abs(y - cy) / (totalH / 2) : 0; 
      const x = cx + xOffset + arcAmount * (distFromCenter * distFromCenter);
      result.push({ ...n, x, y });
    });
  };

  // References — left side (Spaced out to x: -400)
  placeNodes(byType.reference, -420, -100);

  // Citing — right side (Spaced out to x: +400)
  placeNodes(byType.citing, 420, 100);

  // Related — top + bottom
  const relatedTop = byType.related.slice(0, Math.ceil(byType.related.length / 2));
  const relatedBot = byType.related.slice(Math.ceil(byType.related.length / 2));

  const placeHorizontal = (list: any[], yOffset: number) => {
    const spacingX = 260; // Spacious horizontal gap
    const totalW = (list.length - 1) * spacingX;
    const startX = cx - totalW / 2;
    list.forEach((n, i) => {
      result.push({ ...n, x: startX + i * spacingX, y: cy + yOffset });
    });
  };

  placeHorizontal(relatedTop, -240);
  placeHorizontal(relatedBot, 240);

  // Custom — scatter below (if they don't already have positions set that differ from 0,0)
  byType.custom.forEach((n, i) => {
    if (n.x && n.y) result.push(n);
    else result.push({ ...n, x: cx - 200 + i * 260, y: cy + 380 });
  });

  return result;
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function getId(n: string | MapNode): string {
  return typeof n === "string" ? n : n.id;
}

const FONT = "'Inter', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

// Custom SVG path generators
function getShapePath(shape: NodeShape = "rect", w: number, h: number) {
  const hw = w / 2;
  const hh = h / 2;
  if (shape === "circle") {
    const r = hh;
    return `M ${-hw + r} ${-hh} L ${hw - r} ${-hh} A ${r} ${r} 0 0 1 ${hw} 0 A ${r} ${r} 0 0 1 ${hw - r} ${hh} L ${-hw + r} ${hh} A ${r} ${r} 0 0 1 ${-hw} 0 A ${r} ${r} 0 0 1 ${-hw + r} ${-hh} Z`;
  }
  if (shape === "diamond") {
    const offset = 40;
    return `M 0 ${-hh - 20} L ${hw + offset} 0 L 0 ${hh + 20} L ${-hw - offset} 0 Z`;
  }
  const r = 8;
  return `M ${-hw + r} ${-hh} L ${hw - r} ${-hh} A ${r} ${r} 0 0 1 ${hw} ${-hh + r} L ${hw} ${hh - r} A ${r} ${r} 0 0 1 ${hw - r} ${hh} L ${-hw + r} ${hh} A ${r} ${r} 0 0 1 ${-hw} ${hh - r} L ${-hw} ${-hh + r} A ${r} ${r} 0 0 1 ${-hw + r} ${-hh} Z`;
}

// ── Component ──────────────────────────────────────────────
export default function MapPage() {
  const params = useParams();
  const router = useRouter();
  const svgRef  = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [nodes,     setNodes]     = useState<MapNode[]>([]);
  const [edges,     setEdges]     = useState<MapEdge[]>([]);
  const [centerId,  setCenterId]  = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error,     setError]     = useState("");
  const [dims,      setDims]      = useState({ w: 1400, h: 800 });

  const [editMode,       setEditMode]       = useState(false);
  const [activeTool,     setActiveTool]     = useState<Tool>("select");
  const [selectedNode,   setSelectedNode]   = useState<MapNode | null>(null);
  const [selectedEdge,   setSelectedEdge]   = useState<MapEdge | null>(null);
  const [connectSource,  setConnectSource]  = useState<MapNode | null>(null);

  const [showAdd,     setShowAdd]     = useState(false);
  const [addQuery,    setAddQuery]    = useState("");
  const [addResults,  setAddResults]  = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam.map(decodeURIComponent).join("/") : (idParam as string);

  // ── Actions ──
  const removeNode = useCallback((nodeId: string) => {
    setNodes(p => p.filter(n => n.id !== nodeId));
    setEdges(p => p.filter(e => getId(e.source) !== nodeId && getId(e.target) !== nodeId));
    if (selectedNode?.id === nodeId) setSelectedNode(null);
  }, [selectedNode]);

  const addQuickNote = useCallback((sourceId: string) => {
    const source = nodes.find(n => n.id === sourceId);
    if (!source) return;
    const newNodeId = "node_" + Date.now();
    const offsetW = source.shape === "diamond" ? NODE_W/2 + 60 : NODE_W/2 + 20;
    const n: MapNode = {
      id: newNodeId, title: "New Note", type: "custom", shape: "rect",
      x: source.x + offsetW + 150, y: source.y + 80
    };
    setNodes(p => [...p, n]);
    setEdges(p => [...p, { id: "edge_" + Date.now(), source: sourceId, target: newNodeId, type: "custom" }]);
    setSelectedNode(n); // auto select to open right panel
  }, [nodes]);

  // ── Measure canvas ──
  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Fetch ──
  useEffect(() => {
    if (!id) return;
    
    setLoadingProgress(0);
    const progressInterval = setInterval(() => {
      setLoadingProgress(p => {
        const diff = 90 - p;
        const inc = Math.max(0.2, diff * 0.05);
        return p + inc;
      });
    }, 50);

    fetch(`/api/map?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { 
          setError(data.error); 
          setIsLoading(false); 
          clearInterval(progressInterval);
          return; 
        }
        const positioned = assignPositions(data.nodes, data.center, dims.w, dims.h);
        setNodes(positioned);
        setEdges(data.edges.map((e: any, i: number) => ({ ...e, id: e.id || `edge_${Date.now()}_${i}` })));
        setCenterId(data.center);
        
        clearInterval(progressInterval);
        setLoadingProgress(100);
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      })
      .catch(() => { 
        setError("Failed to load map"); 
        setIsLoading(false); 
        clearInterval(progressInterval);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── D3 render ──
  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;
    const { w: W, h: H } = dims;
    const el = svgRef.current;

    d3.select(el).selectAll("*").remove();
    const svg = d3.select(el).attr("width", W).attr("height", H);
    const defs = svg.append("defs");

    // Dot grid
    const pat = defs.append("pattern")
      .attr("id", "dotgrid").attr("width", 28).attr("height", 28)
      .attr("patternUnits", "userSpaceOnUse");
    pat.append("circle").attr("cx", 1).attr("cy", 1).attr("r", 1).attr("fill", "#1a1a1a");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "url(#dotgrid)");

    // Arrow markers
    (Object.keys(EDGE_COLOR) as EdgeType[]).forEach(t => {
      defs.append("marker")
        .attr("id",          `arr-${t}`)
        .attr("viewBox",     "0 -4 9 8")
        .attr("refX",        9)
        .attr("refY",        0)
        .attr("markerWidth", 6)
        .attr("markerHeight",6)
        .attr("orient",      "auto")
        .append("path")
        .attr("d",    "M0,-4L9,0L0,4")
        .attr("fill", EDGE_COLOR[t]);
    });

    // Dash array edges
    defs.append("marker")
      .attr("id",          `arr-dashed`)
      .attr("viewBox",     "0 -4 9 8")
      .attr("refX",        9)
      .attr("refY",        0)
      .attr("markerWidth", 6)
      .attr("markerHeight",6)
      .attr("orient",      "auto")
      .append("path")
      .attr("d",    "M0,-4L9,0L0,4")
      .attr("fill", "#94a3b8");

    // Drop shadow filter
    const filt = defs.append("filter").attr("id", "shadow")
      .attr("x", "-20%").attr("y", "-20%").attr("width", "140%").attr("height", "140%");
    filt.append("feDropShadow")
      .attr("dx", 0).attr("dy", 4).attr("stdDeviation", 8)
      .attr("flood-color", "#000").attr("flood-opacity", 0.5);

    // Zoom + pan
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", ev => g.attr("transform", ev.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    // ── Draw edges first (behind nodes) ──
    const edgeG = g.append("g").attr("class", "edges");

    function edgePath(e: MapEdge): string {
      const s = typeof e.source === "string" ? nodes.find(n => n.id === e.source) : e.source as MapNode;
      const t = typeof e.target === "string" ? nodes.find(n => n.id === e.target) : e.target as MapNode;
      if (!s || !t) return "";

      const dx = t.x - s.x;
      const dy = t.y - s.y;
      let sx: number, sy: number, tx: number, ty: number;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) {
          sx = s.x + (s.shape === "diamond" ? NODE_W/2 + 40 : NODE_W/2); sy = s.y;
          tx = t.x - (t.shape === "diamond" ? NODE_W/2 + 40 : NODE_W/2); ty = t.y;
        } else {
          sx = s.x - (s.shape === "diamond" ? NODE_W/2 + 40 : NODE_W/2); sy = s.y;
          tx = t.x + (t.shape === "diamond" ? NODE_W/2 + 40 : NODE_W/2); ty = t.y;
        }
        const mx = (sx + tx) / 2;
        return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
      } else {
        if (dy > 0) {
          sx = s.x; sy = s.y + (s.shape === "diamond" ? NODE_H/2 + 20 : NODE_H/2);
          tx = t.x; ty = t.y - (t.shape === "diamond" ? NODE_H/2 + 20 : NODE_H/2);
        } else {
          sx = s.x; sy = s.y - (s.shape === "diamond" ? NODE_H/2 + 20 : NODE_H/2);
          tx = t.x; ty = t.y + (t.shape === "diamond" ? NODE_H/2 + 20 : NODE_H/2);
        }
        const my = (sy + ty) / 2;
        return `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`;
      }
    }

        const linkSel = edgeG.selectAll<SVGGElement, MapEdge>("g.edge")
      .data(edges, (d: any) => d.id || `${getId(d.source)}-${getId(d.target)}`)
      .join("g")
      .attr("class", "edge")
      .attr("cursor", "pointer")
      .on("click", (ev, d) => {
        setSelectedNode(null);
        setSelectedEdge(d);
      });

    linkSel.selectAll("path.link").data(d => [d]).join("path")
      .attr("class", "link")
      .attr("fill",           "none")
      .attr("stroke",         (d: any) => d.type === "custom" ? (nodes.find(n => n.id === getId(d.source))?.color || EDGE_COLOR.custom) : EDGE_COLOR[d.type as EdgeType])
      .attr("stroke-width",   1.5)
      .attr("stroke-opacity", 0.7)
      .attr("stroke-dasharray", (d: any) => d.type === "custom" ? "4,4" : "none")
      .attr("marker-end",     (d: any) => d.type === "custom" ? `url(#arr-dashed)` : `url(#arr-${d.type})`)
      .attr("d",              edgePath as any);

    linkSel.each(function(d: MapEdge) {
      const group = d3.select(this);
      group.selectAll("g.label").remove();
      if (d.label) {
        const s = typeof d.source === "string" ? nodes.find(n => n.id === d.source) : d.source as MapNode;
        const t = typeof d.target === "string" ? nodes.find(n => n.id === d.target) : d.target as MapNode;
        if (!s || !t) return;

        const dx = t.x - s.x;
        const dy = t.y - s.y;
        let mx, my;
        
        if (Math.abs(dx) > Math.abs(dy)) {
          let sx = s.x + (s.shape === "diamond" ? NODE_W/2 + 40 : (dx > 0 ? NODE_W/2 : -NODE_W/2));
          let tx = t.x - (t.shape === "diamond" ? NODE_W/2 + 40 : (dx > 0 ? NODE_W/2 : -NODE_W/2));
          mx = (sx + tx) / 2;
          my = (s.y + t.y) / 2;
        } else {
          let sy = s.y + (s.shape === "diamond" ? NODE_H/2 + 20 : (dy > 0 ? NODE_H/2 : -NODE_H/2));
          let ty = t.y - (t.shape === "diamond" ? NODE_H/2 + 20 : (dy > 0 ? NODE_H/2 : -NODE_H/2));
          mx = (s.x + t.x) / 2;
          my = (sy + ty) / 2;
        }

        const lbl = group.append("g").attr("class", "label").attr("transform", `translate(${mx}, ${my})`);
        lbl.append("rect").attr("rx", 10).attr("fill", "#050505").attr("stroke", "#1a1a1a");
        const txt = lbl.append("text").attr("text-anchor", "middle").attr("dominant-baseline", "central")
          .attr("font-family", FONT).attr("font-size", "10px").attr("fill", "#38bdf8").text(d.label);
        
        try {
          const node = txt.node();
          if (node) {
            const bbox = node.getBBox();
            lbl.select("rect").attr("x", bbox.x - 10).attr("y", bbox.y - 4).attr("width", bbox.width + 20).attr("height", bbox.height + 8);
          }
        } catch(e) {}
      }
    });

    // ── Draw nodes ──
    const nodeG = g.append("g").attr("class", "nodes");

    const nodeSel = nodeG.selectAll<SVGGElement, MapNode>("g")
      .data(nodes, (d: MapNode) => d.id)
      .join("g")
      .attr("transform", (d: MapNode) => `translate(${d.x},${d.y})`)
      .attr("cursor", "pointer")
      .call(
        d3.drag<SVGGElement, MapNode>()
          .on("start", function (ev, d) { d3.select(this).raise(); })
          .on("drag", function (ev, d) {
            d.x = ev.x; d.y = ev.y;
            d3.select(this).attr("transform", `translate(${ev.x},${ev.y})`);
            linkSel.selectAll("path.link").attr("d", edgePath as any);
            // Re-render to update labels correctly on drop/drag is handled by state update on end, so this is fine for live drag.
          })
          .on("end", function (ev, d) {
            setNodes(prev => prev.map(n => n.id === d.id ? { ...n, x: ev.x, y: ev.y } : n));
          })
      )
      .on("click", function (_ev, d) {
        handleNodeClick(d);
      });

    // Background shadow (dynamic shape)
    nodeSel.append("path")
      .attr("d", d => getShapePath(d.shape, NODE_W, NODE_H))
      .attr("fill", "rgba(0,0,0,0.8)")
      .attr("filter", "url(#shadow)")
      .attr("transform", "translate(0, 4)");

    // Card body (dynamic shape)
    nodeSel.append("path")
      .attr("d", d => getShapePath(d.shape, NODE_W, NODE_H))
      .attr("fill", (d: MapNode) => d.type === "center" ? "#1a1a1a" : (d.shape === "diamond" ? "#0f0f0f" : "#050505"))
      .attr("stroke", (d: MapNode) => d.color || TYPE_CFG[d.type].border)
      .attr("stroke-width", (d: MapNode) => d.color ? 2 : ((d.type === "center" || d.shape === "diamond") ? 1.5 : 1));

    // Accent stripe (only for rect shape)
    nodeSel.filter(d => d.shape === "rect" || !d.shape)
      .append("path")
      .attr("d", `M ${-NODE_W/2 + 8} ${-NODE_H/2} L ${-NODE_W/2 + 11} ${-NODE_H/2} L ${-NODE_W/2 + 11} ${NODE_H/2} L ${-NODE_W/2 + 8} ${NODE_H/2} A 8 8 0 0 1 ${-NODE_W/2} ${NODE_H/2 - 8} L ${-NODE_W/2} ${-NODE_H/2 + 8} A 8 8 0 0 1 ${-NODE_W/2 + 8} ${-NODE_H/2} Z`)
      .attr("fill", d => d.color || TYPE_CFG[d.type].accent);

    // Type badge (only for rect)
    nodeSel.filter(d => d.shape === "rect" || !d.shape)
      .append("rect")
      .attr("x", -NODE_W/2 + 20).attr("y", -NODE_H/2 + 10)
      .attr("width", 74).attr("height", 16).attr("rx", 3)
      .attr("fill", d => d.color ? d.color + "20" : TYPE_CFG[d.type].badge);

    nodeSel.filter(d => d.shape === "rect" || !d.shape)
      .append("text")
      .text(d => TYPE_CFG[d.type].label)
      .attr("x", -NODE_W/2 + 57).attr("y", -NODE_H/2 + 22)
      .attr("text-anchor", "middle").attr("font-size", "7px")
      .attr("font-weight", "600").attr("letter-spacing", "0.08em")
      .attr("font-family", MONO)
      .attr("fill", d => d.color || TYPE_CFG[d.type].accent)
      .attr("pointer-events", "none");

    // Title — wrapped
    nodeSel.each(function (d: MapNode) {
      const grp   = d3.select(this);
      const title = truncate(d.title, d.shape === "diamond" ? 40 : 52);
      const words = title.split(" ");
      const half  = Math.ceil(words.length / 2);
      const line1 = words.slice(0, half).join(" ");
      const line2 = words.slice(half).join(" ");

      const t = grp.append("text")
        .attr("text-anchor", "middle")
        .attr("font-size",   d.type === "center" ? "12px" : "11px")
        .attr("font-weight", d.type === "center" ? "600" : "500")
        .attr("font-family", FONT)
        .attr("fill",        d.type === "center" ? "#f1f5f9" : "#cbd5e1")
        .attr("pointer-events", "none");

      const yOffset = (d.shape === "rect" || !d.shape) ? 4 : 0;
      t.append("tspan").text(line1).attr("x", (d.shape === "rect" || !d.shape) ? 10 : 0).attr("y", line2 ? -6 + yOffset : yOffset);
      if (line2) t.append("tspan").text(line2).attr("x", (d.shape === "rect" || !d.shape) ? 10 : 0).attr("dy", "1.4em");
    });

    // Bottom meta row (only for rect)
    nodeSel.filter(d => d.shape === "rect" || !d.shape)
      .append("text")
      .attr("x", 10).attr("y", NODE_H/2 - 12)
      .attr("text-anchor", "middle").attr("font-size", "9px")
      .attr("font-family", MONO).attr("fill", "#334155")
      .attr("pointer-events", "none")
      .text(d => {
        const parts = [];
        if (d.year)      parts.push(d.year);
        if (d.citations) parts.push(`${d.citations.toLocaleString()} cit.`);
        return parts.join("  ·  ");
      });

    // Port dots (left + right) - adjusted for shape
    nodeSel.each(function(d: MapNode) {
      const s = d3.select(this);
      const offsetW = d.shape === "diamond" ? NODE_W/2 + 40 : NODE_W/2;
      [-offsetW, offsetW].forEach(px => {
        s.append("circle")
          .attr("cx", px).attr("cy", 0).attr("r", 4)
          .attr("fill", "#151515")
          .attr("stroke", d.color || "#334155")
          .attr("stroke-width", 1.5);
      });
    });

    // Selected ring
    nodeSel.append("path")
      .attr("class",   "sel-ring")
      .attr("d", d => getShapePath(d.shape, NODE_W + 12, NODE_H + 12))
      .attr("fill",   "none")
      .attr("stroke", d => d.color || TYPE_CFG[d.type].border)
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,3")
      .attr("opacity", d => d.id === selectedNode?.id ? 1 : 0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, dims]);

  // ── Node Controls Overlay ──
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    // Update selection ring opacity
    svg.selectAll<SVGPathElement, MapNode>(".sel-ring")
      .attr("opacity", (d: MapNode) => d.id === selectedNode?.id ? 1 : 0);

    const g = svg.select("g");
    g.selectAll(".node-controls").remove();

    if (editMode && selectedNode) {
      const node = nodes.find(n => n.id === selectedNode.id);
      if (node) {
        const cg = g.append("g")
          .attr("class", "node-controls")
          .attr("transform", `translate(${node.x}, ${node.y})`);

        // offset for shape
        const offsetW = node.shape === "diamond" ? NODE_W/2 + 40 : NODE_W/2;
        const offsetH = node.shape === "diamond" ? NODE_H/2 + 20 : NODE_H/2;

        // Delete button (top right)
        const delBtn = cg.append("g").attr("cursor", "pointer")
          .attr("transform", `translate(${offsetW + 5}, ${-offsetH - 5})`)
          .on("click", (ev) => {
            ev.stopPropagation();
            removeNode(node.id);
          });
        delBtn.append("circle").attr("r", 12).attr("fill", "#ef4444").attr("stroke", "#0a0a0a").attr("stroke-width", 2);
        delBtn.append("path").attr("d", "M -4 -4 L 4 4 M 4 -4 L -4 4").attr("stroke", "#fff").attr("stroke-width", 2);

        // Add Note button (right)
        const addBtn = cg.append("g").attr("cursor", "pointer")
          .attr("transform", `translate(${offsetW + 20}, 0)`)
          .on("click", (ev) => {
            ev.stopPropagation();
            addQuickNote(node.id);
          });
        addBtn.append("circle").attr("r", 14).attr("fill", "#22d3ee").attr("stroke", "#0a0a0a").attr("stroke-width", 2);
        addBtn.append("path").attr("d", "M -6 0 L 6 0 M 0 -6 L 0 6").attr("stroke", "#fff").attr("stroke-width", 2);

        // Connect button (bottom right)
        const connectBtn = cg.append("g").attr("cursor", "pointer")
          .attr("transform", `translate(${offsetW + 5}, ${offsetH + 5})`)
          .on("click", (ev) => {
            ev.stopPropagation();
            setActiveTool("connect");
            setConnectSource(node);
          });
        connectBtn.append("circle").attr("r", 12).attr("fill", "#10b981").attr("stroke", "#0a0a0a").attr("stroke-width", 2);
        connectBtn.append("path").attr("d", "M -4 -2 L 4 -2 M 4 -2 L 2 -4 M 4 -2 L 2 0 M -4 2 L -4 2").attr("stroke", "#fff").attr("stroke-width", 2).attr("fill", "none");
      }
    }
  }, [selectedNode, editMode, nodes, removeNode, addQuickNote]);

  // ── Handlers ──
  function handleNodeClick(d: MapNode) {
    if (activeTool === "delete") {
      removeNode(d.id);
      return;
    }
    if (activeTool === "connect") {
      if (!connectSource) { setConnectSource(d); return; }
      if (connectSource.id !== d.id) {
        setEdges(p => [...p, { id: "edge_" + Date.now(), source: connectSource.id, target: d.id, type: "custom" }]);
      }
      setConnectSource(null);
      return;
    }
    setSelectedNode(p => p?.id === d.id ? null : d);
  }

  function doZoom(dir: "in" | "out" | "fit") {
    if (!svgRef.current || !zoomRef.current) return;
    const s = d3.select(svgRef.current);
    if (dir === "in")  s.transition().duration(220).call(zoomRef.current.scaleBy, 1.3);
    if (dir === "out") s.transition().duration(220).call(zoomRef.current.scaleBy, 0.77);
    if (dir === "fit") s.transition().duration(350).call(zoomRef.current.transform, d3.zoomIdentity.translate(0,0).scale(1));
  }

  // ── Add Paper ──
  useEffect(() => {
    if (addQuery.length < 2) { setAddResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const r = await fetch("/api/search", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: addQuery }),
        });
        const d = await r.json();
        setAddResults((d.papers || []).slice(0, 6));
      } catch { setAddResults([]); }
      finally { setIsSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [addQuery]);

  function addPaper(paper: any) {
    const n: MapNode = {
      id: paper.id, title: paper.title,
      year: paper.publicationYear, citations: paper.citationCount,
      author: paper.authors?.[0], field: paper.field,
      type: "custom", shape: "rect",
      x: dims.w / 2 + (Math.random() - 0.5) * 500,
      y: dims.h / 2 + 360 + Math.random() * 80,
    };
    if (nodes.find(x => x.id === n.id)) return;
    setNodes(p => [...p, n]);
    setEdges(p => [...p, { id: "edge_" + Date.now(), source: centerId, target: n.id, type: "custom" }]);
    setAddQuery(""); setAddResults([]); setShowAdd(false);
  }

  // ── Add Custom Node ──
  function addCustomNode() {
    const id = "node_" + Date.now();
    const n: MapNode = {
      id, title: "New Note", type: "custom", shape: "rect",
      x: dims.w / 2, y: dims.h / 2
    };
    setNodes(p => [...p, n]);
    setSelectedNode(n);
  }

  // ── Update Custom Node ──
  function updateNode(id: string, updates: Partial<MapNode>) {
    setNodes(p => p.map(n => n.id === id ? { ...n, ...updates } : n));
    if (selectedNode?.id === id) {
      setSelectedNode(p => p ? { ...p, ...updates } : null);
    }
  }

  function updateEdge(id: string, updates: Partial<MapEdge>) {
    setEdges(p => p.map(e => e.id === id ? { ...e, ...updates } : e));
    if (selectedEdge?.id === id) {
      setSelectedEdge(p => p ? { ...p, ...updates } : null);
    }
  }

  function autoLayout() {
    const positioned = assignPositions(
      nodes.map(n => ({ ...n, type: n.type })),
      centerId, dims.w, dims.h
    );
    setNodes(positioned);
  }

  const centerPaper = nodes.find(n => n.id === centerId);

  // ── JSX ──
  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden"
      style={{ background: "#000000", fontFamily: FONT }}>

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-5 py-2 shrink-0 z-30"
        style={{ background: "#0a0a0a", borderBottom: "1px solid #1a1a1a" }}>

        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[12px] shrink-0 hover:opacity-70 transition-opacity"
            style={{ color: "#38bdf8" }}>
            <ArrowLeft size={13} /> Back
          </button>
          <div className="w-px h-4 shrink-0" style={{ background: "#1a1a1a" }} />
          {centerPaper && (
            <span className="text-[12px] truncate max-w-[320px] font-medium" style={{ color: "#38bdf8" }}>
              {truncate(centerPaper.title, 60)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-1 text-[11px]" style={{ color: "#1a1a1a" }}>
            <span style={{ color: "#e2e8f0" }} className="font-semibold">{nodes.length}</span>
            <span style={{ color: "#334155" }}> nodes</span>
            <span className="mx-2" style={{ color: "#1a1a1a" }}>·</span>
            <span style={{ color: "#e2e8f0" }} className="font-semibold">{edges.length}</span>
            <span style={{ color: "#334155" }}> edges</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {editMode ? (
            <>
              <button onClick={autoLayout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium border transition-all hover:opacity-80"
                style={{ background: "#1a1a1a", borderColor: "#0284c7", color: "#38bdf8" }}>
                <LayoutGrid size={12} /> Auto Layout
              </button>
              <button
                onClick={() => { setEditMode(false); setActiveTool("select"); setConnectSource(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium border transition-all hover:opacity-80"
                style={{ background: "#1a1a1a", borderColor: "#0284c7", color: "#94a3b8" }}>
                <X size={12} /> Done
              </button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium border transition-all hover:opacity-80"
              style={{ background: "rgba(59,201,219,0.08)", borderColor: "rgba(59,201,219,0.2)", color: "#3bc9db" }}>
              <Plus size={12} /> Edit Map
            </button>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left toolbar */}
        {editMode && (
          <div className="flex flex-col gap-1 px-2 py-3 shrink-0 z-20 items-center"
            style={{ background: "#0a0a0a", borderRight: "1px solid #1a1a1a", width: 56 }}>
            {([
              { t: "select"  as Tool, icon: <MousePointer size={15} />, tip: "Select (V)"  },
              { t: "connect" as Tool, icon: <Link2        size={15} />, tip: "Connect (C)" },
              { t: "delete"  as Tool, icon: <Trash2       size={15} />, tip: "Delete (D)"  },
            ] as const).map(({ t, icon, tip }) => (
              <button key={t} title={tip}
                onClick={() => { setActiveTool(t); setConnectSource(null); }}
                className="w-10 h-10 rounded-md flex items-center justify-center transition-all"
                style={{
                  background: activeTool === t ? "#151515" : "transparent",
                  color:      activeTool === t ? "#3bc9db" : "#38bdf8",
                  border:     `1px solid ${activeTool === t ? "#3bc9db33" : "transparent"}`,
                }}>
                {icon}
              </button>
            ))}
            <div className="w-8 h-px my-2" style={{ background: "#1a1a1a" }} />
            <button title="Add Custom Node"
              onClick={addCustomNode}
              className="w-10 h-10 rounded-md flex items-center justify-center transition-all hover:bg-[#151515]"
              style={{ color: "#22d3ee", border: "1px solid transparent" }}>
              <Plus size={18} />
            </button>
            <button title="Search & Add Paper"
              onClick={() => setShowAdd(true)}
              className="w-10 h-10 rounded-md flex items-center justify-center transition-all hover:bg-[#151515]"
              style={{ color: "#3bc9db", border: "1px solid transparent" }}>
              <Search size={16} />
            </button>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">

          {/* Connect banner */}
          {activeTool === "connect" && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full text-[11px] font-medium pointer-events-none shadow-lg"
              style={{
                background: "#0a0a0a",
                border:     `1px solid ${connectSource ? "#0ea5e9" : "#3bc9db"}`,
                color:      connectSource ? "#0ea5e9" : "#3bc9db"
              }}>
              {connectSource ? `Click target node to connect from "${truncate(connectSource.title, 30)}"` : "Click a source node"}
            </div>
          )}

          {/* Shape Legend (only visible in edit mode) */}
          {editMode && (
            <div className="absolute bottom-6 left-6 pointer-events-auto bg-[#0a0a0a]/90 border border-[#1a1a1a] rounded-lg p-3 backdrop-blur-md shadow-2xl flex flex-col gap-2">
              <span className="text-[10px] font-semibold tracking-widest uppercase mb-1" style={{ color: "#38bdf8", fontFamily: MONO }}>
                Priority Shapes
              </span>
              <div className="flex items-center gap-3">
                <Square size={14} color="#94a3b8" />
                <span className="text-[11px] text-[#cbd5e1]">Standard Card</span>
              </div>
              <div className="flex items-center gap-3">
                <Diamond size={14} color="#f59e0b" />
                <span className="text-[11px] text-[#cbd5e1]">High Priority / Crucial</span>
              </div>
              <div className="flex items-center gap-3">
                <Circle size={14} color="#22d3ee" />
                <span className="text-[11px] text-[#cbd5e1]">Conceptual Pill</span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "#000000" }}>
              <div className="relative w-full max-w-[80%] md:max-w-[70%] lg:max-w-[740px] aspect-[962/192] flex items-center justify-center">
                
                <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <clipPath id="textMask">
                      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" 
                            fontSize="150" fontWeight="900" fill="#fff" fontFamily={FONT} letterSpacing="-4px">
                        Nagi
                      </text>
                    </clipPath>
                  </defs>
                  
                  {/* Outline behind */}
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" 
                        fontSize="150" fontWeight="900" fill="transparent" stroke="rgba(59,201,219,0.15)" strokeWidth="2" fontFamily={FONT} letterSpacing="-4px">
                    Nagi
                  </text>

                  {/* Filled water part */}
                  <g clipPath="url(#textMask)">
                    <g transform={`translate(0, ${180 - (loadingProgress / 100) * 200})`} style={{ transition: "transform 0.1s linear" }}>
                      {/* Back Wave */}
                      <path d="M 0 20 Q 50 40 100 20 T 200 20 T 300 20 T 400 20 T 500 20 T 600 20 T 700 20 T 800 20 L 800 250 L 0 250 Z" fill="#0284c7">
                        <animateTransform attributeName="transform" type="translate" from="-200 -10" to="0 -10" dur="2.5s" repeatCount="indefinite" />
                      </path>
                      {/* Front Wave */}
                      <path d="M 0 20 Q 50 40 100 20 T 200 20 T 300 20 T 400 20 T 500 20 T 600 20 T 700 20 T 800 20 L 800 250 L 0 250 Z" fill="#3bc9db">
                        <animateTransform attributeName="transform" type="translate" from="0 0" to="-200 0" dur="2s" repeatCount="indefinite" />
                      </path>
                    </g>
                  </g>
                </svg>

                {/* Percentage Counter (bottom right) */}
                <div className="absolute right-0 top-full mt-2 text-[11px] font-medium tracking-widest uppercase flex items-center gap-2" style={{ color: "#3bc9db", fontFamily: MONO }}>
                  loading... <span className="inline-block w-8 text-right">{Math.round(loadingProgress)}%</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#000000]">
              <p className="text-[13px]" style={{ color: "#ef4444" }}>Error: {error}</p>
            </div>
          )}

          <svg ref={svgRef} className="w-full h-full" />
        </div>

        
        {/* Edge detail panel */}
        {selectedEdge && !selectedNode && (
          <aside className="w-[300px] shrink-0 flex flex-col overflow-hidden"
            style={{ background: "#0a0a0a", borderLeft: "1px solid #1a1a1a" }}>
            <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid #1a1a1a" }}>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-semibold tracking-widest uppercase text-[#38bdf8]">CONNECTION</span>
              </div>
              <button onClick={() => setSelectedEdge(null)} className="text-[#38bdf8] hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
              {editMode ? (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "#38bdf8", fontFamily: MONO }}>
                    Connection Label
                  </span>
                  <textarea 
                    value={selectedEdge.label || ""}
                    placeholder="E.g. 'Supports this finding'"
                    onChange={(e) => updateEdge(selectedEdge.id!, { label: e.target.value })}
                    className="w-full bg-[#000000] text-white text-[13px] p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3bc9db] resize-none"
                    style={{ border: "1px solid #1a1a1a", fontFamily: FONT }}
                    rows={3}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "#38bdf8", fontFamily: MONO }}>
                    Connection Label
                  </span>
                  <p className="text-[14px] font-medium leading-relaxed" style={{ color: "#f1f5f9" }}>
                    {selectedEdge.label || "No label."}
                  </p>
                </div>
              )}

              {editMode && (
                <div className="flex flex-col gap-2.5 pt-4 mt-auto" style={{ borderTop: "1px solid #1a1a1a" }}>
                  <button onClick={() => removeEdge(selectedEdge.id!)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[12px] font-semibold border transition-all hover:bg-opacity-20"
                    style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.25)", color: "#ef4444" }}>
                    <Trash2 size={14} /> Delete Connection
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Right detail panel */}
        {selectedNode && (
          <aside className="w-[300px] shrink-0 flex flex-col overflow-hidden"
            style={{ background: "#0a0a0a", borderLeft: "1px solid #1a1a1a" }}>

            <div className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: "1px solid #1a1a1a" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-sm"
                  style={{ background: selectedNode.color || TYPE_CFG[selectedNode.type].accent }} />
                <span className="text-[9px] font-semibold tracking-widest uppercase"
                  style={{ color: selectedNode.color || TYPE_CFG[selectedNode.type].accent, fontFamily: MONO }}>
                  {NODE_LABEL[selectedNode.type]}
                </span>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ color: "#38bdf8" }} className="hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
              
              {/* Title Section */}
              <div className="flex flex-col gap-2">
                {editMode ? (
                  <textarea 
                    value={selectedNode.title}
                    onChange={(e) => updateNode(selectedNode.id, { title: e.target.value })}
                    className="w-full bg-[#000000] text-white text-[13px] p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#3bc9db] resize-none"
                    style={{ border: "1px solid #1a1a1a", fontFamily: FONT }}
                    rows={3}
                  />
                ) : (
                  <p className="text-[14px] font-medium leading-relaxed" style={{ color: "#f1f5f9" }}>
                    {selectedNode.title}
                  </p>
                )}
              </div>

              {/* Editing Controls for Custom Nodes */}
              {editMode && (
                <div className="flex flex-col gap-5 pt-4" style={{ borderTop: "1px solid #1a1a1a" }}>
                  
                  {/* Shape Selector */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "#38bdf8", fontFamily: MONO }}>
                      Shape
                    </span>
                    <div className="flex gap-2">
                      {[
                        { s: "rect",    icon: <Square size={14} />,  label: "Card" },
                        { s: "diamond", icon: <Diamond size={14} />, label: "Priority" },
                        { s: "circle",  icon: <Circle size={14} />,  label: "Pill" },
                      ].map(shape => (
                        <button key={shape.s}
                          onClick={() => updateNode(selectedNode.id, { shape: shape.s as NodeShape })}
                          className="flex-1 flex flex-col items-center gap-1.5 p-2 rounded-md border transition-all"
                          style={{ 
                            background: (selectedNode.shape || "rect") === shape.s ? "#151515" : "transparent",
                            borderColor: (selectedNode.shape || "rect") === shape.s ? "#3bc9db" : "#1a1a1a",
                            color: (selectedNode.shape || "rect") === shape.s ? "#3bc9db" : "#38bdf8"
                          }}>
                          {shape.icon}
                          <span className="text-[9px]">{shape.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Selector */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "#38bdf8", fontFamily: MONO }}>
                      Color
                    </span>
                    <div className="flex gap-2">
                      {["#22d3ee", "#3bc9db", "#0284c7", "#0ea5e9", "#ef4444", "#cbd5e1"].map(color => (
                        <button key={color}
                          onClick={() => updateNode(selectedNode.id, { color })}
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                          style={{ 
                            background: color,
                            border: `2px solid ${selectedNode.color === color ? "#fff" : "transparent"}`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Meta information for papers */}
              {selectedNode.type !== "custom" && (
                <div className="flex flex-col gap-3 pt-4" style={{ borderTop: "1px solid #1a1a1a" }}>
                  {[
                    { label: "Author",    value: selectedNode.author },
                    { label: "Year",      value: selectedNode.year?.toString() },
                    { label: "Citations", value: selectedNode.citations?.toLocaleString(), accent: true },
                    { label: "Field",     value: selectedNode.field },
                  ].filter(r => r.value).map(row => (
                    <div key={row.label} className="flex items-start justify-between gap-3">
                      <span className="text-[10px] font-semibold tracking-wider uppercase shrink-0"
                        style={{ color: "#38bdf8", fontFamily: MONO }}>{row.label}</span>
                      <span className="text-[12px] text-right leading-snug font-medium"
                        style={{ color: row.accent ? "#3bc9db" : "#94a3b8" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2.5 pt-4 mt-auto" style={{ borderTop: "1px solid #1a1a1a" }}>
                {selectedNode.type !== "custom" && (
                  <>
                    <button onClick={() => { window.location.href = `/paper/${selectedNode.id}`; }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[12px] font-semibold border transition-all hover:bg-opacity-20"
                      style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.25)", color: "#22d3ee" }}>
                      <BookOpen size={14} /> View Full Paper
                    </button>
                    <button onClick={() => { window.location.href = `/map/${selectedNode.id}`; }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[12px] font-semibold border transition-all hover:bg-opacity-20"
                      style={{ background: "rgba(59,201,219,0.1)", borderColor: "rgba(59,201,219,0.25)", color: "#3bc9db" }}>
                      <Map size={14} /> Map This Paper
                    </button>
                  </>
                )}
                {editMode && (
                  <button onClick={() => {
                    removeNode(selectedNode.id);
                  }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-[12px] font-semibold border transition-all hover:bg-opacity-20 mt-2"
                    style={{ background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.25)", color: "#f87171" }}>
                    <Trash2 size={14} /> Remove Node
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── Bottom bar ── */}
      <footer className="flex items-center justify-between px-5 py-2 shrink-0 z-30"
        style={{ background: "#0a0a0a", borderTop: "1px solid #1a1a1a" }}>

        <div className="flex items-center gap-5">
          {(Object.keys(TYPE_CFG) as NodeType[]).map(type => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: TYPE_CFG[type].accent }} />
              <span className="text-[9px] font-medium tracking-widest uppercase"
                style={{ color: "#38bdf8", fontFamily: MONO }}>
                {TYPE_CFG[type].label}
              </span>
            </div>
          ))}

          {/* New Shape Legend */}
          <div className="w-px h-4" style={{ background: "#1a1a1a" }} />
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: "#38bdf8", fontFamily: MONO }}>Shapes:</span>
            <div className="flex items-center gap-1.5" title="Paper Card">
              <Square size={11} color="#38bdf8" />
              <span className="text-[9px] uppercase font-medium" style={{ color: "#38bdf8", fontFamily: MONO }}>Card</span>
            </div>
            <div className="flex items-center gap-1.5" title="Priority / Precedence">
              <Diamond size={11} color="#38bdf8" />
              <span className="text-[9px] uppercase font-medium" style={{ color: "#38bdf8", fontFamily: MONO }}>Priority</span>
            </div>
            <div className="flex items-center gap-1.5" title="Grouping / Note">
              <Circle size={11} color="#38bdf8" />
              <span className="text-[9px] uppercase font-medium" style={{ color: "#38bdf8", fontFamily: MONO }}>Pill</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] mr-2 tracking-widest uppercase" style={{ color: "#334155", fontFamily: MONO }}>
            scroll to zoom · drag to move
          </span>
          {([
            { fn: () => doZoom("out"), icon: <ZoomOut   size={13} />, tip: "Zoom out" },
            { fn: () => doZoom("in"),  icon: <ZoomIn    size={13} />, tip: "Zoom in"  },
            { fn: () => doZoom("fit"), icon: <Maximize2 size={13} />, tip: "Reset"    },
          ]).map((z, i) => (
            <button key={i} title={z.tip} onClick={z.fn}
              className="w-7 h-7 flex items-center justify-center rounded transition-all hover:opacity-80"
              style={{ background: "#1a1a1a", color: "#38bdf8" }}>
              {z.icon}
            </button>
          ))}
        </div>
      </footer>

      {/* ── Add paper modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(10,15,26,0.9)" }}
          onClick={() => { setShowAdd(false); setAddQuery(""); setAddResults([]); }}>
          <div className="w-[560px] rounded-xl overflow-hidden shadow-2xl"
            style={{ background: "#0a0a0a", border: "1px solid #1a1a1a" }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #1a1a1a" }}>
              <span className="text-[13px] font-semibold" style={{ color: "#f1f5f9" }}>
                Add Paper to Map
              </span>
              <button onClick={() => { setShowAdd(false); setAddQuery(""); setAddResults([]); }}
                style={{ color: "#38bdf8" }} className="hover:text-white transition-colors"><X size={15} /></button>
            </div>

            <div className="flex items-center gap-3 px-5 py-4"
              style={{ borderBottom: "1px solid #1a1a1a" }}>
              <Search size={15} style={{ color: "#38bdf8" }} />
              <input autoFocus type="text" value={addQuery}
                onChange={e => setAddQuery(e.target.value)}
                placeholder="Search by title, author, topic…"
                className="flex-1 bg-transparent text-[14px] text-white focus:outline-none"
                style={{ fontFamily: FONT }} />
              {isSearching && <Loader2 size={15} className="animate-spin" style={{ color: "#3bc9db" }} />}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {addResults.map((p, i) => (
                <button key={i} onClick={() => addPaper(p)}
                  className="w-full flex flex-col gap-2 px-5 py-4 text-left transition-all hover:bg-[#1a1a1a]"
                  style={{
                    borderBottom: "1px solid #1a1a1a",
                    background:   i % 2 === 0 ? "#0a0a0a" : "#000000",
                  }}>
                  <span className="text-[13px] font-medium leading-snug line-clamp-2"
                    style={{ color: "#f1f5f9" }}>{p.title}</span>
                  <div className="flex items-center gap-2 text-[11px]" style={{ color: "#38bdf8" }}>
                    <span>{p.authors?.[0]}{p.authors?.length > 1 ? " et al." : ""}</span>
                    {p.publicationYear && <><span>·</span><span>{p.publicationYear}</span></>}
                    <span style={{ color: "#3bc9db" }}>· {p.citationCount?.toLocaleString()} citations</span>
                  </div>
                </button>
              ))}
              {addQuery.length >= 2 && !isSearching && !addResults.length && (
                <p className="px-5 py-8 text-[13px] text-center" style={{ color: "#38bdf8" }}>No results found</p>
              )}
              {addQuery.length < 2 && (
                <p className="px-5 py-8 text-[11px] text-center tracking-widest uppercase"
                  style={{ color: "#334155", fontFamily: MONO }}>
                  Type to search OpenAlex
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
