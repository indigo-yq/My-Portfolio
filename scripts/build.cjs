const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const project = JSON.parse(fs.readFileSync(path.join(root, 'data/project.json'), 'utf8'));
const files = [];

// Use the same project and runtime as the editor's standalone website export.
for (const asset of project.assets) {
  const source = asset.seed
    ? path.join(root, asset.url.replace(/^\//, ''))
    : path.join(root, 'data/assets', asset.file);
  const filename = `assets/${asset.id}${path.extname(source)}`;
  if (fs.statSync(source).size > 25 * 1024 * 1024) {
    throw new Error(`Cloudflare Pages assets must be at most 25 MiB: ${source}`);
  }
  files.push([filename, fs.readFileSync(source)]);
  asset.url = filename;
  delete asset.file;
  delete asset.seed;
}
for (const page of project.pages) delete page.revision;
delete project.revision;
delete project.settingsRevision;

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(
  '<script src="runtime/render.js"></script>',
  () => `<script>window.portfolioProject=${JSON.stringify(project).replace(/</g, '\\u003c')};</script><script src="runtime/render.js"></script>`
);
if (!html.includes('window.portfolioProject=')) throw new Error('Project injection failed');
files.push(['index.html', html]);
for (const name of ['site.css', 'render.js', 'cursor-trail.js', 'design-trail.js', 'exhibitions.js', 'site.js']) {
  files.push([`runtime/${name}`, fs.readFileSync(path.join(root, 'runtime', name))]);
}

fs.mkdirSync(output, { recursive: true });
for (const [filename, bytes] of files) {
  const destination = path.join(output, filename);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes);
}
// Remove stale build assets after all inputs have been read successfully.
const expectedAssets = new Set(files.filter(([name]) => name.startsWith('assets/')).map(([name]) => path.basename(name)));
for (const name of fs.readdirSync(path.join(output, 'assets'))) {
  if (!expectedAssets.has(name)) fs.unlinkSync(path.join(output, 'assets', name));
}
console.log(`Built ${project.pages.length} pages and ${project.assets.length} assets into dist/`);
