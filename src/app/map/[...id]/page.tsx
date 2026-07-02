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
  Database, Phone, Megaphone, Users, LineChart, Webhook, Link, Code,
  MessageSquare, FileText, Terminal, Settings2, Download, MessageCircle, ArrowUpRight,
  History, MoreHorizontal, Paperclip, Mic, ChevronDown, User, Send
} from "lucide-react";

const SF   = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, Menlo, monospace";

type NodeType    = "center" | "reference" | "citing" | "related" | "custom" | "paper" | "ai" | "dataset" | "prompt" | "note" | "question" | "timeline" | "comment" | "frame";
type NodeShape   = "card" | "diamond" | "circle" | "pill";
type Priority    = "normal" | "high" | "critical";
type EdgeType    = "supports" | "contradicts" | "extends" | "references" | "inspired_by" | "uses_dataset" | "uses_methodology" | "replicates" | "improves" | "limitation" | "future_work" | "open_question" | "literature_review" | "custom";
type Tool        = "select" | "hand" | "comment" | "note" | "ai" | "paper" | "dataset" | "prompt" | "question" | "timeline" | "connect" | "play" | "export" | "settings" | "frame";

interface MapNode {
  id: string;
  title: string;
  year?: number;
  citations?: number;
  author?: string;
  field?: string;
  journal?: string;
  content?: string;
  type: NodeType;
  shape: NodeShape;
  priority: Priority;
  note?: string;
  url?: string;
  description?: string;
  tags?: string[];
  customColor?: string;
  metadata?: Record<string, string>;
  properties?: Record<string, string>;
  x: number;
  y: number;
}

interface EdgeMetadata {
  strength?: "weak" | "medium" | "strong";
  confidence?: "low" | "medium" | "high";
  notes?: string;
  creator?: string;
  date?: string;
}

interface MapEdge {
  id: string;
  source: string | MapNode;
  target: string | MapNode;
  type: EdgeType;
  label?: string;
  metadata?: EdgeMetadata;
}

const NODE_W = 220;
const NODE_H = 88;

const PRIORITY_COLOR: Record<Priority, string> = {
  normal:   "#555555",
  high:     "#f59e0b",
  critical: "#ef4444",
};

const TYPE_COLOR: Record<NodeType, string> = {
  center:    "#e8e8e6",
  reference: "#808080",
  citing:    "#808080",
  related:   "#808080",
  custom:    "#808080",
  paper:     "#808080",
  ai:        "#3bc9db",
  dataset:   "#10b981",
  prompt:    "#f59e0b",
  note:      "#fde047",
  question:  "#ec4899",
  timeline:  "#6366f1",
  comment:   "#a855f7",
  frame:     "#ffffff",
};

const EDGE_COLOR: Record<EdgeType, string> = {
  supports: "#10b981", // green
  contradicts: "#ef4444", // red
  extends: "#3b82f6", // blue
  references: "#64748b", // slate
  inspired_by: "#f59e0b", // amber
  uses_dataset: "#8b5cf6", // violet
  uses_methodology: "#d946ef", // fuchsia
  replicates: "#14b8a6", // teal
  improves: "#22c55e", // green
  limitation: "#f97316", // orange
  future_work: "#6366f1", // indigo
  open_question: "#ec4899", // pink
  literature_review: "#8b5cf6", // purple
  custom: "#444444",
};

const EDGE_DASH: Record<EdgeType, string> = {
  supports: "none",
  contradicts: "4 4",
  extends: "none",
  references: "2 4",
  inspired_by: "none",
  uses_dataset: "none",
  uses_methodology: "none",
  replicates: "none",
  improves: "none",
  limitation: "8 4",
  future_work: "8 4",
  open_question: "4 4",
  literature_review: "none",
  custom: "none",
};

const EDGE_LABEL: Record<EdgeType, string> = {
  supports: "Supports",
  contradicts: "Contradicts",
  extends: "Extends",
  references: "References",
  inspired_by: "Inspired By",
  uses_dataset: "Uses Dataset",
  uses_methodology: "Uses Methodology",
  replicates: "Replicates",
  improves: "Improves",
  limitation: "Limitation",
  future_work: "Future Work",
  open_question: "Open Question",
  literature_review: "Literature Review",
  custom: "Connected To",
};

const TYPE_LABEL: Record<NodeType, string> = {
  center:    "SELECTED",
  reference: "REFERENCED",
  citing:    "CITES THIS",
  related:   "RELATED",
  custom:    "ADDED",
  paper:     "PAPER",
  ai:        "AI NODE",
  dataset:   "DATASET",
  prompt:    "PROMPT",
  note:      "NOTE",
  question:  "QUESTION",
  timeline:  "TIMELINE",
  comment:   "COMMENT",
  frame:     "FRAME",
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
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdge,  setSelectedEdge]  = useState<MapEdge | null>(null);
  const [connectSource, setConnectSource] = useState<MapNode | null>(null);
  const [history,       setHistory]       = useState<{ nodes: MapNode[], edges: MapEdge[] }[]>([]);
  const [historyIndex,  setHistoryIndex]  = useState(-1);
  const [clipboard,     setClipboard]     = useState<MapNode[]>([]);
  const [contextMenu,   setContextMenu]   = useState<{x: number, y: number, show: boolean} | null>(null);

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
  const [aiCommand,      setAiCommand]      = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: "user" | "ai", text: string}[]>([
    { role: "ai", text: "Hi! I'm your AI Research Assistant. How can I help you build your map?" }
  ]);

  const idParam = params?.id;
  const id = Array.isArray(idParam)
    ? idParam.map(decodeURIComponent).join("/")
    : (idParam as string);

  const selectedNode = selectedNodeIds.length === 1 ? nodes.find(n => n.id === selectedNodeIds[0]) || null : null;
  const stateRef = useRef({ activeTool, connectSource, selectedNodeIds, selectedEdge, nodes, edges, history, historyIndex, clipboard });
  stateRef.current = { activeTool, connectSource, selectedNodeIds, selectedEdge, nodes, edges, history, historyIndex, clipboard };

  const pushHistory = (newNodes: MapNode[], newEdges: MapEdge[]) => {
    setHistory(prev => {
      const next = prev.slice(0, stateRef.current.historyIndex + 1);
      next.push({ nodes: newNodes, edges: newEdges });
      if (next.length > 50) next.shift();
      return next;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 50));
    setNodes(newNodes);
    setEdges(newEdges);
  };

  const applyCanvasOperations = (operations: any[]) => {
    let currentNodes = [...stateRef.current.nodes];
    let currentEdges = [...stateRef.current.edges];
    
    operations.forEach(op => {
      if (op.type === "add_nodes") {
        currentNodes = [...currentNodes, ...op.nodes];
      } else if (op.type === "add_edges") {
        currentEdges = [...currentEdges, ...op.edges];
      } else if (op.type === "update_nodes") {
        currentNodes = currentNodes.map(n => {
          const update = op.updates.find((u: any) => u.id === n.id);
          return update ? { ...n, ...update.changes } : n;
        });
      }
    });
    
    pushHistory(currentNodes, currentEdges);
  };

  const handleAIChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiCommand.trim() || isProcessingAI) return;
    
    const userMsg = aiCommand;
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setAiCommand("");
    setIsProcessingAI(true);
    
    try {
      const res = await fetch('/api/canvas-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: userMsg,
          nodes: stateRef.current.nodes,
          edges: stateRef.current.edges,
          selectedIds: stateRef.current.selectedNodeIds
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      applyCanvasOperations(data.operations);
      setChatMessages(prev => [...prev, { role: "ai", text: data.message || "I've updated the canvas based on your request!" }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: "ai", text: `Sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setIsProcessingAI(false);
    }
  };

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

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space") {
        e.preventDefault();
        setActiveTool("ai");
      } else if (e.code === "Tab") {
        e.preventDefault();
        setActiveTool("select");
      } else if (e.key === "A" && e.shiftKey) {
        e.preventDefault();
        const child: MapNode = {
          id: `ai-${Date.now()}`, title: "New AI Action", type: "ai", shape: "card", priority: "normal",
          x: dims.w / 2, y: dims.h / 2,
        };
        setNodes(p => [...p, child]);
      } else if (e.key === "P" && e.shiftKey) {
        e.preventDefault();
        const child: MapNode = {
          id: `paper-${Date.now()}`, title: "New Paper", type: "paper", shape: "card", priority: "normal",
          x: dims.w / 2, y: dims.h / 2,
        };
        setNodes(p => [...p, child]);
      } else if (e.code === "Delete" || e.code === "Backspace") {
        const { selectedNodeIds, nodes, edges } = stateRef.current;
        if (selectedNodeIds.length > 0) {
          e.preventDefault();
          const newNodes = nodes.filter(n => !selectedNodeIds.includes(n.id));
          const newEdges = edges.filter(edge => !selectedNodeIds.includes(getId(edge.source)) && !selectedNodeIds.includes(getId(edge.target)));
          pushHistory(newNodes, newEdges);
          setSelectedNodeIds([]);
        } else if (stateRef.current.selectedEdge) {
          e.preventDefault();
          const newEdges = edges.filter(edge => edge !== stateRef.current.selectedEdge);
          pushHistory(nodes, newEdges);
          setSelectedEdge(null);
        }
      } else if (e.code === "KeyC" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const { selectedNodeIds, nodes } = stateRef.current;
        if (selectedNodeIds.length > 0) {
          setClipboard(nodes.filter(n => selectedNodeIds.includes(n.id)));
        }
      } else if (e.code === "KeyV" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const { clipboard, nodes, edges } = stateRef.current;
        if (clipboard.length > 0) {
          const newNodes = clipboard.map(n => ({
            ...n,
            id: `copy-${Date.now()}-${Math.random()}`,
            x: n.x + 40,
            y: n.y + 40,
          }));
          pushHistory([...nodes, ...newNodes], edges);
          setSelectedNodeIds(newNodes.map(n => n.id));
        }
      } else if (e.code === "KeyD" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const { selectedNodeIds, nodes, edges } = stateRef.current;
        if (selectedNodeIds.length > 0) {
          const newNodes = nodes.filter(n => selectedNodeIds.includes(n.id)).map(n => ({
            ...n,
            id: `copy-${Date.now()}-${Math.random()}`,
            x: n.x + 40,
            y: n.y + 40,
          }));
          pushHistory([...nodes, ...newNodes], edges);
          setSelectedNodeIds(newNodes.map(n => n.id));
        }
      } else if ((e.code === "KeyZ" || e.code === "KeyY") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const { history, historyIndex } = stateRef.current;
        if (e.shiftKey || e.code === "KeyY") { // Redo
          if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            setNodes(next.nodes);
            setEdges(next.edges);
          }
        } else { // Undo
          if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setHistoryIndex(historyIndex - 1);
            setNodes(prev.nodes);
            setEdges(prev.edges);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dims.w, dims.h]);

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

    // Premium Layered Drop shadow
    const f = defs.append("filter").attr("id", "shadow")
      .attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    // Ambient shadow
    f.append("feDropShadow").attr("dx", 0).attr("dy", 12).attr("stdDeviation", 24)
      .attr("flood-color", "#000").attr("flood-opacity", 0.4);
    // Hard shadow
    f.append("feDropShadow").attr("dx", 0).attr("dy", 4).attr("stdDeviation", 8)
      .attr("flood-color", "#000").attr("flood-opacity", 0.3);

    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .filter((ev) => {
        if (ev.type === "wheel") return true;
        return stateRef.current.activeTool === "hand" || ev.button === 1;
      })
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

    const brush = d3.brush()
      .filter((ev) => stateRef.current.activeTool === "select" && ev.button === 0)
      .on("end", (ev) => {
        if (!ev.selection) {
          if (ev.sourceEvent && ev.sourceEvent.type === "mouseup") {
             setSelectedNodeIds([]);
          }
          return;
        }
        const [[x0, y0], [x1, y1]] = ev.selection;
        const selected = stateRef.current.nodes.filter(n => {
           const w = getNodeW(n.type);
           const h = getNodeH(n.type);
           const nx0 = n.x - w/2;
           const ny0 = n.y - h/2;
           const nx1 = n.x + w/2;
           const ny1 = n.y + h/2;
           return nx0 < x1 && nx1 > x0 && ny0 < y1 && ny1 > y0;
        }).map(n => n.id);
        
        if (ev.sourceEvent?.shiftKey) {
          setSelectedNodeIds(prev => Array.from(new Set([...prev, ...selected])));
        } else {
          setSelectedNodeIds(selected);
        }
        d3.select(el).select(".brush").call(brush.move as any, null);
      });

    g.append("g").attr("class", "brush").call(brush);

    const getNodeW = (t: NodeType) => t === "frame" ? 800 : t === "center" ? 280 : t === "timeline" ? 340 : t === "question" ? 260 : t === "note" ? 220 : t === "comment" ? 240 : ["paper", "reference", "citing", "related", "custom"].includes(t) ? 280 : 200;
    const getNodeH = (t: NodeType) => t === "frame" ? 600 : t === "center" ? 80 : t === "timeline" ? 80 : t === "question" ? 80 : t === "note" ? 140 : t === "comment" ? 120 : ["paper", "reference", "citing", "related", "custom"].includes(t) ? 110 : 72;

    svg.on("click", (ev) => {
      if (ev.defaultPrevented) return;
      const { activeTool, nodes, edges } = stateRef.current;
      if (["paper", "note", "question", "timeline", "comment", "frame", "ai"].includes(activeTool)) {
        const transform = d3.zoomTransform(el);
        const [x, y] = transform.invert(d3.pointer(ev, el));
        
        const newNode: MapNode = {
          id: `${activeTool}-${Date.now()}`,
          title: `New ${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}`,
          type: activeTool as NodeType,
          shape: "card",
          priority: "normal",
          x: Math.round(x / 20) * 20,
          y: Math.round(y / 20) * 20,
        };
        pushHistory([...nodes, newNode], edges);
        setActiveTool("select");
      }
    });

    // Edge path helper
    const edgePath = (d: any) => {
      const s = typeof d.source === "string" ? nodes.find(n => n.id === d.source) : d.source as MapNode;
      const t = typeof d.target === "string" ? nodes.find(n => n.id === d.target) : d.target as MapNode;
      if (!s || !t) return "";

      const sW = getNodeW(s.type);
      const tW = getNodeW(t.type);
      const sH = getNodeH(s.type);
      const tH = getNodeH(t.type);

      let sx = s.x, sy = s.y, tx = t.x, ty = t.y;

      if (Math.abs(s.x - t.x) > Math.abs(s.y - t.y)) {
        sx = s.x < t.x ? s.x + sW / 2 : s.x - sW / 2;
        tx = s.x < t.x ? t.x - tW / 2 : t.x + tW / 2;
        const dist = Math.abs(tx - sx) * 0.5;
        return `M${sx},${sy} C${sx + (s.x < t.x ? dist : -dist)},${sy} ${tx - (s.x < t.x ? dist : -dist)},${ty} ${tx},${ty}`;
      } else {
        sy = s.y < t.y ? s.y + sH / 2 : s.y - sH / 2;
        ty = s.y < t.y ? t.y - tH / 2 : t.y + tH / 2;
        const dist = Math.abs(ty - sy) * 0.5;
        return `M${sx},${sy} C${sx},${sy + (s.y < t.y ? dist : -dist)} ${tx},${ty - (s.y < t.y ? dist : -dist)} ${tx},${ty}`;
      }
    };

    // Edges
    const edgeG = g.append("g");
    const edgeGroups = edgeG.selectAll<SVGGElement, MapEdge>("g")
      .data(edges).join("g");
    const linkSel = edgeGroups.append("path")
      .attr("fill", "none")
      .attr("stroke", (d: any) => stateRef.current.selectedEdge?.id === d.id ? "#ffffff" : EDGE_COLOR[d.type as EdgeType] || "#4F46E5")
      .attr("stroke-width", (d: any) => stateRef.current.selectedEdge?.id === d.id ? 3 : 2)
      .attr("stroke-opacity", 0.8)
      .attr("stroke-dasharray", (d: any) => EDGE_DASH[d.type as EdgeType] || "none")
      .attr("marker-end", (d: any) => `url(#arr-${d.type})`)
      .attr("cursor", "pointer")
      .attr("class", "animated-edge")
      .attr("d", edgePath as any)
      .on("mouseover", function(ev, d: any) {
        if (stateRef.current.selectedEdge?.id === d.id) return;
        d3.select(this).transition().duration(200).attr("stroke-width", 4).attr("stroke-opacity", 1);
      })
      .on("mouseout", function(ev, d: any) {
        if (stateRef.current.selectedEdge?.id === d.id) return;
        d3.select(this).transition().duration(200).attr("stroke-width", 2).attr("stroke-opacity", 0.8);
      })
      .on("click", (_ev, d: any) => {
        setSelectedEdge(d);
        setEdgeLabelInput(d.label || "");
        setShowEdgeLabel(true);
      });

    // Edge labels
    edgeGroups.each(function(d: any) {
      const labelText = d.label || EDGE_LABEL[d.type as EdgeType];
      if (!labelText) return;
      const s = typeof d.source === "string" ? nodes.find(n => n.id === d.source) : d.source as MapNode;
      const t = typeof d.target === "string" ? nodes.find(n => n.id === d.target) : d.target as MapNode;
      if (!s || !t) return;
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
      
      const width = labelText.length * 7.5 + 24;
      d3.select(this).append("rect")
        .attr("x", mx - width/2).attr("y", my - 12)
        .attr("width", width).attr("height", 24).attr("rx", 12)
        .attr("fill", "#121212").attr("stroke", EDGE_COLOR[d.type as EdgeType] || "#2b2d2d")
        .attr("stroke-width", stateRef.current.selectedEdge?.id === d.id ? 2 : 1)
        .attr("cursor", "pointer")
        .on("click", () => {
           setSelectedEdge(d);
           setEdgeLabelInput(d.label || "");
           setShowEdgeLabel(true);
        });
      d3.select(this).append("text")
        .text(labelText)
        .attr("x", mx).attr("y", my + 4.5)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px").attr("font-family", SF).attr("font-weight", 500)
        .attr("fill", "#e2e8f0").attr("pointer-events", "none");
    });

    // Nodes
    const nodeG = g.append("g");
    const nodeSel = nodeG.selectAll<SVGGElement, MapNode>("g")
      .data(nodes, (d: MapNode) => d.id).join("g")
      .attr("class", "node-group")
      .attr("transform", (d: MapNode) => `translate(${d.x},${d.y})`)
      .attr("cursor", "pointer")
      .call(d3.drag<SVGGElement, MapNode>()
        .on("start", function(ev, d) { 
          d3.select(this).raise(); 
          if (!stateRef.current.selectedNodeIds.includes(d.id)) {
            setSelectedNodeIds([d.id]);
          }
        })
        .on("drag",  function(ev, d) {
          const dx = ev.dx;
          const dy = ev.dy;
          const { selectedNodeIds } = stateRef.current;
          
          if (selectedNodeIds.includes(d.id) && selectedNodeIds.length > 1) {
            nodeSel.filter((n: MapNode) => selectedNodeIds.includes(n.id)).each(function(n: MapNode) {
              n.x += dx; n.y += dy;
              d3.select(this).attr("transform", `translate(${n.x},${n.y})`);
            });
          } else {
            d.x += dx; d.y += dy;
            d3.select(this).attr("transform", `translate(${d.x},${d.y})`);
          }
          linkSel.attr("d", edgePath as any);
          edgeGroups.selectAll("rect,text").remove();
        })
        .on("end", function() {
          const newNodes = stateRef.current.nodes.map(n => ({ ...n, x: n.x, y: n.y }));
          pushHistory(newNodes, stateRef.current.edges);
        })
      )
      .on("click", (ev, d) => handleNodeClick(ev, d))
      .on("dblclick", (_ev, d) => {
        // Mock edit mode trigger for now
        // A full implementation would open a modal or inline edit
        const newTitle = window.prompt("Edit Node Title:", d.title);
        if (newTitle) {
          setNodes(p => p.map(n => n.id === d.id ? { ...n, title: newTitle } : n));
        }
      });

    // Card shadow
    nodeSel.append("rect")
      .attr("x", d => -getNodeW(d.type) / 2 - 4)
      .attr("y", d => -getNodeH(d.type) / 2 - 4)
      .attr("width", d => getNodeW(d.type) + 8)
      .attr("height", d => getNodeH(d.type) + 8)
      .attr("rx", 16)
      .attr("fill", d => {
        if (d.customColor) return d.customColor + "33";
        return d.type === "frame" ? "transparent" : d.type === "ai" ? "rgba(59,201,219,0.2)" : d.type === "dataset" ? "rgba(16,185,129,0.2)" : d.type === "prompt" ? "rgba(245,158,11,0.2)" : d.type === "question" ? "rgba(236,72,153,0.2)" : "rgba(0,0,0,0.5)";
      })
      .attr("filter", "url(#shadow)");

    // Card body (n8n style)
    nodeSel.append("rect")
      .attr("class", "card-body")
      .attr("x", d => -getNodeW(d.type) / 2)
      .attr("y", d => -getNodeH(d.type) / 2)
      .attr("width", d => getNodeW(d.type))
      .attr("height", d => getNodeH(d.type))
      .attr("rx", 16)
      .attr("fill", d => {
        if (d.customColor) return d.customColor + "1A";
        if (d.type === "center") return "#1A1D27";
        if (d.type === "ai") return "rgba(30,41,59,0.8)";
        if (d.type === "dataset") return "rgba(6,78,59,0.8)";
        if (d.type === "prompt") return "rgba(120,53,15,0.8)";
        if (d.type === "question") return "rgba(80,20,50,0.8)";
        if (d.type === "note") return "rgba(30,30,20,0.8)";
        if (d.type === "timeline") return "rgba(15,20,40,0.8)";
        if (d.type === "comment") return "rgba(40,15,50,0.8)";
        if (d.type === "frame") return "rgba(255,255,255,0.02)";
        return "#11131A";
      })
      .attr("stroke", d => {
        if (stateRef.current.selectedNodeIds.includes(d.id)) return "#FFFFFF";
        if (d.customColor) return d.customColor;
        if (d.type === "ai") return "#3BC9DB";
        if (d.type === "dataset") return "#10B981";
        if (d.type === "prompt") return "#F59E0B";
        if (d.type === "question") return "#EC4899";
        if (d.type === "timeline") return "#6366f1";
        if (d.type === "note") return "#EAB308";
        if (d.type === "comment") return "#a855f7";
        if (d.type === "frame") return "#444";
        return "#2A2E3D";
      })
      .attr("stroke-width", d => {
        if (stateRef.current.selectedNodeIds.includes(d.id)) return 1.5;
        if (d.customColor) return 1.5;
        if (["ai", "dataset", "prompt", "question", "timeline", "note", "comment", "frame"].includes(d.type)) return 1.5;
        return 1;
      })
      .on("mouseover", function(_ev, d) {
        if (stateRef.current.selectedNodeIds.includes(d.id)) return;
        const targetStroke = d.customColor || (d.type === "ai" ? "#67E8F9" : d.type === "dataset" ? "#34D399" : d.type === "prompt" ? "#FBBF24" : d.type === "question" ? "#F472B6" : d.type === "timeline" ? "#818CF8" : d.type === "note" ? "#FDE047" : d.type === "comment" ? "#c084fc" : d.type === "frame" ? "#666" : "#4e5569");
        d3.select(this).transition().duration(200).attr("stroke", targetStroke);
      })
      .on("mouseout", function(_ev, d) {
        if (stateRef.current.selectedNodeIds.includes(d.id)) return;
        const defaultStroke = d.customColor || (d.type === "ai" ? "#3BC9DB" : d.type === "dataset" ? "#10B981" : d.type === "prompt" ? "#F59E0B" : d.type === "question" ? "#EC4899" : d.type === "timeline" ? "#6366f1" : d.type === "note" ? "#EAB308" : d.type === "comment" ? "#a855f7" : d.type === "frame" ? "#444" : "#2A2E3D");
        d3.select(this).transition().duration(200).attr("stroke", defaultStroke);
      });

    // Center Node Content (foreignObject for perfect text wrapping and alignment)
    const centerGroup = nodeSel.filter(d => d.type === "center");
    centerGroup.append("foreignObject")
      .attr("x", d => -getNodeW(d.type) / 2)
      .attr("y", d => -getNodeH(d.type) / 2)
      .attr("width", d => getNodeW(d.type))
      .attr("height", d => getNodeH(d.type))
      .append("xhtml:div")
      .attr("class", "flex items-center h-full p-4 gap-4 pointer-events-none")
      .html(d => `
        <div class="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a2 2 0 0 1 2 2c-.11.66-.5 1.25-1.07 1.62C13.62 6.09 14.33 7 15 8h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-4c-.67 1-1.38 1.91-2.07 2.38C13.5 20.75 13.89 21.34 14 22a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2c.11-.66.5-1.25 1.07-1.62C6.38 19.91 5.67 19 5 18H1a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h4c.67-1 1.38-1.91 2.07-2.38C6.5 7.25 6.11 6.66 6 6a2 2 0 0 1 2-2h4z"></path>
            <path d="M9 12v.01"></path>
            <path d="M15 12v.01"></path>
          </svg>
        </div>
        <div class="flex flex-col overflow-hidden">
          <div class="text-[13px] font-semibold text-[#FFFFFF] leading-tight line-clamp-2" style="font-family: ${SF}">${d.title}</div>
          <div class="text-[10px] text-[#64748B] mt-1 uppercase tracking-widest" style="font-family: ${MONO}">AI Map Center</div>
        </div>
      `);

    // Paper / Reference / Custom Nodes
    const paperGroup = nodeSel.filter(d => ["paper", "reference", "custom", "citing", "related"].includes(d.type));
    paperGroup.append("foreignObject")
      .attr("x", d => -getNodeW(d.type) / 2)
      .attr("y", d => -getNodeH(d.type) / 2)
      .attr("width", d => getNodeW(d.type))
      .attr("height", d => getNodeH(d.type))
      .append("xhtml:div")
      .attr("class", "flex flex-col h-full p-4 pointer-events-none")
      .html(d => `
        <div class="flex items-center gap-1.5 mb-1 opacity-70">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#94A3B8]"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
          <span class="text-[9px] text-[#94A3B8] font-mono font-bold tracking-widest">${d.year || "2024"}</span>
          ${d.citations ? `<span class="text-[9px] text-[#94A3B8] font-mono font-bold tracking-widest ml-auto">${d.citations.toLocaleString()} cit.</span>` : ''}
        </div>
        <div class="text-[12px] font-semibold text-[#E2E8F0] leading-tight mb-1 line-clamp-2" style="font-family: ${SF}">${d.title}</div>
        <div class="text-[10px] text-[#64748B] truncate" style="font-family: ${SF}">${d.author || "Unknown Author"}</div>
        ${d.journal ? `<div class="text-[10px] text-[#10B981] truncate mt-0.5" style="font-family: ${SF}">${d.journal}</div>` : ''}
      `);

    // Note Nodes
    const noteGroup = nodeSel.filter(d => d.type === "note");
    noteGroup.append("foreignObject")
      .attr("x", d => -getNodeW(d.type) / 2)
      .attr("y", d => -getNodeH(d.type) / 2)
      .attr("width", d => getNodeW(d.type))
      .attr("height", d => getNodeH(d.type))
      .append("xhtml:div")
      .attr("class", "flex flex-col h-full p-4 pointer-events-none")
      .html(d => `
        <div class="text-[13px] text-[#E2E8F0] whitespace-pre-wrap leading-relaxed overflow-hidden" style="font-family: ${SF}">${d.note || d.title}</div>
      `);

    // Question Nodes
    const questionGroup = nodeSel.filter(d => d.type === "question");
    questionGroup.append("foreignObject")
      .attr("x", d => -getNodeW(d.type) / 2)
      .attr("y", d => -getNodeH(d.type) / 2)
      .attr("width", d => getNodeW(d.type))
      .attr("height", d => getNodeH(d.type))
      .append("xhtml:div")
      .attr("class", "flex items-center h-full p-4 gap-3 pointer-events-none")
      .html(d => `
        <div class="flex-shrink-0 w-8 h-8 rounded-full bg-[#EC4899] bg-opacity-20 flex items-center justify-center border border-[#EC4899]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="text-[13px] font-semibold text-[#FBCFE8] leading-tight line-clamp-3" style="font-family: ${SF}">${d.title}</div>
      `);

    // Timeline Nodes
    const timelineGroup = nodeSel.filter(d => d.type === "timeline");
    timelineGroup.append("foreignObject")
      .attr("x", d => -getNodeW(d.type) / 2)
      .attr("y", d => -getNodeH(d.type) / 2)
      .attr("width", d => getNodeW(d.type))
      .attr("height", d => getNodeH(d.type))
      .append("xhtml:div")
      .attr("class", "flex flex-col justify-center h-full p-4 pointer-events-none relative")
      .html(d => `
        <div class="absolute left-0 right-0 top-1/2 h-[2px] bg-[#4F46E5] opacity-50 -z-10"></div>
        <div class="flex items-center justify-between z-10 w-full px-2">
           <div class="w-3 h-3 rounded-full bg-[#818CF8] shadow-[0_0_10px_rgba(129,140,248,0.8)] border-2 border-[#1E1B4B]"></div>
           <div class="text-[12px] font-bold text-[#E0E7FF] px-4 py-1.5 rounded-full bg-[#312E81] border border-[#4F46E5] uppercase tracking-widest">${d.title}</div>
           <div class="w-3 h-3 rounded-full bg-[#818CF8] shadow-[0_0_10px_rgba(129,140,248,0.8)] border-2 border-[#1E1B4B]"></div>
        </div>
      `);

    // AI Nodes
    const aiGroup = nodeSel.filter(d => d.type === "ai");
    aiGroup.append("foreignObject")
      .attr("x", d => -getNodeW(d.type) / 2)
      .attr("y", d => -getNodeH(d.type) / 2)
      .attr("width", d => getNodeW(d.type))
      .attr("height", d => getNodeH(d.type))
      .append("xhtml:div")
      .attr("class", "flex flex-col items-center justify-center h-full gap-1.5 pointer-events-none")
      .html(d => `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3BC9DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>
        <div class="text-[12px] font-semibold text-[#67E8F9] text-center px-2 leading-tight" style="font-family: ${SF}">${d.title}</div>
      `);

    // Dataset Nodes
    const datasetGroup = nodeSel.filter(d => d.type === "dataset");
    datasetGroup.append("foreignObject")
      .attr("x", d => -getNodeW(d.type) / 2)
      .attr("y", d => -getNodeH(d.type) / 2)
      .attr("width", d => getNodeW(d.type))
      .attr("height", d => getNodeH(d.type))
      .append("xhtml:div")
      .attr("class", "flex flex-col items-center justify-center h-full gap-1.5 pointer-events-none")
      .html(d => `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        <div class="text-[12px] font-semibold text-[#34D399] text-center px-2 leading-tight" style="font-family: ${SF}">${d.title}</div>
      `);

    // Prompt Nodes
    const promptGroup = nodeSel.filter(d => d.type === "prompt");
    promptGroup.append("foreignObject")
      .attr("x", d => -getNodeW(d.type) / 2)
      .attr("y", d => -getNodeH(d.type) / 2)
      .attr("width", d => getNodeW(d.type))
      .attr("height", d => getNodeH(d.type))
      .append("xhtml:div")
      .attr("class", "flex flex-col items-center justify-center h-full gap-1.5 pointer-events-none")
      .html(d => `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
        <div class="text-[12px] font-semibold text-[#FBBF24] text-center px-2 leading-tight" style="font-family: ${SF}">${d.title}</div>
      `);

    // Port dots (Left, Right, Top, Bottom)
    const ports = [
      { id: "left", x: (d: MapNode) => -getNodeW(d.type) / 2, y: () => 0 },
      { id: "right", x: (d: MapNode) => getNodeW(d.type) / 2, y: () => 0 },
      { id: "top", x: () => 0, y: (d: MapNode) => -getNodeH(d.type) / 2 },
      { id: "bottom", x: () => 0, y: (d: MapNode) => getNodeH(d.type) / 2 }
    ];
    
    let tempLink: any = null;
    const portDrag = d3.drag<SVGCircleElement, MapNode>()
      .on("start", function(ev, d) {
        ev.sourceEvent.stopPropagation();
        tempLink = edgeG.append("path")
          .attr("fill", "none")
          .attr("stroke", "#3bc9db")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4 4")
          .attr("pointer-events", "none");
      })
      .on("drag", function(ev, d) {
        if (!tempLink) return;
        const cx = Number(d3.select(this).attr("cx") || 0);
        const cy = Number(d3.select(this).attr("cy") || 0);
        const startX = d.x + cx;
        const startY = d.y + cy;
        const pointerX = d.x + ev.x;
        const pointerY = d.y + ev.y;
        const dist = Math.abs(pointerX - startX) * 0.5;
        tempLink.attr("d", `M${startX},${startY} C${startX + dist},${startY} ${pointerX - dist},${pointerY} ${pointerX},${pointerY}`);
      })
      .on("end", function(ev, d) {
        if (tempLink) { tempLink.remove(); tempLink = null; }
        const pointerX = d.x + ev.x;
        const pointerY = d.y + ev.y;
        
        let targetNode = null;
        for (const n of nodes) {
          if (n.id === d.id) continue;
          const nw = getNodeW(n.type);
          const nh = getNodeH(n.type);
          if (pointerX >= n.x - nw/2 - 20 && pointerX <= n.x + nw/2 + 20 &&
              pointerY >= n.y - nh/2 - 20 && pointerY <= n.y + nh/2 + 20) {
            targetNode = n; break;
          }
        }
        
        if (targetNode) {
          // ensure no duplicate edge
          const exists = edges.find(e => (getId(e.source) === d.id && getId(e.target) === targetNode!.id));
          if (!exists) {
            setEdges(p => [...p, { id: `edge-${Date.now()}-${Math.random()}`, source: d.id, target: targetNode!.id, type: "references" }]);
          }
        }
      });

    ports.forEach(pos => {
      nodeSel.append("circle")
        .attr("class", "port-handle-hit")
        .attr("cx", pos.x)
        .attr("cy", pos.y)
        .attr("r", 14)
        .attr("fill", "transparent")
        .attr("cursor", "crosshair")
        .call(portDrag as any);

      nodeSel.append("circle")
        .attr("class", "port-handle")
        .attr("cx", pos.x)
        .attr("cy", pos.y)
        .attr("r", 4)
        .attr("fill", "#0a0f1a")
        .attr("stroke", "#3bc9db")
        .attr("stroke-width", 1.5)
        .attr("pointer-events", "none");
    });

    // Plus button (add child node)
    nodeSel.append("circle")
      .attr("cx", d => getNodeW(d.type) / 2 + 14)
      .attr("cy", 0)
      .attr("r", 7)
      .attr("fill", "#1A1D27")
      .attr("stroke", "#2A2E3D")
      .attr("cursor", "pointer")
      .on("click", (ev, d) => {
        ev.stopPropagation();
        const child: MapNode = {
          id: `custom-${Date.now()}`,
          title: "New Node",
          type: "custom", shape: "card", priority: "normal",
          x: d.x + getNodeW(d.type) + 40, y: d.y + (Math.random() * 40 - 20),
        };
        setNodes(p => [...p, child]);
        setEdges(p => [...p, { id: `edge-${Date.now()}-${Math.random()}`, source: d.id, target: child.id, type: "references" }]);
      });
    nodeSel.append("text")
      .text("+").attr("x", d => getNodeW(d.type) / 2 + 14).attr("y", 3)
      .attr("text-anchor", "middle").attr("font-size", "10px")
      .attr("fill", "#64748B").attr("font-family", MONO)
      .attr("pointer-events", "none");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, dims]);

  // Update selection ring
  useEffect(() => {
    if (!svgRef.current) return;
    d3.select(svgRef.current).selectAll<SVGRectElement, MapNode>(".sel-ring")
      .attr("opacity", (d: MapNode) => selectedNodeIds.includes(d.id) ? 1 : 0);
    d3.select(svgRef.current).selectAll<SVGRectElement, MapNode>(".card-body")
      .attr("stroke", (d: MapNode) => selectedNodeIds.includes(d.id) ? "#fff" : (PRIORITY_COLOR[d.priority] ?? TYPE_COLOR[d.type]))
      .attr("stroke-width", (d: MapNode) => selectedNodeIds.includes(d.id) ? 2 : 1);
  }, [selectedNodeIds]);

  function handleNodeClick(ev: any, d: MapNode) {
    const { activeTool } = stateRef.current;
    if (activeTool === "note") {
      setSelectedNodeIds([d.id]);
      setNoteInput(d.note || "");
      setShowNoteModal(true); return;
    }
    if (ev.shiftKey) {
      setSelectedNodeIds(prev => prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id]);
    } else {
      setSelectedNodeIds(prev => prev.includes(d.id) && prev.length === 1 ? [] : [d.id]);
    }
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
    setEdges(p2 => [...p2, { id: `edge-${Date.now()}-${Math.random()}`, source: centerId, target: n.id, type: "references" }]);
    setAddQuery(""); setAddResults([]); setShowAdd(false);
  }

  function updateNodePriority(priority: Priority) {
    if (!selectedNode) return;
    const newNodes = nodes.map(n => n.id === selectedNode.id ? { ...n, priority } : n);
    pushHistory(newNodes, edges);
  }

  function updateNodeShape(shape: NodeShape) {
    if (!selectedNode) return;
    const newNodes = nodes.map(n => n.id === selectedNode.id ? { ...n, shape } : n);
    pushHistory(newNodes, edges);
  }

  const centerPaper = nodes.find(n => n.id === centerId);

  const updateSelectedNode = (updates: Partial<MapNode>) => {
    if (selectedNodeIds.length === 0) return;
    const newNodes = nodes.map(n => 
      selectedNodeIds.includes(n.id) ? { ...n, ...updates } : n
    );
    pushHistory(newNodes, edges);
  };

  return (
    <div className="w-full h-full flex overflow-hidden"
      style={{ background: "#050505", fontFamily: SF }}>
      <style>{`
        @keyframes flow {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        .animated-edge {
          stroke-dasharray: 6 6;
          animation: flow 1s linear infinite;
          transition: stroke-width 0.2s, stroke-opacity 0.2s;
        }
        .animated-edge:hover {
          stroke-width: 3px;
          stroke-opacity: 1;
        }
        .port-handle {
          opacity: 0;
          transition: opacity 0.2s;
        }
        .node-group:hover .port-handle {
          opacity: 1;
        }
      `}</style>

      {/* ── Left Sidebar ── */}
      <Sidebar />

      {/* ── Main Canvas Area ── */}
      <div className="flex-1 relative overflow-hidden">
      
        {/* ── Floating Canvas ── */}
        <div ref={containerRef} className="absolute inset-0"
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, show: true });
          }}
          onClick={() => {
            if (contextMenu) setContextMenu(null);
          }}
        >
          {contextMenu?.show && (
            <div className="fixed z-50 rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl border flex flex-col py-1.5"
                 style={{
                   left: contextMenu.x,
                   top: contextMenu.y,
                   background: "rgba(10, 15, 26, 0.75)",
                   borderColor: "rgba(255,255,255,0.1)",
                   width: 180,
                 }}
                 onClick={e => e.stopPropagation()}
            >
              {[
                { label: "Copy", key: "C", fn: () => {
                  const { selectedNodeIds, nodes } = stateRef.current;
                  setClipboard(nodes.filter(n => selectedNodeIds.includes(n.id)));
                  setContextMenu(null);
                }},
                { label: "Paste", key: "V", fn: () => {
                  const { clipboard, nodes, edges } = stateRef.current;
                  if (clipboard.length) {
                    const newNodes = clipboard.map(n => ({...n, id: `copy-${Date.now()}-${Math.random()}`, x: n.x + 40, y: n.y + 40}));
                    pushHistory([...nodes, ...newNodes], edges);
                    setSelectedNodeIds(newNodes.map(n => n.id));
                  }
                  setContextMenu(null);
                }},
                { label: "Duplicate", key: "D", fn: () => {
                  const { selectedNodeIds, nodes, edges } = stateRef.current;
                  if (selectedNodeIds.length) {
                    const newNodes = nodes.filter(n => selectedNodeIds.includes(n.id)).map(n => ({...n, id: `copy-${Date.now()}-${Math.random()}`, x: n.x + 40, y: n.y + 40}));
                    pushHistory([...nodes, ...newNodes], edges);
                    setSelectedNodeIds(newNodes.map(n => n.id));
                  }
                  setContextMenu(null);
                }},
                { divider: true },
                { label: "Delete", key: "Del", fn: () => {
                  const { selectedNodeIds, nodes, edges } = stateRef.current;
                  const newNodes = nodes.filter(n => !selectedNodeIds.includes(n.id));
                  const newEdges = edges.filter(edge => !selectedNodeIds.includes(getId(edge.source)) && !selectedNodeIds.includes(getId(edge.target)));
                  pushHistory(newNodes, newEdges);
                  setSelectedNodeIds([]);
                  setContextMenu(null);
                }}
              ].map((item, i) => item.divider ? (
                <div key={i} className="my-1.5 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
              ) : (
                <button key={item.label} onClick={item.fn} className="flex justify-between items-center px-4 py-1.5 text-left text-[12px] text-white hover:bg-white/10 transition-colors">
                  <span>{item.label}</span>
                  <span className="text-white/40">{item.key}</span>
                </button>
              ))}
            </div>
          )}
          {activeTool === "note" && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full text-[11px] font-medium pointer-events-none"
              style={{
                background: "#0a0f1a",
                border: `1px solid #3bc9db`,
                color:  "#3bc9db",
              }}>
              Click a node to add a note
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
              <input 
                className="text-[17px] font-semibold text-white tracking-tight bg-transparent border-none outline-none hover:bg-[#1A1D27] focus:bg-[#1A1D27] px-2 py-0.5 rounded transition-colors w-64 -ml-2"
                defaultValue={centerPaper ? centerPaper.title : "Research Map"}
                title="Edit Project Name"
              />
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





      {/* ── Floating Bottom Center Toolbar (Glassmorphism Dock) ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4 pointer-events-none">
      {/* Premium Glassmorphism Toolbar */}
        <div 
          className="flex items-center gap-5 px-3 py-2 pointer-events-auto rounded-[20px] shadow-2xl backdrop-blur-2xl transition-all"
          style={{ 
            background: "rgba(17, 19, 26, 0.7)", 
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
          }}
        >
          {([
            [
              { t: "select",  icon: <MousePointer size={17} />, tip: "Cursor (V)"  },
              { t: "hand",    icon: <Hand         size={17} />, tip: "Hand (H)" },
            ],
            [
              { t: "paper",   icon: <FileText     size={17} />, tip: "Paper Node"  },
              { t: "note",    icon: <StickyNote   size={17} />, tip: "Note Node" },
              { t: "question",icon: <MessageSquare size={17} />, tip: "Research Question" },
              { t: "timeline",icon: <Minus        size={17} />, tip: "Timeline" },
              { t: "frame",   icon: <Square       size={17} />, tip: "Frame" },
            ],
            [
              { t: "connect", icon: <ArrowUpRight size={17} />, tip: "Connection" },
              { t: "comment", icon: <MessageCircle size={17} />, tip: "Comment" },
            ],
            [
              { t: "ai",      icon: <Sparkles     size={17} />, tip: "AI Assistant", special: true },
            ],
            [
              { t: "export",  icon: <Download     size={17} />, tip: "Export" },
            ]
          ] as any[][]).map((group, groupIndex) => (
            <div key={groupIndex} className="flex items-center gap-1 relative">
              {group.map((item) => (
                <button 
                  key={item.t} 
                  className={`relative group w-9 h-9 flex items-center justify-center rounded-[12px] transition-all duration-300 active:scale-95 ${
                    item.special ? "hover:scale-105 hover:-translate-y-0.5" : "hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
                  }`}
                  onClick={() => {
                    if (item.t === "paper") {
                      setShowAdd(true);
                    } else if (item.t === "ai") {
                      setActiveTool("ai" as Tool);
                    } else {
                      setActiveTool(item.t as Tool);
                    }
                  }}
                  style={item.special ? {
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4), inset 0 1px 1px rgba(255,255,255,0.4)",
                    color: "#ffffff"
                  } : {
                    background: activeTool === item.t ? "rgba(255,255,255,0.12)" : "transparent",
                    color:      activeTool === item.t ? "#ffffff" : "#94a3b8",
                    boxShadow:  activeTool === item.t ? "inset 0 1px 3px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.2)" : "none",
                  }}
                >
                  {item.icon}
                  {/* Tooltip */}
                  <div className="absolute -top-[52px] left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-[10px] text-[12px] font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-2xl backdrop-blur-xl z-50 translate-y-2 group-hover:translate-y-0"
                    style={{ background: "rgba(10,12,16,0.95)", border: "1px solid rgba(255,255,255,0.15)", color: "#f8fafc", fontFamily: SF, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}>
                    {item.tip}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Floating Bottom Right (Zoom) ── */}
      <div className="absolute bottom-6 right-6 z-30 flex items-center gap-1.5 pointer-events-auto nagi-glass-toolbar px-3 py-2">
        {([
          { fn: () => doZoom("out"), icon: <ZoomOut    size={14} />, tip: "Zoom out" },
          { fn: () => doZoom("in"),  icon: <ZoomIn     size={14} />, tip: "Zoom in"  },
          { fn: () => doZoom("fit"), icon: <Maximize2  size={14} />, tip: "Reset"    },
        ]).map((z, i) => (
          <button key={i} title={z.tip} onClick={z.fn}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-[rgba(255,255,255,0.1)] active:scale-95 text-[#a1a1aa] hover:text-white">
            {z.icon}
          </button>
        ))}
      </div>

      {/* ── Floating Right Panel ── */}
      {selectedNode && activeTool === "select" && (
        <aside className="absolute top-24 right-4 w-[340px] max-h-[80vh] flex flex-col overflow-hidden nagi-glass-panel z-40 pointer-events-auto transition-transform duration-200">
          <div className="flex items-center justify-between px-5 py-4 shrink-0 nagi-glass-header">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-sm shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ background: selectedNode.customColor || TYPE_COLOR[selectedNode.type] }} />
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase"
                style={{ color: selectedNode.customColor || TYPE_COLOR[selectedNode.type], fontFamily: MONO }}>
                {TYPE_LABEL[selectedNode.type]}
              </span>
            </div>
            <button onClick={() => setSelectedNodeIds([])} style={{ color: "#64748b" }} className="hover:text-white hover:scale-110 active:scale-95 transition-all">
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6" style={{ WebkitOverflowScrolling: "touch" }}>
            
            {/* Title & Description Editor */}
            <div className="flex flex-col gap-2">
               <textarea
                 value={selectedNode.title}
                 onChange={(e) => updateSelectedNode({ title: e.target.value })}
                 className="text-[15px] font-semibold leading-snug bg-transparent border-none outline-none resize-none placeholder-gray-500 w-full tracking-tight"
                 style={{ color: "#f1f5f9" }}
                 placeholder="Object Title..."
                 rows={Math.max(1, Math.ceil(selectedNode.title.length / 30))}
               />
               <textarea
                 value={selectedNode.description || ""}
                 onChange={(e) => updateSelectedNode({ description: e.target.value })}
                 className="text-[12px] leading-relaxed bg-transparent border-none outline-none resize-none placeholder-gray-600 w-full"
                 style={{ color: "#a0a0a0", minHeight: "40px" }}
                 placeholder="Add a description..."
               />
            </div>

            {/* Color Picker */}
            <div className="flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#808080", fontFamily: MONO }}>Color</span>
              <div className="flex gap-1.5 flex-wrap">
                {["", "#ef4444", "#f59e0b", "#10b981", "#3bc9db", "#6366f1", "#a855f7", "#ec4899", "#ffffff", "#444444"].map((c) => (
                  <button key={c || "default"} onClick={() => updateSelectedNode({ customColor: c || undefined })}
                    className="w-5 h-5 rounded-full border flex items-center justify-center transition-transform hover:scale-110"
                    style={{
                      background: c || "transparent",
                      borderColor: selectedNode.customColor === c || (!selectedNode.customColor && !c) ? "#fff" : "rgba(255,255,255,0.1)",
                    }}>
                    {!c && <X size={10} color="#808080" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#808080", fontFamily: MONO }}>Tags</span>
              <input 
                type="text"
                value={(selectedNode.tags || []).join(", ")}
                onChange={(e) => updateSelectedNode({ tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                placeholder="tag1, tag2..."
                className="text-[11px] bg-transparent border-none outline-none placeholder-gray-600 w-full"
                style={{ color: "#a0a0a0" }}
              />
            </div>

            {/* Note Editor */}
            <div className="flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#808080", fontFamily: MONO }}>Notes</span>
              <textarea
                 value={selectedNode.note || ""}
                 onChange={(e) => updateSelectedNode({ note: e.target.value })}
                 className="text-[12px] leading-relaxed rounded-lg px-3 py-2.5 outline-none resize-y placeholder-gray-600 w-full"
                 style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)", color: "#a0a0a0", minHeight: "80px" }}
                 placeholder="Markdown supported notes..."
               />
            </div>
            
            {/* Type-Specific Fields */}
            {selectedNode.type === "paper" && (
              <div className="flex flex-col gap-2.5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#808080", fontFamily: MONO }}>Metadata</span>
                {[
                  { key: "author", label: "Author", value: selectedNode.author },
                  { key: "year", label: "Year", value: selectedNode.year?.toString() },
                  { key: "citations", label: "Citations", value: selectedNode.citations?.toString(), isNumber: true },
                  { key: "field", label: "Field", value: selectedNode.field },
                  { key: "journal", label: "Journal", value: selectedNode.journal },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest shrink-0"
                      style={{ color: "#64748b", fontFamily: MONO }}>{row.label}</span>
                    <input 
                      type="text"
                      value={row.value || ""}
                      onChange={(e) => updateSelectedNode({ [row.key]: row.isNumber ? (parseInt(e.target.value) || 0) : e.target.value })}
                      className="text-[11px] font-medium text-right leading-snug bg-transparent border-none outline-none placeholder-gray-700 w-full"
                      style={{ color: "#a0a0a0" }}
                      placeholder={`Add ${row.label}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Properties Editor */}
            <div className="flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#808080", fontFamily: MONO }}>Properties</span>
              <textarea
                value={selectedNode.properties ? JSON.stringify(selectedNode.properties, null, 2) : ""}
                onChange={(e) => {
                  try { updateSelectedNode({ properties: JSON.parse(e.target.value) }) } catch(err) {}
                }}
                className="text-[10px] bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.05)] rounded px-2 py-2 outline-none resize-y w-full"
                style={{ color: "#a0a0a0", fontFamily: MONO, minHeight: "60px" }}
                placeholder='{"key": "value"}'
              />
            </div>

            {/* Connections */}
            <div className="flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#808080", fontFamily: MONO }}>Connections</span>
              <div className="flex flex-col gap-1.5">
                {edges.filter(e => {
                  const srcId = typeof e.source === "string" ? e.source : e.source.id;
                  const tgtId = typeof e.target === "string" ? e.target : e.target.id;
                  return srcId === selectedNode.id || tgtId === selectedNode.id;
                }).length === 0 ? (
                   <span className="text-[10px] text-gray-600">No connections</span>
                ) : (
                  edges.filter(e => {
                    const srcId = typeof e.source === "string" ? e.source : e.source.id;
                    const tgtId = typeof e.target === "string" ? e.target : e.target.id;
                    return srcId === selectedNode.id || tgtId === selectedNode.id;
                  }).map((e, i) => {
                    const srcId = typeof e.source === "string" ? e.source : e.source.id;
                    const tgtId = typeof e.target === "string" ? e.target : e.target.id;
                    const isSource = srcId === selectedNode.id;
                    const otherId = isSource ? tgtId : srcId;
                    const otherNode = nodes.find(n => n.id === otherId);
                    return (
                      <div key={i} className="flex justify-between items-center bg-[rgba(0,0,0,0.5)] px-2.5 py-1.5 rounded border border-[rgba(255,255,255,0.05)]">
                        <span className="text-[10px] text-[#a0a0a0] truncate w-[140px]">{otherNode?.title || String(otherId)}</span>
                        <span className="text-[9px] text-[#666] font-bold uppercase" style={{fontFamily: MONO}}>{e.label || e.type}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {selectedNode.type === "paper" && (
                <>
                  <button onClick={() => { window.location.href = `/paper/${selectedNode.id}`; }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                    style={{ background: "#111", border: "1px solid #2b2d2d", color: "#e8e8e6" }}>
                    <BookOpen size={12} /> View Full Paper
                  </button>
                  <button onClick={() => { window.location.href = `/map/${selectedNode.id}`; }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                    style={{ background: "#1a1a1a", border: "1px solid #333", color: "#e8e8e6" }}>
                    <Map size={12} /> Map This Paper
                  </button>
                </>
              )}
              {selectedNode.url && (
                <a href={selectedNode.url} target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                  style={{ background: "#111", border: "1px solid #2b2d2d", color: "#a0a0a0" }}>
                  <ExternalLink size={12} /> Open Source Link
                </a>
              )}
              <button
                onClick={() => {
                  const newNodes = nodes.filter(n => n.id !== selectedNode!.id);
                  const newEdges = edges.filter(e => {
                    const srcId = typeof e.source === "string" ? e.source : e.source.id;
                    const tgtId = typeof e.target === "string" ? e.target : e.target.id;
                    return srcId !== selectedNode!.id && tgtId !== selectedNode!.id;
                  });
                  pushHistory(newNodes, newEdges);
                  setSelectedNodeIds([]);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                <Trash2 size={12} /> Remove Node
              </button>
            </div>
          </div>
        </aside>
      )}

      {selectedEdge && activeTool === "select" && (
        <aside className="absolute right-4 top-24 bottom-24 w-[340px] flex flex-col overflow-hidden nagi-glass-panel z-40 pointer-events-auto transition-transform duration-200">
          <div className="flex items-center justify-between px-5 py-4 nagi-glass-header">
            <div className="flex items-center gap-2">
              <Link size={12} color="#a0a0a0" />
              <span className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: EDGE_COLOR[selectedEdge.type] || "#ffffff", fontFamily: MONO }}>
                {EDGE_LABEL[selectedEdge.type]}
              </span>
            </div>
            <button onClick={() => setSelectedEdge(null)} style={{ color: "#64748b" }} className="hover:text-white hover:scale-110 active:scale-95 transition-all">
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6" style={{ WebkitOverflowScrolling: "touch" }}>
            
            {/* Relationship Type */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#808080", fontFamily: MONO }}>Relationship</span>
              <select
                value={selectedEdge.type}
                onChange={(e) => {
                  const newType = e.target.value as EdgeType;
                  setEdges(edges.map(ed => ed.id === selectedEdge.id ? { ...ed, type: newType, label: EDGE_LABEL[newType] } : ed));
                  setSelectedEdge({ ...selectedEdge, type: newType, label: EDGE_LABEL[newType] });
                }}
                className="w-full text-[11px] font-semibold bg-[rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.05)] rounded-lg px-3 py-2.5 outline-none cursor-pointer"
                style={{ color: "#e2e8f0" }}>
                {Object.keys(EDGE_COLOR).map((t) => (
                  <option key={t} value={t}>{EDGE_LABEL[t as EdgeType]}</option>
                ))}
              </select>
            </div>

            {/* Custom Label */}
            <div className="flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#808080", fontFamily: MONO }}>Custom Label</span>
              <input
                type="text"
                value={selectedEdge.label || EDGE_LABEL[selectedEdge.type]}
                onChange={(e) => {
                  setEdges(edges.map(ed => ed.id === selectedEdge.id ? { ...ed, label: e.target.value } : ed));
                  setSelectedEdge({ ...selectedEdge, label: e.target.value });
                }}
                className="text-[11px] font-medium leading-snug bg-transparent border-none outline-none placeholder-gray-700 w-full"
                style={{ color: "#a0a0a0" }}
                placeholder="Connection label..."
              />
            </div>

            {/* Metadata Fields */}
            <div className="flex flex-col gap-2.5 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#808080", fontFamily: MONO }}>Metadata</span>
              
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#64748b", fontFamily: MONO }}>Strength</span>
                <select
                  value={selectedEdge.metadata?.strength || ""}
                  onChange={(e) => {
                    const strength = e.target.value as any;
                    setEdges(edges.map(ed => ed.id === selectedEdge.id ? { ...ed, metadata: { ...ed.metadata, strength } } : ed));
                    setSelectedEdge({ ...selectedEdge, metadata: { ...selectedEdge.metadata, strength } });
                  }}
                  className="text-[11px] font-medium text-right bg-transparent border-none outline-none cursor-pointer"
                  style={{ color: "#a0a0a0" }}>
                  <option value="">None</option>
                  <option value="weak">Weak</option>
                  <option value="medium">Medium</option>
                  <option value="strong">Strong</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#64748b", fontFamily: MONO }}>Confidence</span>
                <select
                  value={selectedEdge.metadata?.confidence || ""}
                  onChange={(e) => {
                    const confidence = e.target.value as any;
                    setEdges(edges.map(ed => ed.id === selectedEdge.id ? { ...ed, metadata: { ...ed.metadata, confidence } } : ed));
                    setSelectedEdge({ ...selectedEdge, metadata: { ...selectedEdge.metadata, confidence } });
                  }}
                  className="text-[11px] font-medium text-right bg-transparent border-none outline-none cursor-pointer"
                  style={{ color: "#a0a0a0" }}>
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Note Editor */}
            <div className="flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-[9px] font-bold uppercase tracking-widest shrink-0" style={{ color: "#808080", fontFamily: MONO }}>Notes</span>
              <textarea
                 value={selectedEdge.metadata?.notes || ""}
                 onChange={(e) => {
                   const notes = e.target.value;
                   setEdges(edges.map(ed => ed.id === selectedEdge.id ? { ...ed, metadata: { ...ed.metadata, notes } } : ed));
                   setSelectedEdge({ ...selectedEdge, metadata: { ...selectedEdge.metadata, notes } });
                 }}
                 className="text-[12px] leading-relaxed rounded-lg px-3 py-2.5 outline-none resize-y placeholder-gray-600 w-full"
                 style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.05)", color: "#a0a0a0", minHeight: "80px" }}
                 placeholder="Connection rationale..."
               />
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => {
                  const newEdges = edges.filter(e => e.id !== selectedEdge.id);
                  pushHistory(nodes, newEdges);
                  setSelectedEdge(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-semibold transition-all hover:opacity-80"
                style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>
                <Trash2 size={12} /> Remove Connection
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
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  "Supports", "Contradicts", "References", "Inspired By", "Future Work", 
                  "Methodology", "Uses Dataset", "Continuation", "Open Question"
                ].map(label => (
                  <button key={label}
                    onClick={() => setEdgeLabelInput(label)}
                    className="px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors"
                    style={{
                      background: edgeLabelInput === label ? "rgba(59,201,219,0.15)" : "#121826",
                      color: edgeLabelInput === label ? "#3bc9db" : "#94a3b8",
                      border: `1px solid ${edgeLabelInput === label ? "rgba(59,201,219,0.3)" : "#1e293b"}`
                    }}>
                    {label}
                  </button>
                ))}
              </div>
              <input type="text" value={edgeLabelInput}
                onChange={e => setEdgeLabelInput(e.target.value)}
                placeholder="Or type a custom label…"
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
                      const newNodes = nodes.map(n => n.id === selectedNode.id ? { ...n, note: noteInput || undefined } : n);
                      pushHistory(newNodes, edges);
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
                      const newNodes = nodes.map(n => n.id === selectedNode.id ? { ...n, url: urlInput || undefined } : n);
                      pushHistory(newNodes, edges);
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

      {/* ── Fixed AI Copilot Panel (Right Side) ── */}
      <aside className="absolute right-0 top-0 bottom-0 w-[360px] flex-shrink-0 flex flex-col z-40" style={{ background: "#11131A", borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span className="text-[10px] font-semibold tracking-widest text-gray-400" style={{ fontFamily: SF }}>CHAT</span>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-[rgba(255,255,255,0.1)] rounded text-gray-400 hover:text-white transition-colors">
              <Plus size={14} />
            </button>
            <button className="p-1.5 hover:bg-[rgba(255,255,255,0.1)] rounded text-gray-400 hover:text-white transition-colors">
              <History size={14} />
            </button>
            <button className="p-1.5 hover:bg-[rgba(255,255,255,0.1)] rounded text-gray-400 hover:text-white transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6" style={{ WebkitOverflowScrolling: "touch" }}>
          {chatMessages.length === 0 && !isProcessingAI && (
            <div className="text-gray-500 text-[13px] px-2" style={{ fontFamily: SF }}>
              I'll help you create or modify the canvas. Let me know what you need.
            </div>
          )}
          
          {chatMessages.map((msg, i) => (
            <div key={i} className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                {msg.role === "user" ? (
                  <div className="w-6 h-6 rounded-full bg-[#1e293b] flex items-center justify-center">
                    <User size={12} className="text-gray-300" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded flex items-center justify-center bg-[#2563eb]">
                    <Sparkles size={12} className="text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-[13px] leading-relaxed text-gray-300 whitespace-pre-wrap" style={{ fontFamily: SF }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isProcessingAI && (
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                <div className="w-6 h-6 rounded flex items-center justify-center bg-[#2563eb]">
                  <Sparkles size={12} className="text-white" />
                </div>
              </div>
              <div className="flex-1 flex items-center h-6">
                <Loader2 size={14} className="animate-spin text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 pt-2">
          <div className="bg-[#1e1e1e] border border-[rgba(255,255,255,0.1)] rounded-lg overflow-hidden flex flex-col transition-colors focus-within:border-gray-500">
            
            {/* Context Pill */}
            <div className="px-3 py-2 flex items-center" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-gray-400 hover:text-gray-200 transition-colors text-[11px]" style={{ fontFamily: SF }}>
                <Paperclip size={12} /> Add Context...
              </button>
            </div>

            {/* Textarea */}
            <form onSubmit={handleAIChatSubmit} className="flex flex-col">
              <textarea
                value={aiCommand}
                onChange={(e) => setAiCommand(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAIChatSubmit(e as any);
                  }
                }}
                disabled={isProcessingAI}
                placeholder="Ask Copilot or type / for commands"
                className="w-full bg-transparent resize-none outline-none px-3 py-2 text-[13px] text-gray-300 placeholder-gray-500 min-h-[60px]"
                style={{ fontFamily: SF }}
              />
              
              {/* Bottom Row Controls */}
              <div className="flex items-center justify-between px-2 py-2 border-t border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-1">
                  <button type="button" className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.1)] text-gray-400 transition-colors">
                    <Mic size={14} />
                  </button>
                  <button type="button" className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[rgba(255,255,255,0.1)] text-gray-400 transition-colors text-[11px]" style={{ fontFamily: SF }}>
                    Agent <ChevronDown size={12} />
                  </button>
                  <button type="button" className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[rgba(255,255,255,0.1)] text-gray-400 transition-colors text-[11px]" style={{ fontFamily: SF }}>
                    Claude 3.7 Sonnet <ChevronDown size={12} />
                  </button>
                </div>
                <button type="submit" disabled={isProcessingAI || !aiCommand.trim()} className="p-1.5 rounded hover:bg-[rgba(255,255,255,0.1)] text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-400">
                  <Send size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </aside>
    </div>
  );
}
