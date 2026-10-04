import { spawn } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = fileURLToPath(new URL('../', import.meta.url));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Compare live bytes, including art, so an unrelated service or outdated asset
// allowlist cannot be mistaken for this clone. Old serve.mjs needs no health API.
export async function publicFiles(root) {
  const files = ['index.html', 'styles.css'];
  for (const folder of ['src', 'assets/environment', 'assets/defenders', 'assets/towers']) {
    for (const entry of await readdir(path.join(root, folder), { withFileTypes: true })) {
      if (entry.isFile() && (folder === 'src' ? entry.name.endsWith('.js') : entry.name.endsWith('.png'))) {
        files.push(`${folder}/${entry.name}`);
      }
    }
  }
  return files;
}

function portOccupied(port) {
  return new Promise((resolve, reject) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.setTimeout(1500);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); reject(new Error('Local preview port did not respond.')); });
    socket.once('error', error => {
      if (error.code === 'ECONNREFUSED') resolve(false);
      else reject(error);
    });
  });
}

function getAsset(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, response => {
      if (response.statusCode !== 200) {
        response.resume(); reject(new Error('Preview asset is unavailable.')); return;
      }
      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > 24 * 1024 * 1024) request.destroy(new Error('Preview asset is too large.'));
        else chunks.push(chunk);
      });
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
    request.setTimeout(2000, () => request.destroy(new Error('Preview request timed out.')));
    request.on('error', reject);
  });
}

export async function matchesPreview(root, url) {
  const files = await publicFiles(root);
  // Bounded concurrency keeps large atlases from overwhelming the local server.
  for (let i = 0; i < files.length; i += 4) {
    const results = await Promise.all(files.slice(i, i + 4).map(async file => {
      try {
        const [local, remote] = await Promise.all([readFile(path.join(root, file)), getAsset(`${url}/${file}`)]);
        return local.equals(remote);
      } catch { return false; }
    }));
    if (results.some(result => !result)) return false;
  }
  return true;
}

export function openSystemBrowser(url) {
  let command, args;
  if (process.platform === 'win32') {
    command = 'rundll32.exe'; args = ['url.dll,FileProtocolHandler', url];
  } else if (process.platform === 'darwin') {
    command = 'open'; args = [url];
  } else {
    command = 'xdg-open'; args = [url];
  }
  return new Promise((resolve, reject) => {
    const opener = spawn(command, args, { stdio: 'ignore' });
    opener.once('error', reject);
    opener.once('exit', code => code === 0 ? resolve() : reject(new Error('Browser opener did not complete.')));
  });
}

export async function launchPreview({ root = repository, port = 5173, openBrowser = openSystemBrowser } = {}) {
  const url = `http://127.0.0.1:${port}`;
  let server = null;
  if (await portOccupied(port)) {
    if (!await matchesPreview(root, url)) {
      throw new Error(`Port ${port} is occupied by another app or an outdated preview. Stop that server yourself, then retry. No process was stopped.`);
    }
  } else {
    server = spawn(process.execPath, [path.join(root, 'tools/serve.mjs')], {
      cwd: root, stdio: ['ignore', 'inherit', 'inherit'],
      env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
    });
    let failure;
    server.once('error', error => { failure = error; });
    try {
      let ready = false;
      for (let attempt = 0; attempt < 40; attempt++) {
        if (failure || server.exitCode !== null || server.signalCode !== null) {
          throw new Error('The preview server could not start.');
        }
        if (await portOccupied(port) && await matchesPreview(root, url)) { ready = true; break; }
        await delay(100);
      }
      if (!ready) throw new Error('The preview server did not become ready.');
    } catch (error) { server.kill(); throw error; }
  }
  try { await openBrowser(url); }
  catch { console.log(`Open ${url} in your browser to play.`); }
  return { server, reused: !server, url };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const preview = await launchPreview();
    console.log(`${preview.reused ? 'Using your running preview' : 'Preview ready'}: ${preview.url}`);
    if (preview.server) {
      console.log('Keep this window open while playing. Press Ctrl+C to stop the preview.');
      const stop = () => preview.server.kill();
      process.once('SIGINT', stop);
      process.once('SIGTERM', stop);
      preview.server.once('exit', code => { process.exitCode = code || 0; });
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
