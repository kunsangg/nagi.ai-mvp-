"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import * as d3 from "d3";
import {
  ArrowLeft, Plus, Trash2, Link2, MousePointer,
  X, Search, Loader2, ZoomIn, ZoomOut, Maximize2,
  BookOpen, Map, LayoutGrid, StickyNote, Diamond,
  Circle, Square, Minus, ExternalLink, AlignLeft,
  Hand, Sparkles, Play, CheckCircle2, Upload, BoxSelect,
  Database, Phone, Megaphone, Users, LineChart, Webhook, Link, Code
} from "lucide-react";

const SF   = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, Menlo, monospace";

type NodeType    = "center" | "reference" | "citing" | "related" | "custom";
type NodeShape   = "card" | "diamond" | "circle" | "pill";
type Priority    = "normal" | "high" | "critical";
type EdgeType    = "reference" | "citing" | "related" | "custom";
type Tool        = "select" | "connect" | "delete" | "note" | "pan" | "ai" | "upload" | "box";

interface MapNode {
  id: string;
  title: string;
  year?: number;
  citations?: number;
  author?: string;
  field?: string;
  type: NodeType;
  shape: NodeShape;
  priority: Priority;
  note?: string;
  url?: string;
  x: number;
  y: number;
}

interface MapEdge {
  source: string | MapNode;
  target: string | MapNode;
  type: EdgeType;
  label?: string;
}

const NODE_W = 220;
const NODE_H = 88;

const PRIORITY_COLOR: Record<Priority, string> = {
  normal:   "#3bc9db",
  high:     "#f59e0b",
  critical: "#ef4444",
};

const TYPE_COLOR: Record<NodeType, string> = {
  center:    "#3bc9db",
  reference: "#8b5cf6",
  citing:    "#f59e0b",
  related:   "#475569",
  custom:    "#10b981",
};

const EDGE_COLOR: Record<EdgeType, string> = {
  reference: "#8b5cf6",
  citing:    "#f59e0b",
  related:   "#243044",
  custom:    "#10b981",
};

const TYPE_LABEL: Record<NodeType, string> = {
  center:    "SELECTED",
  reference: "REFERENCED",
  citing:    "CITES THIS",
  related:   "RELATED",
  custom:    "ADDED",
};

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function getId(n: string | MapNode): string {
  return typeof n === "string" ? n : n.id;
}

function assignPositions(nodes: any[], centerId: string, W: number, H: number): MapNode[] {
  const cx = W / 2;
  const cy = H / 2;
  const result: MapNode[] = [];
  const byType: Record<string, any[]> = { center: [], reference: [], citing: [], related: [], custom: [] };
  nodes.forEach(n => {
    if (byType[n.type]) byType[n.type].push(n);
    else byType.custom.push(n);
  });

  byType.center.forEach(n => result.push({ ...n, shape: "card", priority: "normal", x: cx, y: cy }));

  const place = (arr: any[], angleFrom: number, angleTo: number, r: number) => {
    arr.forEach((n, i, a) => {
      const angle = a.length === 1
        ? (angleFrom + angleTo) / 2
        : angleFrom + (angleTo - angleFrom) * (i / (a.length - 1));
      result.push({ ...n, shape: "card", priority: "normal", x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    });
  };

  place(byType.reference, Math.PI * 0.55, Math.PI * 1.45, 340);
  place(byType.citing,    -Math.PI * 0.45, Math.PI * 0.45, 340);
  place(byType.related,   -Math.PI * 0.45, -Math.PI * 1.45, 260);
  byType.custom?.forEach((n, i) => result.push({ ...n, shape: "card", priority: "normal", x: cx - 200 + i * 260, y: cy + 370 }));

  return result;
}

export default function MapPage() {
  const params = useParams();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef  = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [nodes,     setNodes]     = useState<MapNode[]>([]);
  const [edges,     setEdges]     = useState<MapEdge[]>([]);
  const [centerId,  setCenterId]  = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState("");
  const [dims,      setDims]      = useState({ w: 1400, h: 800 });

  const [editMode,      setEditMode]      = useState(false);
  const [activeTool,    setActiveTool]    = useState<Tool>("select");
  const [selectedNode,  setSelectedNode]  = useState<MapNode | null>(null);
  const [selectedEdge,  setSelectedEdge]  = useState<MapEdge | null>(null);
  const [connectSource, setConnectSource] = useState<MapNode | null>(null);

  // Modals
  const [showAdd,        setShowAdd]        = useState(false);
  const [showEdgeLabel,  setShowEdgeLabel]  = useState(false);
  const [showNoteModal,  setShowNoteModal]  = useState(false);
  const [showUrlModal,   setShowUrlModal]   = useState(false);
  const [addQuery,       setAddQuery]       = useState("");
  const [addResults,     setAddResults]     = useState<any[]>([]);
  const [isSearching,    setIsSearching]    = useState(false);
  const [edgeLabelInput, setEdgeLabelInput] = useState("");
  const [noteInput,      setNoteInput]      = useState("");
  const [urlInput,       setUrlInput]       = useState("");

  const idParam = params?.id;
  const id = Array.isArray(idParam)
    ? idParam.map(decodeURIComponent).join("/")
    : (idParam as string);

  const stateRef = useRef({ activeTool, connectSource, selectedNode });
  stateRef.current = { activeTool, connectSource, selectedNode };

  // Measure canvas
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) {
        setDims({ w: width, h: height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fetch
  useEffect(() => {
    if (!id) return;
    fetch(`/api/map?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setIsLoading(false); return; }
        setNodes(assignPositions(data.nodes, data.center, dims.w, dims.h));
        setEdges(data.edges);
        setCenterId(data.center);
        setIsLoading(false);
      })
      .catch(() => { setError("Failed to load map"); setIsLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // D3 render
  useEffect(() => {
    if (!nodes.length || !svgRef.current) return;
    const { w: W, h: H } = dims;
    const el = svgRef.current;
    d3.select(el).selectAll("*").remove();

    const svg = d3.select(el).attr("width", W).attr("height", H);
    const defs = svg.append("defs");

    // Dot grid
    const pat = defs.append("pattern")
      .attr("id", "dotgrid").attr("width", 24).attr("height", 24)
      .attr("patternUnits", "userSpaceOnUse");
    pat.append("circle").attr("cx", 1).attr("cy", 1).attr("r", 1).attr("fill", "rgba(255,255,255,0.15)");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#050505");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "url(#dotgrid)");

    // Arrows
    (Object.keys(EDGE_COLOR) as EdgeType[]).forEach(t => {
      defs.append("marker")
        .attr("id", `arr-${t}`).attr("viewBox", "0 -4 9 8")
        .attr("refX", 9).attr("refY", 0)
        .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
        .append("path").attr("d", "M0,-4L9,0L0,4").attr("fill", EDGE_COLOR[t]);
    });

    // Drop shadow
    const f = defs.append("filter").attr("id", "shadow")
      .attr("x", "-30%").attr("y", "-30%").attr("width", "160%").attr("height", "160%");
    f.append("feDropShadow").attr("dx", 0).attr("dy", 3).attr("stdDeviation", 10)
      .attr("flood-color", "#000").attr("flood-opacity", 0.6);

    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on("zoom", ev => {
        g.attr("transform", ev.transform);
        pat.attr("patternTransform", ev.transform);
      });
    svg.call(zoom);
    zoomRef.current = zoom;
    const currentTransform = d3.zoomTransform(el);
    if (currentTransform !== d3.zoomIdentity) {
      g.attr("transform", currentTransform.toString());
    }

    // Edge path helper
    function edgePath(e: MapEdge): string {
      const s = typeof e.source === "string" ? nodes.find(n => n.id === e.source) : e.source as MapNode;
      const t = typeof e.target === "string" ? nodes.find(n => n.id === e.target) : e.target as MapNode;
      if (!s || !t) return "";
      const dx = t.x - s.x, dy = t.y - s.y;
      let sx: number, sy: number, tx: number, ty: number;
      if (Math.abs(dx) >= Math.abs(dy)) {
        sx = s.x + (dx > 0 ?  NODE_W / 2 : -NODE_W / 2); sy = s.y;
        tx = t.x + (dx > 0 ? -NODE_W / 2 :  NODE_W / 2); ty = t.y;
        const mx = (sx + tx) / 2;
        return `M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`;
      } else {
        sx = s.x; sy = s.y + (dy > 0 ?  NODE_H / 2 : -NODE_H / 2);
        tx = t.x; ty = t.y + (dy > 0 ? -NODE_H / 2 :  NODE_H / 2);
        const my = (sy + ty) / 2;
        return `M${sx},${sy} C${sx},${my} ${tx},${my} ${tx},${ty}`;
      }
    }

    // Edges
    const edgeG = g.append("g");
    const edgeGroups = edgeG.selectAll<SVGGElement, MapEdge>("g")
      .data(edges).join("g");

    const linkSel = edgeGroups.append("path")
      .attr("fill", "none")
      .attr("stroke",         (d: any) => EDGE_COLOR[d.type as EdgeType])
      .attr("stroke-width",   1.5)
      .attr("stroke-opacity", 0.65)
      .attr("marker-end",     (d: any) => `url(#arr-${d.type})`)
      .attr("cursor",         "pointer")
      .attr("d",              edgePath as any)
      .on("click", (_ev, d: any) => {
        if (stateRef.current.activeTool === "delete") {
          setEdges(p => p.filter(e => !(getId(e.source) === getId(d.source) && getId(e.target) === getId(d.target))));
        } else {
          setSelectedEdge(d);
          setEdgeLabelInput(d.label || "");
          setShowEdgeLabel(true);
        }
      });

    // Edge labels
    edgeGroups.each(function(d: any) {
      if (!d.label) return;
      const s = typeof d.source === "string" ? nodes.find(n => n.id === d.source) : d.source as MapNode;
      const t = typeof d.target === "string" ? nodes.find(n => n.id === d.target) : d.target as MapNode;
      if (!s || !t) return;
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
      d3.select(this).append("rect")
        .attr("x", mx - 40).attr("y", my - 11)
        .attr("width", 80).attr("height", 20).attr("rx", 4)
        .attr("fill", "#0d1520").attr("stroke", "#1a2535");
      d3.select(this).append("text")
        .text(d.label)
        .attr("x", mx).attr("y", my + 4)
        .attr("text-anchor", "middle")
        .attr("font-size", "9px").attr("font-family", MONO)
        .attr("fill", "#64748b").attr("pointer-events", "none");
    });

    // Nodes
    const nodeG = g.append("g");
    const nodeSel = nodeG.selectAll<SVGGElement, MapNode>("g")
      .data(nodes, (d: MapNode) => d.id).join("g")
      .attr("transform", (d: MapNode) => `translate(${d.x},${d.y})`)
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, MapNode>()
        .on("start", function() { d3.select(this).raise(); })
        .on("drag",  function(ev, d) {
          d.x = ev.x; d.y = ev.y;
          d3.select(this).attr("transform", `translate(${ev.x},${ev.y})`);
          linkSel.attr("d", edgePath as any);
          edgeGroups.selectAll("rect,text").remove();
        })
        .on("end", function(ev, d) {
          setNodes(p => p.map(n => n.id === d.id ? { ...n, x: ev.x, y: ev.y } : n));
        })
      )
      .on("click", (_ev, d) => handleNodeClick(d));

    // Card shadow
    nodeSel.append("rect")
      .attr("x", -NODE_W / 2 - 3).attr("y", -NODE_H / 2 - 3)
      .attr("width", NODE_W + 6).attr("height", NODE_H + 6)
      .attr("rx", 10).attr("fill", "rgba(0,0,0,0.45)").attr("filter", "url(#shadow)");

    // Card body
    nodeSel.append("rect")
      .attr("class", "card-body")
      .attr("x", -NODE_W / 2).attr("y", -NODE_H / 2)
      .attr("width", NODE_W).attr("height", NODE_H).attr("rx", 8)
      .attr("fill", (d: MapNode) => d.type === "center" ? "#0f1e30" : "#0d1520")
      .attr("stroke", (d: MapNode) => {
        if (d.id === stateRef.current.selectedNode?.id) return "#fff";
        return PRIORITY_COLOR[d.priority] ?? TYPE_COLOR[d.type];
      })
      .attr("stroke-width", (d: MapNode) => d.id === stateRef.current.selectedNode?.id ? 2 : 1)
      .on("mouseover", function(_ev, d) {
        if (d.id !== stateRef.current.selectedNode?.id)
          d3.select(this).attr("fill", "#111f30");
      })
      .on("mouseout", function(_ev, d) {
        d3.select(this).attr("fill", d.type === "center" ? "#0f1e30" : "#0d1520");
      });

    // Left accent
    nodeSel.append("rect")
      .attr("x", -NODE_W / 2).attr("y", -NODE_H / 2)
      .attr("width", 3).attr("height", NODE_H).attr("rx", 2)
      .attr("fill", (d: MapNode) => PRIORITY_COLOR[d.priority] ?? TYPE_COLOR[d.type]);

    // Type badge
    nodeSel.append("rect")
      .attr("x", -NODE_W / 2 + 14).attr("y", -NODE_H / 2 + 10)
      .attr("width", 76).attr("height", 15).attr("rx", 3)
      .attr("fill", (d: MapNode) => TYPE_COLOR[d.type] + "18");
    nodeSel.append("text")
      .text((d: MapNode) => TYPE_LABEL[d.type])
      .attr("x", -NODE_W / 2 + 52).attr("y", -NODE_H / 2 + 21)
      .attr("text-anchor", "middle")
      .attr("font-size", "7px").attr("font-weight", "700")
      .attr("letter-spacing", "0.1em").attr("font-family", MONO)
      .attr("fill", (d: MapNode) => TYPE_COLOR[d.type])
      .attr("pointer-events", "none");

    // Priority badge (if not normal)
    nodeSel.filter((d: MapNode) => d.priority !== "normal").append("text")
      .text((d: MapNode) => d.priority === "critical" ? "●" : "◆")
      .attr("x", NODE_W / 2 - 14).attr("y", -NODE_H / 2 + 20)
      .attr("text-anchor", "middle").attr("font-size", "10px")
      .attr("fill", (d: MapNode) => PRIORITY_COLOR[d.priority])
      .attr("pointer-events", "none");

    // Note indicator
    nodeSel.filter((d: MapNode) => !!d.note).append("text")
      .text("✎")
      .attr("x", NODE_W / 2 - 28).attr("y", -NODE_H / 2 + 20)
      .attr("text-anchor", "middle").attr("font-size", "9px")
      .attr("fill", "#64748b").attr("pointer-events", "none");

    // Link indicator
    nodeSel.filter((d: MapNode) => !!d.url).append("text")
      .text("↗")
      .attr("x", NODE_W / 2 - 42).attr("y", -NODE_H / 2 + 21)
      .attr("text-anchor", "middle").attr("font-size", "10px")
      .attr("fill", "#64748b").attr("pointer-events", "none");

    // Title
    nodeSel.each(function(d: MapNode) {
      const title = truncate(d.title, 50);
      const words = title.split(" ");
      const half  = Math.ceil(words.length / 2);
      const l1    = words.slice(0, half).join(" ");
      const l2    = words.slice(half).join(" ");

      const t = d3.select(this).append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", d.type === "center" ? "12px" : "11px")
        .attr("font-weight", d.type === "center" ? "600" : "500")
        .attr("font-family", SF)
        .attr("fill", d.type === "center" ? "#f1f5f9" : "#e2e8f0")
        .attr("pointer-events", "none");

      t.append("tspan").text(l1).attr("x", 10).attr("y", l2 ? -5 : 5);
      if (l2) t.append("tspan").text(l2).attr("x", 10).attr("dy", "1.4em");
    });

    // Year · citations
    nodeSel.append("text")
      .attr("x", 10).attr("y", NODE_H / 2 - 11)
      .attr("text-anchor", "middle")
      .attr("font-size", "9px").attr("font-family", MONO)
      .attr("fill", "#2d3f55").attr("pointer-events", "none")
      .text((d: MapNode) =>
        [d.year, d.citations ? `${d.citations.toLocaleString()} cit.` : ""].filter(Boolean).join("  ·  ")
      );

    // Port dots
    [-NODE_W / 2, NODE_W / 2].forEach(px => {
      nodeSel.append("circle")
        .attr("cx", px).attr("cy", 0).attr("r", 4)
        .attr("fill", "#0d1520").attr("stroke", "#243044").attr("stroke-width", 1.5);
    });

    // Plus button (add child node)
    nodeSel.append("circle")
      .attr("cx", 0).attr("cy", NODE_H / 2 + 16)
      .attr("r", 10).attr("fill", "#0d1520")
      .attr("stroke", "#243044").attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .on("click", (ev, d) => {
        ev.stopPropagation();
        const child: MapNode = {
          id: `custom-${Date.now()}`,
          title: "New Node",
          type: "custom", shape: "card", priority: "normal",
          x: d.x + 280, y: d.y,
        };
        setNodes(p => [...p, child]);
        setEdges(p => [...p, { source: d.id, target: child.id, type: "custom" }]);
      });
    nodeSel.append("text")
      .text("+").attr("x", 0).attr("y", NODE_H / 2 + 21)
      .attr("text-anchor", "middle").attr("font-size", "12px")
      .attr("fill", "#64748b").attr("font-family", MONO)
      .attr("pointer-events", "none");

    // Selection ring
    nodeSel.append("rect").attr("class", "sel-ring")
      .attr("x", -NODE_W / 2 - 4).attr("y", -NODE_H / 2 - 4)
      .attr("width", NODE_W + 8).attr("height", NODE_H + 8).attr("rx", 11)
      .attr("fill", "none")
      .attr("stroke", (d: MapNode) => TYPE_COLOR[d.type])
      .attr("stroke-width", 2).attr("stroke-dasharray", "5,3")
      .attr("opacity", (d: MapNode) => d.id === stateRef.current.selectedNode?.id ? 1 : 0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, dims]);

  // Update selection ring
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll<SVGRectElement, MapNode>(".sel-ring")
      .attr("opacity", (d: MapNode) => d.id === selectedNode?.id ? 1 : 0);
    d3.select(svgRef.current).selectAll<SVGRectElement, MapNode>(".card-body")
      .attr("stroke", (d: MapNode) => d.id === selectedNode?.id ? "#fff" : (PRIORITY_COLOR[d.priority] ?? TYPE_COLOR[d.type]))
      .attr("stroke-width", (d: MapNode) => d.id === selectedNode?.id ? 2 : 1);
  }, [selectedNode]);

  function handleNodeClick(d: MapNode) {
    const { activeTool, connectSource } = stateRef.current;
    if (activeTool === "delete") {
      setNodes(p => p.filter(n => n.id !== d.id));
      setEdges(p => p.filter(e => getId(e.source) !== d.id && getId(e.target) !== d.id));
      setSelectedNode(null); return;
    }
    if (activeTool === "connect") {
      if (!connectSource) { setConnectSource(d); return; }
      if (connectSource.id !== d.id)
        setEdges(p => [...p, { source: connectSource.id, target: d.id, type: "custom" }]);
      setConnectSource(null); return;
    }
    if (activeTool === "note") {
      setSelectedNode(d);
      setNoteInput(d.note || "");
      setShowNoteModal(true); return;
    }
    setSelectedNode(p => p?.id === d.id ? null : d);
  }

  function doZoom(dir: "in" | "out" | "fit") {
    if (!svgRef.current || !zoomRef.current) return;
    const s = d3.select(svgRef.current);
    if (dir === "in")  s.transition().duration(220).call(zoomRef.current.scaleBy, 1.3);
    if (dir === "out") s.transition().duration(220).call(zoomRef.current.scaleBy, 0.77);
    if (dir === "fit") s.transition().duration(350).call(zoomRef.current.transform, d3.zoomIdentity);
  }

  function autoLayout() {
    setNodes(assignPositions(nodes, centerId, dims.w, dims.h));
  }

  // Add paper search
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

  function addPaper(p: any) {
    if (nodes.find(n => n.id === p.id)) return;
    const n: MapNode = {
      id: p.id, title: p.title, year: p.publicationYear,
      citations: p.citationCount, author: p.authors?.[0], field: p.field,
      type: "custom", shape: "card", priority: "normal",
      x: dims.w / 2 + (Math.random() - 0.5) * 500,
      y: dims.h / 2 + 380,
    };
    setNodes(p2 => [...p2, n]);
    setEdges(p2 => [...p2, { source: centerId, target: n.id, type: "custom" }]);
    setAddQuery(""); setAddResults([]); setShowAdd(false);
  }

  function updateNodePriority(priority: Priority) {
    if (!selectedNode) return;
    setNodes(p => p.map(n => n.id === selectedNode.id ? { ...n, priority } : n));
    setSelectedNode(prev => prev ? { ...prev, priority } : null);
  }

  function updateNodeShape(shape: NodeShape) {
    if (!selectedNode) return;
    setNodes(p => p.map(n => n.id === selectedNode.id ? { ...n, shape } : n));
    setSelectedNode(prev => prev ? { ...prev, shape } : null);
  }

  const centerPaper = nodes.find(n => n.id === centerId);

  return (
    <div className="w-full h-full flex overflow-hidden"
      style={{ background: "#050505", fontFamily: SF }}>

      {/* ── Left Sidebar ── */}
      <Sidebar />

      {/* ── Main Canvas Area ── */}
      <div className="flex-1 relative overflow-hidden">
      
        {/* ── Floating Canvas ── */}
        <div ref={containerRef} className="absolute inset-0">
          {activeTool === "connect" && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full text-[11px] font-medium pointer-events-none"
              style={{
                background: "#0a0f1a",
                border: `1px solid ${connectSource ? "#f59e0b" : "#3bc9db"}`,
                color:  connectSource ? "#f59e0b" : "#3bc9db",
              }}>
              {connectSource ? `Click target node to connect from "${truncate(connectSource.title, 28)}"` : "Click source node"}
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
              <Loader2 size={18} className="animate-spin" style={{ color: "#3bc9db" }} />
              <p className="text-[13px] font-medium animate-pulse" style={{ color: "#3bc9db" }}>Building research map…</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "#1a2535", fontFamily: MONO }}>
                citations · references · related works
              </p>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <p className="text-[14px]" style={{ color: "#ef4444" }}>Error: {error}</p>
            </div>
          )}
          {!isLoading && !error && <svg ref={svgRef} className="w-full h-full" />}
        </div>

        {/* ── Floating Top Left ── */}
        <div className="absolute top-6 left-6 z-30 flex flex-col gap-4 pointer-events-none">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[12px] font-medium transition-opacity pointer-events-auto w-max"
          style={{ color: "#94a3b8" }}>
          <ArrowLeft size={13} /> Back to papers
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[14px] bg-white text-black shrink-0 shadow-lg pointer-events-auto">
            {centerPaper?.title?.charAt(0) || "P"}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2.5 pointer-events-auto">
              <span className="text-[17px] font-semibold text-white tracking-tight">
                {centerPaper ? truncate(centerPaper.title, 45) : "Research Map"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: "#1a2535", border: "1px solid #243044", color: "#94a3b8" }}>
                Draft
              </span>
            </div>
            <span className="text-[11px] pointer-events-auto" style={{ color: "#64748b" }}>
              last updates on: 05 May, 2026
            </span>
          </div>
        </div>
      </div>

      {/* ── Floating Top Right ── */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-4 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto" style={{ color: "#10b981" }}>
          <CheckCircle2 size={13} />
          <span className="text-[11px] font-medium">Auto saved</span>
        </div>
        <button className="px-5 py-2 rounded-lg text-[13px] font-semibold bg-white text-black hover:bg-gray-100 transition-colors pointer-events-auto shadow-lg flex items-center gap-2">
          <CheckCircle2 size={14} className="opacity-50" /> Save
        </button>
      </div>

      {/* ── Floating Bottom Center Toolbar ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3 pointer-events-none">
        {/* AI Pill */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium pointer-events-auto transition-opacity hover:opacity-80"
          style={{ background: "#0d1520", border: "1px solid #1a2535", color: "#94a3b8" }}>
          Build with AI <Sparkles size={11} />
        </button>

        {/* Main Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl pointer-events-auto shadow-2xl"
          style={{ background: "#0a0f1a", border: "1px solid #1a2535" }}>
          {([
            { t: "select"  as Tool, icon: <MousePointer size={14} />, tip: "Select"  },
            { t: "pan"     as Tool, icon: <Hand         size={14} />, tip: "Pan"     },
            { t: "ai"      as Tool, icon: <Sparkles     size={14} />, tip: "AI Actions" },
            { t: "note"    as Tool, icon: <StickyNote   size={14} />, tip: "Add Note"},
            { t: "upload"  as Tool, icon: <Upload       size={14} />, tip: "Add Papers"  },
            { t: "delete"  as Tool, icon: <Trash2       size={14} />, tip: "Delete"  },
            { t: "connect" as Tool, icon: <Link2        size={14} />, tip: "Connect Nodes" },
            { t: "box"     as Tool, icon: <BoxSelect    size={14} />, tip: "Box Select"},
          ] as const).map(({ t, icon, tip }) => (
            <button key={t} title={tip}
              onClick={() => {
                if (t === "upload") {
                  setShowAdd(true);
                } else {
                  setActiveTool(t);
                  setConnectSource(null);
                }
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: activeTool === t && t !== "upload" ? "#1a2535" : "transparent",
                color:      activeTool === t && t !== "upload" ? "#f1f5f9" : "#64748b",
                border:     `1px solid ${activeTool === t && t !== "upload" ? "#243044" : "transparent"}`,
              }}>
              {icon}
            </button>
          ))}
          
          <div className="w-[1px] h-6 mx-1" style={{ background: "#1a2535" }} />
          
          <button title="Test / Run"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white text-black hover:bg-gray-100 transition-colors shadow-lg">
            <Play size={14} className="fill-black" />
          </button>
        </div>
      </div>

      {/* ── Floating Bottom Right (Zoom) ── */}
      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1.5 pointer-events-none">
        {([
          { fn: () => doZoom("out"), icon: <ZoomOut    size={13} />, tip: "Zoom out" },
          { fn: () => doZoom("in"),  icon: <ZoomIn     size={13} />, tip: "Zoom in"  },
          { fn: () => doZoom("fit"), icon: <Maximize2  size={13} />, tip: "Reset"    },
        ]).map((z, i) => (
          <button key={i} title={z.tip} onClick={z.fn}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80 pointer-events-auto shadow-lg"
            style={{ background: "#0d1520", border: "1px solid #1a2535", color: "#64748b" }}>
            {z.icon}
          </button>
        ))}
      </div>

      {/* ── Floating Right Panel ── */}
      {selectedNode && activeTool === "select" && (
        <aside className="absolute top-24 right-6 w-72 max-h-[70vh] flex flex-col overflow-hidden rounded-2xl shadow-2xl z-40 pointer-events-auto"
          style={{ background: "#0a0a0a", border: "1px solid #1a2535" }}>
          <div className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: "1px solid #1a2535" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-sm" style={{ background: TYPE_COLOR[selectedNode.type] }} />
              <span className="text-[9px] font-bold tracking-widest uppercase"
                style={{ color: TYPE_COLOR[selectedNode.type], fontFamily: MONO }}>
                {TYPE_LABEL[selectedNode.type]}
              </span>
            </div>
            <button onClick={() => setSelectedNode(null)} style={{ color: "#334155" }} className="hover:text-white transition-colors">
              <X size={13} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
            <p className="text-[13px] font-semibold leading-snug" style={{ color: "#e2e8f0" }}>
              {selectedNode.title}
            </p>

            {/* Meta */}
            <div className="flex flex-col gap-2.5 pt-3" style={{ borderTop: "1px solid #1a2535" }}>
              {[
                { label: "Author",    value: selectedNode.author },
                { label: "Year",      value: selectedNode.year?.toString() },
                { label: "Citations", value: selectedNode.citations?.toLocaleString(), accent: true },
                { label: "Field",     value: selectedNode.field },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="flex items-start justify-between gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest shrink-0"
                    style={{ color: "#334155", fontFamily: MONO }}>{row.label}</span>
                  <span className="text-[11px] font-medium text-right leading-snug"
                    style={{ color: row.accent ? "#3bc9db" : "#64748b" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Note */}
            {selectedNode.note && (
              <div className="rounded-lg px-3 py-2.5" style={{ background: "#111", border: "1px solid #1a2535" }}>
                <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                  style={{ color: "#334155", fontFamily: MONO }}>Note</div>
                <p className="text-[12px] leading-relaxed" style={{ color: "#64748b" }}>{selectedNode.note}</p>
              </div>
            )}

            {/* Priority */}
            <div style={{ borderTop: "1px solid #1a2535", paddingTop: 12 }}>
              <div className="text-[9px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "#334155", fontFamily: MONO }}>Priority</div>
              <div className="flex gap-1.5">
                {(["normal", "high", "critical"] as Priority[]).map(p => (
                  <button key={p} onClick={() => updateNodePriority(p)}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all hover:opacity-80"
                    style={{
                      background: selectedNode.priority === p ? PRIORITY_COLOR[p] + "18" : "#111",
                      border: `1px solid ${selectedNode.priority === p ? PRIORITY_COLOR[p] + "40" : "#1a2535"}`,
                      color: selectedNode.priority === p ? PRIORITY_COLOR[p] : "#334155",
                    }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Note + URL */}
            <div className="flex gap-2">
              <button onClick={() => { setNoteInput(selectedNode.note || ""); setShowNoteModal(true); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all hover:opacity-80"
                style={{ background: "#111", border: "1px solid #1a2535", color: "#64748b" }}>
                <AlignLeft size={12} /> Note
              </button>
              <button onClick={() => { setUrlInput(selectedNode.url || ""); setShowUrlModal(true); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all hover:opacity-80"
                style={{ background: "#111", border: "1px solid #1a2535", color: "#64748b" }}>
                <ExternalLink size={12} /> Link
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-3" style={{ borderTop: "1px solid #1a2535" }}>
              <button onClick={() => { window.location.href = `/paper/${selectedNode.id}`; }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)", color: "#10b981" }}>
                <BookOpen size={12} /> View Full Paper
              </button>
              <button onClick={() => { window.location.href = `/map/${selectedNode.id}`; }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(59,201,219,0.05)", border: "1px solid rgba(59,201,219,0.15)", color: "#3bc9db" }}>
                <Map size={12} /> Map This Paper
              </button>
              {selectedNode.url && (
                <a href={selectedNode.url} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                  style={{ background: "#111", border: "1px solid #1a2535", color: "#64748b" }}>
                  <ExternalLink size={12} /> Open Source Link
                </a>
              )}
              <button
                onClick={() => {
                  setNodes(p => p.filter(n => n.id !== selectedNode!.id));
                  setEdges(p => p.filter(e =>
                    getId(e.source) !== selectedNode!.id && getId(e.target) !== selectedNode!.id
                  ));
                  setSelectedNode(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                <Trash2 size={12} /> Remove Node
              </button>
            </div>
          </div>
        </aside>
      )}

      </div>

      {/* ── Add paper modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(5,8,16,0.9)" }}
          onClick={() => { setShowAdd(false); setAddQuery(""); setAddResults([]); }}>
          <div className="w-[560px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#0a0f1a", border: "1px solid #1a2535" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid #1a2535" }}>
              <span className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>Add Paper to Map</span>
              <button onClick={() => { setShowAdd(false); setAddQuery(""); setAddResults([]); }} style={{ color: "#334155" }}>
                <X size={14} />
              </button>
            </div>
            <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid #1a2535" }}>
              <Search size={13} style={{ color: "#334155" }} />
              <input autoFocus type="text" value={addQuery}
                onChange={e => setAddQuery(e.target.value)}
                placeholder="Search by title, author, topic…"
                className="flex-1 bg-transparent text-[13px] text-white focus:outline-none"
                style={{ fontFamily: SF }} />
              {isSearching && <Loader2 size={13} className="animate-spin" style={{ color: "#3bc9db" }} />}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {addResults.map((p, i) => (
                <button key={i} onClick={() => addPaper(p)}
                  className="w-full flex flex-col gap-1.5 px-5 py-3.5 text-left transition-opacity hover:opacity-75"
                  style={{ borderBottom: "1px solid #1a2535", background: i % 2 === 0 ? "#0a0f1a" : "#050810" }}>
                  <span className="text-[12px] font-medium leading-snug line-clamp-2" style={{ color: "#e2e8f0" }}>
                    {p.title}
                  </span>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: "#334155" }}>
                    <span>{p.authors?.[0]}{p.authors?.length > 1 ? " et al." : ""}</span>
                    {p.publicationYear && <><span>·</span><span>{p.publicationYear}</span></>}
                    <span style={{ color: "#3bc9db" }}>· {p.citationCount?.toLocaleString()} cit.</span>
                  </div>
                </button>
              ))}
              {addQuery.length >= 2 && !isSearching && !addResults.length && (
                <p className="px-5 py-6 text-[12px]" style={{ color: "#334155" }}>No results found</p>
              )}
              {addQuery.length < 2 && (
                <p className="px-5 py-6 text-[11px] uppercase tracking-widest"
                  style={{ color: "#1a2535", fontFamily: MONO }}>Type to search</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edge label modal ── */}
      {showEdgeLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(5,8,16,0.85)" }}
          onClick={() => setShowEdgeLabel(false)}>
          <div className="w-[380px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#0a0f1a", border: "1px solid #1a2535" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid #1a2535" }}>
              <span className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>Edge Label / Snippet</span>
              <button onClick={() => setShowEdgeLabel(false)} style={{ color: "#334155" }}><X size={14} /></button>
            </div>
            <div className="px-5 py-4">
              <input type="text" value={edgeLabelInput}
                onChange={e => setEdgeLabelInput(e.target.value)}
                placeholder="Add a label or snippet to this connection…"
                className="w-full bg-transparent text-[13px] text-white focus:outline-none py-2"
                style={{ borderBottom: "1px solid #1a2535", fontFamily: SF }} />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    if (selectedEdge) {
                      setEdges(p => p.map(e =>
                        getId(e.source) === getId(selectedEdge.source) && getId(e.target) === getId(selectedEdge.target)
                          ? { ...e, label: edgeLabelInput || undefined }
                          : e
                      ));
                    }
                    setShowEdgeLabel(false);
                  }}
                  className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "rgba(59,201,219,0.08)", border: "1px solid rgba(59,201,219,0.2)", color: "#3bc9db" }}>
                  Save
                </button>
                <button onClick={() => setShowEdgeLabel(false)}
                  className="py-2 px-4 rounded-xl text-[12px] font-medium transition-opacity hover:opacity-80"
                  style={{ background: "#0d1520", border: "1px solid #1a2535", color: "#64748b" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Note modal ── */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(5,8,16,0.85)" }}
          onClick={() => setShowNoteModal(false)}>
          <div className="w-[440px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#0a0f1a", border: "1px solid #1a2535" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid #1a2535" }}>
              <span className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>Add Note</span>
              <button onClick={() => setShowNoteModal(false)} style={{ color: "#334155" }}><X size={14} /></button>
            </div>
            <div className="px-5 py-4">
              <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)}
                placeholder="Write a note about this paper…"
                rows={4}
                className="w-full bg-transparent text-[13px] text-white focus:outline-none resize-none p-3 rounded-xl"
                style={{ border: "1px solid #1a2535", fontFamily: SF, color: "#94a3b8" }} />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    if (selectedNode) {
                      setNodes(p => p.map(n => n.id === selectedNode.id ? { ...n, note: noteInput || undefined } : n));
                      setSelectedNode(prev => prev ? { ...prev, note: noteInput || undefined } : null);
                    }
                    setShowNoteModal(false);
                  }}
                  className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "rgba(59,201,219,0.08)", border: "1px solid rgba(59,201,219,0.2)", color: "#3bc9db" }}>
                  Save Note
                </button>
                <button onClick={() => setShowNoteModal(false)}
                  className="py-2 px-4 rounded-xl text-[12px] font-medium transition-opacity hover:opacity-80"
                  style={{ background: "#0d1520", border: "1px solid #1a2535", color: "#64748b" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── URL modal ── */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(5,8,16,0.85)" }}
          onClick={() => setShowUrlModal(false)}>
          <div className="w-[440px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#0a0f1a", border: "1px solid #1a2535" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid #1a2535" }}>
              <span className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>Link Source</span>
              <button onClick={() => setShowUrlModal(false)} style={{ color: "#334155" }}><X size={14} /></button>
            </div>
            <div className="px-5 py-4">
              <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="https://doi.org/… or any URL"
                className="w-full bg-transparent text-[13px] text-white focus:outline-none py-2"
                style={{ borderBottom: "1px solid #1a2535", fontFamily: SF }} />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    if (selectedNode) {
                      setNodes(p => p.map(n => n.id === selectedNode.id ? { ...n, url: urlInput || undefined } : n));
                      setSelectedNode(prev => prev ? { ...prev, url: urlInput || undefined } : null);
                    }
                    setShowUrlModal(false);
                  }}
                  className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "rgba(59,201,219,0.08)", border: "1px solid rgba(59,201,219,0.2)", color: "#3bc9db" }}>
                  Save Link
                </button>
                <button onClick={() => setShowUrlModal(false)}
                  className="py-2 px-4 rounded-xl text-[12px] font-medium transition-opacity hover:opacity-80"
                  style={{ background: "#0d1520", border: "1px solid #1a2535", color: "#64748b" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
