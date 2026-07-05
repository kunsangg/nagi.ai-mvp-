const fs = require('fs');
const path = require('path');

const replacements = [
  // Soft pill styles instead of neon solid backgrounds
  { search: /background: ["']#10b981["']/g, replace: 'background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)"' },
  { search: /background: ["']#3bc9db["']/g, replace: 'background: "rgba(59, 201, 219, 0.1)", color: "#3bc9db", border: "1px solid rgba(59, 201, 219, 0.2)"' },
  { search: /background: ["']#f59e0b["']/g, replace: 'background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.2)"' },
  { search: /background: ["']#8b5cf6["']/g, replace: 'background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "1px solid rgba(139, 92, 246, 0.2)"' },
  
  // Clean up any pure black backgrounds to #0a0a0a
  { search: /background: ["']#000000["']/g, replace: 'background: "#0a0a0a"' }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  replacements.forEach(r => {
    newContent = newContent.replace(r.search, r.replace);
  });
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated Badges in', file);
  }
});
