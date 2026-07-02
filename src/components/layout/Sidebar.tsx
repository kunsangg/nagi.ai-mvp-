"use client";

import { useState, useEffect } from "react";
import { Plus, Compass, Network, Folder, Library, MessageSquare, Settings, UserCircle2, FileText, PanelLeftClose, PanelLeft, X, Users, Database, LayoutGrid } from "lucide-react";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [recentItems, setRecentItems] = useState<string[]>([]);

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
      className={`${isCollapsed ? "w-[68px]" : "w-[240px]"} flex-shrink-0 h-full bg-[#121314] flex flex-col pt-5 pb-4 px-3 border-r border-[#2b2d2d]/40 transition-all duration-300 ease-in-out`}
    >
      {/* Logo Area */}
      <div className={`flex items-center mb-8 ${isCollapsed ? "justify-center px-0" : "justify-between px-2"}`}>
        {!isCollapsed && (
          <div className="select-none flex items-center gap-3">
            <div className="text-transparent bg-clip-text bg-gradient-to-b from-[#0a58ca] to-[#3bc9db] text-3xl font-black leading-none">
              海
            </div>
            <span className="text-[#e8e8e6] font-bold text-xl tracking-widest">NAGI</span>
          </div>
        )}
        {isCollapsed && (
          <div className="text-transparent bg-clip-text bg-gradient-to-b from-[#0a58ca] to-[#3bc9db] text-3xl font-black leading-none">
            海
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`text-[#a0a0a0] hover:text-[#e8e8e6] transition-colors p-1.5 rounded-lg hover:bg-[#2b2d2d] ${isCollapsed ? "hidden" : "block"}`}
          title="Collapse Sidebar"
        >
          <PanelLeftClose size={18} />
        </button>
      </div>

      {/* Expanded Collapse Button (when collapsed) */}
      {isCollapsed && (
        <div className="flex justify-center mb-6">
          <button 
            onClick={() => setIsCollapsed(false)}
            className="text-[#a0a0a0] hover:text-[#e8e8e6] transition-colors p-2 rounded-lg hover:bg-[#2b2d2d]"
            title="Expand Sidebar"
          >
            <PanelLeft size={20} />
          </button>
        </div>
      )}

      {/* New Research Button */}
      <div className="mb-6 flex justify-center">
        <button 
          className={`${isCollapsed ? "w-11 h-11 px-0 justify-center" : "w-full h-[44px] px-4 justify-start"} bg-[#1a1c1d] hover:bg-[#2b2d2d] text-[#e8e8e6] rounded-xl flex items-center transition-all duration-200 text-sm font-semibold border border-[#2b2d2d]/80 shadow-sm overflow-hidden`}
        >
          <div className={`flex items-center ${isCollapsed ? "gap-0 justify-center" : "gap-3 whitespace-nowrap min-w-0"}`}>
            <Plus size={18} className="text-[#e8e8e6] flex-shrink-0" />
            {!isCollapsed && <span className="truncate">New Research</span>}
          </div>
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar pr-1">
        <NavItem icon={<Compass size={18} />} label="Discover" active isCollapsed={isCollapsed} />
        <NavItem icon={<Folder size={18} />} label="Projects" isCollapsed={isCollapsed} />
        <NavItem icon={<Network size={18} />} label="Maps" isCollapsed={isCollapsed} />
        <NavItem icon={<Library size={18} />} label="Collections" isCollapsed={isCollapsed} />
        <NavItem icon={<Database size={18} />} label="Datasets" isCollapsed={isCollapsed} />
        <NavItem icon={<Users size={18} />} label="Authors" isCollapsed={isCollapsed} />
        <NavItem icon={<FileText size={18} />} label="Saved Papers" isCollapsed={isCollapsed} />
        <NavItem icon={<LayoutGrid size={18} />} label="Workspaces" isCollapsed={isCollapsed} />
        
        {!isCollapsed && recentItems.length > 0 && (
          <div className="mt-8 mb-3">
            <div className="text-xs font-semibold text-[#808080] px-3 py-1.5 uppercase tracking-widest">Recent</div>
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

      <div className="my-3 border-t border-[#2b2d2d]/40"></div>

      {/* Footer Nav */}
      <div className="space-y-1 flex flex-col">
        <NavItem icon={<Settings size={18} />} label="Settings" isCollapsed={isCollapsed} />
        <button className={`w-full flex items-center ${isCollapsed ? "justify-center p-2" : "justify-between px-3 py-2.5"} hover:bg-[#202222] rounded-xl transition-colors group mt-1`}>
          <div className={`flex items-center ${isCollapsed ? "gap-0 justify-center" : "gap-3"} text-sm font-medium text-[#a0a0a0] group-hover:text-[#e8e8e6] transition-colors`}>
            <div className="w-7 h-7 rounded-full bg-[#1a1c1d] border border-[#2b2d2d] flex items-center justify-center text-[#a0a0a0] group-hover:text-[#e8e8e6] transition-colors flex-shrink-0 shadow-sm">
              <UserCircle2 size={16} />
            </div>
            {!isCollapsed && <span className="truncate">Kunsang</span>}
          </div>
        </button>
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active = false, className = "", isCollapsed, onRemove }: { icon?: React.ReactNode; label: string; active?: boolean; className?: string; isCollapsed: boolean; onRemove?: () => void }) {
  return (
    <a
      href="#"
      title={isCollapsed ? label : undefined}
      className={`group relative flex items-center ${isCollapsed ? "justify-center px-0 h-11 w-11 mx-auto" : "gap-3 px-3 py-2.5"} rounded-xl text-sm font-medium transition-all duration-200 ${
        active 
          ? "bg-[#202222] text-[#e8e8e6] shadow-sm" 
          : "text-[#a0a0a0] hover:bg-[#1a1c1d] hover:text-[#e8e8e6]"
      } ${className}`}
    >
      {icon && <span className={`${active ? "opacity-100" : "opacity-70"} flex-shrink-0 transition-opacity`}>{icon}</span>}
      {!isCollapsed && <span className={`truncate ${!icon ? "pl-7" : ""} ${onRemove ? "pr-6" : ""}`}>{label}</span>}
      
      {!isCollapsed && onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 opacity-0 group-hover:opacity-100 text-[#a0a0a0] hover:text-[#e8e8e6] hover:bg-[#2b2d2d] p-1 rounded-md transition-all duration-200"
          title="Remove"
        >
          <X size={14} />
        </button>
      )}
    </a>
  );
}
