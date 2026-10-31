const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const appointmentsFile = path.join(root, 'data', 'consultas.json');
const medicinesFile = path.join(root, 'data', 'remedios.json');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/api/consultas') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'GET') {
      fs.readFile(appointmentsFile, 'utf8', (error, data) => {
        if (error) { res.writeHead(500).end(JSON.stringify({ error: 'Não foi possível carregar as consultas.' })); return; }
        res.writeHead(200).end(data);
      });
      return;
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; if (body.length > 1_000_000) req.destroy(); });
      req.on('end', () => {
        let appointments;
        try { appointments = JSON.parse(body); }
        catch { res.writeHead(400).end(JSON.stringify({ error: 'Dados inválidos.' })); return; }
        const valid = Array.isArray(appointments) && appointments.every((item) => item && ['id', 'date', 'time', 'specialty', 'location'].every((key) => typeof item[key] === 'string'));
        if (!valid) { res.writeHead(400).end(JSON.stringify({ error: 'Formato das consultas inválido.' })); return; }
        fs.mkdir(path.dirname(appointmentsFile), { recursive: true }, (mkdirError) => {
          if (mkdirError) { res.writeHead(500).end(JSON.stringify({ error: 'Não foi possível salvar as consultas.' })); return; }
          fs.writeFile(appointmentsFile, JSON.stringify(appointments, null, 2) + '\n', 'utf8', (writeError) => {
            if (writeError) { res.writeHead(500).end(JSON.stringify({ error: 'Não foi possível salvar as consultas.' })); return; }
            res.writeHead(200).end(JSON.stringify(appointments));
          });
        });
      });
      return;
    }
    res.setHeader('Allow', 'GET, PUT');
    res.writeHead(405).end(JSON.stringify({ error: 'Método não permitido.' }));
    return;
  }
  if (pathname === '/api/remedios') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (req.method === 'GET') {
      fs.readFile(medicinesFile, 'utf8', (error, data) => {
        if (error) { res.writeHead(500).end(JSON.stringify({ error: 'Não foi possível carregar os remédios.' })); return; }
        res.writeHead(200).end(data);
      });
      return;
    }
    if (req.method === 'PUT') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; if (body.length > 1_000_000) req.destroy(); });
      req.on('end', () => {
        let medicines;
        try { medicines = JSON.parse(body); }
        catch { res.writeHead(400).end(JSON.stringify({ error: 'Dados inválidos.' })); return; }
        const required = ['id', 'name', 'dosage', 'time', 'instructions', 'duration', 'durationLabel', 'startDate'];
        const valid = Array.isArray(medicines) && medicines.every((item) => item && required.every((key) => typeof item[key] === 'string') && (item.endDate === null || typeof item.endDate === 'string'));
        if (!valid) { res.writeHead(400).end(JSON.stringify({ error: 'Formato dos remédios inválido.' })); return; }
        fs.mkdir(path.dirname(medicinesFile), { recursive: true }, (mkdirError) => {
          if (mkdirError) { res.writeHead(500).end(JSON.stringify({ error: 'Não foi possível salvar os remédios.' })); return; }
          fs.writeFile(medicinesFile, JSON.stringify(medicines, null, 2) + '\n', 'utf8', (writeError) => {
            if (writeError) { res.writeHead(500).end(JSON.stringify({ error: 'Não foi possível salvar os remédios.' })); return; }
            res.writeHead(200).end(JSON.stringify(medicines));
          });
        });
      });
      return;
    }
    res.setHeader('Allow', 'GET, PUT');
    res.writeHead(405).end(JSON.stringify({ error: 'Método não permitido.' }));
    return;
  }
  if (pathname === '/index.html') {
    res.writeHead(301, { Location: '/pages/index.html' }).end();
    return;
  }
  const file = pathname.startsWith('/assets/')
    ? path.join('public', pathname.replace(/^\//, ''))
    : pathname === '/'
      ? path.join('pages', 'index.html')
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

