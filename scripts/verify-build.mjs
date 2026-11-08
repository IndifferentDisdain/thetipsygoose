import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../dist/', import.meta.url);
const rootPath = fileURLToPath(root);
const required = ['index.html', 'about/index.html', 'recipes/index.html', 'menus/index.html', 'notes/index.html', '404.html', 'robots.txt', 'sitemap-index.xml'];

for (const file of required) await access(new URL(file, root));

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    files.push(...(entry.isDirectory() ? await collect(path) : [path]));
  }
  return files;
}

const files = await collect(rootPath);
const textFiles = files.filter(file => /\.(html|xml|js|json|txt|css)$/.test(file));
const output = (await Promise.all(textFiles.map(file => readFile(file, 'utf8')))).join('\n');
const forbidden = ['Smoky Citrus Chicken', 'Brass Neck Spritz', 'development fixture · excluded from production'];

for (const phrase of forbidden) {
  if (output.toLowerCase().includes(phrase.toLowerCase())) throw new Error(`Production output contains fixture marker: ${phrase}`);
}

for (const route of ['smoky-citrus-chicken', 'brass-neck-spritz', 'citrus-supper', 'salt-acid-and-the-second-draft']) {
  if (output.includes(route)) throw new Error(`Production output references fixture route: ${route}`);
}

console.log(`Verified ${required.length} required outputs and fixture-free production content across ${textFiles.length} text assets.`);
