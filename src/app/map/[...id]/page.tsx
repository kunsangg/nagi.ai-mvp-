"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import * as d3 from "d3";
import { ArrowLeft, Info, X } from "lucide-react";

const NODE_COLORS = {
  center: "#3bc9db",
  reference: "#a78bfa",
  citing: "#fbbf24",
  related: "#94a3b8",
};

const NODE_LABELS = {
  center: "Selected Paper",
  reference: "Referenced By This Paper",
  citing: "Cites This Paper",
  related: "Related Work",
};

const EDGE_COLORS = {
  reference: "#a78bfa",
  citing: "#fbbf24",
  related: "#334155",
};

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + "…" : str;
}

export default function MapPage() {
  const params = useParams();
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam.map(decodeURIComponent).join("/") : (idParam as string);
  const mono = "'JetBrains Mono', 'Fira Code', monospace";

  useEffect(() => {
    if (!id) return;
    fetch(`/api/map?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error);
        else setMapData(data);
        setIsLoading(false);
      })
      .catch(() => { setError("Failed to load map"); setIsLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!mapData || !svgRef.current) return;

    const container = svgRef.current.parentElement!;
    const W = container.clientWidth;
    const H = container.clientHeight;

    // Clear previous render
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", W)
      .attr("height", H);

    // Defs — arrowhead markers
    const defs = svg.append("defs");
    ["reference", "citing", "related"].forEach(type => {
      defs.append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 22)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", EDGE_COLORS[type as keyof typeof EDGE_COLORS]);
    });

    // Zoom
    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Node sizing — log scale on citations
    const maxCitations = Math.max(...mapData.nodes.map((n: any) => n.citations || 0), 1);
    const nodeRadius = (n: any) => {
      if (n.type === "center") return 28;
      const base = 10;
      const scale = Math.log10((n.citations || 0) + 1) / Math.log10(maxCitations + 1);
      return base + scale * 18;
    };

    // Force simulation
    const nodes = mapData.nodes.map((n: any) => ({ ...n }));
    const edges = mapData.edges.map((e: any) => ({ ...e }));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(edges)
        .id((d: any) => d.id)
        .distance((d: any) => {
          const t = d.type;
          return t === "reference" ? 180 : t === "citing" ? 200 : 220;
        })
        .strength(0.4)
      )
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide().radius((d: any) => nodeRadius(d) + 20));

    // Draw edges
    const link = g.append("g").selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", (d: any) => EDGE_COLORS[d.type as keyof typeof EDGE_COLORS])
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .attr("marker-end", (d: any) => `url(#arrow-${d.type})`);

    // Draw nodes
    const node = g.append("g").selectAll("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(
        d3.drag<any, any>()
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

    // Node circle
    node.append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d: any) => {
        const color = NODE_COLORS[d.type as keyof typeof NODE_COLORS];
        return d.type === "center" ? color : color + "22";
      })
      .attr("stroke", (d: any) => NODE_COLORS[d.type as keyof typeof NODE_COLORS])
      .attr("stroke-width", (d: any) => d.type === "center" ? 2.5 : 1.5)
      .on("mouseover", function (event, d: any) {
        d3.select(this).attr("fill", NODE_COLORS[d.type as keyof typeof NODE_COLORS] + "55");
        setHoveredNode(d);
        setTooltipPos({ x: event.pageX, y: event.pageY });
      })
      .on("mousemove", (event) => {
        setTooltipPos({ x: event.pageX, y: event.pageY });
      })
      .on("mouseout", function (_, d: any) {
        d3.select(this).attr("fill", d.type === "center"
          ? NODE_COLORS[d.type]
          : NODE_COLORS[d.type as keyof typeof NODE_COLORS] + "22"
        );
        setHoveredNode(null);
      })
      .on("click", (_, d: any) => {
        setSelectedNode(d);
      });

    // Node year label inside circle
    node.append("text")
      .text((d: any) => d.year || "")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", (d: any) => d.type === "center" ? "11px" : "9px")
      .attr("font-family", mono)
      .attr("fill", (d: any) => d.type === "center" ? "#06051d" : NODE_COLORS[d.type as keyof typeof NODE_COLORS])
      .attr("pointer-events", "none");

    // Node title below circle
    node.append("text")
      .text((d: any) => truncate(d.title, 28))
      .attr("text-anchor", "middle")
      .attr("y", (d: any) => nodeRadius(d) + 14)
      .attr("font-size", "9px")
      .attr("font-family", mono)
      .attr("fill", "#cad5e2")
      .attr("pointer-events", "none");

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [mapData]);

  return (
    <div className="w-full h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #06051d 0%, #061434 100%)", fontFamily: mono }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-3 shrink-0" style={{ background: "#1d293d", borderBottom: "1px solid #0f1c36" }}>
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-[13px] hover:opacity-70 transition-opacity"
          style={{ color: "#63b3ed" }}>
          <ArrowLeft size={14} /> Back
        </button>
        {mapData && (
          <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "#314062" }}>
            Research Map · {mapData.nodes.length} papers · {mapData.edges.length} connections
          </span>
        )}
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-4">
            {Object.entries(NODE_LABELS).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: NODE_COLORS[type as keyof typeof NODE_COLORS] }} />
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "#314062" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* Map canvas */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="text-[13px] animate-pulse" style={{ color: "#3bc9db" }}>
              Building research map...
            </div>
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

        {/* Scroll hint */}
        {!isLoading && !error && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest" style={{ color: "#314062" }}>
            Scroll to zoom · Drag to pan · Click node for details
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      {hoveredNode && !selectedNode && (
        <div
          className="fixed z-50 pointer-events-none px-3 py-2 rounded-lg text-[11px]"
          style={{
            left: tooltipPos.x + 14,
            top: tooltipPos.y - 10,
            background: "#1d293d",
            border: "1px solid #314062",
            color: "#cad5e2",
            fontFamily: mono,
            maxWidth: 240,
          }}
        >
          <div className="font-normal text-white mb-1">{truncate(hoveredNode.title, 60)}</div>
          <div style={{ color: "#314062" }}>{hoveredNode.author} · {hoveredNode.year}</div>
          <div style={{ color: NODE_COLORS[hoveredNode.type as keyof typeof NODE_COLORS] }} className="mt-1 text-[10px] uppercase tracking-wider">
            {NODE_LABELS[hoveredNode.type as keyof typeof NODE_LABELS]}
          </div>
        </div>
      )}

      {/* Selected node panel */}
      {selectedNode && (
        <div
          className="fixed right-0 top-0 h-full w-[320px] z-50 overflow-y-auto"
          style={{ background: "#06051d", borderLeft: "1px solid #1d293d", fontFamily: mono }}
        >
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1d293d" }}>
            <span className="text-[10px] uppercase tracking-[0.2em]"
              style={{ color: NODE_COLORS[selectedNode.type as keyof typeof NODE_COLORS] }}>
              {NODE_LABELS[selectedNode.type as keyof typeof NODE_LABELS]}
            </span>
            <button onClick={() => setSelectedNode(null)} className="text-[#314062] hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>

          <div className="px-5 py-5 flex flex-col gap-5">
            <h3 className="text-[14px] font-normal text-white leading-snug">{selectedNode.title}</h3>

            <div className="flex flex-col gap-1.5">
              {selectedNode.author && (
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: "#314062" }}>Author</span>
                  <span className="text-[11px]" style={{ color: "#cad5e2" }}>{selectedNode.author}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "#314062" }}>Year</span>
                <span className="text-[11px]" style={{ color: "#cad5e2" }}>{selectedNode.year || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-widest" style={{ color: "#314062" }}>Citations</span>
                <span className="text-[11px]" style={{ color: "#3bc9db" }}>{selectedNode.citations?.toLocaleString()}</span>
              </div>
              {selectedNode.field && (
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest" style={{ color: "#314062" }}>Field</span>
                  <span className="text-[11px] truncate max-w-[180px]" style={{ color: "#cad5e2" }}>{selectedNode.field}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => { window.location.href = `/paper/${selectedNode.id}`; }}
                className="w-full py-2.5 rounded-full text-[11px] uppercase tracking-[0.15em] border transition-all hover:opacity-80"
                style={{ background: "rgba(0,79,59,0.2)", borderColor: "rgba(255,255,255,0.1)", color: "#00bc7d" }}>
                View Full Paper
              </button>
              <button
                onClick={() => { window.location.href = `/map/${selectedNode.id}`; }}
                className="w-full py-2.5 rounded-full text-[11px] uppercase tracking-[0.15em] border transition-all hover:opacity-80"
                style={{ background: "rgba(0,60,71,0.3)", borderColor: "rgba(59,201,219,0.2)", color: "#3bc9db" }}>
                Map This Paper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
