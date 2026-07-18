import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

async function readProjectFile(path) {
  return readFile(resolve(root, path), 'utf8');
}

test('the static app exposes the accessible soundboard controls', async () => {
  const html = await readProjectFile('index.html');

  assert.match(html, /<main/i);
  assert.match(html, /id="sound-grid"/i);
  assert.match(html, /id="composer-list"/i);
  assert.match(html, /id="stop-all"/i);
  assert.match(html, /aria-live="polite"/i);
  assert.match(html, /assets\/js\/app\.js/i);
});

test('the app includes PWA files and a versioned sound manifest', async () => {
  await Promise.all([
    access(resolve(root, 'manifest.webmanifest')),
    access(resolve(root, 'sw.js')),
    access(resolve(root, 'data/sounds.json')),
  ]);

  const sounds = JSON.parse(await readProjectFile('data/sounds.json'));
  assert.equal(sounds.version, 1);
  assert.ok(Array.isArray(sounds.sounds));
  assert.ok(sounds.sounds.length >= 4);
});

test('the service worker refreshes same-origin assets online and uses its cache only as an offline fallback', async () => {
  const worker = await readProjectFile('sw.js');
  assert.match(worker, /function networkFirst/);
  assert.match(worker, /fetch\(request\).*cache\.put/s);
  assert.match(worker, /catch\(\(\) => caches\.match\(request\)\)/);
});

test('the app registers its PWA worker for every secure context', async () => {
  const app = await readProjectFile('assets/js/app.js');
  assert.match(app, /isSecureContext/);
});

test('the documented audio pipeline normalizes a source to web-safe mp3 output', async () => {
  const pipeline = await readProjectFile('tools/prepare-audio.sh');

  assert.match(pipeline, /loudnorm/i);
  assert.match(pipeline, /libmp3lame/i);
  assert.match(pipeline, /assets\/audio/i);
});
