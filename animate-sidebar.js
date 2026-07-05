const fs = require('fs');
const file = './src/components/layout/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

// The Workspace Dropdown labels
content = content.replace(
  /\{!isCollapsed && <span className="text-sm text-\[#e2e8f0\] font-medium">Personal Workspace<\/span>\}/g, 
  '<span className={`text-sm text-[#e2e8f0] font-medium transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>Personal Workspace</span>'
);

content = content.replace(
  /\{!isCollapsed && <span className="text-sm text-\[#e2e8f0\] font-medium">Stanford Neuro Lab<\/span>\}/g, 
  '<span className={`text-sm text-[#e2e8f0] font-medium transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>Stanford Neuro Lab</span>'
);

// The Workspace Header (active one)
content = content.replace(
  /\{!isCollapsed && \(\s*<div className="flex flex-col text-left">\s*<span className="text-\[11px\] font-semibold text-\[#808080\] uppercase tracking-wider">Workspace<\/span>\s*<span className="text-sm font-semibold text-\[#e2e8f0\]">([^<]+)<\/span>\s*<\/div>\s*\)\}/g,
  '<div className={`flex flex-col text-left transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}> <span className="text-[11px] font-semibold text-[#808080] uppercase tracking-wider whitespace-nowrap">Workspace</span> <span className="text-sm font-semibold text-[#e2e8f0] whitespace-nowrap">$1</span> </div>'
);

// The New Research button and Profile button
content = content.replace(
  /\{!isCollapsed && <span className="truncate">([^<]+)<\/span>\}/g, 
  '<span className={`truncate transition-all duration-300 overflow-hidden ${isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>$1</span>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Sidebar transitions smoothed.');
