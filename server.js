import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const port = process.env.PORT || 3000;
const publicDir = join(process.cwd(), 'public');
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };
const sendJson = (res, status, data) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
const aiRewrite = (text='') => text.replaceAll('。', '。\n').replace(/\s{2,}/g, ' ').trim();
const aiCritique = (text='') => ({ overall: text.length > 400 ? '描写量は十分です。' : 'もう少し描写を増やすと良くなります。', scores: { structure: 7, character: 7, style: 6, tempo: 7, hook: 6 }, strengths: ['文章意図が明確', '展開が分かりやすい', '読点配置が安定'], weaknesses: ['余韻を増やせる', '比喩が少なめ', '場面転換が急な箇所'] });
const aiPlot = (summary='') => ({ proposals:[{title:'対立深化',idea:`${summary.slice(0,60)}...から対立軸を増やす`},{title:'伏線回収',idea:'既出小道具を鍵に再登場'},{title:'反転展開',idea:'味方の動機を反転させる'}] });

createServer(async (req, res) => {
  const url = req.url || '/';
  if (url === '/api/health') return sendJson(res, 200, { ok: true, service: 'note-architect', timestamp: new Date().toISOString() });
  if (req.method === 'POST' && url.startsWith('/api/ai/')) {
    let body=''; req.on('data', c => { body += c; });
    req.on('end', () => {
      let payload = {};
      try { payload = body ? JSON.parse(body) : {}; } catch { return sendJson(res, 400, { ok: false, error: 'invalid json' }); }
      if (url === '/api/ai/rewrite') return sendJson(res, 200, { ok: true, data: { rewritten: aiRewrite(payload.text) } });
      if (url === '/api/ai/critique') return sendJson(res, 200, { ok: true, data: aiCritique(payload.text) });
      if (url === '/api/ai/plot') return sendJson(res, 200, { ok: true, data: aiPlot(payload.summary) });
      return sendJson(res, 404, { ok: false, error: 'unknown ai endpoint' });
    });
    return;
  }
  const filePath = join(publicDir, url === '/' ? '/index.html' : url);
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
}).listen(port, () => console.log(`note-architect is running at http://localhost:${port}`));
