// Audit generated internal links and sitemap without requesting analytics-tagged pages.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..', 'dist');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) files.push(full);
  }
}
walk(root);
const failures = [];
let checked = 0;
function exists(url) {
  const pathname = decodeURIComponent(url.split(/[?#]/)[0]);
  const candidate = path.join(root, pathname.replace(/^\//, ''));
  return fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    || fs.existsSync(path.join(candidate, 'index.html'));
}
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  for (const match of html.matchAll(/href="(\/[^"\s]*)"/g)) {
    if (match[1].startsWith('//')) continue;
    checked++;
    if (!exists(match[1])) failures.push(`${path.relative(root, file)} -> ${match[1]}`);
  }
}
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
let sitemapCount = 0;
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  sitemapCount++;
  if (!exists(new URL(match[1]).pathname)) failures.push(`sitemap -> ${match[1]}`);
}
console.log(JSON.stringify({ htmlFiles: files.length, internalLinksChecked: checked, sitemapURLs: sitemapCount, failures }, null, 2));
if (failures.length) process.exitCode = 1;
