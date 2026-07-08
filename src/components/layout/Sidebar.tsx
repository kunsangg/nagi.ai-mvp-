"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Compass, Network, Folder, Library, MessageSquare, Settings, UserCircle2, FileText, PanelLeftClose, PanelLeft, X, Users, Database, LayoutGrid, BookOpen, Layers, SearchX, Scale, Building2, PenTool, ChevronDown, BarChart3 } from "lucide-react";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recentItems, setRecentItems] = useState<string[]>([]);
  const [workspace, setWorkspace] = useState("Personal Workspace");
  const [showWorkspaces, setShowWorkspaces] = useState(false);

  useEffect(() => {
    const loadRecent = () => {
      setRecentItems(JSON.parse(localStorage.getItem("recentSearches") || "[]"));
    };
    loadRecent();
    window.addEventListener("recentSearchesUpdated", loadRecent);
    return () => window.removeEventListener("recentSearchesUpdated", loadRecent);
  }, []);

  const removeRecentItem = (labelToRemove: string) => {
    const updated = recentItems.filter(item => item !== labelToRemove);
    setRecentItems(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
    window.dispatchEvent(new Event("recentSearchesUpdated"));
  };

  return (
    <aside 
      className={`${isCollapsed ? "w-[72px]" : "w-[260px]"} flex-shrink-0 h-[calc(100vh-24px)] my-3 mx-3 bg-[#0a0a0a]/80 backdrop-blur-2xl flex flex-col pt-5 pb-4 px-3 rounded-2xl border border-white/5 shadow-2xl shadow-black/50 transition-all duration-300 ease-in-out z-50`}
    >
      {/* Logo Area */}
      <div className={`flex items-center mb-8 ${isCollapsed ? "justify-center px-0" : "justify-between px-2"}`}>
        {!isCollapsed && (
          <Link href="/" className="select-none flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="   text-[#3bc9db] text-[22px] font-black leading-none">
              海
            </div>
            <span className="text-[#e2e8f0] font-bold text-[15px] tracking-widest">NAGI</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/" className="   text-[#3bc9db] text-[22px] font-black leading-none cursor-pointer hover:opacity-80 transition-opacity">
            海
          </Link>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`text-[#64748b] hover:text-[#e2e8f0] transition-colors p-1.5 rounded-lg hover:bg-[#1f1f1f] ${isCollapsed ? "hidden" : "block"}`}
          title="Collapse Sidebar"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Expanded Collapse Button (when collapsed) */}
      {isCollapsed && (
        <div className="flex justify-center mb-6">
          <button 
            onClick={() => setIsCollapsed(false)}
            className="text-[#64748b] hover:text-[#e2e8f0] transition-colors p-2 rounded-lg hover:bg-[#1f1f1f]"
            title="Expand Sidebar"
          >
            <PanelLeft size={20} />
          </button>
        </div>
      )}

      {/* Workspace Switcher */}
      <div className="mb-6 px-0 relative">
        <button 
          onClick={() => !isCollapsed && setShowWorkspaces(!showWorkspaces)}
          className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-1.5 rounded-md hover:bg-[#111111] transition-colors`}
          title={isCollapsed ? workspace : undefined}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-5 h-5 rounded-[4px] bg-[#111111] border border-[#1f1f1f] flex items-center justify-center flex-shrink-0 shadow-sm">
              {workspace === "Personal Workspace" ? (
                <UserCircle2 size={12} className="text-[#e2e8f0]" />
              ) : (
                <Building2 size={12} className="text-[#3bc9db]" />
              )}
            </div>
            <span className={`truncate text-[13.5px] font-[500] text-[#e2e8f0] transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
              {workspace}
            </span>
          </div>
          {!isCollapsed && <ChevronDown size={14} className="text-[#64748b] flex-shrink-0 mr-1" />}
        </button>

        {showWorkspaces && !isCollapsed && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#111111] border border-[#1f1f1f] rounded-lg shadow-xl z-50 p-2 overflow-hidden">
            <button 
              onClick={() => { setWorkspace("Personal Workspace"); setShowWorkspaces(false); }}
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[#1f1f1f] transition-colors text-left"
            >
              <UserCircle2 size={16} className="text-[#64748b]" />
              <span className="text-sm text-[#e2e8f0] font-medium">Personal Workspace</span>
            </button>
            <button 
              onClick={() => { setWorkspace("Stanford Neuro Lab"); setShowWorkspaces(false); }}
              className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-[#1f1f1f] transition-colors text-left mt-1"
            >
              <Building2 size={16} className="text-[#3bc9db]" />
              <span className="text-sm text-[#e2e8f0] font-medium">Stanford Neuro Lab</span>
            </button>
          </div>
        )}
      </div>

      {/* New Research Button */}
      <div className="mb-6 flex justify-center">
        <button 
          className={`${isCollapsed ? "w-10 h-10 px-0 justify-center" : "w-full h-[38px] px-4 justify-start"} bg-gradient-to-b from-[#1a1a1a] to-[#111111] hover:from-[#222222] hover:to-[#1a1a1a] text-[#e2e8f0] rounded-xl flex items-center transition-all duration-200 text-[13px] font-semibold border border-white/5 shadow-sm shadow-black/20 overflow-hidden group`}
        >
          <div className={`flex items-center ${isCollapsed ? "gap-0 justify-center" : "gap-3 whitespace-nowrap min-w-0"}`}>
            <Plus size={15} className="text-[#e2e8f0] flex-shrink-0" />
            <span className={`truncate transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>New Research</span>
          </div>
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <NavItem icon={<Compass size={15} />} label="Discover" active isCollapsed={isCollapsed} />
        <NavItem icon={<PenTool size={15} />} label="Nagi Writer" href="/writer" isCollapsed={isCollapsed} />
        <NavItem icon={<Folder size={15} />} label="Projects" isCollapsed={isCollapsed} />
        <NavItem icon={<Network size={15} />} label="Maps" href="/map" isCollapsed={isCollapsed} />
        <NavItem icon={<BookOpen size={15} />} label="Literature Review" href="/review" isCollapsed={isCollapsed} />
        <NavItem icon={<Layers size={15} />} label="Compare Papers" href="/compare" isCollapsed={isCollapsed} />
        <NavItem icon={<SearchX size={15} />} label="Research Gap Finder" href="/gaps" isCollapsed={isCollapsed} />
        <NavItem icon={<Scale size={15} />} label="Evidence Finder" href="/evidence" isCollapsed={isCollapsed} />
        <NavItem icon={<Library size={15} />} label="Collections" isCollapsed={isCollapsed} />
        <NavItem icon={<Database size={15} />} label="Datasets" isCollapsed={isCollapsed} />
        <NavItem icon={<Users size={15} />} label="Authors" isCollapsed={isCollapsed} />
        <NavItem icon={<FileText size={15} />} label="Saved Papers" isCollapsed={isCollapsed} />
        <NavItem icon={<LayoutGrid size={15} />} label="Workspaces" isCollapsed={isCollapsed} />
        <NavItem icon={<BarChart3 size={15} />} label="Pricing" href="/pricing" isCollapsed={isCollapsed} />
        
        {!isCollapsed && recentItems.length > 0 && (
          <div className="mt-8 mb-3">
            <div className="text-[11px] font-semibold text-[#808080] px-3 py-1.5 uppercase tracking-widest">Recent</div>
            {recentItems.map(item => (
              <NavItem 
                key={item}
                icon={<MessageSquare size={15} />} 
                label={item} 
                className="text-sm" 
                isCollapsed={isCollapsed} 
                onRemove={() => removeRecentItem(item)}
              />
            ))}
          </div>
        )}
      </nav>

      <div className="my-3 border-t border-[#1f1f1f]"></div>

      {/* Footer Nav */}
      <div className="space-y-0.5 flex flex-col">
        <NavItem icon={<Settings size={15} />} label="Settings" isCollapsed={isCollapsed} />
        <button className={`w-full flex items-center ${isCollapsed ? "justify-center p-2" : "justify-between px-3 py-1.5"} hover:bg-[#202222] rounded-md transition-colors group mt-1`}>
          <div className={`flex items-center ${isCollapsed ? "gap-0 justify-center" : "gap-3"} text-[14px] font-[450] text-[#64748b] group-hover:text-[#e2e8f0] transition-colors`}>
            <div className="w-7 h-7 rounded-full bg-[#111111] border border-[#1f1f1f] flex items-center justify-center text-[#64748b] group-hover:text-[#e2e8f0] transition-colors flex-shrink-0 shadow-sm">
              <UserCircle2 size={16} />
            </div>
            <span className={`truncate transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>Kunsang</span>
          </div>
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active = false, className = "", isCollapsed, onRemove, href }: { icon?: React.ReactNode; label: string; active?: boolean; className?: string; isCollapsed: boolean; onRemove?: () => void; href?: string }) {
  return (
    <a
      href={href ?? "#"}
      title={isCollapsed ? label : undefined}
      className={`group relative flex items-center ${isCollapsed ? "justify-center px-0 h-10 w-10 mx-auto" : "gap-3 px-3 py-2"} rounded-xl text-[13px] font-[500] tracking-wide transition-all duration-300 ${
        active 
          ? "bg-white/10 text-white shadow-sm ring-1 ring-white/5" 
          : "text-[#8b949e] hover:bg-white/5 hover:text-[#e2e8f0]"
      } ${className}`}
    >
      {icon && <span className={`${active ? "opacity-100" : "opacity-70"} flex-shrink-0 transition-opacity`}>{icon}</span>}
      <span className={`truncate whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"} ${!icon ? "pl-7" : ""} ${onRemove ? "pr-6" : ""}`}>{label}</span>
      
      {!isCollapsed && onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 opacity-0 group-hover:opacity-100 text-[#64748b] hover:text-[#e2e8f0] hover:bg-[#1f1f1f] p-1 rounded-md transition-all duration-200"
          title="Remove"
        >
          <X size={14} />
        </button>
      )}
    </a>
  );
}
