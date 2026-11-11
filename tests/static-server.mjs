import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml'
};

export function serveStatic(root) {
  const base = path.resolve(root);
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = path.resolve(base, '.' + pathname);
      if (file !== base && !file.startsWith(base + path.sep)) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }
      const data = fs.readFileSync(file);
      const type = TYPES[path.extname(file)] || 'application/octet-stream';
      res.writeHead(200, {'content-type': type, 'cache-control': 'no-store'});
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const {port} = server.address();
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise(done => server.close(() => done()))
      });
    });
  });
}
