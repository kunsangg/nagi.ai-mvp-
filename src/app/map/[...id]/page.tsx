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
  History, MoreHorizontal, Paperclip, Mic, ChevronDown, User, Send,
  AlignStartVertical, AlignCenterHorizontal, AlignEndVertical,
  AlignStartHorizontal, AlignCenterVertical, AlignEndHorizontal,
  AlignHorizontalSpaceBetween, AlignVerticalSpaceBetween
} from "lucide-react";

const SF   = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, Menlo, monospace";

type NodeType    = "center" | "reference" | "citing" | "related" | "custom" | "paper" | "ai" | "dataset" | "prompt" | "note" | "question" | "timeline" | "comment" | "frame" | "shape";
type NodeShape   = "card" | "diamond" | "circle" | "pill" | "rect";
type Priority    = "normal" | "high" | "critical";
type EdgeType    = "supports" | "contradicts" | "extends" | "references" | "inspired_by" | "uses_dataset" | "uses_methodology" | "replicates" | "improves" | "limitation" | "future_work" | "open_question" | "literature_review" | "custom";
type Tool        = "select" | "hand" | "comment" | "note" | "ai" | "paper" | "dataset" | "prompt" | "question" | "timeline" | "connect" | "play" | "export" | "settings" | "frame" | "shape";

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
  width?: number;
  height?: number;
  borderRadius?: number;
  isGenerated?: boolean;
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

export const getNodeW = (n: MapNode) => n.width !== undefined ? n.width : (n.type === "frame" ? 900 : n.type === "center" ? 360 : n.type === "timeline" ? 420 : n.type === "question" ? 340 : n.type === "note" ? 300 : n.type === "comment" ? 320 : ["paper", "reference", "citing", "related", "custom", "shape"].includes(n.type) ? 340 : 270);
export const getNodeH = (n: MapNode) => n.height !== undefined ? n.height : (n.type === "frame" ? 700 : n.type === "center" ? 120 : n.type === "timeline" ? 100 : n.type === "question" ? 120 : n.type === "note" ? 200 : n.type === "comment" ? 160 : ["paper", "reference", "citing", "related", "custom", "shape"].includes(n.type) ? 160 : 100);
export const getNodeRx = (n: MapNode) => n.borderRadius !== undefined ? n.borderRadius : (n.type === "frame" ? 0 : 12);

const NODE_W = 240;
const NODE_H = 100;

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
  shape:     "#808080"
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
  shape:     "SHAPE"
};

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

function getId(n: string | MapNode): string {
  return typeof n === "string" ? n : n.id;
}

// ─── Auto-priority: assign colours based on citation count ───────────────────
function autoPriority(n: any): { priority: Priority; customColor: string } {
  const c = typeof n.citations === "number" ? n.citations : 0;
  if (n.type === "center") return { priority: "normal",   customColor: "#3bc9db" }; // teal  = focal
  if (c >= 500)            return { priority: "critical", customColor: "#ef4444" }; // red   = very high impact
  if (c >= 100)            return { priority: "high",     customColor: "#f59e0b" }; // amber = high impact
  if (c >= 20)             return { priority: "normal",   customColor: "#6366f1" }; // indigo = moderate
  if (n.type === "citing") return { priority: "normal",   customColor: "#10b981" }; // green = cites this
  return                          { priority: "normal",   customColor: "#475569" }; // slate = low/unknown
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

  // Center node
  byType.center.forEach(n => {
    const ap = autoPriority(n);
    result.push({ ...n, shape: "card", ...ap, x: cx, y: cy });
  });

  // Node dimensions for gap calculation
  const NODE_W = 360;
  const NODE_H = 170;
  const MIN_GAP = 40; // minimum gap between node edges

  // Place a ring of nodes with dynamic angular spacing to prevent overlap
  const placeRing = (arr: any[], baseAngle: number, r: number) => {
    if (arr.length === 0) return;
    // Angular space needed per node: arc length = NODE_W + MIN_GAP at radius r
    const angularStep = Math.max(
      (NODE_W + MIN_GAP) / r,     // minimum arc gap
      Math.PI * 1.8 / arr.length  // or evenly divide 324° if few nodes
    );
    const totalSpan = angularStep * (arr.length - 1);
    const startAngle = baseAngle - totalSpan / 2;

    arr.forEach((n, i) => {
      const angle = arr.length === 1 ? baseAngle : startAngle + i * angularStep;
      const ap = autoPriority(n);
      result.push({ ...n, shape: "card", ...ap, x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    });
  };

  // References fan out to the LEFT  at radius 700
  placeRing(byType.reference, Math.PI,          700);
  // Citing papers fan out to the RIGHT at radius 700
  placeRing(byType.citing,    0,                700);
  // Related papers spread BELOW at radius 550
  placeRing(byType.related,   Math.PI * 0.5,    550);
  // Custom nodes spread below further
  byType.custom?.forEach((n, i, a) => {
    const ap = autoPriority(n);
    const spread = (NODE_W + MIN_GAP) * a.length;
    result.push({ ...n, shape: "card", ...ap,
      x: cx - spread / 2 + i * (NODE_W + MIN_GAP) + NODE_W / 2,
      y: cy + 820
    });
  });

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
  const [selectedModel, setSelectedModel] = useState("Llama 3.1 8B (Groq)");
  const [isContextAdded, setIsContextAdded] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: "user" | "ai", text: string}[]>([
    { role: "ai", text: "Hi! I'm your AI Research Assistant. How can I help you build your map?" }
  ]);
  const [showCanvasPrompt, setShowCanvasPrompt] = useState(false);
  const [canvasPromptText, setCanvasPromptText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const idParam = params?.id;
  const id = Array.isArray(idParam)
    ? idParam.map(decodeURIComponent).join("/")
    : (idParam as string);

  const selectedNode = selectedNodeIds.length === 1 ? nodes.find(n => n.id === selectedNodeIds[0]) || null : null;

  const [activeSidebarTab, setActiveSidebarTab] = useState<"design" | "copilot">("copilot");

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    appearance: true,
    layout: false,
    typography: false,
    metadata: true,
    connections: false,
    notes: false,
    ai: true,
    danger: false
  });
  const toggleSection = (s: string) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));

  useEffect(() => {
    if (selectedNodeIds.length > 0 || selectedEdge) {
      setActiveSidebarTab("design");
    }
  }, [selectedNodeIds, selectedEdge]);
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
      } else if (op.type === "remove_nodes") {
        const idsToRemove = new Set(op.nodeIds || []);
        currentNodes = currentNodes.filter(n => !idsToRemove.has(n.id));
        // cascade delete connected edges
        currentEdges = currentEdges.filter(e => {
          const sId = typeof e.source === "string" ? e.source : e.source.id;
          const tId = typeof e.target === "string" ? e.target : e.target.id;
          return !idsToRemove.has(sId) && !idsToRemove.has(tId);
        });
      } else if (op.type === "remove_edges") {
        const idsToRemove = new Set(op.edgeIds || []);
        currentEdges = currentEdges.filter(e => !idsToRemove.has(e.id));
      }
    });
    
    pushHistory(currentNodes, currentEdges);
  };

  const executeAICommand = async (userMsg: string) => {
    if (!userMsg.trim() || isProcessingAI) return;
    
    setChatMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsProcessingAI(true);
    const oldNodeIds = new Set(stateRef.current.nodes.map(n => n.id));
    
    try {
      const provider = selectedModel.includes('Fireworks') ? 'fireworks' : 'groq';
      const res = await fetch('/api/canvas-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: userMsg,
          nodes: stateRef.current.nodes,
          edges: stateRef.current.edges,
          selectedIds: stateRef.current.selectedNodeIds,
          provider
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      applyCanvasOperations(data.operations);
      
      // Mark newly added nodes as generated
      setNodes(prev => prev.map(n => oldNodeIds.has(n.id) ? n : { ...n, isGenerated: true }));
      // Clear generated flag after 3s
      setTimeout(() => {
        setNodes(p => p.map(n => ({...n, isGenerated: false})));
      }, 3000);

      setChatMessages(prev => [...prev, { role: "ai", text: data.message || "I've updated the canvas based on your request!" }]);
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: "ai", text: `Sorry, I encountered an error: ${err.message}` }]);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleAIChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = aiCommand;
    setAiCommand("");
    await executeAICommand(cmd);
  };

  useEffect(() => {
    (window as any).dispatchAICommand = (cmd: string) => {
      executeAICommand(cmd);
    };
    return () => {
      delete (window as any).dispatchAICommand;
    };
  });

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
        const positioned = assignPositions(data.nodes, data.center, dims.w, dims.h);
        setNodes(positioned);
        setEdges(data.edges);
        setCenterId(data.center);
        setIsLoading(false);
        // Auto-fit to show all nodes after a short render delay
        setTimeout(() => {
          if (!svgRef.current || !zoomRef.current) return;
          const xs = positioned.map(n => n.x);
          const ys = positioned.map(n => n.y);
          const minX = Math.min(...xs) - 240, maxX = Math.max(...xs) + 240;
          const minY = Math.min(...ys) - 140, maxY = Math.max(...ys) + 140;
          const W = dims.w || 1200, H = dims.h || 800;
          const scale = Math.min(0.72, Math.min(W / (maxX - minX), H / (maxY - minY)));
          const tx = W / 2 - scale * (minX + maxX) / 2;
          const ty = H / 2 - scale * (minY + maxY) / 2;
          d3.select(svgRef.current!).transition().duration(600)
            .call(zoomRef.current!.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
        }, 300);
      })
      .catch(() => { setError("Failed to load map"); setIsLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCanvasPrompt(p => !p);
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }
      if (e.key === "Escape") {
        setShowCanvasPrompt(false);
        setContextMenu(null);
      }

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

    // Dot grid - Softer and wider spacing
    const pat = defs.append("pattern")
      .attr("id", "dotgrid").attr("width", 40).attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");
    pat.append("circle").attr("cx", 2).attr("cy", 2).attr("r", 1.5).attr("fill", "rgba(255,255,255,0.04)");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#050505");
    svg.append("rect").attr("width", W).attr("height", H).attr("fill", "url(#dotgrid)");

    // Arrows - refined and subtle
    (Object.keys(EDGE_COLOR) as EdgeType[]).forEach(t => {
      defs.append("marker")
        .attr("id", `arr-${t}`).attr("viewBox", "0 -4 9 8")
        .attr("refX", 10).attr("refY", 0)
        .attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto")
        .append("path").attr("d", "M0,-4L9,0L0,4").attr("fill", EDGE_COLOR[t]).attr("opacity", 0.9);
    });

    // Premium Layered Drop shadow
    const f = defs.append("filter").attr("id", "shadow")
      .attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    f.append("feDropShadow").attr("dx", 0).attr("dy", 16).attr("stdDeviation", 32)
      .attr("flood-color", "#000").attr("flood-opacity", 0.5);
    f.append("feDropShadow").attr("dx", 0).attr("dy", 4).attr("stdDeviation", 12)
      .attr("flood-color", "#000").attr("flood-opacity", 0.3);

    const fGlow = defs.append("filter").attr("id", "glow")
      .attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    fGlow.append("feGaussianBlur").attr("stdDeviation", 4).attr("result", "coloredBlur");
    const feMerge = fGlow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .filter((ev) => {
        if (ev.type === "wheel") return true;
        return stateRef.current.activeTool === "hand" || ev.button === 1 || ev.button === 2;
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
           const w = getNodeW(n);
           const h = getNodeH(n);
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

    // Modern spacing dimensions extracted
    

    svg.on("click", (ev) => {
      if (ev.defaultPrevented) return;
      const { activeTool, nodes, edges } = stateRef.current;
      if (["paper", "note", "question", "timeline", "comment", "frame", "ai", "shape"].includes(activeTool)) {
        const transform = d3.zoomTransform(el);
        const [x, y] = transform.invert(d3.pointer(ev, el));
        
        const newNode: MapNode = {
          id: `${activeTool}-${Date.now()}`,
          title: `New ${activeTool.charAt(0).toUpperCase() + activeTool.slice(1)}`,
          type: activeTool as NodeType,
          shape: activeTool === "shape" ? "rect" : "card",
          priority: "normal",
          x: Math.round(x / 20) * 20,
          y: Math.round(y / 20) * 20,
        };
        pushHistory([...nodes, newNode], edges);
        setActiveTool("select");
      }
    });

    // Smooth continuous Bezier edge path
    const edgePath = (d: any) => {
      const s = typeof d.source === "string" ? nodes.find(n => n.id === d.source) : d.source as MapNode;
      const t = typeof d.target === "string" ? nodes.find(n => n.id === d.target) : d.target as MapNode;
      if (!s || !t) return "";

      const sW = getNodeW(s);
      const tW = getNodeW(t);
      const sH = getNodeH(s);
      const tH = getNodeH(t);

      let sx = s.x, sy = s.y, tx = t.x, ty = t.y;

      if (Math.abs(s.x - t.x) > Math.abs(s.y - t.y)) {
        sx = s.x < t.x ? s.x + sW / 2 : s.x - sW / 2;
        tx = s.x < t.x ? t.x - tW / 2 : t.x + tW / 2;
        const dist = Math.abs(tx - sx) * 0.4;
        return `M${sx},${sy} C${sx + (s.x < t.x ? dist : -dist)},${sy} ${tx - (s.x < t.x ? dist : -dist)},${ty} ${tx},${ty}`;
      } else {
        sy = s.y < t.y ? s.y + sH / 2 : s.y - sH / 2;
        ty = s.y < t.y ? t.y - tH / 2 : t.y + tH / 2;
        const dist = Math.abs(ty - sy) * 0.4;
        return `M${sx},${sy} C${sx},${sy + (s.y < t.y ? dist : -dist)} ${tx},${ty - (s.y < t.y ? dist : -dist)} ${tx},${ty}`;
      }
    };

    // Edges
    const edgeG = g.append("g");
    const edgeGroups = edgeG.selectAll<SVGGElement, MapEdge>("g")
      .data(edges).join("g");
      
    // Invisible hit area for easier hover
    const hitSel = edgeGroups.append("path")
      .attr("fill", "none").attr("stroke", "transparent").attr("stroke-width", 15)
      .attr("cursor", "pointer").attr("d", edgePath as any);

    const linkSel = edgeGroups.append("path")
      .attr("fill", "none")
      .attr("stroke", (d: any) => stateRef.current.selectedEdge?.id === d.id ? "#3bc9db" : EDGE_COLOR[d.type as EdgeType] || "#4F46E5")
      .attr("stroke-width", (d: any) => stateRef.current.selectedEdge?.id === d.id ? 2.5 : 1.5)
      .attr("stroke-opacity", (d: any) => stateRef.current.selectedEdge?.id === d.id ? 1 : 0.65)
      .attr("stroke-dasharray", (d: any) => EDGE_DASH[d.type as EdgeType] || "none")
      .attr("marker-end", (d: any) => `url(#arr-${d.type})`)
      .attr("cursor", "pointer")
      .attr("class", "animated-edge")
      .attr("filter", (d: any) => stateRef.current.selectedEdge?.id === d.id ? "url(#glow)" : "none")
      .attr("d", edgePath as any);

    hitSel.on("mouseover", function(ev, d: any) {
        if (stateRef.current.selectedEdge?.id === d.id) return;
        const p = d3.select(this.parentNode as SVGGElement).select(".animated-edge");
        p.transition().duration(250).attr("stroke-width", 2.5).attr("stroke-opacity", 0.9).attr("filter", "url(#glow)");
      })
      .on("mouseout", function(ev, d: any) {
        if (stateRef.current.selectedEdge?.id === d.id) return;
        const p = d3.select(this.parentNode as SVGGElement).select(".animated-edge");
        p.transition().duration(250).attr("stroke-width", 1.5).attr("stroke-opacity", 0.65).attr("filter", "none");
      })
      .on("click", (_ev, d: any) => {
        setSelectedEdge(d);
        setEdgeLabelInput(d.label || "");
        setShowEdgeLabel(true);
      });

    // Elegant Pill Labels
    edgeGroups.each(function(d: any) {
      const labelText = d.label || EDGE_LABEL[d.type as EdgeType];
      if (!labelText) return;
      const s = typeof d.source === "string" ? nodes.find(n => n.id === d.source) : d.source as MapNode;
      const t = typeof d.target === "string" ? nodes.find(n => n.id === d.target) : d.target as MapNode;
      if (!s || !t) return;
      const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
      
      const width = labelText.length * 7 + 20;
      const pillGrp = d3.select(this).append("g")
         .attr("cursor", "pointer")
         .on("click", () => {
           setSelectedEdge(d);
           setEdgeLabelInput(d.label || "");
           setShowEdgeLabel(true);
         })
         .on("mouseover", function() {
            d3.select(this).select("rect").transition().duration(200).attr("stroke", "#ffffff");
         })
         .on("mouseout", function() {
            d3.select(this).select("rect").transition().duration(200).attr("stroke", "transparent");
         });

      pillGrp.append("rect")
        .attr("x", mx - width/2).attr("y", my - 11)
        .attr("width", width).attr("height", 22).attr("rx", 11)
        .attr("fill", "#0A0F1A")
        .attr("stroke", stateRef.current.selectedEdge?.id === d.id ? "#3BC9DB" : "transparent")
        .attr("stroke-width", 1)
        .attr("filter", "url(#shadow)");

      pillGrp.append("rect")
        .attr("x", mx - width/2).attr("y", my - 11)
        .attr("width", width).attr("height", 22).attr("rx", 11)
        .attr("fill", EDGE_COLOR[d.type as EdgeType] || "#2b2d2d")
        .attr("fill-opacity", 0.15)
        .attr("pointer-events", "none");

      pillGrp.append("text")
        .text(labelText)
        .attr("x", mx).attr("y", my + 3.5)
        .attr("text-anchor", "middle")
        .attr("font-size", "10px").attr("font-family", SF).attr("font-weight", 600).attr("letter-spacing", "0.05em")
        .attr("fill", EDGE_COLOR[d.type as EdgeType] || "#e2e8f0").attr("pointer-events", "none");
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
          d3.select(this).select(".card-shadow").transition().duration(200).attr("transform", "translate(0, 10)");
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
          hitSel.attr("d", edgePath as any);
          edgeGroups.selectAll("g").remove(); // Removes pills to avoid jitter during drag, will re-render on end
        })
        .on("end", function() {
          const newNodes = stateRef.current.nodes.map(n => ({ ...n, x: n.x, y: n.y }));
          pushHistory(newNodes, stateRef.current.edges);
          d3.select(this).select(".card-shadow").transition().duration(200).attr("transform", "translate(0, 0)");
          // Force re-render of pills
          setEdges([...stateRef.current.edges]);
        })
      )
      .on("click", (ev, d) => handleNodeClick(ev, d))
      .on("dblclick", (_ev, d) => {
        const newTitle = window.prompt("Edit Node Title:", d.title);
        if (newTitle) {
          setNodes(p => p.map(n => n.id === d.id ? { ...n, title: newTitle } : n));
        }
      });

    // Premium shadow for cards
    const standardNodes = nodeSel.filter((d: MapNode) => d.type !== "shape");
    const shapeNodes = nodeSel.filter((d: MapNode) => d.type === "shape");

    // --- RENDER STANDARD CARDS ---
    // Premium shadow for cards
    standardNodes.append("rect")
      .attr("class", "card-shadow")
      .attr("x", (d: MapNode) => -getNodeW(d) / 2)
      .attr("y", (d: MapNode) => -getNodeH(d) / 2)
      .attr("width", (d: MapNode) => getNodeW(d))
      .attr("height", (d: MapNode) => getNodeH(d))
      .attr("rx", (d: MapNode) => getNodeRx(d))
      .attr("fill", "transparent")
      .attr("filter", "url(#shadow)");

    // Main Card body – stroke & fill use auto-priority colour
    standardNodes.append("rect")
      .attr("class", "card-body")
      .attr("x", (d: MapNode) => -getNodeW(d) / 2)
      .attr("y", (d: MapNode) => -getNodeH(d) / 2)
      .attr("width", (d: MapNode) => getNodeW(d))
      .attr("height", (d: MapNode) => getNodeH(d))
      .attr("rx", (d: MapNode) => getNodeRx(d))
      .attr("fill", (d: MapNode) => (d.customColor || "#475569") + "18")
      .attr("stroke", (d: MapNode) => {
        if (stateRef.current.selectedNodeIds.includes(d.id)) return "#3BC9DB";
        return (d.customColor || "#475569") + "70";
      })
      .attr("stroke-width", (d: MapNode) => stateRef.current.selectedNodeIds.includes(d.id) ? 2.5 : 1.5)
      .style("backdrop-filter", "blur(24px)")
      .on("mouseover", function(_ev, d: MapNode) {
        if (stateRef.current.selectedNodeIds.includes(d.id)) return;
        d3.select(this).transition().duration(200).attr("stroke", d.customColor || "#475569");
      })
      .on("mouseout", function(_ev, d: MapNode) {
        if (stateRef.current.selectedNodeIds.includes(d.id)) return;
        d3.select(this).transition().duration(200).attr("stroke", (d.customColor || "#475569") + "70");
      });

    // Glow ring for newly generated nodes
    standardNodes.filter((d: MapNode) => !!d.isGenerated)
      .append("rect")
      .attr("class", "animate-pulse pointer-events-none")
      .attr("x", (d: MapNode) => -getNodeW(d) / 2)
      .attr("y", (d: MapNode) => -getNodeH(d) / 2)
      .attr("width", (d: MapNode) => getNodeW(d))
      .attr("height", (d: MapNode) => getNodeH(d))
      .attr("rx", (d: MapNode) => getNodeRx(d))
      .attr("fill", "transparent")
      .attr("stroke", "#3BC9DB")
      .attr("stroke-width", 3)
      .attr("filter", "url(#glow)");

    // Coloured left-accent strip
    standardNodes.append("rect")
      .attr("class", "card-accent")
      .attr("x", (d: MapNode) => -getNodeW(d) / 2)
      .attr("y", (d: MapNode) => -getNodeH(d) / 2 + getNodeRx(d))
      .attr("width", 3)
      .attr("height", (d: MapNode) => getNodeH(d) - getNodeRx(d) * 2)
      .attr("rx", 1.5)
      .attr("fill", (d: MapNode) => d.customColor || "#475569")
      .attr("opacity", 0.9);

    // HTML ForeignObject
    standardNodes.append("foreignObject")
      .attr("x", (d: MapNode) => -getNodeW(d) / 2)
      .attr("y", (d: MapNode) => -getNodeH(d) / 2)
      .attr("width", (d: MapNode) => getNodeW(d))
      .attr("height", (d: MapNode) => getNodeH(d))
      .html((d: MapNode) => `
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; padding:13px 16px 13px 22px; box-sizing:border-box; display:flex; flex-direction:column; gap:7px; font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;">
          <!-- Badge row -->
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <span style="font-size:9px; font-weight:700; letter-spacing:0.09em; color:${d.customColor || "#475569"}; text-transform:uppercase;">${d.type === "citing" ? "CITES THIS" : d.type === "reference" ? "REFERENCED" : d.type === "center" ? "FOCUS PAPER" : d.type === "related" ? "RELATED" : d.type.toUpperCase()}</span>
            ${d.citations ? `<span style="font-size:9px; color:#475569; font-weight:500;">${d.citations >= 1000 ? (d.citations/1000).toFixed(1)+"k" : d.citations} cit.</span>` : ""}
          </div>
          <!-- Divider -->
          <div style="height:1px; background:rgba(255,255,255,0.05); flex-shrink:0;"></div>
          <!-- Title -->
          <div style="flex:1; overflow:hidden;">
            <p style="margin:0; font-size:12.5px; font-weight:500; color:#E2E8F0; line-height:1.5; display:-webkit-box; -webkit-line-clamp:${getNodeH(d) <= 120 ? 3 : 4}; -webkit-box-orient:vertical; overflow:hidden;">${d.title}</p>
          </div>
          ${d.author || d.year ? `<p style="margin:0; font-size:10px; color:#64748B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${[d.author ? d.author.split(",")[0].trim() : "", d.year ? String(d.year) : ""].filter(Boolean).join(" · ")}</p>` : ""}
        </div>
      `);


    // --- INLINE QUICK ACTIONS ---
    const selectedStandardNodes = standardNodes.filter((d: MapNode) => stateRef.current.selectedNodeIds.includes(d.id) && stateRef.current.selectedNodeIds.length === 1);
    
    selectedStandardNodes.append("foreignObject")
      .attr("x", (d: MapNode) => -getNodeW(d) / 2)
      .attr("y", (d: MapNode) => -getNodeH(d) / 2 - 50)
      .attr("width", (d: MapNode) => getNodeW(d))
      .attr("height", 50)
      .attr("class", "pointer-events-none")
      .html((d: MapNode) => `
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%; display:flex; justify-content:center; align-items:flex-end; padding-bottom:8px; pointer-events:none;">
          <div style="background:rgba(10,10,10,0.85); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:4px; display:flex; gap:4px; pointer-events:auto; box-shadow:0 8px 16px rgba(0,0,0,0.4);">
            <button onclick="window.dispatchAICommand('Summarize this')" style="background:transparent; border:none; color:#e2e8f0; font-size:11px; font-weight:600; padding:4px 8px; border-radius:4px; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">✨ Summarize</button>
            <div style="width:1px; background:rgba(255,255,255,0.1); margin:4px 0;"></div>
            <button onclick="window.dispatchAICommand('Find related concepts')" style="background:transparent; border:none; color:#e2e8f0; font-size:11px; font-weight:600; padding:4px 8px; border-radius:4px; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">🔍 Find Related</button>
            <div style="width:1px; background:rgba(255,255,255,0.1); margin:4px 0;"></div>
            <button onclick="window.dispatchAICommand('Expand details')" style="background:transparent; border:none; color:#e2e8f0; font-size:11px; font-weight:600; padding:4px 8px; border-radius:4px; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">➕ Expand</button>
          </div>
        </div>
      `);

    // --- RENDER SHAPES ---
    // Shadow
    shapeNodes.each(function(d: MapNode) {
      const g = d3.select(this);
      const w = getNodeW(d);
      const h = getNodeH(d);
      const isSelected = stateRef.current.selectedNodeIds.includes(d.id);
      const strokeColor = isSelected ? "#3BC9DB" : (d.customColor || "rgba(255,255,255,0.2)");
      const fillColor = d.customColor ? d.customColor + "33" : "rgba(255,255,255,0.05)";
      
      let shapeEl: any;
      if (d.shape === "circle") {
        shapeEl = g.append("ellipse")
          .attr("cx", 0).attr("cy", 0)
          .attr("rx", w/2).attr("ry", h/2);
      } else if (d.shape === "diamond") {
        shapeEl = g.append("polygon")
          .attr("points", `0,${-h/2} ${w/2},0 0,${h/2} ${-w/2},0`);
      } else {
        // rect or pill
        shapeEl = g.append("rect")
          .attr("x", -w/2).attr("y", -h/2)
          .attr("width", w).attr("height", h)
          .attr("rx", d.shape === "pill" ? Math.min(w, h)/2 : getNodeRx(d));
      }

      shapeEl
        .attr("fill", fillColor)
        .attr("stroke", strokeColor)
        .attr("stroke-width", isSelected ? 2 : 1)
        .attr("filter", "url(#shadow)")
        .style("backdrop-filter", "blur(24px)");
        
      if (d.isGenerated) {
        shapeEl.clone(true)
          .attr("class", "animate-pulse pointer-events-none")
          .attr("fill", "transparent")
          .attr("stroke", "#3BC9DB")
          .attr("stroke-width", 3)
          .attr("filter", "url(#glow)");
      }
        
      if (d.title && d.title !== "New Shape") {
         g.append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("fill", "#E2E8F0")
          .style("font-family", SF)
          .style("font-size", "14px")
          .style("font-weight", "500")
          .text(d.title);
      }
    });

    // Focus state outline

    // Port dots (Left, Right, Top, Bottom)
    const ports = [
      { id: "left", x: (d: MapNode) => -getNodeW(d) / 2, y: () => 0 },
      { id: "right", x: (d: MapNode) => getNodeW(d) / 2, y: () => 0 },
      { id: "top", x: () => 0, y: (d: MapNode) => -getNodeH(d) / 2 },
      { id: "bottom", x: () => 0, y: (d: MapNode) => getNodeH(d) / 2 }
    ];
    
    let tempLink: any = null;
    const portDrag = d3.drag<SVGCircleElement, MapNode>()
      .on("start", function(ev, d) {
        ev.sourceEvent.stopPropagation();
        tempLink = edgeG.append("path")
          .attr("fill", "none").attr("stroke", "#3bc9db").attr("stroke-width", 2.5)
          .attr("stroke-dasharray", "6 6").attr("pointer-events", "none")
          .attr("filter", "url(#glow)");
      })
      .on("drag", function(ev, d) {
        if (!tempLink) return;
        const cx = Number(d3.select(this).attr("cx") || 0);
        const cy = Number(d3.select(this).attr("cy") || 0);
        const startX = d.x + cx;
        const startY = d.y + cy;
        const pointerX = d.x + ev.x;
        const pointerY = d.y + ev.y;
        const dist = Math.abs(pointerX - startX) * 0.4;
        tempLink.attr("d", `M${startX},${startY} C${startX + dist},${startY} ${pointerX - dist},${pointerY} ${pointerX},${pointerY}`);
      })
      .on("end", function(ev, d) {
        if (tempLink) { tempLink.remove(); tempLink = null; }
        const pointerX = d.x + ev.x;
        const pointerY = d.y + ev.y;
        
        let targetNode = null;
        for (const n of nodes) {
          if (n.id === d.id) continue;
          const nw = getNodeW(n);
          const nh = getNodeH(n);
          if (pointerX >= n.x - nw/2 - 30 && pointerX <= n.x + nw/2 + 30 &&
              pointerY >= n.y - nh/2 - 30 && pointerY <= n.y + nh/2 + 30) {
            targetNode = n; break;
          }
        }
        
        if (targetNode) {
          const exists = edges.find(e => ((typeof e.source === "string" ? e.source : (e.source as MapNode).id) === d.id && (typeof e.target === "string" ? e.target : (e.target as MapNode).id) === targetNode!.id));
          if (!exists) {
            setEdges(p => [...p, { id: `edge-${Date.now()}-${Math.random()}`, source: d.id, target: targetNode!.id, type: "references" }]);
          }
        }
      });

    ports.forEach(pos => {
      nodeSel.append("circle")
        .attr("class", "port-handle-hit")
        .attr("cx", pos.x).attr("cy", pos.y).attr("r", 18).attr("fill", "transparent").attr("cursor", "crosshair")
        .call(portDrag as any);

      nodeSel.append("circle")
        .attr("class", "port-handle")
        .attr("cx", pos.x).attr("cy", pos.y).attr("r", 5).attr("fill", "#000000")
        .attr("stroke", "#3bc9db").attr("stroke-width", 2).attr("pointer-events", "none");
    });

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
    if (dir === "fit") {
      // Fit all nodes in view with padding
      if (nodes.length === 0) { s.transition().duration(350).call(zoomRef.current.transform, d3.zoomIdentity); return; }
      const xs = nodes.map(n => n.x);
      const ys = nodes.map(n => n.y);
      const minX = Math.min(...xs) - 220, maxX = Math.max(...xs) + 220;
      const minY = Math.min(...ys) - 120, maxY = Math.max(...ys) + 120;
      const W = dims.w, H = dims.h;
      const scale = Math.min(0.85, Math.min(W / (maxX - minX), H / (maxY - minY)));
      const tx = W / 2 - scale * (minX + maxX) / 2;
      const ty = H / 2 - scale * (minY + maxY) / 2;
      s.transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    }
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

  
  const handleAlign = (type: 'left' | 'centerHorizontal' | 'right' | 'top' | 'centerVertical' | 'bottom' | 'distributeHorizontal' | 'distributeVertical') => {
    if (selectedNodeIds.length < 2) return;
    
    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    
    const bounds = selectedNodes.map(n => {
      const w = getNodeW(n);
      const h = getNodeH(n);
      return {
        id: n.id,
        left: n.x - w / 2,
        right: n.x + w / 2,
        top: n.y - h / 2,
        bottom: n.y + h / 2,
        cx: n.x,
        cy: n.y,
        w,
        h
      };
    });
    
    const minLeft = Math.min(...bounds.map(b => b.left));
    const maxRight = Math.max(...bounds.map(b => b.right));
    const minTop = Math.min(...bounds.map(b => b.top));
    const maxBottom = Math.max(...bounds.map(b => b.bottom));
    
    const selectionCenterX = (minLeft + maxRight) / 2;
    const selectionCenterY = (minTop + maxBottom) / 2;
    
    const updatedNodes = nodes.map(n => {
      if (!selectedNodeIds.includes(n.id)) return n;
      const w = getNodeW(n);
      const h = getNodeH(n);
      
      switch (type) {
        case 'left': return { ...n, x: minLeft + w / 2 };
        case 'right': return { ...n, x: maxRight - w / 2 };
        case 'centerHorizontal': return { ...n, x: selectionCenterX };
        case 'top': return { ...n, y: minTop + h / 2 };
        case 'bottom': return { ...n, y: maxBottom - h / 2 };
        case 'centerVertical': return { ...n, y: selectionCenterY };
        default: return n;
      }
    });

    if (type === 'distributeHorizontal' && selectedNodes.length > 2) {
      const sorted = [...selectedNodes].sort((a, b) => a.x - b.x);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const span = last.x - first.x;
      const step = span / (sorted.length - 1);
      
      sorted.forEach((node, index) => {
        if (index === 0 || index === sorted.length - 1) return;
        const targetX = first.x + step * index;
        const mappedNode = updatedNodes.find(n => n.id === node.id);
        if (mappedNode) mappedNode.x = targetX;
      });
    }

    if (type === 'distributeVertical' && selectedNodes.length > 2) {
      const sorted = [...selectedNodes].sort((a, b) => a.y - b.y);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const span = last.y - first.y;
      const step = span / (sorted.length - 1);
      
      sorted.forEach((node, index) => {
        if (index === 0 || index === sorted.length - 1) return;
        const targetY = first.y + step * index;
        const mappedNode = updatedNodes.find(n => n.id === node.id);
        if (mappedNode) mappedNode.y = targetY;
      });
    }

    pushHistory(updatedNodes, edges);
  };

  return (
    <div className="w-full h-full flex overflow-hidden"
      style={{ background: "#050505" }}>
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
                background: "#111111",
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
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "#1f1f1f" }}>
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

        {/* ── Floating AI Canvas Prompt (Cmd+K) ── */}
        {showCanvasPrompt && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setShowCanvasPrompt(false)}>
            <div className="bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(59,201,219,0.2)] w-[600px] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                <Sparkles size={16} className="text-[#3bc9db]" />
                <span className="text-[12px] font-medium text-white tracking-wide">Generate on Canvas</span>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setShowCanvasPrompt(false);
                const cmd = canvasPromptText;
                setCanvasPromptText("");
                await executeAICommand(cmd);
              }} className="p-4">
                <input
                  ref={inputRef}
                  value={canvasPromptText}
                  onChange={(e) => setCanvasPromptText(e.target.value)}
                  placeholder="Ask Nagi to generate nodes, summarize papers, or connect concepts..."
                  className="w-full bg-transparent text-[15px] text-white placeholder-[#8b949e] outline-none"
                  autoFocus
                />
                <div className="flex justify-between items-center mt-6">
                  <span className="text-[10px] text-[#64748b] bg-white/5 px-2 py-1 rounded">esc to close</span>
                  <button type="submit" disabled={!canvasPromptText.trim() || isProcessingAI} className="bg-white/10 hover:bg-[#3bc9db]/20 text-[#3bc9db] border border-transparent hover:border-[#3bc9db]/30 transition-colors px-3 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-50 flex items-center gap-2">
                     {isProcessingAI ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Generate
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Floating Top Left ── */}
        <div className="absolute top-5 left-5 z-30 flex flex-col gap-3 pointer-events-none">
          <button onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[12px] font-medium transition-opacity pointer-events-auto w-max hover:opacity-80"
            style={{ color: "#64748b" }}>
            <ArrowLeft size={12} /> Back to papers
          </button>

          <div className="flex items-center gap-3 pointer-events-auto">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-[13px] bg-[#1f1f1f] text-[#e2e8f0] shrink-0 border border-[#2a2a2a]">
              {centerPaper?.title?.charAt(0) || "M"}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <input
                  className="text-[15px] font-[550] text-[#e2e8f0] tracking-tight bg-transparent border-none outline-none focus:bg-[#111111] px-1.5 py-0.5 rounded-md transition-colors w-60 -ml-1.5"
                  defaultValue={centerPaper ? centerPaper.title : "Research Map"}
                  title="Edit Map Name"
                />
                <span className="px-2 py-0.5 rounded-full text-[10px] font-[500] shrink-0"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #2a2a2a", color: "#64748b" }}>
                  Draft
                </span>
              </div>
              <span className="text-[11px] text-[#475569] pl-1.5">Last updated 5 May, 2026</span>
            </div>
          </div>
        </div>




      {/* ── Floating Bottom Center Toolbar (Premium Glass Dock) ── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none">
        <div 
          className="flex items-center gap-3 px-3 py-2 pointer-events-auto rounded-[16px] shadow-2xl backdrop-blur-2xl transition-all"
          style={{ 
            background: "rgba(10, 15, 26, 0.85)", 
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)"
          }}
        >
          {([
            [
              { t: "select",  icon: <MousePointer size={16} />, tip: "Cursor"  },
              { t: "hand",    icon: <Hand         size={16} />, tip: "Pan" },
            ],
            [
              { t: "paper",   icon: <FileText     size={16} />, tip: "Paper"  },
              { t: "note",    icon: <StickyNote   size={16} />, tip: "Note" },
              { t: "question",icon: <MessageSquare size={16} />, tip: "Question" },
              { t: "timeline",icon: <Minus        size={16} />, tip: "Timeline" },
              { t: "frame",   icon: <BoxSelect    size={16} />, tip: "Frame" },
              { t: "shape",   icon: <Square       size={16} />, tip: "Shape" },
            ],
            [
              { t: "connect", icon: <ArrowUpRight size={16} />, tip: "Connect" },
              { t: "comment", icon: <MessageCircle size={16} />, tip: "Comment" },
            ],
            [
              { t: "ai",      icon: <Sparkles     size={16} />, tip: "Nagi Research Assistant", special: true },
            ],
            [
              { t: "export",  icon: <Download     size={16} />, tip: "Export" },
            ]
          ] as any[][]).map((group, groupIndex, arr) => (
            <div key={groupIndex} className="flex items-center gap-0.5 relative">
              {group.map((item) => {
                const isActive = activeTool === item.t;
                return (
                  <button 
                    key={item.t} 
                    className={`relative group w-8 h-8 flex items-center justify-center rounded-[10px] transition-all duration-300 active:scale-95 ${
                      item.special ? "hover:scale-105 hover:-translate-y-0.5 mx-1" : "hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
                    }`}
                    onClick={() => {
                      if (item.t === "paper") setShowAdd(true);
                      else if (item.t === "ai") setActiveTool("ai" as Tool);
                      else setActiveTool(item.t as Tool);
                    }}
                    style={item.special ? {
                      background: "linear-gradient(135deg, #3BC9DB, #8B5CF6)",
                      boxShadow: "0 4px 15px rgba(139, 92, 246, 0.4), inset 0 1px 1px rgba(255,255,255,0.4)",
                      color: "#ffffff"
                    } : {
                      background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                      color: isActive ? "#ffffff" : "#94a3b8",
                      boxShadow: isActive ? "inset 0 1px 2px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.2)" : "none",
                    }}
                  >
                    {item.icon}
                    {/* Premium Tooltip */}
                    <div className="absolute -top-[48px] left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-2xl backdrop-blur-xl z-50 translate-y-1 group-hover:translate-y-0"
                      style={{ background: "rgba(5, 5, 5, 0.95)", border: "1px solid rgba(255,255,255,0.1)", color: "#f8fafc", letterSpacing: "0.02em" }}>
                      {item.tip}
                    </div>
                  </button>
                );
              })}
              {groupIndex < arr.length - 1 && <div className="w-[1px] h-4 mx-1.5 bg-[rgba(255,255,255,0.08)]"></div>}
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



      </div>
      {/* ── Fixed Right Sidebar (Unified) ── */}
      <aside className="w-[280px] flex-shrink-0 h-[calc(100vh-24px)] my-3 mr-3 flex flex-col z-40 transition-all duration-300 bg-[#0a0a0a]/80 backdrop-blur-2xl rounded-2xl border border-white/5 shadow-2xl shadow-black/50 overflow-hidden">
        
        {/* Tab Header */}
        <div className="flex items-center px-2 py-2 gap-1 border-b border-white/5 bg-white/[0.02]">
          <button 
            onClick={() => setActiveSidebarTab("design")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all ${activeSidebarTab === "design" ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5" : "text-[#808080] hover:text-[#e2e8f0] hover:bg-white/5"}`}
          >
            Design
          </button>
          <button 
            onClick={() => setActiveSidebarTab("copilot")}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition-all ${activeSidebarTab === "copilot" ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5" : "text-[#808080] hover:text-[#e2e8f0] hover:bg-white/5"}`}
          >
            Assistant
          </button>
        </div>

        <div className="flex-1 overflow-hidden relative">
          
          
          {/* ── DESIGN TAB ── */}
          {activeSidebarTab === "design" && (
            <div className="absolute inset-0 overflow-y-auto flex flex-col custom-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
              
              <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                
                .nagi-slider { -webkit-appearance: none; width: 100%; height: 2px; background: rgba(255,255,255,0.1); border-radius: 2px; outline: none; }
                .nagi-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; border-radius: 50%; background: #fff; cursor: pointer; border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 1px 3px rgba(0,0,0,0.3); transition: transform 0.1s; }
                .nagi-slider::-webkit-slider-thumb:hover { transform: scale(1.2); }
              `}</style>

              {!selectedNode && !selectedEdge ? (
                <div className="flex-1 flex flex-col items-center justify-center text-[#64748B] text-[12px] gap-4" style={{ }}>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-dashed border-[#1f1f1f] bg-[rgba(255,255,255,0.02)]">
                    <MousePointer size={20} className="opacity-50" />
                  </div>
                  <span className="font-medium">Select an object to inspect</span>
                </div>
              ) : (
                <div className="flex flex-col pb-8">
                  
                                    {/* === MULTIPLE SELECTION INSPECTOR === */}
                  {selectedNodeIds.length > 1 && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="px-5 py-4 border-b border-[#1f1f1f]">
                        <h2 className="text-[13px] font-semibold text-[#E2E8F0] tracking-wide" style={{ }}>Multiple Selected ({selectedNodeIds.length})</h2>
                      </div>
                      
                      <div className="p-4 space-y-6">
                        {/* ALIGNMENT SECTION */}
                        <div className="flex flex-col gap-3">
                          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider" style={{ }}>Alignment</span>
                          <div className="grid grid-cols-6 gap-1 bg-[rgba(255,255,255,0.02)] p-1 rounded-[8px] border border-[#1f1f1f]">
                            <button onClick={() => handleAlign('left')} title="Align Left" className="p-1.5 flex items-center justify-center rounded-[6px] text-[#94A3B8] hover:text-[#3BC9DB] hover:bg-[rgba(59,201,219,0.1)] transition-colors">
                              <AlignStartVertical size={16} />
                            </button>
                            <button onClick={() => handleAlign('centerHorizontal')} title="Align Center (Horizontal)" className="p-1.5 flex items-center justify-center rounded-[6px] text-[#94A3B8] hover:text-[#3BC9DB] hover:bg-[rgba(59,201,219,0.1)] transition-colors">
                              <AlignCenterHorizontal size={16} />
                            </button>
                            <button onClick={() => handleAlign('right')} title="Align Right" className="p-1.5 flex items-center justify-center rounded-[6px] text-[#94A3B8] hover:text-[#3BC9DB] hover:bg-[rgba(59,201,219,0.1)] transition-colors">
                              <AlignEndVertical size={16} />
                            </button>
                            <button onClick={() => handleAlign('top')} title="Align Top" className="p-1.5 flex items-center justify-center rounded-[6px] text-[#94A3B8] hover:text-[#3BC9DB] hover:bg-[rgba(59,201,219,0.1)] transition-colors">
                              <AlignStartHorizontal size={16} />
                            </button>
                            <button onClick={() => handleAlign('centerVertical')} title="Align Center (Vertical)" className="p-1.5 flex items-center justify-center rounded-[6px] text-[#94A3B8] hover:text-[#3BC9DB] hover:bg-[rgba(59,201,219,0.1)] transition-colors">
                              <AlignCenterVertical size={16} />
                            </button>
                            <button onClick={() => handleAlign('bottom')} title="Align Bottom" className="p-1.5 flex items-center justify-center rounded-[6px] text-[#94A3B8] hover:text-[#3BC9DB] hover:bg-[rgba(59,201,219,0.1)] transition-colors">
                              <AlignEndHorizontal size={16} />
                            </button>
                          </div>
                        </div>

                        {/* DISTRIBUTION SECTION */}
                        <div className="flex flex-col gap-3">
                          <span className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider" style={{ }}>Distribution</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleAlign('distributeHorizontal')} title="Distribute Horizontally" className="flex-1 py-2 flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.02)] border border-[#1f1f1f] rounded-[8px] text-[#94A3B8] hover:text-[#3BC9DB] hover:border-[#3BC9DB] transition-all">
                              <AlignHorizontalSpaceBetween size={16} />
                              <span className="text-[11px] font-medium">Horizontal</span>
                            </button>
                            <button onClick={() => handleAlign('distributeVertical')} title="Distribute Vertically" className="flex-1 py-2 flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.02)] border border-[#1f1f1f] rounded-[8px] text-[#94A3B8] hover:text-[#3BC9DB] hover:border-[#3BC9DB] transition-all">
                              <AlignVerticalSpaceBetween size={16} />
                              <span className="text-[11px] font-medium">Vertical</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === SINGLE NODE INSPECTOR === */}
                  {selectedNode && (
                    <>
                      {/* Global Type Indicator */}
                      <div className="flex items-center justify-between px-5 py-4 shrink-0 bg-[#070b14]" style={{ borderBottom: "1px solid #1f1f1f" }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-sm shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ background: selectedNode.customColor || TYPE_COLOR[selectedNode.type] }} />
                          <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#E2E8F0]" style={{ }}>
                            {TYPE_LABEL[selectedNode.type] || selectedNode.type}
                          </span>
                        </div>
                      </div>

                      {/* --- GENERAL SECTION --- */}
                      <div className="flex flex-col border-b border-white/5">
                        <button onClick={() => toggleSection('general')} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors w-full text-left">
                          <span className="text-[11px] font-semibold text-[#8b949e]">General</span>
                          <ChevronDown size={14} className={`text-[#64748B] transition-transform duration-200 ${openSections.general ? 'rotate-180' : ''}`} />
                        </button>
                        {openSections.general && (
                          <div className="flex flex-col gap-3 px-4 pb-4 pt-1">
                            <input
                              value={selectedNode.title}
                              onChange={(e) => updateSelectedNode({ title: e.target.value })}
                              className="text-[13px] font-semibold leading-snug bg-transparent border border-transparent hover:border-white/10 focus:border-[#3BC9DB] focus:bg-white/[0.03] rounded-md outline-none px-2 py-1 -mx-2 transition-all w-[calc(100%+16px)] text-white"
                              placeholder="Title..."
                            />
                            <textarea
                              value={selectedNode.description || ""}
                              onChange={(e) => updateSelectedNode({ description: e.target.value })}
                              className="text-[12px] leading-relaxed bg-transparent border border-transparent hover:border-white/10 focus:border-[#3BC9DB] focus:bg-white/[0.03] rounded-md outline-none resize-none px-2 py-1 -mx-2 transition-all w-[calc(100%+16px)] text-[#8b949e]"
                              style={{ minHeight: "60px" }}
                              placeholder="Add a description..."
                            />
                          </div>
                        )}
                      </div>

                      {/* --- APPEARANCE SECTION --- */}
                      <div className="flex flex-col border-b border-white/5">
                        <button onClick={() => toggleSection('appearance')} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors w-full text-left">
                          <span className="text-[11px] font-semibold text-[#8b949e]">Appearance</span>
                          <ChevronDown size={14} className={`text-[#64748B] transition-transform duration-200 ${openSections.appearance ? 'rotate-180' : ''}`} />
                        </button>
                        {openSections.appearance && (
                          <div className="flex flex-col gap-4 px-5 pb-5 pt-1">
                            
                            {/* Color Picker Swatches */}
                            <div className="flex flex-col gap-2">
                              <span className="text-[10px] font-medium text-[#64748B]" style={{ }}>Accent Color</span>
                              <div className="flex gap-1.5 flex-wrap">
                                {["", "#ef4444", "#f59e0b", "#10b981", "#3bc9db", "#6366f1", "#a855f7", "#ec4899", "#ffffff", "#444444"].map((c) => (
                                  <button key={c || "default"} onClick={() => updateSelectedNode({ customColor: c || undefined })}
                                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                                    style={{
                                      background: c || "rgba(255,255,255,0.05)",
                                      borderColor: selectedNode.customColor === c || (!selectedNode.customColor && !c) ? "#fff" : "transparent",
                                    }}>
                                    {!c && <X size={10} color="#64748B" />}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Opacity Slider (Mock) */}
                            <div className="flex flex-col gap-2">
                               <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-medium text-[#64748B]" style={{ }}>Opacity</span>
                                  <span className="text-[10px] font-mono text-[#E2E8F0]">100%</span>
                               </div>
                               <input type="range" min="0" max="100" defaultValue="100" className="nagi-slider" />
                            </div>

                          </div>
                        )}
                      </div>

                      {/* --- SIZE & LAYOUT SECTION --- */}
                      <div className="flex flex-col border-b border-white/5">
                        <button onClick={() => toggleSection('layout')} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors w-full text-left">
                          <span className="text-[11px] font-semibold text-[#8b949e]">Layout</span>
                          <ChevronDown size={14} className={`text-[#64748B] transition-transform duration-200 ${openSections.layout ? 'rotate-180' : ''}`} />
                        </button>
                        {openSections.layout && (
                          <div className="flex flex-col gap-4 px-4 pb-4 pt-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-transparent hover:border-white/10 focus-within:border-[#3bc9db] rounded-md px-2 py-1 transition-colors">
                                <span className="text-[10px] font-medium text-[#64748B]">W</span>
                                <input 
                                  type="text" 
                                  value={selectedNode.width || "Auto"} 
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    updateSelectedNode({ width: isNaN(val) ? undefined : val });
                                  }}
                                  className="w-full bg-transparent outline-none text-[11px] text-[#E2E8F0] font-mono" 
                                />
                              </div>
                              <div className="w-3 flex justify-center text-[#475569]"><Link2 size={12}/></div>
                              <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-transparent hover:border-white/10 focus-within:border-[#3bc9db] rounded-md px-2 py-1 transition-colors">
                                <span className="text-[10px] font-medium text-[#64748B]">H</span>
                                <input 
                                  type="text" 
                                  value={selectedNode.height || "Auto"} 
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    updateSelectedNode({ height: isNaN(val) ? undefined : val });
                                  }}
                                  className="w-full bg-transparent outline-none text-[11px] text-[#E2E8F0] font-mono" 
                                />
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 mt-1">
                               <span className="text-[10px] font-medium text-[#64748B]" style={{ }}>Corner Radius</span>
                               <div className="flex items-center bg-[rgba(255,255,255,0.03)] border border-[#1f1f1f] p-0.5 rounded-[8px]">
                                  {[0, 8, 16, 24].map((r) => {
                                    const isActive = selectedNode.borderRadius === r || (!selectedNode.borderRadius && r === 16);
                                    return (
                                      <button 
                                        key={r} 
                                        onClick={() => updateSelectedNode({ borderRadius: r })}
                                        className={`flex-1 py-1 rounded-[6px] text-[11px] font-medium ${isActive ? 'bg-[#3BC9DB] text-[#050505]' : 'text-[#94A3B8] hover:text-[#fff]'}`}
                                      >
                                        {r}
                                      </button>
                                    );
                                  })}
                               </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* --- METADATA SECTION (Papers Only) --- */}
                      {selectedNode.type === "paper" && (
                        <div className="flex flex-col border-b border-[#1f1f1f]">
                          <button onClick={() => toggleSection('metadata')} className="flex items-center justify-between px-5 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors w-full text-left">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]" style={{ }}>Metadata</span>
                            <ChevronDown size={14} className={`text-[#64748B] transition-transform duration-200 ${openSections.metadata ? 'rotate-180' : ''}`} />
                          </button>
                          {openSections.metadata && (
                            <div className="flex flex-col gap-2.5 px-5 pb-5 pt-1">
                              {[
                                { key: "author", label: "Author", value: selectedNode.author },
                                { key: "year", label: "Year", value: selectedNode.year?.toString() },
                                { key: "citations", label: "Citations", value: selectedNode.citations?.toString(), isNumber: true },
                                { key: "field", label: "Field", value: selectedNode.field },
                                { key: "journal", label: "Journal", value: selectedNode.journal },
                              ].map(row => (
                                <div key={row.label} className="flex items-center justify-between gap-2 group">
                                  <span className="text-[11px] font-medium text-[#64748B]" style={{ }}>{row.label}</span>
                                  <input 
                                    type="text"
                                    value={row.value || ""}
                                    onChange={(e) => updateSelectedNode({ [row.key]: row.isNumber ? (parseInt(e.target.value) || 0) : e.target.value })}
                                    className="text-[11px] font-medium text-right bg-transparent border-b border-transparent group-hover:border-[#1f1f1f] focus:border-[#3BC9DB] outline-none placeholder-[#334155] w-40 transition-colors py-0.5"
                                    style={{ color: "#E2E8F0" }}
                                    placeholder="-"
                                  />
                                </div>
                              ))}
                              
                              <div className="mt-3">
                                 <span className="text-[10px] font-medium text-[#64748B] mb-1.5 block" style={{ }}>Tags</span>
                                 <input 
                                    type="text"
                                    value={(selectedNode.tags || []).join(", ")}
                                    onChange={(e) => updateSelectedNode({ tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                                    placeholder="Add tags separated by commas..."
                                    className="text-[11px] bg-[rgba(255,255,255,0.02)] border border-[#1f1f1f] rounded-[6px] px-3 py-2 outline-none focus:border-[#3BC9DB] w-full transition-colors"
                                    style={{ color: "#E2E8F0" }}
                                  />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* --- NOTES SECTION --- */}
                      <div className="flex flex-col border-b border-[#1f1f1f]">
                        <button onClick={() => toggleSection('notes')} className="flex items-center justify-between px-5 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors w-full text-left">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]" style={{ }}>Notes</span>
                          <ChevronDown size={14} className={`text-[#64748B] transition-transform duration-200 ${openSections.notes ? 'rotate-180' : ''}`} />
                        </button>
                        {openSections.notes && (
                          <div className="flex flex-col gap-2 px-5 pb-5 pt-1">
                             <textarea
                               value={selectedNode.note || ""}
                               onChange={(e) => updateSelectedNode({ note: e.target.value })}
                               className="text-[12px] leading-relaxed rounded-[8px] bg-[rgba(255,255,255,0.02)] border border-[#1f1f1f] px-3 py-2.5 outline-none resize-y placeholder-[#475569] w-full focus:border-[#3BC9DB] transition-colors"
                               style={{ color: "#E2E8F0", minHeight: "100px" }}
                               placeholder="Supports Markdown..."
                             />
                          </div>
                        )}
                      </div>

                      {/* --- CONNECTIONS SECTION --- */}
                      <div className="flex flex-col border-b border-[#1f1f1f]">
                        <button onClick={() => toggleSection('connections')} className="flex items-center justify-between px-5 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors w-full text-left">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]" style={{ }}>Connections</span>
                          <ChevronDown size={14} className={`text-[#64748B] transition-transform duration-200 ${openSections.connections ? 'rotate-180' : ''}`} />
                        </button>
                        {openSections.connections && (
                          <div className="flex flex-col gap-1.5 px-5 pb-5 pt-1">
                            {edges.filter(e => {
                              const srcId = typeof e.source === "string" ? e.source : e.source.id;
                              const tgtId = typeof e.target === "string" ? e.target : e.target.id;
                              return srcId === selectedNode.id || tgtId === selectedNode.id;
                            }).length === 0 ? (
                               <span className="text-[11px] text-[#475569] py-2" style={{ }}>No active connections.</span>
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
                                  <div key={i} className="flex justify-between items-center bg-[rgba(255,255,255,0.02)] px-3 py-2 rounded-[6px] border border-[#1f1f1f] hover:border-[#334155] transition-colors cursor-pointer group">
                                    <span className="text-[11px] text-[#E2E8F0] font-medium truncate w-[130px]" style={{ }}>{otherNode?.title || String(otherId)}</span>
                                    <span className="text-[9px] font-bold uppercase py-0.5 px-1.5 rounded-[4px]" style={{ color: EDGE_COLOR[e.type], background: `${EDGE_COLOR[e.type]}22`}}>{e.label || e.type}</span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>

                      {/* --- ACTIONS & DANGER ZONE --- */}
                      <div className="flex flex-col px-5 py-6 gap-2.5">
                        {selectedNode.type === "paper" && (
                          <div className="flex gap-2">
                            <button onClick={() => { window.location.href = `/paper/${selectedNode.id}`; }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[11px] font-semibold transition-all hover:bg-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]"
                              style={{ color: "#E2E8F0" }}>
                              <BookOpen size={14} /> View
                            </button>
                            <button onClick={() => { window.location.href = `/map/${selectedNode.id}`; }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[11px] font-semibold transition-all hover:bg-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]"
                              style={{ color: "#E2E8F0" }}>
                              <Map size={14} /> Map
                            </button>
                          </div>
                        )}
                        {selectedNode.url && (
                          <a href={selectedNode.url} target="_blank" rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[11px] font-semibold transition-all hover:bg-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]"
                            style={{ color: "#E2E8F0" }}>
                            <ExternalLink size={14} /> Source Link
                          </a>
                        )}
                        
                        <div className="h-4"></div>
                        
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
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-[8px] text-[12px] font-semibold transition-all hover:bg-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)]"
                          style={{ color: "#F87171" }}>
                          <Trash2 size={14} /> Delete Node
                        </button>
                      </div>
                    </>
                  )}

                  {/* === EDGE INSPECTOR === */}
                  {selectedEdge && !selectedNode && (
                    <>
                      <div className="flex items-center gap-2 px-5 py-4 shrink-0 bg-[#070b14]" style={{ borderBottom: "1px solid #1f1f1f" }}>
                        <Link2 size={14} color="#64748B" />
                        <span className="text-[11px] font-bold tracking-[0.15em] uppercase"
                          style={{ color: EDGE_COLOR[selectedEdge.type] || "#E2E8F0" }}>
                          Connection
                        </span>
                      </div>

                      <div className="flex flex-col gap-3 px-5 py-5" style={{ borderBottom: "1px solid #1f1f1f" }}>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]" style={{ }}>Properties</span>
                        
                        <div className="flex flex-col gap-1.5 mt-2">
                          <span className="text-[10px] font-medium text-[#64748B]" style={{ }}>Relationship Type</span>
                          <select
                            value={selectedEdge.type}
                            onChange={(e) => {
                              const newType = e.target.value as EdgeType;
                              setEdges(edges.map(ed => ed.id === selectedEdge.id ? { ...ed, type: newType, label: EDGE_LABEL[newType] } : ed));
                              setSelectedEdge({ ...selectedEdge, type: newType, label: EDGE_LABEL[newType] });
                            }}
                            className="w-full text-[12px] font-medium bg-[rgba(255,255,255,0.03)] border border-[#1f1f1f] rounded-[6px] px-3 py-2 outline-none cursor-pointer focus:border-[#3BC9DB] transition-colors"
                            style={{ color: "#E2E8F0" }}>
                            {Object.keys(EDGE_COLOR).map((t) => (
                              <option key={t} value={t} style={{background: "#111111"}}>{EDGE_LABEL[t as EdgeType]}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5 mt-2">
                          <span className="text-[10px] font-medium text-[#64748B]" style={{ }}>Custom Label (Pill)</span>
                          <input
                            type="text"
                            value={selectedEdge.label || EDGE_LABEL[selectedEdge.type]}
                            onChange={(e) => {
                              setEdges(edges.map(ed => ed.id === selectedEdge.id ? { ...ed, label: e.target.value } : ed));
                              setSelectedEdge({ ...selectedEdge, label: e.target.value });
                            }}
                            className="w-full text-[12px] font-medium bg-[rgba(255,255,255,0.03)] border border-[#1f1f1f] rounded-[6px] px-3 py-2 outline-none focus:border-[#3BC9DB] transition-colors"
                            style={{ color: "#E2E8F0" }}
                          />
                        </div>
                      </div>

                      <div className="px-5 py-6">
                        <button
                          onClick={() => {
                            const newEdges = edges.filter(e => e.id !== selectedEdge.id);
                            pushHistory(nodes, newEdges);
                            setSelectedEdge(null);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-[8px] text-[12px] font-semibold transition-all hover:bg-[rgba(239,68,68,0.15)] bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.2)]"
                          style={{ color: "#F87171" }}>
                          <Trash2 size={14} /> Delete Connection
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── COPILOT TAB ── */}
          {activeSidebarTab === "copilot" && (
            <div className="absolute inset-0 flex flex-col">
              {/* Chat History */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6" style={{ WebkitOverflowScrolling: "touch" }}>
                {chatMessages.length === 0 && !isProcessingAI && (
                  <div className="text-[#808080] text-[12px] px-1" style={{ }}>
                    I'll help you create or modify the canvas. Let me know what you need.
                  </div>
                )}
                
                {chatMessages.map((msg, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      {msg.role === "user" ? (
                        <div className="w-5 h-5 rounded-[4px] bg-[#1f1f1f] flex items-center justify-center border border-[#334155]">
                          <User size={10} className="text-[#E2E8F0]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-[4px] flex items-center justify-center bg-[#3bc9db] shadow-[0_0_8px_rgba(59,201,219,0.4)]">
                          <Sparkles size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-[12px] leading-relaxed text-[#D1D5DB] whitespace-pre-wrap" style={{ }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isProcessingAI && (
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      <div className="w-5 h-5 rounded-[4px] flex items-center justify-center bg-[#3bc9db] shadow-[0_0_8px_rgba(59,201,219,0.4)]">
                        <Sparkles size={10} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 flex items-center h-5">
                      <Loader2 size={12} className="animate-spin text-[#808080]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 pt-2" style={{ borderTop: "1px solid #1f1f1f" }}>
                <div className="bg-[#000000] border border-[#1f1f1f] rounded-[8px] overflow-hidden flex flex-col transition-colors focus-within:border-[#3bc9db]">
                  
                  {/* Context Pill */}
                  <div className="px-2 py-1.5 flex items-center" style={{ borderBottom: "1px solid #1f1f1f" }}>
                    <button 
                      type="button"
                      onClick={() => setIsContextAdded(!isContextAdded)}
                      className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded ${isContextAdded ? 'bg-[rgba(59,201,219,0.15)] text-[#3bc9db] border border-[rgba(59,201,219,0.3)]' : 'bg-[#1f1f1f] hover:bg-[#334155] text-[#A0A0A0] hover:text-[#E2E8F0]'} transition-colors text-[10px] font-medium`} 
                      style={{ }}
                    >
                      <Paperclip size={10} /> {isContextAdded ? "Context Added" : "Add Context"}
                    </button>
                  </div>

                  {/* Textarea */}
                  <form onSubmit={handleAIChatSubmit} className="flex flex-col relative">
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
                      placeholder="Ask Nagi..."
                      className="w-full bg-transparent resize-none outline-none px-3 py-2.5 text-[12px] text-[#E2E8F0] placeholder-[#666] min-h-[50px]"
                      style={{ }}
                    />
                    
                    {/* Bottom Row Controls */}
                    <div className="flex items-center justify-between px-2 py-1.5 border-t border-[#1f1f1f] relative">
                      <div className="flex items-center gap-0.5 relative">
                        <button type="button" className="p-1.5 rounded hover:bg-[#1f1f1f] text-[#808080] hover:text-[#D1D5DB] transition-colors">
                          <Mic size={12} />
                        </button>
                        
                        <div className="relative">
                          <button 
                            type="button" 
                            onClick={() => setShowModelDropdown(!showModelDropdown)}
                            className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-[#1f1f1f] text-[#808080] hover:text-[#D1D5DB] transition-colors text-[10px] font-medium" 
                            style={{ }}
                          >
                            {selectedModel} <ChevronDown size={10} />
                          </button>
                          
                          {showModelDropdown && (
                            <div className="absolute bottom-full left-0 mb-1 w-32 bg-[#111111] border border-[#1f1f1f] rounded-md shadow-lg overflow-hidden z-50">
                              {['Llama 3.1 8B (Groq)', 'Gemma 2 9B (Fireworks)'].map(model => (
                                <button
                                  key={model}
                                  type="button"
                                  onClick={() => {
                                    setSelectedModel(model);
                                    setShowModelDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-[10px] ${selectedModel === model ? 'bg-[rgba(59,201,219,0.1)] text-[#3bc9db]' : 'text-[#A0A0A0] hover:bg-[#1f1f1f] hover:text-[#E2E8F0]'} transition-colors`}
                                >
                                  {model}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button type="submit" disabled={isProcessingAI || !aiCommand.trim()} className="p-1.5 rounded hover:bg-[#1f1f1f] text-[#808080] hover:text-white transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#666]">
                        <Send size={12} />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Add paper modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(5,8,16,0.9)" }}
          onClick={() => { setShowAdd(false); setAddQuery(""); setAddResults([]); }}>
          <div className="w-[560px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid #1f1f1f" }}>
              <span className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>Add Paper to Map</span>
              <button onClick={() => { setShowAdd(false); setAddQuery(""); setAddResults([]); }} style={{ color: "#334155" }}>
                <X size={14} />
              </button>
            </div>
            <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid #1f1f1f" }}>
              <Search size={13} style={{ color: "#334155" }} />
              <input autoFocus type="text" value={addQuery}
                onChange={e => setAddQuery(e.target.value)}
                placeholder="Search by title, author, topic…"
                className="flex-1 bg-transparent text-[13px] text-white focus:outline-none"
                style={{ }} />
              {isSearching && <Loader2 size={13} className="animate-spin" style={{ color: "#3bc9db" }} />}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {addResults.map((p, i) => (
                <button key={i} onClick={() => addPaper(p)}
                  className="w-full flex flex-col gap-1.5 px-5 py-3.5 text-left transition-opacity hover:opacity-75"
                  style={{ borderBottom: "1px solid #1f1f1f", background: i % 2 === 0 ? "#111111" : "#000000" }}>
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
                  style={{ color: "#1f1f1f" }}>Type to search</p>
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
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid #1f1f1f" }}>
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
                style={{ borderBottom: "1px solid #1f1f1f" }} />
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
                  style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", color: "#64748b" }}>
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
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid #1f1f1f" }}>
              <span className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>Add Note</span>
              <button onClick={() => setShowNoteModal(false)} style={{ color: "#334155" }}><X size={14} /></button>
            </div>
            <div className="px-5 py-4">
              <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)}
                placeholder="Write a note about this paper…"
                rows={4}
                className="w-full bg-transparent text-[13px] text-white focus:outline-none resize-none p-3 rounded-xl"
                style={{ border: "1px solid #1f1f1f", color: "#94a3b8" }} />
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
                  style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", color: "#64748b" }}>
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
            style={{ background: "#111111", border: "1px solid #1f1f1f" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid #1f1f1f" }}>
              <span className="text-[13px] font-semibold" style={{ color: "#e2e8f0" }}>Link Source</span>
              <button onClick={() => setShowUrlModal(false)} style={{ color: "#334155" }}><X size={14} /></button>
            </div>
            <div className="px-5 py-4">
              <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                placeholder="https://doi.org/… or any URL"
                className="w-full bg-transparent text-[13px] text-white focus:outline-none py-2"
                style={{ borderBottom: "1px solid #1f1f1f" }} />
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
                  style={{ background: "#0a0a0a", border: "1px solid #1f1f1f", color: "#64748b" }}>
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
