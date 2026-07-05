const fs = require('fs');
const file = './src/components/layout/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/text-3xl/g, 'text-[22px]');
content = content.replace(/text-xl/g, 'text-[15px]');

fs.writeFileSync(file, content, 'utf8');
console.log('Sidebar Logo UI refined.');
