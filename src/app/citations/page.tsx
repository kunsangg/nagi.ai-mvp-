"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Quote, Search } from "lucide-react";
import { useState } from "react";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";

export default function CitationsIndex() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // In a real app this would resolve a paper ID from a search term, 
      // but here we just route to a dummy ID for the demo
      router.push(`/citations/W2163102067`);
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0a", overflow: "hidden" }}>
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
            <Quote size={14} color="#34d399" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Find Citations</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
          <div style={{ 
            width: 56, height: 56, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
            borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px"
          }}>
            <Quote size={28} color="#34d399" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>Citation Network Explorer</h1>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.5, marginBottom: 32 }}>
            Search for a paper to instantly discover its most influential citations and the underlying citation network.
          </p>
          
          <form onSubmit={handleSearch} style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 14, top: 14, color: "#64748b" }}>
              <Search size={18} />
            </div>
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a paper..."
              style={{
                width: "100%", padding: "14px 14px 14px 44px",
                background: "#0a0a0a", border: "1px solid #1f1f1f",
                borderRadius: 12, color: "#e2e8f0", fontSize: 14,
                outline: "none", transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = "#34d399"}
              onBlur={(e) => e.target.style.borderColor = "#1f1f1f"}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
