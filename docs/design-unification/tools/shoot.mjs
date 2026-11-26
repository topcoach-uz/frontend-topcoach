#!/usr/bin/env node
// Screenshot a URL in headless Chrome with optional media emulation.
//
//   node docs/design-unification/tools/shoot.mjs <url> <out.png> [--w 1440] [--h 900]
//        [--full] [--reduced-motion] [--reduced-transparency] [--focus "<css selector>"]
//        [--click "<css selector>"] [--wait 800]
//
// Uses Chrome's DevTools protocol directly (Node 22 has a global WebSocket),
// so it can emulate prefers-reduced-transparency, which the Browser pane can't.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const argv = process.argv.slice(2);
const [url, out] = argv;
const flag = (k) => argv.includes(`--${k}`);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i < 0 ? d : argv[i + 1]; };
const W = Number(opt('w', 1440)); const H = Number(opt('h', 900)); const wait = Number(opt('wait', 800));
if (!url || !out) { console.error('usage: shoot.mjs <url> <out.png> [options]'); process.exit(2); }

const chromePaths = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium',
].filter(Boolean);
const chrome = chromePaths.find((p) => fs.existsSync(p));
if (!chrome) { console.error('no Chrome/Edge found; set CHROME_PATH'); process.exit(2); }

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-shoot-'));
const port = 9300 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function target() {
  for (let i = 0; i < 50; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); const p = list.find((t) => t.type === 'page'); if (p) return p; } catch {}
    await sleep(200);
  }
  throw new Error('Chrome did not start');
}

let ws; let id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const n = ++id; pending.set(n, { resolve, reject }); ws.send(JSON.stringify({ id: n, method, params }));
});
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.value;

try {
  const t = await target();
  ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.reject(new Error(d.error.message)) : p.resolve(d.result); } };

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 600 });
  const features = [];
  if (flag('reduced-motion')) features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  if (flag('reduced-transparency')) features.push({ name: 'prefers-reduced-transparency', value: 'reduce' });
  if (features.length) await send('Emulation.setEmulatedMedia', { features });

  // --session <file.json>: localStorage entries (e.g. a local test login) set on the
  // page's origin before loading. Local dev hosts only, so a session never reaches
  // another site.
  const sessionFile = opt('session');
  if (sessionFile) {
    const target = new URL(url);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) throw new Error('--session is only allowed for localhost URLs');
    const entries = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    await send('Page.navigate', { url: `${target.origin}/robots.txt` });
    await sleep(500);
    await evaluate(`(() => { const e = ${JSON.stringify(entries)}; for (const [k, v] of Object.entries(e)) localStorage.setItem(k, v); return Object.keys(e).length; })()`);
  }

  await send('Page.navigate', { url });
  for (let i = 0; i < 60; i++) { if ((await evaluate('document.readyState')) === 'complete') break; await sleep(250); }
  await evaluate('document.fonts ? document.fonts.ready.then(() => true) : true');
  await sleep(wait);

  const click = opt('click'); if (click) { await evaluate(`document.querySelector(${JSON.stringify(click)})?.click()`); await sleep(400); }
  const focus = opt('focus');
  if (focus) {
    // Keyboard focus, so :focus-visible applies: focus the element via a Tab-like path.
    await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(focus)}); el?.focus({ focusVisible: true }); return !!el; })()`);
    await sleep(300);
  }
  if (features.length) {
    const check = await evaluate(`[matchMedia('(prefers-reduced-motion: reduce)').matches, matchMedia('(prefers-reduced-transparency: reduce)').matches]`);
    console.log('emulated media (motion, transparency):', JSON.stringify(check));
  }
  let clip;
  if (flag('full')) {
    const h = await evaluate('Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)');
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: Math.min(h, 12000), deviceScaleFactor: 1, mobile: W < 600 });
    await sleep(300);
  }
  const shot = await send('Page.captureScreenshot', { format: 'png', clip });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
  console.log('saved', out);
} catch (e) {
  console.error('shoot failed:', e.message); process.exitCode = 1;
} finally {
  try { ws?.close(); } catch {}
  proc.kill();
  await sleep(300);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
}
