const fs = require('fs');
const path = require('path');

const replacements = [
  // Remove inline fontFamily declarations
  { search: /,\s*fontFamily:\s*SF/g, replace: '' },
  { search: /fontFamily:\s*SF\s*,?/g, replace: '' },
  { search: /,\s*fontFamily:\s*MONO/g, replace: '' },
  { search: /fontFamily:\s*MONO\s*,?/g, replace: '' }
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
    console.log('Updated Fonts in', file);
  }
});
