const fs = require('fs');

const files = process.argv.slice(2);

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  const nodes = {};
  for (const node of data.nodes) {
    let name = node.callFrame.functionName || '(anonymous)';
    if (name === '(root)' || name === '(program)' || name === '(idle)' || name === '(garbage collector)') {
       name = `[${name}]`;
    }
    const url = node.callFrame.url;
    // Simplify URL if it exists
    const shortUrl = url ? url.split('/').pop().split('\\').pop() : '';
    nodes[node.id] = shortUrl ? `${name} (${shortUrl}:${node.callFrame.lineNumber})` : name;
  }

  const counts = {};
  let total = 0;

  for (const sampleId of data.samples) {
    counts[sampleId] = (counts[sampleId] || 0) + 1;
    total++;
  }

  const sorted = Object.keys(counts)
    .sort((a, b) => counts[b] - counts[a])
    .filter(id => {
       const name = nodes[id];
       return !name.includes('[') && !name.includes('idle') && !name.includes('program') && !name.includes('epoll');
    })
    .slice(0, 5);

  console.log(`\n=== Analyzing ${file.split('\\').pop()} ===`);
  for (const id of sorted) {
    const percent = ((counts[id] / total) * 100).toFixed(2);
    console.log(`- ${percent}% : ${nodes[id]}`);
  }
}
