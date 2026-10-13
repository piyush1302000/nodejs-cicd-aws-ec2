const http = require('node:http');
const pkg = require('./package.json');

// Edit this line to make a visible change for a deployment demo.
const GREETING = 'Hello from my Node.js app, deployed by GitHub Actions. This is a change to demonstrate a deployment.';

// Incident 1 in the lab: change 'ok' to 'broken' to make the test fail.
const HEALTH_RESPONSE = { status: 'broken' };

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function sendHtml(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function homePage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${pkg.name}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 4rem auto; padding: 0 1rem; color: #222; }
    h1 { margin-bottom: 0.25rem; }
    .meta { color: #666; font-size: 0.9rem; }
    code { background: #f2f2f2; padding: 0.1rem 0.3rem; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>${GREETING}</h1>
  <p class="meta">${pkg.name} v${pkg.version}</p>
  <p>Try <code>/health</code> and <code>/version</code>.</p>
</body>
</html>`;
}

// Returns an HTTP server that is NOT listening yet, so tests can start it on any port.
function createApp() {
  return http.createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');

    if (req.method !== 'GET') {
      return sendJson(res, 405, { error: 'Method not allowed' });
    }

    switch (pathname) {
      case '/':
        return sendHtml(res, homePage());
      case '/health':
        return sendJson(res, 200, HEALTH_RESPONSE);
      case '/version':
        return sendJson(res, 200, {
          name: pkg.name,
          version: pkg.version,
          uptimeSeconds: Math.round(process.uptime()),
        });
      default:
        return sendJson(res, 404, { error: 'Not found' });
    }
  });
}

module.exports = createApp;
