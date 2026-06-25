import React from 'react';
import { 
  Search, 
  Compass, 
  BookOpen, 
  Layers, 
  Bookmark, 
  Clock, 
  Settings, 
  SlidersHorizontal,
  ExternalLink,
  Send,
  User,
  Calendar,
  BookMarked,
  Quote
} from 'lucide-react';

export default function DiscoverPage() {
  return (
    <div className="flex h-screen w-full bg-white text-gray-900 font-sans">
      {/* SIDEBAR */}
      <aside className="w-[220px] shrink-0 border-r-[0.5px] border-black/12 flex flex-col justify-between h-full sticky top-0 bg-white z-10">
        <div>
          {/* Logo */}
          <div className="p-4 flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-[#1a6bff] rounded flex items-center justify-center text-white text-xs font-bold leading-none">
              澳
            </div>
            <span className="font-semibold text-lg tracking-tight">Nagi</span>
          </div>

          {/* Nav Items */}
          <nav className="px-2 space-y-1">
            <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f8f8f8] text-[#1a6bff] font-medium text-sm">
              <Compass size={18} className="text-[#1a6bff]" />
              Discover
            </a>
            <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#f8f8f8] text-gray-700 font-medium text-sm transition-colors">
              <BookOpen size={18} className="text-gray-400" />
              Understand
            </a>
            <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#f8f8f8] text-gray-700 font-medium text-sm transition-colors">
              <Layers size={18} className="text-gray-400" />
              Synthesize
            </a>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-2 space-y-1 mb-2">
          <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#f8f8f8] text-gray-700 font-medium text-sm transition-colors">
            <Bookmark size={18} className="text-gray-400" />
            Saved papers
          </a>
          <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#f8f8f8] text-gray-700 font-medium text-sm transition-colors">
            <Clock size={18} className="text-gray-400" />
            Recent
          </a>
          <a href="#" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#f8f8f8] text-gray-700 font-medium text-sm transition-colors">
            <Settings size={18} className="text-gray-400" />
            Settings
          </a>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* TOPBAR */}
        <header className="sticky top-0 z-10 bg-white border-b-[0.5px] border-black/12 px-6 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search papers, topics, authors…" 
                className="w-full pl-10 pr-4 py-2 border-[0.5px] border-black/12 rounded-lg outline-none focus:border-[#1a6bff] focus:ring-[3px] focus:ring-[#1a6bff]/20 transition-all text-sm placeholder:text-gray-400"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border-[0.5px] border-black/12 rounded-lg hover:bg-[#f8f8f8] transition-colors text-sm font-medium text-gray-700">
              <SlidersHorizontal size={16} className="text-gray-500" />
              Filters
            </button>
            <button className="px-5 py-2 bg-[#1a6bff] hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium">
              Search
            </button>
          </div>

          {/* QUERY EXPANSION BOX */}
          <div className="bg-[#f8f8f8] border-[0.5px] border-black/12 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Query expanded by Nagi</div>
            <div className="flex flex-wrap gap-2">
              {["Attention mechanisms", "Transformer architectures", "Large language models", "Self-attention scaling", "Sequence-to-sequence"].map((term) => (
                <span key={term} className="px-2.5 py-1 bg-blue-50 text-[#1a6bff] rounded-md text-xs font-medium border-[0.5px] border-blue-200">
                  {term}
                </span>
              ))}
            </div>
          </div>

          {/* FILTER ROW */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button className="px-3 py-1.5 rounded-full border-[0.5px] border-[#1a6bff] bg-blue-50 text-[#1a6bff] text-xs font-medium whitespace-nowrap">
              Year: 2023 - 2024
            </button>
            <button className="px-3 py-1.5 rounded-full border-[0.5px] border-black/12 bg-white hover:bg-[#f8f8f8] text-gray-700 text-xs font-medium whitespace-nowrap transition-colors">
              Field: Computer Science
            </button>
            <button className="px-3 py-1.5 rounded-full border-[0.5px] border-black/12 bg-white hover:bg-[#f8f8f8] text-gray-700 text-xs font-medium whitespace-nowrap transition-colors">
              Citations: &gt; 50
            </button>
          </div>
        </header>

        {/* RESULTS AREA */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* RESULTS HEADER */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              <span className="font-bold text-gray-900">284</span> papers found
            </div>
            <div className="flex items-center gap-1 bg-[#f8f8f8] p-1 rounded-lg border-[0.5px] border-black/12">
              <button className="px-3 py-1 rounded-md bg-white shadow-sm border-[0.5px] border-black/12 text-xs font-medium text-gray-900">
                Relevance
              </button>
              <button className="px-3 py-1 rounded-md text-gray-500 hover:text-gray-900 text-xs font-medium transition-colors">
                Citations
              </button>
              <button className="px-3 py-1 rounded-md text-gray-500 hover:text-gray-900 text-xs font-medium transition-colors">
                Recency
              </button>
            </div>
          </div>

          {/* PAPER CARDS LIST */}
          <div className="space-y-4 max-w-4xl">
            {/* Active Card */}
            <div className="p-5 rounded-xl border-[0.5px] border-black/12 bg-white relative hover:border-black/30 transition-colors group cursor-pointer">
              <div className="absolute left-[-0.5px] top-[-0.5px] bottom-[-0.5px] w-1 bg-[#1a6bff] rounded-l-xl"></div>
              
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="text-[14px] font-medium text-gray-900 leading-snug pr-24">
                  Attention Is All You Need: A Retrospective on the Transformer Architecture and Its Impact
                </h3>
                <div className="px-2 py-1 bg-blue-50 text-[#1a6bff] rounded flex items-center text-xs font-medium whitespace-nowrap absolute right-5 top-5">
                  98% match
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1.5"><User size={14} /> Vaswani et al.</div>
                <div className="flex items-center gap-1.5"><Calendar size={14} /> 2017</div>
                <div className="flex items-center gap-1.5"><BookMarked size={14} /> NeurIPS</div>
                <div className="flex items-center gap-1.5"><Quote size={14} /> 94,832 citations</div>
              </div>

              <div className="text-[13px] text-gray-500 leading-relaxed mb-4">
                <span className="font-semibold text-gray-700">Nagi summary — </span>
                This foundational paper introduces the Transformer architecture, dispensing entirely with recurrence and convolutions in favor of attention mechanisms. It demonstrates superior translation quality while requiring significantly less training time, laying the groundwork for modern LLMs.
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded bg-[#f8f8f8] text-gray-600 text-xs border-[0.5px] border-black/5">Neural Networks</span>
                  <span className="px-2 py-1 rounded bg-[#f8f8f8] text-gray-600 text-xs border-[0.5px] border-black/5">NLP</span>
                  <span className="px-2 py-1 rounded bg-[#f8f8f8] text-gray-600 text-xs border-[0.5px] border-black/5">Transformers</span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-gray-400 hover:text-[#1a6bff] hover:bg-blue-50 rounded transition-colors" title="Bookmark">
                    <Bookmark size={16} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-[#1a6bff] hover:bg-blue-50 rounded transition-colors" title="External link">
                    <ExternalLink size={16} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-[#1a6bff] hover:bg-blue-50 rounded transition-colors" title="Send to Understand">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-5 rounded-xl border-[0.5px] border-black/12 bg-white relative hover:border-black/30 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="text-[14px] font-medium text-gray-900 leading-snug pr-24">
                  Language Models are Few-Shot Learners
                </h3>
                <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded flex items-center text-xs font-medium whitespace-nowrap absolute right-5 top-5">
                  92% match
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1.5"><User size={14} /> Brown et al.</div>
                <div className="flex items-center gap-1.5"><Calendar size={14} /> 2020</div>
                <div className="flex items-center gap-1.5"><BookMarked size={14} /> NeurIPS</div>
                <div className="flex items-center gap-1.5"><Quote size={14} /> 24,195 citations</div>
              </div>

              <div className="text-[13px] text-gray-500 leading-relaxed mb-4">
                <span className="font-semibold text-gray-700">Nagi summary — </span>
                Presents GPT-3, a 175 billion parameter language model. The paper shows that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes reaching competitiveness with prior state-of-the-art fine-tuning approaches.
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded bg-[#f8f8f8] text-gray-600 text-xs border-[0.5px] border-black/5">LLMs</span>
                  <span className="px-2 py-1 rounded bg-[#f8f8f8] text-gray-600 text-xs border-[0.5px] border-black/5">Few-shot learning</span>
                  <span className="px-2 py-1 rounded bg-[#f8f8f8] text-gray-600 text-xs border-[0.5px] border-black/5">Scaling laws</span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-gray-400 hover:text-[#1a6bff] hover:bg-blue-50 rounded transition-colors" title="Bookmark">
                    <Bookmark size={16} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-[#1a6bff] hover:bg-blue-50 rounded transition-colors" title="External link">
                    <ExternalLink size={16} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-[#1a6bff] hover:bg-blue-50 rounded transition-colors" title="Send to Understand">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-5 rounded-xl border-[0.5px] border-black/12 bg-white relative hover:border-black/30 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start gap-4 mb-2">
                <h3 className="text-[14px] font-medium text-gray-900 leading-snug pr-24">
                  Scaling Laws for Neural Language Models
                </h3>
                <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded flex items-center text-xs font-medium whitespace-nowrap absolute right-5 top-5">
                  87% match
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1.5"><User size={14} /> Kaplan et al.</div>
                <div className="flex items-center gap-1.5"><Calendar size={14} /> 2020</div>
                <div className="flex items-center gap-1.5"><BookMarked size={14} /> arXiv</div>
                <div className="flex items-center gap-1.5"><Quote size={14} /> 5,432 citations</div>
              </div>

              <div className="text-[13px] text-gray-500 leading-relaxed mb-4">
                <span className="font-semibold text-gray-700">Nagi summary — </span>
                Empirical study of scaling laws for language model performance. Demonstrates that cross-entropy loss scales as a power-law with model size, dataset size, and the amount of compute used for training, providing a predictable path for future model development.
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded bg-[#f8f8f8] text-gray-600 text-xs border-[0.5px] border-black/5">Scaling laws</span>
                  <span className="px-2 py-1 rounded bg-[#f8f8f8] text-gray-600 text-xs border-[0.5px] border-black/5">Compute efficiency</span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-gray-400 hover:text-[#1a6bff] hover:bg-blue-50 rounded transition-colors" title="Bookmark">
                    <Bookmark size={16} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-[#1a6bff] hover:bg-blue-50 rounded transition-colors" title="External link">
                    <ExternalLink size={16} />
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-[#1a6bff] hover:bg-blue-50 rounded transition-colors" title="Send to Understand">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
