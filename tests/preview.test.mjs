import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchPreview, matchesPreview } from '../tools/preview.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
const launcher = await readFile(path.join(repo, 'Launch-Canopy-Defense.cmd'), 'utf8');
const bootstrap = launcher.split(/\r?\n/).find(line => line.startsWith('node -e "')).slice(9, -1);

function runUpdate(overrides = {}) {
  // Execute the actual self-contained bootstrap, replacing Git with a recorder.
  // This checks that no mutating command precedes the local-work safeguards.
  const outputs = {
    'rev-parse --show-toplevel': process.cwd(),
    'remote get-url origin': 'https://github.com/TheCryptoArborist/treetowerdefense.git',
    'symbolic-ref --quiet --short HEAD': 'main',
    'status --porcelain': '',
    'merge-base --is-ancestor HEAD origin/main': '',
    ...overrides,
  };
  const stub = `const cp=require('node:child_process');const calls=[];const outputs=${JSON.stringify(outputs)};
    cp.execFileSync=(cmd,args)=>{const key=args.join(' ');calls.push(key);
      if(outputs[key]===false)throw Object.assign(Error('git failed'),{status:1});return outputs[key]||'';};
    process.on('exit',()=>console.log('CALLS:'+JSON.stringify(calls)));`;
  let output;
  try { output = execFileSync(process.execPath, ['-e', stub + bootstrap], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (error) { output = error.stdout; }
  return JSON.parse(output.split('CALLS:')[1]);
}

test('updater blocks local edits, untracked files, wrong branches, and wrong origins before fetch', () => {
  for (const overrides of [
    { 'status --porcelain': ' M src/app.js' },
    { 'status --porcelain': '?? notes.txt' },
    { 'symbolic-ref --quiet --short HEAD': 'feature' },
    { 'symbolic-ref --quiet --short HEAD': false },
    { 'remote get-url origin': 'https://github.com/another/project.git' },
  ]) {
    const calls = runUpdate(overrides);
    assert.ok(!calls.includes('fetch origin main'));
    assert.ok(!calls.some(call => call.startsWith('merge ')));
  }
});

test('updater refuses divergent or locally ahead main without merging', () => {
  const calls = runUpdate({ 'merge-base --is-ancestor HEAD origin/main': false });
  assert.ok(calls.includes('fetch origin main'));
  assert.ok(!calls.includes('merge --ff-only origin/main'));
});

test('failed fetch stops the update without merging', () => {
  const calls = runUpdate({ 'fetch origin main': false });
  assert.ok(!calls.includes('merge --ff-only origin/main'));
});

test('clean expected clone updates only through a fast-forward', () => {
  const calls = runUpdate();
  assert.deepEqual(calls.slice(-3), ['fetch origin main', 'merge-base --is-ancestor HEAD origin/main', 'merge --ff-only origin/main']);
  assert.ok(!calls.some(call => /reset|stash|checkout/.test(call)));
});

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'canopy-preview-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const folder of ['tools', 'src', 'assets/environment', 'assets/defenders', 'assets/towers']) {
    await mkdir(path.join(root, folder), { recursive: true });
  }
  await copyFile(path.join(repo, 'tools/serve.mjs'), path.join(root, 'tools/serve.mjs'));
  for (const file of ['index.html', 'styles.css', 'src/app.js', 'assets/defenders/oak-aim-v1.png']) {
    await writeFile(path.join(root, file), `fixture:${file}`);
  }
  return root;
}

async function listen(server) {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return server.address().port;
}

async function unusedPort() {
  const server = http.createServer();
  const port = await listen(server);
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function stopChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const closed = once(child, 'exit');
  child.kill();
  await closed;
}

test('launcher starts the actual asset server and reuses it on the second launch', async t => {
  const root = await fixture(t);
  const port = await unusedPort();
  const opened = [];
  const first = await launchPreview({ root, port, openBrowser: async url => opened.push(url) });
  t.after(() => stopChild(first.server));
  assert.equal(first.reused, false);
  assert.equal(await matchesPreview(root, first.url), true);
  const second = await launchPreview({ root, port, openBrowser: async url => opened.push(url) });
  assert.equal(second.reused, true);
  assert.equal(second.server, null);
  assert.deepEqual(opened, [first.url, first.url]);
});

test('unrelated occupied port is left running and no browser is opened', async t => {
  const root = await fixture(t);
  const other = http.createServer((req, res) => res.end('Other app'));
  const port = await listen(other);
  t.after(() => new Promise(resolve => other.close(resolve)));
  let opened = false;
  await assert.rejects(launchPreview({ root, port, openBrowser: async () => { opened = true; } }), /occupied/);
  assert.equal(opened, false);
  assert.equal(other.listening, true);
});

test('stale art prevents reuse even when the game HTML and source match', async t => {
  const root = await fixture(t);
  const stale = http.createServer(async (req, res) => {
    if (req.url.endsWith('.png')) { res.end('outdated image'); return; }
    try { res.end(await readFile(path.join(root, req.url))); }
    catch { res.writeHead(404); res.end(); }
  });
  const port = await listen(stale);
  t.after(() => new Promise(resolve => stale.close(resolve)));
  await assert.rejects(launchPreview({ root, port, openBrowser: async () => assert.fail('must not open') }), /outdated preview/);
  assert.equal(stale.listening, true);
});

test('browser opener failure leaves a working server available for manual opening', async t => {
  const root = await fixture(t);
  const preview = await launchPreview({ root, port: await unusedPort(), openBrowser: async () => { throw Error('No browser'); } });
  t.after(() => stopChild(preview.server));
  assert.equal(await matchesPreview(root, preview.url), true);
});

test('Windows batch launcher stops safely on an untracked clone without launching', { skip: process.platform !== 'win32' }, async t => {
  const root = await fixture(t);
  await copyFile(path.join(repo, 'Launch-Canopy-Defense.cmd'), path.join(root, 'Launch-Canopy-Defense.cmd'));
  await writeFile(path.join(root, 'tools/preview.mjs'), "throw Error('SHOULD_NOT_LAUNCH');");
  execFileSync('git', ['init', '-b', 'main'], { cwd: root, stdio: 'pipe' });
  execFileSync('git', ['remote', 'add', 'origin', 'https://github.com/TheCryptoArborist/treetowerdefense.git'], { cwd: root });
  let result;
  try {
    execFileSync('cmd.exe', ['/d', '/c', 'Launch-Canopy-Defense.cmd'], {
      cwd: root, encoding: 'utf8', input: '\r\n', timeout: 10000,
    });
    assert.fail('Expected the guarded update to stop');
  } catch (error) { result = error; }
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Local edits or untracked files found/);
  assert.doesNotMatch(result.stderr, /SHOULD_NOT_LAUNCH/);
  assert.equal(await readFile(path.join(root, 'index.html'), 'utf8'), 'fixture:index.html');
});
