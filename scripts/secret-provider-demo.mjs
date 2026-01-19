import http from 'node:http';

const port = Number.parseInt(process.env.SECRET_PROVIDER_PORT || '8787', 10);
const requireToken = process.env.SECRET_PROVIDER_REQUIRE_TOKEN === 'true';
const expectedToken = process.env.SECRET_PROVIDER_TOKEN || '';
const dataRaw = process.env.SECRET_PROVIDER_DATA || '';

let secrets = { 'demo/api-key': 'demo-secret' };
if (dataRaw) {
  try {
    const parsed = JSON.parse(dataRaw);
    if (parsed && typeof parsed === 'object') {
      secrets = { ...secrets, ...parsed };
    }
  } catch {
    // ignore invalid JSON
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
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
    const reference = typeof payload.reference === 'string' ? payload.reference : '';
    if (!reference) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing reference' }));
      return;
    }

    const value = secrets[reference];
    if (!value) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Secret not found' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ value }));
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Server error' }));
  }
});

server.listen(port, () => {
  console.log(`Secret provider demo listening on http://127.0.0.1:${port}/resolve`);
});
