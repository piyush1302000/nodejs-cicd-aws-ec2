const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../app');

let server;
let baseUrl;

before(async () => {
  server = createApp();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('GET /health returns status ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
});

test('GET / returns the home page', async () => {
  const res = await fetch(`${baseUrl}/`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/html/);
  const html = await res.text();
  assert.match(html, /Hello from my Node\.js app/);
});

test('GET /version returns name and version', async () => {
  const res = await fetch(`${baseUrl}/version`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.name, 'nodejs-cicd-aws-ec2');
  assert.match(body.version, /^\d+\.\d+\.\d+$/);
});

test('unknown path returns 404', async () => {
  const res = await fetch(`${baseUrl}/nope`);
  assert.equal(res.status, 404);
});

test('non-GET request returns 405', async () => {
  const res = await fetch(`${baseUrl}/health`, { method: 'POST' });
  assert.equal(res.status, 405);
});
