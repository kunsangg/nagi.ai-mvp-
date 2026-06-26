import { BookOpen, BarChart2, Library, Lightbulb, FileText } from "lucide-react";

export default function FeatureCards() {
  const actions = [
    { icon: <BookOpen size={15} />, label: "Literature Review" },
    { icon: <BarChart2 size={15} />, label: "Analyze Data" },
    { icon: <Library size={15} />, label: "Find Citations" },
    { icon: <Lightbulb size={15} />, label: "Form Hypothesis" },
    { icon: <FileText size={15} />, label: "Summarize Paper" },
  ];

  return (
    <div className="w-full max-w-[736px] mx-auto mt-4 flex items-center justify-center gap-2 flex-wrap">
      {actions.map((action, index) => (
        <button
          key={index}
          className="flex items-center gap-2 px-3 py-1.5 rounded-[16px] bg-[#202222] border border-[#2b2d2d] text-[#e8e8e6] text-sm font-medium hover:bg-[#2b2d2d] transition-colors"
        >
          <span className="text-[#a0a0a0] flex-shrink-0 flex items-center justify-center">{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
