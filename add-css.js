const fs = require('fs');
const file = './src/styles/globals.css';
let content = fs.readFileSync(file, 'utf8');

const scrollbarCSS = `
.no-scrollbar::-webkit-scrollbar { display: none !important; width: 0px !important; height: 0px !important; }
.no-scrollbar::-webkit-scrollbar-thumb { display: none !important; width: 0px !important; }
.no-scrollbar::-webkit-scrollbar-track { display: none !important; width: 0px !important; }
.no-scrollbar { scrollbar-width: none !important; -ms-overflow-style: none !important; }
`;

if (!content.includes('.no-scrollbar::-webkit-scrollbar-track')) {
  content += scrollbarCSS;
  fs.writeFileSync(file, content, 'utf8');
}
