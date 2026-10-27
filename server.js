const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = pathname.startsWith('/assets/')
    ? path.join('public', pathname.replace(/^\//, ''))
    : pathname === '/'
      ? 'index.html'
      : pathname.replace(/^\//, '');
  const resolved = path.resolve(root, file);
  if (!resolved.startsWith(root + path.sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  fs.readFile(resolved, (error, data) => {
    if (error) {
      res.writeHead(404).end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(resolved)] || 'application/octet-stream' });
    res.end(data);
  });
});
const port = Number(process.env.PORT) || 3000;
const listen = (candidate) => {
  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      listen(candidate + 1);
      return;
    }
    throw error;
  });
  server.listen(candidate, () => console.log(`ConectaSênior disponível em http://localhost:${candidate}`));
};
listen(port);

