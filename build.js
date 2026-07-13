// FintechAI.directory — zero-dependency static site generator
// Usage: node build.js  → outputs ./dist
const fs = require('fs');
const path = require('path');

const SITE = {
  domain: 'https://fintechai.directory',
  name: 'FintechAI Directory',
  tagline: 'AI Tools for Finance, Curated by Finance Professionals',
  description: 'The professional directory of AI tools for finance — research, trading, risk, compliance, wealth management and more. Curated and reviewed by finance industry insiders.',
};

const rawGa4Id = (process.env.GA4_MEASUREMENT_ID || '').trim().toUpperCase();
const GA4_ID = /^G-[A-Z0-9]+$/.test(rawGa4Id) ? rawGa4Id : '';

// ---------- CSV parsing (handles quoted fields) ----------
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const headers = rows[0];
  return rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}

const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- Load data ----------
const tools = parseCSV(fs.readFileSync(path.join(__dirname, 'data', 'tools.csv'), 'utf8'))
  .filter(t => t.name)
  .map(t => ({ ...t, slug: slugify(t.name), catSlug: slugify(t.category) }));

const guides = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'guides.json'), 'utf8'));
const toolBySlug = Object.fromEntries(tools.map(t => [t.slug, t]));

const categories = [...new Set(tools.map(t => t.category))].map(c => ({
  name: c, slug: slugify(c),
  tools: tools.filter(t => t.category === c),
}));

// ---------- Layout ----------
function layout({ title, desc, canonical, body, schema }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canonical}">
${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
${GA4_ID ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_ID}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA4_ID}', { anonymize_ip: true });
</script>` : ''}
<script defer src="/_vercel/insights/script.js"></script>
<style>
:root{--bg:#fafbfc;--card:#fff;--text:#16182d;--text2:#5a5f73;--border:#e6e8ee;--accent:#1d4ed8;--accent2:#047857;}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:var(--bg);color:var(--text);line-height:1.65}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
header{background:#fff;border-bottom:1px solid var(--border);padding:14px 0}
header .wrap{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
.logo{font-weight:800;font-size:18px;color:var(--text)}
.logo span{color:var(--accent)}
nav a{margin-left:18px;font-size:14px;color:var(--text2)}
.hero{text-align:center;padding:56px 20px 44px;background:linear-gradient(135deg,#0f2a52,#1d4ed8);color:#fff}
.hero h1{font-size:32px;margin-bottom:10px;letter-spacing:-.5px}
.hero p{font-size:16px;opacity:.88;max-width:640px;margin:0 auto}
.search{max-width:560px;margin:24px auto 0}
.search input{width:100%;padding:13px 18px;border-radius:10px;border:none;font-size:15px}
.section{padding:36px 0}
h2{font-size:22px;margin-bottom:18px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.card{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:18px;transition:box-shadow .15s}
.card:hover{box-shadow:0 4px 18px rgba(0,0,0,.07)}
.card h3{font-size:16px;margin-bottom:6px}
.card p{font-size:13.5px;color:var(--text2)}
.badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11.5px;font-weight:600;background:#eff6ff;color:var(--accent);margin-top:10px}
.badge.price{background:#ecfdf5;color:var(--accent2);margin-left:6px}
.catlist{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:8px}
.catlist a{background:#fff;border:1px solid var(--border);border-radius:20px;padding:7px 16px;font-size:13.5px;color:var(--text)}
.catlist a:hover{border-color:var(--accent);color:var(--accent);text-decoration:none}
.breadcrumb{font-size:13px;color:var(--text2);padding:18px 0 0}
.tool-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
.btn{display:inline-block;background:var(--accent);color:#fff;padding:10px 22px;border-radius:9px;font-weight:600;font-size:14px}
.btn:hover{text-decoration:none;opacity:.92}
.meta-table{width:100%;border-collapse:collapse;font-size:14px;margin:18px 0}
.meta-table td{padding:9px 12px;border-bottom:1px solid var(--border)}
.meta-table td:first-child{color:var(--text2);width:160px}
footer{border-top:1px solid var(--border);padding:28px 0;margin-top:40px;font-size:13px;color:var(--text2);text-align:center}
.bd-form{width:100%}
.bd-form input{min-width:0}
@media(max-width:640px){
  .wrap{padding:0 16px}
  header .wrap{justify-content:center}
  nav{width:100%;display:flex;justify-content:center;gap:16px}
  nav a{margin-left:0}
  .hero{padding:40px 16px 34px}
  .hero h1{font-size:24px}
  .grid{grid-template-columns:minmax(0,1fr)}
  .bd-form{flex-direction:column}
  .bd-form input,.bd-form button{width:100%!important;min-width:0}
  .tool-head .btn{width:100%;text-align:center}
  .meta-table{display:block;overflow-x:auto}
}
</style>
</head>
<body>
<header><div class="wrap">
  <a class="logo" href="/">Fintech<span>AI</span>.directory</a>
  <nav><a href="/">Home</a><a href="/#categories">Categories</a><a href="/about/">About</a></nav>
</div></header>
${body}
<div style="background:#0f2a52;color:#fff;padding:40px 20px;text-align:center;">
  <h2 style="font-size:20px;margin-bottom:6px;">Fintech AI Weekly</h2>
  <p style="font-size:13.5px;opacity:.85;max-width:480px;margin:0 auto 16px;">New AI tools for finance, reviewed by a wealth-management insider. One email a week, no spam.</p>
  <form action="https://buttondown.com/api/emails/embed-subscribe/fintechai" method="post" class="bd-form" data-newsletter-placement="footer" style="display:flex;gap:8px;max-width:420px;margin:0 auto;">
    <input type="email" name="email" required placeholder="you@work-email.com" style="flex:1;padding:11px 14px;border-radius:8px;border:none;font-size:14px;">
    <button type="submit" style="background:#10b981;color:#fff;border:none;padding:11px 20px;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;">Subscribe</button>
  </form>
</div>
<footer><div class="wrap">
  <p>${SITE.name} — ${SITE.tagline}</p>
  <p style="margin-top:6px;">© ${new Date().getFullYear()} fintechai.directory · Independently curated. Some links may be affiliate links.</p>
</div></footer>
<script>
function currentPageType(){
  var p = window.location.pathname;
  if (p.indexOf('/tool/') === 0) return 'tool';
  if (p.indexOf('/best-ai-for/') === 0) return 'guide';
  if (p.indexOf('/category/') === 0) return 'category';
  if (p.indexOf('/about/') === 0) return 'about';
  return 'home';
}
function trackEvent(name, params){
  if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
}
document.addEventListener('click', function(e){
  var link = e.target.closest('[data-track="outbound_tool_click"]');
  if (!link) return;
  trackEvent('outbound_tool_click', {
    tool_name: link.getAttribute('data-tool-name') || '',
    category: link.getAttribute('data-category') || '',
    page_type: currentPageType(),
    placement: link.getAttribute('data-placement') || 'unknown'
  });
});
document.querySelectorAll('form.bd-form').forEach(function(form){
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var btn = form.querySelector('button[type=submit]');
    var data = new FormData(form);
    var placement = form.getAttribute('data-newsletter-placement') || 'unknown';
    trackEvent('newsletter_submit', { page_type: currentPageType(), placement: placement });
    btn && (btn.disabled = true, btn.textContent = '...');
    fetch(form.action, { method:'POST', body:data, mode:'no-cors' })
      .then(function(){
        trackEvent('newsletter_success', { page_type: currentPageType(), placement: placement });
        var msg = document.createElement('p');
        msg.textContent = '\u2713 Thanks! Check your inbox to confirm your subscription.';
        msg.style.cssText = 'color:#10b981;font-weight:600;font-size:14px;margin:6px 0 0;';
        form.replaceWith(msg);
      })
      .catch(function(){
        btn && (btn.disabled = false, btn.textContent = 'Subscribe');
        alert('Something went wrong. Please try again.');
      });
  });
});
</script>
</body>
</html>`;
}

const toolCard = t => `<a class="card" href="/tool/${t.slug}/" style="display:block;color:inherit;text-decoration:none;">
  <h3>${esc(t.name)}</h3>
  <p>${esc(t.short_description)}</p>
  <span class="badge">${esc(t.category)}</span><span class="badge price">${esc(t.pricing)}</span>
</a>`;

// ---------- Output ----------
const dist = path.join(__dirname, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
const out = (p, html) => {
  const f = path.join(dist, p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html);
};

// Homepage
out('index.html', layout({
  title: `${SITE.name} — ${SITE.tagline}`,
  desc: SITE.description,
  canonical: SITE.domain + '/',
  schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.name, url: SITE.domain, description: SITE.description },
  body: `
<div class="hero"><div class="wrap">
  <h1>Find the Right AI Tool for Finance</h1>
  <p>${tools.length}+ AI tools for research, trading, risk, compliance and wealth management — curated and reviewed by finance professionals, not bots.</p>
  <div class="search"><input id="q" type="search" placeholder="Search ${tools.length} tools… (e.g. 'earnings analysis', 'fraud detection')"></div>
  <form action="https://buttondown.com/api/emails/embed-subscribe/fintechai" method="post" class="bd-form" data-newsletter-placement="home_hero" style="display:flex;gap:8px;max-width:480px;margin:18px auto 0;">
    <input type="email" name="email" required placeholder="Get new fintech AI tools weekly — your email" style="flex:1;padding:11px 14px;border-radius:8px;border:none;font-size:13.5px;">
    <button type="submit" style="background:#10b981;color:#fff;border:none;padding:11px 18px;border-radius:8px;font-weight:600;font-size:13.5px;cursor:pointer;white-space:nowrap;">Subscribe</button>
  </form>
  <p style="font-size:11.5px;opacity:.7;margin-top:8px;">Join Fintech AI Weekly · one email per week · unsubscribe anytime</p>
</div></div>
<div class="wrap">
  <div class="section" id="categories"><h2>Browse by Category</h2>
    <div class="catlist">${categories.map(c => `<a href="/category/${c.slug}/">${esc(c.name)} (${c.tools.length})</a>`).join('')}</div>
  </div>
  <div class="section"><h2>Buying Guides</h2>
    <div class="grid">${guides.map(g => `<a class="card" href="/best-ai-for/${g.slug}/" style="display:block;color:inherit;text-decoration:none;"><h3>${esc(g.title)}</h3><p>${esc(g.intro.slice(0, 120))}…</p><span class="badge">Guide · Updated ${esc(g.updated)}</span></a>`).join('')}</div>
  </div>
  <div class="section"><h2>All Tools</h2><div class="grid" id="grid">${tools.map(toolCard).join('\n')}</div></div>
</div>
<script>
var searchTimer;
document.getElementById('q').addEventListener('input',function(){
  var q=this.value.toLowerCase();
  var matches=0;
  document.querySelectorAll('#grid .card').forEach(function(c){
    var visible=c.textContent.toLowerCase().includes(q);
    c.style.display=visible?'':'none';
    if(visible) matches++;
  });
  clearTimeout(searchTimer);
  if(q.length>=2){
    searchTimer=setTimeout(function(){
      trackEvent('site_search',{page_type:'home',query_length:q.length,results_count:matches});
    },600);
  }
});
</script>`,
}));

// Category pages
for (const c of categories) {
  out(`category/${c.slug}/index.html`, layout({
    title: `Best AI Tools for ${c.name} (${new Date().getFullYear()}) — ${SITE.name}`,
    desc: `Compare ${c.tools.length} AI tools for ${c.name.toLowerCase()} in finance. Pricing, target users and use cases — curated by finance professionals.`,
    canonical: `${SITE.domain}/category/${c.slug}/`,
    schema: { '@context': 'https://schema.org', '@type': 'ItemList', name: `AI Tools for ${c.name}`, itemListElement: c.tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, url: `${SITE.domain}/tool/${t.slug}/` })) },
    body: `<div class="wrap">
<p class="breadcrumb"><a href="/">Home</a> › ${esc(c.name)}</p>
<div class="section"><h2>AI Tools for ${esc(c.name)}</h2>
<p style="color:var(--text2);font-size:14.5px;margin-bottom:20px;">${c.tools.length} tools in this category, curated for finance professionals.</p>
<div class="grid">${c.tools.map(toolCard).join('\n')}</div></div></div>`,
  }));
}

// Tool pages
for (const t of tools) {
  const related = tools.filter(x => x.category === t.category && x.slug !== t.slug).slice(0, 3);
  out(`tool/${t.slug}/index.html`, layout({
    title: `${t.name} — AI for ${t.category} | ${SITE.name}`,
    desc: t.short_description,
    canonical: `${SITE.domain}/tool/${t.slug}/`,
    schema: { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: t.name, url: t.url, applicationCategory: 'FinanceApplication', description: t.short_description, offers: { '@type': 'Offer', category: t.pricing } },
    body: `<div class="wrap">
<p class="breadcrumb"><a href="/">Home</a> › <a href="/category/${t.catSlug}/">${esc(t.category)}</a> › ${esc(t.name)}</p>
<div class="section">
  <div class="tool-head">
    <div><h2 style="font-size:26px;">${esc(t.name)}</h2>
    <p style="color:var(--text2);max-width:640px;margin-top:6px;">${esc(t.short_description)}</p></div>
    <a class="btn" href="${esc(t.url)}" target="_blank" rel="noopener nofollow" data-track="outbound_tool_click" data-tool-name="${esc(t.name)}" data-category="${esc(t.category)}" data-placement="tool_header">Visit Website →</a>
  </div>
  <table class="meta-table">
    <tr><td>Category</td><td><a href="/category/${t.catSlug}/">${esc(t.category)}</a></td></tr>
    <tr><td>Pricing</td><td>${esc(t.pricing)}</td></tr>
    <tr><td>Best for</td><td>${esc(t.target_users)}</td></tr>
    <tr><td>Website</td><td><a href="${esc(t.url)}" rel="nofollow">${esc(t.url)}</a></td></tr>
  </table>
  ${related.length ? `<h2 style="font-size:18px;margin-top:28px;">Alternatives in ${esc(t.category)}</h2><div class="grid" style="margin-top:14px;">${related.map(toolCard).join('')}</div>` : ''}
</div></div>`,
  }));
}

// Guide pages (/best-ai-for/<slug>/)
for (const g of guides) {
  const year = new Date().getFullYear();
  out(`best-ai-for/${g.slug}/index.html`, layout({
    title: `${g.title} (${year}) — ${SITE.name}`,
    desc: g.intro.slice(0, 155),
    canonical: `${SITE.domain}/best-ai-for/${g.slug}/`,
    schema: { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: g.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
    body: `<div class="wrap">
<p class="breadcrumb"><a href="/">Home</a> › Guides › ${esc(g.title)}</p>
<div class="section" style="max-width:760px;">
  <h2 style="font-size:26px;">${esc(g.title)} <span style="font-size:14px;color:var(--text2);font-weight:400;">(Updated ${esc(g.updated)})</span></h2>
  <p style="color:var(--text2);margin:14px 0 24px;">${esc(g.intro)}</p>
  <table class="meta-table"><tr><td style="width:auto"><b>Our picks at a glance</b></td><td></td></tr>
  ${g.picks.map(p => { const t = toolBySlug[p.tool]; return t ? `<tr><td>${esc(p.label)}</td><td><a href="/tool/${t.slug}/"><b>${esc(t.name)}</b></a></td></tr>` : ''; }).join('')}
  </table>
  ${g.picks.map(p => { const t = toolBySlug[p.tool]; if (!t) return ''; return `
  <div class="card" style="margin:14px 0;">
    <h3 style="font-size:17px;">${esc(t.name)} — <span style="color:var(--accent);font-size:14px;">${esc(p.label)}</span></h3>
    <p style="font-size:13.5px;color:var(--text2);margin:8px 0;">${esc(p.verdict)}</p>
    <p style="font-size:12.5px;color:var(--text2);">Pricing: ${esc(t.pricing)} · Best for: ${esc(t.target_users)}</p>
    <p style="margin-top:10px;"><a class="btn" style="padding:7px 16px;font-size:13px;" href="${esc(t.url)}" target="_blank" rel="noopener nofollow" data-track="outbound_tool_click" data-tool-name="${esc(t.name)}" data-category="${esc(t.category)}" data-placement="guide_pick">Visit ${esc(t.name)} →</a> <a href="/tool/${t.slug}/" style="margin-left:12px;font-size:13px;">Details</a></p>
  </div>`; }).join('')}
  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px;margin:24px 0;">
    <p style="font-weight:600;font-size:14.5px;">📬 Get guides like this in your inbox</p>
    <form action="https://buttondown.com/api/emails/embed-subscribe/fintechai" method="post" class="bd-form" data-newsletter-placement="guide_inline" style="display:flex;gap:8px;margin-top:10px;">
      <input type="email" name="email" required placeholder="you@work-email.com" style="flex:1;padding:10px 13px;border-radius:8px;border:1px solid #cbd5e1;font-size:13.5px;">
      <button type="submit" style="background:var(--accent);color:#fff;border:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:13.5px;cursor:pointer;">Subscribe</button>
    </form>
  </div>
  <h2 style="font-size:20px;margin-top:30px;">FAQ</h2>
  ${g.faq.map(f => `<div style="margin:14px 0;"><p style="font-weight:600;font-size:14.5px;">${esc(f.q)}</p><p style="font-size:13.5px;color:var(--text2);margin-top:4px;">${esc(f.a)}</p></div>`).join('')}
</div></div>`,
  }));
}

// About
out('about/index.html', layout({
  title: `About — ${SITE.name}`,
  desc: 'Why FintechAI.directory exists and how tools are curated.',
  canonical: `${SITE.domain}/about/`,
  body: `<div class="wrap"><div class="section" style="max-width:680px;">
<h2>About FintechAI.directory</h2>
<p style="margin:14px 0;color:var(--text2)">FintechAI.directory is an independently curated directory of AI tools for the finance industry — covering investment research, trading, risk, compliance, wealth management, FP&amp;A and more.</p>
<p style="margin:14px 0;color:var(--text2)">Unlike generic AI directories, every listing here is reviewed through the lens of a finance professional with 10+ years in wealth management and financial data: does the tool solve a real workflow problem, is the pricing sane, and would we actually use it?</p>
<p style="margin:14px 0;color:var(--text2)">Want your tool listed? Contact us at hello@fintechai.directory.</p>
</div></div>`,
}));

// 404
out('404.html', layout({ title: 'Page Not Found', desc: 'Page not found', canonical: SITE.domain, body: `<div class="wrap"><div class="section" style="text-align:center;padding:80px 0;"><h2>404 — Page Not Found</h2><p style="margin-top:10px;"><a href="/">← Back to the directory</a></p></div></div>` }));

// sitemap + robots
const urls = [`${SITE.domain}/`, `${SITE.domain}/about/`,
  ...guides.map(g => `${SITE.domain}/best-ai-for/${g.slug}/`),
  ...categories.map(c => `${SITE.domain}/category/${c.slug}/`),
  ...tools.map(t => `${SITE.domain}/tool/${t.slug}/`)];
out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `<url><loc>${u}</loc></url>`).join('\n')}
</urlset>`);
out('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${SITE.domain}/sitemap.xml\n`);

// copy static files (e.g. search engine verification)
const staticDir = path.join(__dirname, 'static');
if (fs.existsSync(staticDir)) {
  for (const f of fs.readdirSync(staticDir)) {
    fs.copyFileSync(path.join(staticDir, f), path.join(dist, f));
  }
}

console.log(`Built ${urls.length} pages → dist/ (${tools.length} tools, ${categories.length} categories)`);
