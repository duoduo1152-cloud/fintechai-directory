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

const rawGa4Id = (process.env.GA4_MEASUREMENT_ID || 'G-M9W7YHWNBQ').trim().toUpperCase();
const GA4_ID = /^G-[A-Z0-9]+$/.test(rawGa4Id) ? rawGa4Id : 'G-M9W7YHWNBQ';
const CONTACT_EMAIL = 'hello@fintechai.directory';
const mailto = (subject, body = '') => `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

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
const partnersFile = path.join(__dirname, 'data', 'partners.json');
const partners = fs.existsSync(partnersFile) ? JSON.parse(fs.readFileSync(partnersFile, 'utf8')) : {};
const toolBySlug = Object.fromEntries(tools.map(t => [t.slug, t]));

function commercialMeta(tool) {
  const partner = partners[tool.slug] || {};
  return {
    url: partner.destination_url || tool.url,
    type: partner.relationship || 'organic',
    featured: partner.status === 'active' && partner.featured === true,
    label: partner.label || '',
    disclosure: partner.disclosure || '',
    riskNotice: partner.risk_notice || '',
  };
}

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
.nav-commercial{font-weight:700;color:var(--accent)!important}
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
.btn.secondary{background:#fff;color:var(--accent);border:1px solid #bfdbfe}
.eyebrow{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.commercial-hero{padding:52px 0 36px;background:linear-gradient(135deg,#eef4ff,#fff)}
.commercial-hero h1{font-size:34px;line-height:1.15;letter-spacing:-.7px;max-width:720px}
.commercial-hero p{color:var(--text2);max-width:700px;margin:14px 0 22px}
.pricing-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:22px}
.price-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:22px;position:relative}
.price-card.featured{border:2px solid var(--accent)}
.price-card .old-price{font-size:13px;color:var(--text2);text-decoration:line-through;margin-left:6px}
.price{font-size:30px;font-weight:800;margin:8px 0}.price small{font-size:13px;color:var(--text2);font-weight:500}
.feature-list{list-style:none;margin:14px 0 20px}.feature-list li{font-size:13.5px;color:var(--text2);padding:5px 0}.feature-list li:before{content:'✓';color:var(--accent2);font-weight:800;margin-right:8px}
.trust-note{font-size:12.5px;color:var(--text2);background:#f8fafc;border:1px solid var(--border);border-radius:10px;padding:14px;margin-top:18px}
.claim-box{display:flex;align-items:center;justify-content:space-between;gap:16px;background:#f8fafc;border:1px solid var(--border);border-radius:12px;padding:16px;margin-top:24px}
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
  .pricing-grid{grid-template-columns:1fr}
  .commercial-hero h1{font-size:27px}
  .claim-box{display:block}.claim-box .btn{margin-top:12px;width:100%;text-align:center}
}
</style>
</head>
<body>
<header><div class="wrap">
  <a class="logo" href="/">Fintech<span>AI</span>.directory</a>
  <nav><a href="/">Home</a><a href="/#categories">Categories</a><a href="/about/">About</a><a class="nav-commercial" href="/for-vendors/">For vendors</a></nav>
</div></header>
${body}
<div style="background:#0f2a52;color:#fff;padding:40px 20px;text-align:center;">
  <h2 style="font-size:20px;margin-bottom:6px;">Fintech AI Updates</h2>
  <p style="font-size:13.5px;opacity:.85;max-width:480px;margin:0 auto 16px;">Occasional finance AI tool updates and buying guides. Subscribe for new editions when published.</p>
  <form action="https://buttondown.com/api/emails/embed-subscribe/fintechai" method="post" class="bd-form" data-newsletter-placement="footer" style="display:flex;gap:8px;max-width:420px;margin:0 auto;">
    <input type="email" name="email" required placeholder="you@work-email.com" style="flex:1;padding:11px 14px;border-radius:8px;border:none;font-size:14px;">
    <button type="submit" style="background:#10b981;color:#fff;border:none;padding:11px 20px;border-radius:8px;font-weight:600;font-size:14px;cursor:pointer;">Subscribe</button>
  </form>
</div>
<footer><div class="wrap">
  <p>${SITE.name} — ${SITE.tagline}</p>
  <p style="margin-top:6px;"><a href="/submit-tool/">Submit a tool</a> · <a href="/for-vendors/">Advertise</a> · <a href="/disclosure/">Editorial &amp; affiliate disclosure</a></p>
  <p style="margin-top:6px;">© ${new Date().getFullYear()} fintechai.directory · Independently curated.</p>
</div></footer>
<script>
function currentPageType(){
  var p = window.location.pathname;
  if (p.indexOf('/tool/') === 0) return 'tool';
  if (p.indexOf('/best-ai-for/') === 0) return 'guide';
  if (p.indexOf('/reviews/') === 0) return 'review';
  if (p.indexOf('/category/') === 0) return 'category';
  if (p.indexOf('/about/') === 0) return 'about';
  return 'home';
}
function trackEvent(name, params){
  if (typeof window.gtag === 'function') window.gtag('event', name, params || {});
}
document.addEventListener('click', function(e){
  var link = e.target.closest('[data-track="outbound_tool_click"]');
  if (link) {
    trackEvent('outbound_tool_click', {
      tool_name: link.getAttribute('data-tool-name') || '',
      category: link.getAttribute('data-category') || '',
      page_type: currentPageType(),
      placement: link.getAttribute('data-placement') || 'unknown',
      commercial_type: link.getAttribute('data-commercial-type') || 'organic'
    });
  }
  var commercial = e.target.closest('[data-commercial-action]');
  if (commercial) {
    trackEvent('commercial_cta_click', {
      action: commercial.getAttribute('data-commercial-action') || 'unknown',
      offer: commercial.getAttribute('data-offer') || '',
      page_type: currentPageType()
    });
  }
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

const toolCard = t => { const commercial = commercialMeta(t); return `<a class="card" href="/tool/${t.slug}/" style="display:block;color:inherit;text-decoration:none;${commercial.featured ? 'border:2px solid var(--accent);' : ''}">
  <h3>${esc(t.name)}</h3>
  <p>${esc(t.short_description)}</p>
  <span class="badge">${esc(t.category)}</span><span class="badge price">${esc(t.pricing)}</span>${commercial.featured ? '<span class="badge" style="margin-left:6px;">Sponsored</span>' : ''}
</a>`; };

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
    <input type="email" name="email" required placeholder="Get finance AI updates — your email" style="flex:1;padding:11px 14px;border-radius:8px;border:none;font-size:13.5px;">
    <button type="submit" style="background:#10b981;color:#fff;border:none;padding:11px 18px;border-radius:8px;font-weight:600;font-size:13.5px;cursor:pointer;white-space:nowrap;">Subscribe</button>
  </form>
  <p style="font-size:11.5px;opacity:.7;margin-top:8px;">Occasional updates · unsubscribe anytime</p>
</div></div>
<div class="wrap">
  <div class="section" id="categories"><h2>Browse by Category</h2>
    <div class="catlist">${categories.map(c => `<a href="/category/${c.slug}/">${esc(c.name)} (${c.tools.length})</a>`).join('')}</div>
  </div>
  <div class="section"><h2>Buying Guides</h2>
    <p style="margin:12px 0;"><a href="/reviews/trendspider/">TrendSpider review: features, costs and workflow fit →</a></p>
    <p style="margin:12px 0;"><a href="/reviews/keeper/">Keeper Tax review: US freelancer plans and filing limits →</a></p>
    <div class="grid">${guides.map(g => `<a class="card" href="/best-ai-for/${g.slug}/" style="display:block;color:inherit;text-decoration:none;"><h3>${esc(g.title)}</h3><p>${esc(g.intro.slice(0, 120))}…</p><span class="badge">Guide · Updated ${esc(g.updated)}</span></a>`).join('')}</div>
  </div>
  <div class="claim-box">
    <div><p class="eyebrow">For fintech AI companies</p><h2 style="font-size:18px;margin:0 0 4px;">Reach finance teams actively comparing tools</h2><p style="font-size:13.5px;color:var(--text2);">Submit, claim or feature your product with transparent launch pricing.</p></div>
    <a class="btn" href="/for-vendors/" data-commercial-action="view_vendor_offers" data-offer="homepage_vendor_cta">View vendor options</a>
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
${c.tools.some(t => t.slug === 'trendspider') ? '<p style="margin-bottom:20px;"><a href="/reviews/trendspider/">Read our TrendSpider buying review →</a></p>' : ''}
${c.tools.some(t => t.slug === 'keeper') ? '<p style="margin-bottom:20px;"><a href="/reviews/keeper/">Read our Keeper Tax buying review →</a></p>' : ''}
<div class="grid">${c.tools.map(toolCard).join('\n')}</div></div></div>`,
  }));
}

// Tool pages
for (const t of tools) {
  const commercial = commercialMeta(t);
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
    <a class="btn" href="${esc(commercial.url)}" target="_blank" rel="noopener nofollow${commercial.type !== 'organic' ? ' sponsored' : ''}" data-track="outbound_tool_click" data-tool-name="${esc(t.name)}" data-category="${esc(t.category)}" data-placement="tool_header" data-commercial-type="${esc(commercial.type)}">Visit Website →</a>
  </div>
  <table class="meta-table">
    ${t.slug === 'trendspider' ? '<tr><td>Buying review</td><td><a href="/reviews/trendspider/">Features, costs, limits and evaluation checklist</a></td></tr>' : ''}
    ${t.slug === 'keeper' ? '<tr><td>Buying review</td><td><a href="/reviews/keeper/">US freelancer plans, pricing and filing limits</a></td></tr>' : ''}
    <tr><td>Category</td><td><a href="/category/${t.catSlug}/">${esc(t.category)}</a></td></tr>
    <tr><td>Pricing</td><td>${esc(t.pricing)}</td></tr>
    <tr><td>Best for</td><td>${esc(t.target_users)}</td></tr>
    <tr><td>Website</td><td><a href="${esc(commercial.url)}" rel="nofollow${commercial.type !== 'organic' ? ' sponsored' : ''}" data-track="outbound_tool_click" data-tool-name="${esc(t.name)}" data-category="${esc(t.category)}" data-placement="tool_table" data-commercial-type="${esc(commercial.type)}">${esc(t.url)}</a>${commercial.label ? ` <span class="badge">${esc(commercial.label)}</span>` : ''}</td></tr>
  </table>
  ${commercial.disclosure ? `<div class="trust-note"><b>Affiliate disclosure:</b> ${esc(commercial.disclosure)}${commercial.riskNotice ? `<br><b>Risk notice:</b> ${esc(commercial.riskNotice)}` : ''} <a href="/disclosure/">Learn how we handle affiliate links.</a></div>` : ''}
  <div class="claim-box">
    <div><p style="font-weight:700;">Represent ${esc(t.name)}?</p><p style="font-size:13px;color:var(--text2);">Claim this listing to correct product details, add a verified profile or discuss featured placement.</p></div>
    <a class="btn secondary" href="${mailto(`Claim ${t.name} listing`, `Company:\nYour name and role:\nProduct URL:\nRequested changes:\n\nPlease send this from your company email so we can verify ownership.`)}" data-commercial-action="claim_listing" data-offer="claim_${t.slug}">Claim this listing</a>
  </div>
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
  ${g.picks.map(p => { const t = toolBySlug[p.tool]; if (!t) return ''; const commercial = commercialMeta(t); return `
  <div class="card" style="margin:14px 0;">
    <h3 style="font-size:17px;">${esc(t.name)} — <span style="color:var(--accent);font-size:14px;">${esc(p.label)}</span></h3>
    <p style="font-size:13.5px;color:var(--text2);margin:8px 0;">${esc(p.verdict)}</p>
    <p style="font-size:12.5px;color:var(--text2);">Pricing: ${esc(t.pricing)} · Best for: ${esc(t.target_users)}</p>
    <p style="margin-top:10px;"><a class="btn" style="padding:7px 16px;font-size:13px;" href="${esc(commercial.url)}" target="_blank" rel="noopener nofollow${commercial.type !== 'organic' ? ' sponsored' : ''}" data-track="outbound_tool_click" data-tool-name="${esc(t.name)}" data-category="${esc(t.category)}" data-placement="guide_pick" data-commercial-type="${esc(commercial.type)}">Visit ${esc(t.name)} →</a> <a href="/tool/${t.slug}/" style="margin-left:12px;font-size:13px;">Details</a></p>
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

// Source-backed buying review; commercial URL comes from the shared partner record.
const trendspider = toolBySlug.trendspider;
const trendCommercial = commercialMeta(trendspider);
out('reviews/trendspider/index.html', layout({
  title: `TrendSpider Review: Features, Costs & Who It Fits | ${SITE.name}`,
  desc: 'A documentation-based TrendSpider review covering charting, Sidekick AI, backtesting limits, extra costs and a practical evaluation checklist.',
  canonical: `${SITE.domain}/reviews/trendspider/`,
  body: `<div class="wrap"><article class="section" style="max-width:760px;">
    <p class="breadcrumb"><a href="/">Home</a> › <a href="/category/trading-quant/">Trading &amp; Quant</a> › TrendSpider review</p>
    <h1>TrendSpider review: is it a fit for your trading workflow?</h1>
    <p style="color:var(--text2);margin:16px 0;">Sources checked October 22, 2026. This is a documentation-based assessment, not a hands-on performance test. We have not verified strategy returns, execution reliability or time savings.</p>
    <p class="trust-note">Affiliate disclosure: ${esc(trendCommercial.disclosure)} <a href="/disclosure/">Editorial policy</a>.</p>
    <h2 style="margin-top:26px;">Quick assessment</h2>
    <p>Worth shortlisting if you already use rule-based technical analysis and want charting, screening and strategy development in one workspace. Our assessment: occasional investors and readers seeking ready-made investment decisions should first consider whether they need a dedicated trading subscription.</p>
    <h2 style="margin-top:26px;">What does the platform do?</h2>
    <p>TrendSpider combines charting, scanners, backtesting, alerts and trading bots. It supports some broker connections, but assets and order processing remain with your broker. Availability depends on the connection and instruments. Check these against your actual workflow in the <a href="https://trendspider.com/product/" rel="noopener" target="_blank">official product overview</a>.</p>
    <table class="meta-table"><tr><th>Workflow</th><th>Question to resolve before purchase</th></tr><tr><td>Chart analysis</td><td>Can you reproduce your existing setup and inspect the result?</td></tr><tr><td>Backtesting</td><td>Does your plan cover the timeframe and history your rules require?</td></tr><tr><td>Monitoring</td><td>Are alert capacity and duration sufficient for your watchlist?</td></tr><tr><td>Execution</td><td>Is your broker, instrument and intended order workflow supported?</td></tr></table>
    <h2 style="margin-top:26px;">What Sidekick AI adds</h2>
    <p>The official documentation describes an assistant for research and strategy workflows. Customers receive 25 messages per calendar month; additional packages govern higher allowances and access to frontier models. Treat generated explanations and rules as drafts to inspect. See <a href="https://help.trendspider.com/kb/sidekick/trendspider-sidekick" rel="noopener" target="_blank">Sidekick documentation</a>.</p>
    <h2 style="margin-top:26px;">Pricing: compare the whole workflow cost</h2>
    <p>The pricing page lists Standard, Premium, Enhanced and Advanced. Capacity differs across plans. At our check, Standard displayed one-minute charting but two-hour minimum backtesting and scanning intervals: chart resolution does not establish testing resolution. The page also lists paid data and AI upgrades. Promotions and billing cycles affect prices, so check the initial charge, renewal charge and required extras in the <a href="https://trendspider.com/pricing/" rel="noopener" target="_blank">live plan comparison</a> before paying.</p>
    <h2 style="margin-top:26px;">Automation needs a separate evaluation</h2>
    <p>Strategy bots can send notifications and webhooks for execution integrations. A working historical test does not establish safe live operation. Start with alerts and verify signal handling before considering execution. Consult the <a href="https://help.trendspider.com/kb/trading-bots/trading-bots" rel="noopener" target="_blank">bot setup documentation</a> for prerequisites.</p>
    <h2 style="margin-top:26px;">Billing details to check</h2>
    <p>The published policy distinguishes base subscriptions from trial fees, data packages and add-ons. Cancellation alone does not issue a refund; the policy includes time limits and exclusions. Read the <a href="https://help.trendspider.com/kb/account-management/billing-and-refund-policy" rel="noopener" target="_blank">current billing and refund policy</a> before subscribing.</p>
    <h2 style="margin-top:26px;">A practical evaluation checklist</h2>
    <ol style="padding-left:24px;margin:16px 0;"><li>Choose one setup you already understand and one relevant watchlist.</li><li>Write down the required timeframe, history, alerts and data coverage.</li><li>Check that the selected plan supports all four.</li><li>Inspect generated rules, entries and exits rather than only the headline backtest result.</li><li>Record the full renewal cost and cancellation date before purchase.</li></ol>
    <p>Our recommendation is to evaluate workflow fit before paying for additional capacity. This review does not establish profitability. Trading can result in loss of principal.</p>
    <p style="margin:24px 0;"><a class="btn" href="${esc(trendCommercial.url)}" target="_blank" rel="noopener nofollow sponsored" data-track="outbound_tool_click" data-tool-name="TrendSpider" data-category="Trading &amp; Quant" data-placement="review_verdict" data-commercial-type="affiliate">Explore TrendSpider — affiliate link</a></p>
    <p><a href="/tool/trendspider/">TrendSpider directory profile</a> · <a href="/category/trading-quant/">Browse trading tools</a></p>
  </article></div>`,
}));

const keeperCommercial = commercialMeta(toolBySlug.keeper);
out('reviews/keeper/index.html', layout({
  title: `Keeper Tax Review: US Freelancer Plans, Costs & Limits | ${SITE.name}`,
  desc: 'A documentation-based Keeper Tax review for US freelancers: expense tracking versus filing, plan prices, exclusions and questions to ask before subscribing.',
  canonical: `${SITE.domain}/reviews/keeper/`,
  body: `<div class="wrap"><article class="section" style="max-width:760px;">
    <p class="breadcrumb"><a href="/">Home</a> › <a href="/category/tax/">Tax tools</a> › Keeper review</p>
    <h1>Keeper Tax review: expense tracking or filing support?</h1>
    <p style="color:var(--text2);margin:16px 0;">Sources checked October 22, 2026. Documentation-based assessment; we have not connected a bank account or filed a return using Keeper. This page evaluates software fit, not your tax position.</p>
    <p class="trust-note">Affiliate disclosure: ${esc(keeperCommercial.disclosure)} <a href="/disclosure/">Editorial policy</a>.</p>
    <h2 style="margin-top:26px;">Who should consider it?</h2>
    <p>Our assessment: Keeper is worth evaluating for US freelancers and self-employed individuals who want expense records and tax filing in one workflow. Someone who already has an accountant may only need exportable expense records. International or expatriate filers should confirm eligibility directly before purchasing.</p>
    <h2 style="margin-top:26px;">What does it offer?</h2>
    <p>Keeper presents itself as a tax platform combining AI and human accountants, with tools for tracking expenses and preparing returns. Its <a href="https://www.keepertax.com/" target="_blank" rel="noopener">official website</a> describes the current product. Automated suggestions are a starting point for review; this assessment does not verify their accuracy or any advertised savings.</p>
    <h2 style="margin-top:26px;">Compare the plans by the job you need done</h2>
    <p>The <a href="https://help.keepertax.com/hc/en-us/articles/17333793372055-Subscriptions" target="_blank" rel="noopener">official subscription guide</a> lists the following prices. Confirm current checkout terms before paying.</p>
    <table class="meta-table"><tr><th>Plan</th><th>Listed price</th><th>Decision point</th></tr><tr><td>Only deductions</td><td>$20/month</td><td>Expense tracking and exports; filing is excluded.</td></tr><tr><td>Standard</td><td>$199/year</td><td>Tracking plus tax filing.</td></tr><tr><td>Premium</td><td>$399/year</td><td>Additional support such as amendments, prior-year returns and quarterly tax assistance.</td></tr></table>
    <p>Premium does not include S-Corp or partnership filing, expat taxes or additional bookkeeping such as P&amp;L preparation. Those needs require separate scope confirmation. The subscription guide also describes exceptions and add-on fees.</p>
    <h2 style="margin-top:26px;">Filing scope matters more than the headline price</h2>
    <p>The <a href="https://help.keepertax.com/hc/en-us/articles/16758879143959-Filing-with-Keeper" target="_blank" rel="noopener">filing guide</a> describes the $199 annual package as Filing + Deductions and includes the current year's federal return and up to two state returns while subscribed. Business returns use separate services. Ask Keeper to confirm your forms, states and tax year before selecting a plan; the monthly expense plan alone does not provide filing.</p>
    <h2 style="margin-top:26px;">Questions to resolve before subscribing</h2>
    <ol style="padding-left:24px;margin:16px 0;"><li>Do you want records for an existing accountant, or a filing service?</li><li>Are your tax residency, income forms, business structure and states supported?</li><li>Does the quoted price include every return and additional service you need?</li><li>Can you export your records in a usable format?</li><li>What are the renewal, cancellation and trial terms shown at checkout?</li></ol>
    <p>Our recommendation: choose by confirmed filing scope and recordkeeping needs. Do not purchase on an assumed refund or deduction amount. For individual filing decisions, consult a qualified tax professional.</p>
    <p style="margin:24px 0;"><a class="btn" href="${esc(keeperCommercial.url)}" target="_blank" rel="noopener nofollow sponsored" data-track="outbound_tool_click" data-tool-name="Keeper" data-category="Tax" data-placement="review_verdict" data-commercial-type="affiliate">Explore Keeper — affiliate link</a></p>
    <p><a href="/tool/keeper/">Keeper directory profile</a> · <a href="/category/tax/">Browse tax tools</a></p>
  </article></div>`,
}));

// About
out('about/index.html', layout({
  title: `About — ${SITE.name}`,
  desc: 'Why FintechAI.directory exists and how tools are curated.',
  canonical: `${SITE.domain}/about/`,
  body: `<div class="wrap"><div class="section" style="max-width:680px;">
<h2>About FintechAI.directory</h2>
<p style="margin:14px 0;color:var(--text2)">FintechAI.directory is an independently curated directory of AI tools for the finance industry — covering investment research, trading, risk, compliance, wealth management, FP&amp;A and more.</p>
<p style="margin:14px 0;color:var(--text2)">Unlike generic AI directories, every listing here is reviewed through the lens of a finance professional with 10+ years in wealth management and financial data: does the tool solve a real workflow problem, is the pricing sane, and would we actually use it?</p>
<p style="margin:14px 0;color:var(--text2)">Want your tool listed? <a href="/submit-tool/">Submit it for editorial review</a>. Vendors can also <a href="/for-vendors/">view sponsorship options</a>.</p>
</div></div>`,
}));

// Vendor monetization page
out('for-vendors/index.html', layout({
  title: `Reach Finance Buyers — Vendor Partnerships | ${SITE.name}`,
  desc: 'Explore a fixed-scope featured listing for your finance AI product. Email-based coordination, transparent sponsorship and measured outbound clicks.',
  canonical: `${SITE.domain}/for-vendors/`,
  schema: { '@context': 'https://schema.org', '@type': 'Service', name: 'FintechAI Directory vendor partnerships', provider: { '@type': 'Organization', name: SITE.name }, areaServed: 'Worldwide' },
  body: `<div class="commercial-hero"><div class="wrap">
    <p class="eyebrow">Vendor partnerships</p>
    <h1>Reach finance teams while they are comparing AI tools</h1>
    <p>FintechAI Directory helps analysts, advisors, compliance teams and finance leaders shortlist specialist AI products. Put your product in the right category with clear, transparent sponsorship.</p>
    <a class="btn" href="${mailto('FintechAI Directory partnership inquiry', 'Company:\nProduct URL:\nTarget customer:\nOffer of interest:\nLaunch timing:\n')}" data-commercial-action="sponsor_inquiry" data-offer="hero">Start a partnership inquiry</a>
    <p class="trust-note">We do not sell rankings or positive verdicts. Sponsored placements are labeled, and editorial inclusion remains independent.</p>
  </div></div>
  <div class="wrap"><div class="section">
    <h2>A simple featured placement</h2>
    <p style="color:var(--text2);max-width:720px;">An independently operated directory with limited partner availability. Coordination happens by email; no sales call is required. We confirm scope and availability before accepting payment.</p>
    <div class="price-card featured" style="max-width:620px;margin-top:22px;"><p class="eyebrow">Fixed-scope pilot</p><h3>Featured listing</h3><p class="price">$299 <small>/ 90 days</small></p><ul class="feature-list"><li>One labeled sponsored placement in an agreed category</li><li>One factual profile update using your supplied details</li><li>Tracked outbound product link</li><li>One performance summary at the end of the placement</li><li>No automatic renewal</li></ul><a class="btn" href="${mailto('Featured listing inquiry — $299 / 90 days', 'Company:\nProduct URL:\nPreferred category:\nTarget customer:\nPreferred start date:\n')}" data-commercial-action="vendor_offer" data-offer="featured_299_90_days">Check availability by email</a></div>
    <p class="trust-note">The placement URL, start and end dates, and payment instructions are agreed by email. Traffic, clicks, leads and sales are not guaranteed. Basic editorial submissions and factual corrections remain free.</p>
  </div>
  <div class="section" style="max-width:760px;"><h2>How it works</h2>
    <div class="grid"><div class="card"><h3>1. Relevance check</h3><p>We confirm the product fits a finance workflow and choose the right audience and page.</p></div><div class="card"><h3>2. Transparent placement</h3><p>Sponsored elements are labeled. Your team approves factual product details, not our editorial judgment.</p></div><div class="card"><h3>3. Measured response</h3><p>We report tracked clicks and campaign placement. No inflated traffic promises or invented leads.</p></div></div>
    <h2 style="font-size:20px;margin-top:34px;">Commercial FAQ</h2>
    <div class="card"><h3>Can we pay to change your verdict or ranking?</h3><p>No. Paid placements are labeled and do not purchase a positive review, undisclosed ranking or removal of factual criticism.</p></div>
    <div class="card" style="margin-top:12px;"><h3>How do we start?</h3><p>Send your product URL, preferred category and timing from a company email. We review inquiries in batches and confirm availability, deliverables and payment instructions by email.</p></div>
    <div class="card" style="margin-top:12px;"><h3>What reporting is included?</h3><p>Paid campaigns receive the live placement URL and a simple report of measured outbound clicks. We do not promise impressions, leads or conversions.</p></div>
  </div></div>`,
}));

// Free submission funnel
out('submit-tool/index.html', layout({
  title: `Submit or Claim a Fintech AI Tool | ${SITE.name}`,
  desc: 'Submit a fintech AI product for independent editorial review or claim an existing listing.',
  canonical: `${SITE.domain}/submit-tool/`,
  body: `<div class="wrap"><div class="section" style="max-width:760px;">
    <p class="eyebrow">Editorial submission</p><h2 style="font-size:28px;">Submit or claim a fintech AI tool</h2>
    <p style="color:var(--text2);margin:12px 0 22px;">Basic editorial consideration is free. Submitting does not guarantee inclusion or a positive review. For faster commercial visibility, see our <a href="/for-vendors/">vendor partnership options</a>.</p>
    <div class="card"><h3>Send the information we need</h3><ul class="feature-list"><li>Product name and website</li><li>Primary finance use case</li><li>Target customer and pricing model</li><li>Your name, role and company email</li><li>Whether this is a new submission or listing correction</li></ul>
    <a class="btn" href="${mailto('Tool submission / listing claim', 'Submission type: New tool / Claim existing listing\nProduct name:\nProduct URL:\nPrimary finance use case:\nTarget customer:\nPricing model:\nYour name and role:\nCompany email:\nAdditional notes:\n')}" data-commercial-action="tool_submission" data-offer="free_editorial">Open submission email</a></div>
    <p class="trust-note">Use a company email when claiming an existing profile. We may request additional proof of ownership.</p>
  </div></div>`,
}));

// Trust and monetization disclosure
out('disclosure/index.html', layout({
  title: `Editorial & Affiliate Disclosure | ${SITE.name}`,
  desc: 'How FintechAI Directory handles editorial selection, sponsored placements and affiliate links.',
  canonical: `${SITE.domain}/disclosure/`,
  body: `<div class="wrap"><div class="section" style="max-width:760px;">
    <h2>Editorial &amp; affiliate disclosure</h2>
    <p style="margin:14px 0;color:var(--text2);">FintechAI Directory independently selects and describes tools based on relevance to real finance workflows. Vendors may pay for clearly labeled featured placement or sponsorship, but payment does not buy a positive verdict or an undisclosed ranking.</p>
    <p style="margin:14px 0;color:var(--text2);">Some outbound links may become affiliate links. If a visitor signs up or purchases through one of those links, we may earn a commission at no additional cost to the visitor. Affiliate relationships do not change the price shown by the vendor.</p>
    <p style="margin:14px 0;color:var(--text2);">Product capabilities and prices change. Readers should verify current terms with the vendor before purchasing. Vendors can <a href="/submit-tool/">request factual corrections</a>.</p>
    <p style="margin:14px 0;color:var(--text2);"><b>Investment and trading risk:</b> Information on this site is for product discovery and general educational purposes only. It is not investment advice, a recommendation, or a guarantee of performance. Trading and investing involve risk, including possible loss of principal.</p>
    <p style="margin:14px 0;color:var(--text2);">Questions about editorial policy or commercial partnerships: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
  </div></div>`,
}));

// 404
out('404.html', layout({ title: 'Page Not Found', desc: 'Page not found', canonical: SITE.domain, body: `<div class="wrap"><div class="section" style="text-align:center;padding:80px 0;"><h2>404 — Page Not Found</h2><p style="margin-top:10px;"><a href="/">← Back to the directory</a></p></div></div>` }));

// sitemap + robots
const urls = [`${SITE.domain}/`, `${SITE.domain}/about/`, `${SITE.domain}/for-vendors/`, `${SITE.domain}/submit-tool/`, `${SITE.domain}/disclosure/`,
  `${SITE.domain}/reviews/trendspider/`,
  `${SITE.domain}/reviews/keeper/`,
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
