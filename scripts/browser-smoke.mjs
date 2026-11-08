import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:4321';
const chromePath = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = await mkdtemp(join(tmpdir(), 'tipsy-goose-chrome-'));
const port = 9333;
const screenshotDir = process.env.SCREENSHOT_DIR;
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let nextId = 1;
const pending = new Map();

async function endpoint() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then(response => response.json());
      if (targets[0]?.webSocketDebuggerUrl) return targets[0].webSocketDebuggerUrl;
    } catch {}
    await pause(100);
  }
  throw new Error('Chrome DevTools endpoint did not become ready.');
}

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.result.value;
}

async function navigate(path) {
  await send('Page.navigate', { url: `${base}${path}` });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await evaluate('document.readyState') === 'complete') return;
    await pause(100);
  }
  throw new Error(`Timed out loading ${path}`);
}

async function screenshot(name) {
  if (!screenshotDir) return;
  await mkdir(screenshotDir, { recursive: true });
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(join(screenshotDir, `${name}.png`), Buffer.from(result.result.data, 'base64'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  socket = new WebSocket(await endpoint());
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    message.error ? item.reject(new Error(message.error.message)) : item.resolve(message);
  };
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate('/recipes/');
  await screenshot('recipes-mobile');
  assert(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Recipe archive overflows at 390px.');
  const overflow = await evaluate(`[...document.querySelectorAll('body *')]
    .filter(element => { const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return style.display !== 'none' && (rect.right > innerWidth + 1 || rect.left < -1); })
    .slice(0, 8).map(element => ({ tag: element.tagName, class: element.className, rect: element.getBoundingClientRect().toJSON() }))`);
  assert(overflow.length === 0, `Elements exceed the 390px viewport: ${JSON.stringify(overflow)}`);
  const filtered = await evaluate(`(() => {
    const input = document.querySelector('#recipe-search');
    input.value = 'spritz'; input.dispatchEvent(new Event('input', { bubbles: true }));
    return [...document.querySelectorAll('[data-recipe-card]')].filter(card => !card.hidden).map(card => card.dataset.title);
  })()`);
  assert(filtered.length === 1 && filtered[0].includes('spritz'), 'Text search did not isolate the cocktail fixture.');
  const food = await evaluate(`(() => {
    const input = document.querySelector('#recipe-search'); input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true }));
    const select = document.querySelector('#kind-filter'); select.value = 'food'; select.dispatchEvent(new Event('change', { bubbles: true }));
    return [...document.querySelectorAll('[data-recipe-card]')].filter(card => !card.hidden).map(card => card.dataset.kind);
  })()`);
  assert(food.length === 1 && food[0] === 'food', 'Food filter did not isolate food recipes.');

  await send('Emulation.setDeviceMetricsOverride', { width: 834, height: 1194, deviceScaleFactor: 1, mobile: true });
  await navigate('/recipes/smoky-citrus-chicken/');
  await screenshot('recipe-tablet');
  assert(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'Recipe page overflows at iPad width.');
  const scaled = await evaluate(`(() => {
    const select = document.querySelector('#serving-adjuster'); select.value = '2'; select.dispatchEvent(new Event('change', { bubbles: true }));
    return document.querySelector('.ingredient-quantity').textContent;
  })()`);
  assert(scaled === '3', `Expected first quantity to scale to 3, received ${scaled}.`);
  const checked = await evaluate(`(() => {
    const box = document.querySelector('.ingredient-check'); box.click();
    return box.checked && getComputedStyle(box.nextElementSibling).textDecorationLine.includes('line-through');
  })()`);
  assert(checked, 'Ingredient checkbox did not apply completed styling.');

  await send('Emulation.setEmulatedMedia', { media: 'print' });
  const print = await evaluate(`(() => ({
    header: getComputedStyle(document.querySelector('body > header')).display,
    intro: getComputedStyle(document.querySelector('.recipe-intro')).display,
    sheet: getComputedStyle(document.querySelector('.recipe-sheet')).display,
    columns: getComputedStyle(document.querySelector('.recipe-columns')).gridTemplateColumns,
  }))()`);
  assert(print.header === 'none' && print.intro === 'none' && print.sheet !== 'none', 'Print view did not hide chrome while retaining the recipe.');
  assert(print.columns.split(' ').length >= 2, 'Print recipe did not retain ingredient/instruction columns.');

  await send('Emulation.setEmulatedMedia', { media: 'screen' });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false });
  await navigate('/');
  await screenshot('home-desktop');
  await send('Emulation.setDeviceMetricsOverride', { width: 834, height: 1194, deviceScaleFactor: 1, mobile: true });
  await navigate('/menus/citrus-supper/');
  await screenshot('menu-tablet');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate('/');
  await screenshot('home-mobile');

  console.log('Browser smoke test passed: mobile overflow, search/type filters, iPad recipe layout, serving adjustment, checkboxes, and print media.');
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => chrome.exitCode === null ? chrome.once('exit', resolve) : resolve()),
    pause(3000),
  ]);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try { await rm(profile, { recursive: true, force: true }); break; }
    catch (error) { if (attempt === 4) throw error; await pause(200); }
  }
}
