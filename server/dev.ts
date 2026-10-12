// Local test server: runs the same handler as production on http://localhost:8787/api/recipe
// Start with:  npm run dev   (reads ANTHROPIC_API_KEY from server/.env.local)
import { createServer } from 'node:http';
import { OPTIONS, POST } from './api/recipe.ts';

const PORT = Number(process.env.PORT ?? 8787);

createServer(async (req, res) => {
  if (req.url !== '/api/recipe') {
    res.writeHead(404).end();
    return;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  if (!headers.has('x-forwarded-for')) headers.set('x-forwarded-for', req.socket.remoteAddress ?? 'local');
  const request = new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers,
    body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
  });
  const response = req.method === 'OPTIONS' ? OPTIONS(request) : req.method === 'POST' ? await POST(request) : new Response(null, { status: 405 });
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(PORT, '0.0.0.0', () => console.log(`Mise AI server on http://localhost:${PORT}/api/recipe`));
