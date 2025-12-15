// Simple HTTP server for testing Konomi Konception
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found: ' + req.url);
      } else {
        res.writeHead(500);
        res.end('Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n  Konomi Konception Server running at:`);
  console.log(`  http://localhost:${PORT}/`);
  console.log(`\n  Pages:`);
  console.log(`  - http://localhost:${PORT}/              (Index)`);
  console.log(`  - http://localhost:${PORT}/views/v1-minimal.html  (Minimal)`);
  console.log(`  - http://localhost:${PORT}/views/v2-core.html     (Core)`);
  console.log(`  - http://localhost:${PORT}/views/v3-advanced.html (Advanced)`);
  console.log(`  - http://localhost:${PORT}/views/v4-full.html     (Full + 3D)`);
  console.log(`\n  Press Ctrl+C to stop\n`);
});
