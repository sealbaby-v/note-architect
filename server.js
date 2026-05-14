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

function sendJson(res, status, data) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function aiRewrite(text) {
  return text.replaceAll('。', '。\n').replace(/\s{2,}/g, ' ').trim();
}

function aiCritique(text) {
  const len = text.length;
  return {
    overall: len > 400 ? '描写量は十分です。冗長箇所の圧縮で読み味が改善します。' : '短めです。情景描写と感情描写を1段追加すると厚みが増します。',
    scores: { structure: 7, character: 7, style: 6, tempo: 7, hook: 6 },
    strengths: ['文章の意図が明確', '場面が把握しやすい', '語彙が安定している'],
    weaknesses: ['余韻の不足', '比喩の少なさ', '転換部が急な箇所がある'],
  };
}

function aiPlot(summary) {
  return {
    proposals: [
      { title: '対立を深める展開', idea: `${summary.slice(0, 60)}...を起点に対立人物の目的を明確化する。` },
      { title: '伏線を回収する展開', idea: '前章で出した小道具を事件解決の鍵として再登場させる。' },
      { title: '意外性重視の展開', idea: '味方だと思っていた人物の動機を反転させ、価値観の衝突を作る。' },
    ],
  };
}

const server = createServer(async (req, res) => {
  const url = req.url || '/';

  if (url === '/api/health') return sendJson(res, 200, { ok: true, service: 'note-architect', timestamp: new Date().toISOString() });

  if (req.method === 'POST' && url?.startsWith('/api/ai/')) {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const payload = body ? JSON.parse(body) : {};
      if (url === '/api/ai/rewrite') return sendJson(res, 200, { ok: true, data: { rewritten: aiRewrite(payload.text || '') } });
      if (url === '/api/ai/critique') return sendJson(res, 200, { ok: true, data: aiCritique(payload.text || '') });
      if (url === '/api/ai/plot') return sendJson(res, 200, { ok: true, data: aiPlot(payload.summary || '') });
      return sendJson(res, 404, { ok: false, error: 'unknown ai endpoint' });
    });
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
