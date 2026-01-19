import http from 'node:http';

const port = Number.parseInt(process.env.ANALYTICS_EXPORT_PORT || '8788', 10);
const requireToken = process.env.ANALYTICS_EXPORT_REQUIRE_TOKEN === 'true';
const expectedToken = process.env.ANALYTICS_EXPORT_TOKEN || '';
const maxBytes = 1_000_000;

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/ingest') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  if (requireToken) {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ') || auth.slice(7) !== expectedToken) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
  }

  try {
    const body = await readBody(req);
    const payload = body ? JSON.parse(body) : {};
    console.log('Analytics export payload received:', JSON.stringify(payload, null, 2));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ received: true }));
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid payload' }));
  }
});

server.listen(port, () => {
  console.log(`Analytics export demo listening on http://127.0.0.1:${port}/ingest`);
});
