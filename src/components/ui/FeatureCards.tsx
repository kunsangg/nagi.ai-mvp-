import { BookOpen, BarChart2, Library, Lightbulb, FileText } from "lucide-react";

export default function FeatureCards() {
  const actions = [
    { icon: <BookOpen size={14} />, label: "Literature Review" },
    { icon: <BarChart2 size={14} />, label: "Research Map" },
    { icon: <Library size={14} />, label: "Find Citations" },
    { icon: <FileText size={14} />, label: "Summarize Paper" },
  ];

  return (
    <div className="w-full max-w-[736px] mx-auto mt-4 flex items-center justify-center gap-2 flex-wrap opacity-80">
      {actions.map((action, index) => (
        <button
          key={index}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1a1b1b]/50 border border-[#1f1f1f] text-[#64748b] text-xs font-medium hover:bg-[#202222] hover:text-[#e2e8f0] hover:border-[#3b3d3d]/50 focus:outline-none focus:ring-1 focus:ring-perplex-teal/40 transition-all duration-200 ease-out"
        >
          <span className="flex-shrink-0 flex items-center justify-center">{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
