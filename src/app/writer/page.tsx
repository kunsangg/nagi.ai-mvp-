"use client";

import { useState } from "react";
import { ArrowLeft, Save, Sparkles, BookOpen, Layers, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Link, ChevronDown, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

const SF = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";
const MONO = "'SF Mono', SFMono-Regular, ui-monospace, Menlo, monospace";

export default function NagiWriterPage() {
  const router = useRouter();
  const [content, setContent] = useState("# The Future of AI in Healthcare\n\nArtificial Intelligence is rapidly transforming the healthcare landscape...");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 1000);
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#000000", fontFamily: SF, overflow: "hidden" }}>
      
      {/* Header */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 56, flexShrink: 0,
        background: "rgba(10,15,26,0.95)", borderBottom: "1px solid #1f1f1f",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={() => router.back()} style={{
            display: "flex", alignItems: "center", gap: 6,
            color: "#64748b", background: "none", border: "none", cursor: "pointer",
            fontSize: 13,
          }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ width: 1, height: 16, background: "#1f1f1f" }} />
          <div style={{ fontSize: 13, color: "#94a3b8" }}>Projects / Stanford Neuro Lab / <span style={{ color: "#e2e8f0" }}>Draft 1</span></div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, color: "#64748b", fontFamily: MONO }}>
            {saved ? "Saved" : isSaving ? "Saving..." : "Edited just now"}
          </div>
          <button onClick={handleSave} style={{
            display: "flex", alignItems: "center", gap: 6,
            background: saved ? "#10b981" : "#e2e8f0", color: saved ? "#fff" : "#000000",
            border: "none", borderRadius: 6, padding: "6px 14px",
            fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
          }}>
            {saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Editor Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#111111", position: "relative" }}>
          
          {/* Mock formatting toolbar */}
          <div style={{
            position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
            background: "rgba(20,25,35,0.8)", backdropFilter: "blur(10px)",
            border: "1px solid #2b2d2d", borderRadius: 8, padding: "6px 12px",
            display: "flex", alignItems: "center", gap: 12, zIndex: 10
          }}>
            <div style={{ display: "flex", gap: 4 }}>
              <button style={{ background: "none", border: "none", color: "#e2e8f0", padding: 4, cursor: "pointer", borderRadius: 4 }}><Bold size={14} /></button>
              <button style={{ background: "none", border: "none", color: "#94a3b8", padding: 4, cursor: "pointer", borderRadius: 4 }}><Italic size={14} /></button>
              <button style={{ background: "none", border: "none", color: "#94a3b8", padding: 4, cursor: "pointer", borderRadius: 4 }}><Link size={14} /></button>
            </div>
            <div style={{ width: 1, height: 16, background: "#2b2d2d" }} />
            <div style={{ display: "flex", gap: 4 }}>
              <button style={{ background: "none", border: "none", color: "#e2e8f0", padding: 4, cursor: "pointer", borderRadius: 4 }}><AlignLeft size={14} /></button>
              <button style={{ background: "none", border: "none", color: "#94a3b8", padding: 4, cursor: "pointer", borderRadius: 4 }}><AlignCenter size={14} /></button>
              <button style={{ background: "none", border: "none", color: "#94a3b8", padding: 4, cursor: "pointer", borderRadius: 4 }}><AlignRight size={14} /></button>
            </div>
            <div style={{ width: 1, height: 16, background: "#2b2d2d" }} />
            <button style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "#e2e8f0", fontSize: 12, cursor: "pointer" }}>
              Heading 1 <ChevronDown size={12} />
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              resize: "none", color: "#e2e8f0", fontSize: 16, lineHeight: 1.8,
              padding: "100px 10% 40px", fontFamily: SF,
            }}
          />
        </div>

        {/* Right Sidebar - AI Assistant */}
        <aside style={{ width: 340, background: "#000000", borderLeft: "1px solid #1f1f1f", display: "flex", flexDirection: "column" }}>
          
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={16} color="#a78bfa" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Nagi Copilot</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Auto-suggested citations */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                Suggested Citations
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { title: "Deep Learning for Healthcare", author: "Esteva et al.", year: 2019 },
                  { title: "AI in medical imaging", author: "Litjens et al.", year: 2017 }
                ].map((paper, i) => (
                  <div key={i} style={{ background: "#111111", border: "1px solid #1f1f1f", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4, lineHeight: 1.4 }}>{paper.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{paper.author} · {paper.year}</div>
                    <button style={{ marginTop: 8, fontSize: 11, color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>
                      + Insert Citation
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Gap Analysis Context */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                From your Gap Analysis
              </div>
              <div style={{ background: "rgba(59,201,219,0.05)", border: "1px solid rgba(59,201,219,0.2)", borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
                  You noted that prior work ignored longitudinal effects. Consider adding a paragraph here addressing how your methodology tracks patients over 5 years.
                </p>
                <button style={{ marginTop: 8, fontSize: 11, color: "#3bc9db", background: "none", border: "none", padding: 0, cursor: "pointer", fontWeight: 600 }}>
                  Generate Draft
                </button>
              </div>
            </div>

          </div>

        </aside>
      </div>
    </div>
  );
}
