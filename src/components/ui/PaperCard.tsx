import { Paper } from "@/types/paper";

function stripHtml(str?: string): string {
  if (!str) return "";
  return String(str).replace(/<[^>]*>/g, "");
}

export function PaperCard({ paper, index, onClick }: { paper: Paper; index: number; onClick: (paper: Paper) => void }) {
  return (
    <div
      onClick={() => onClick(paper)}
      className="group flex flex-col cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-0.5 h-full"
      style={{
        background: "#0a0a0a",
        borderColor: "#1f1f1f",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(59,201,219,0.3)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#1f1f1f";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Card top — domain color bar + rank + badges */}
      <div className="relative px-5 pt-5 pb-4 border-b" style={{ borderColor: "#1f1f1f" }}>
        {/* Colored accent line at very top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, #3bc9db, transparent)`, opacity: 0.6 }} />

        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Rank */}
          <span className="text-[11px] font-semibold tabular-nums shrink-0 mt-0.5"
            style={{ color: "#3bc9db", fontFamily: "var(--font-mono)" }}>
            #{String(index + 1).padStart(2, "0")}
          </span>
          {/* Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            {paper.isOpenAccess && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-widest"
                style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}>
                OA
              </span>
            )}
            {paper.type && (
              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full capitalize tracking-wide"
                style={{ background: "#111111", color: "#64748b", border: "1px solid #1f1f1f" }}>
                {paper.type.replace("-", " ")}
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-semibold leading-snug line-clamp-3 transition-colors group-hover:text-[#3bc9db]"
          style={{ color: "#e2e8f0", fontFamily: "var(--font-system)", letterSpacing: "-0.01em" }}>
          {stripHtml(paper.title)}
        </h3>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 px-5 py-4 gap-3">
        {/* Authors */}
        {paper.authors && paper.authors.length > 0 && (
          <p className="text-[12px] line-clamp-1" style={{ color: "#64748b" }}>
            {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}
          </p>
        )}

        {/* Journal + Year */}
        <div className="flex items-center gap-2 text-[11px]" style={{ color: "#475569" }}>
          {paper.journal && (
            <span className="truncate max-w-[160px] font-medium">{paper.journal}</span>
          )}
          {paper.journal && paper.publicationYear && (
            <span style={{ color: "#243044" }}>·</span>
          )}
          {paper.publicationYear && <span>{paper.publicationYear}</span>}
        </div>

        {/* Citations */}
        <div>
          <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: "rgba(59,201,219,0.08)", color: "#3bc9db", border: "1px solid rgba(59,201,219,0.15)" }}>
            {paper.citationCount.toLocaleString()} Citations
          </span>
        </div>

        {/* Abstract */}
        {paper.abstract && (
          <p className="text-[12px] leading-relaxed line-clamp-3 flex-1"
            style={{ color: "#475569" }}>
            {paper.abstract}
          </p>
        )}

        {/* Topic tags */}
        {paper.topics && paper.topics.length > 0 && (
          <div className="flex gap-1.5 flex-wrap pt-3 mt-auto border-t" style={{ borderColor: "#1f1f1f" }}>
            {paper.topics.slice(0, 2).map((t, i) => (
              <span key={i} className="text-[9px] font-medium px-2 py-1 rounded-md uppercase tracking-widest"
                style={{ background: "#111111", color: "#475569", border: "1px solid #1f1f1f" }}>
                {t.displayName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
