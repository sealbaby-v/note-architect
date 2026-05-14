import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const port = process.env.PORT || 3000;
const publicDir = join(process.cwd(), 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer(async (req, res) => {
  const url = req.url || '/';

  if (url === '/api/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, service: 'note-architect', timestamp: new Date().toISOString() }));
    return;
  }

  const cleanPath = url === '/' ? '/index.html' : url;
  const filePath = join(publicDir, cleanPath);

  try {
    const data = await readFile(filePath);
    const contentType = mimeTypes[extname(filePath)] || 'application/octet-stream';
    res.writeHead(200, { 'content-type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`note-architect is running at http://localhost:${port}`);
});
