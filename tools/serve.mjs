import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '127.0.0.1';
const mime = { '.png': 'image/png', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8' };
http.createServer(async (req, res) => {
  try {
    const requested = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const relative = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');
    // Serve only game assets, never git data, test files, or environment files.
    if (!(relative === 'index.html' || relative === 'styles.css' || /^src\/[a-z-]+\.js$/.test(relative) || /^assets\/environment\/(terrain-forest-v1|tree-life-v1|road-stone-v1)\.png$/.test(relative) || /^assets\/defenders\/(oak|pine|palm|cypress|mushroom)-(warriors|aim-v1)\.png$/.test(relative) || /^assets\/towers\/(archer-watchtower|sap-cannon|thorn-bastion|root-obelisk)-v1\.png$/.test(relative))) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const body = await readFile(path.join(root, relative));
    res.writeHead(200, { 'Content-Type': mime[path.extname(relative)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(port, host, () => console.log(`Canopy Defense preview: http://${host}:${port}`));
