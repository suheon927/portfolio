import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['ko', 'ja', 'en'];
const origin = 'https://yisuheon.dev';
const gh = 'https://github.com/suheon927';
const sample = gh + '/naerim-recipe-validation';
const ci = sample + '/actions/runs/35164490286';
const provenance = gh + '/suheon927/blob/main/assets/screenshots/README.md';
const dimensions = {
  'updream-growth.png': [1284, 2778], 'updream-bible.png': [1284, 2778],
  'updream-admin-overview.png': [1206, 2622], 'updream-admin-ipad.png': [1668, 2420],
  'naerim-preparation.png': [1206, 2622], 'naerim-brewing.png': [1206, 2622], 'naerim-history.png': [1206, 2622],
};
const e = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const lines = value => e(value).replaceAll('\n', '<br>');
const arrow = '<span aria-hidden="true">↗</span>';
const path = (locale, id) => `/${locale}/${id ? `projects/${id}/` : ''}`;
const img = (file, alt, extra = '') => `<img src="/assets/screenshots/${file}" alt="${e(alt)}" width="${dimensions[file][0]}" height="${dimensions[file][1]}" ${extra}>`;
const external = (href, label, cls = 'text-link') => `<a class="${cls}" href="${e(href)}">${e(label)} ${arrow}</a>`;
const chips = values => `<ul class="chips">${values.map(v => `<li>${e(v)}</li>`).join('')}</ul>`;
const heading = (kicker, title, intro = '', id = '') => `<div class="section-heading"${id ? ` id="${id}"` : ''}><p class="eyebrow">${e(kicker)}</p><h2>${lines(title)}</h2>${intro ? `<p class="section-intro">${e(intro)}</p>` : ''}</div>`;

function header(c, id) {
  const home = path(c.locale);
  return `<a class="skip-link" href="#main">${e(c.nav.skip)}</a>
<header class="site-header"><div class="header-inner">
  <a class="brand" href="${home}" aria-label="${e(c.name)} · ${e(c.nav.home)}"><span class="brand-mark" aria-hidden="true">s.</span><span>${e(c.name)}</span></a>
  <button class="menu-toggle" aria-controls="main-nav" aria-expanded="false" aria-label="${e(c.nav.menu)}" data-open-label="${e(c.nav.menu)}" data-close-label="${e(c.nav.closeMenu)}"><span></span><span></span></button>
  <nav id="main-nav" class="main-nav" aria-label="${e(c.nav.menu)}">${['work','engineering','about','contact'].map(k => `<a href="${home}#${k}">${e(c.nav[k])}</a>`).join('')}</nav>
  <nav class="language-nav" aria-label="${e(c.nav.language)}">${locales.map(l => `<a href="${path(l,id)}" lang="${l}" hreflang="${l}"${l === c.locale ? ' aria-current="page"' : ''}>${{ko:'KO',ja:'JA',en:'EN'}[l]}</a>`).join('')}</nav>
</div></header>`;
}
function footer(c) {
  return `<footer class="site-footer"><div><a class="footer-brand" href="${path(c.locale)}">${e(c.name)}<span aria-hidden="true">.</span></a><p>${e(c.footer.note)}</p></div><div class="footer-links">${external(gh + '/portfolio',c.footer.source)}<a href="#top">${e(c.footer.top)} ↑</a><span>${e(c.footer.updated)}</span></div></footer>`;
}
function card(c,p,i) {
  return `<article class="project-card ${p.id}">
    <a class="project-image" href="${path(c.locale,p.id)}" aria-label="${e(p.name)} · ${e(c.work.open)}"><span class="project-number" aria-hidden="true">0${i+1}</span>${img(p.cover,p.screens.find(s => s.file === p.cover).alt,'loading="lazy" decoding="async"')}<span class="image-link-icon" aria-hidden="true">↗</span></a>
    <div class="project-card-body"><p class="eyebrow">${e(p.eyebrow)}</p><h3><a href="${path(c.locale,p.id)}">${e(p.name)}</a></h3><p class="project-tagline">${e(p.tagline)}</p>${chips(p.stack)}<div class="card-links"><a class="text-link" href="${path(c.locale,p.id)}">${e(c.work.open)} <span aria-hidden="true">→</span></a>${external(p.store,c.work.store)}</div></div>
  </article>`;
}
function home(c) {
  return `<main id="main">
<section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><p class="eyebrow">${e(c.hero.kicker)}</p><h1 id="hero-title">${lines(c.hero.title)}</h1><p class="hero-body">${e(c.hero.body)}</p><div class="button-row"><a class="button button-primary" href="#work">${e(c.hero.primary)} <span aria-hidden="true">↓</span></a>${external(gh,c.hero.secondary,'button button-quiet')}</div></div><div class="hero-visual" aria-hidden="true"><div class="visual-orbit"></div><span class="visual-caption">${e(c.name)} / 2026</span>${img('updream-growth.png','','class="hero-shot shot-a" fetchpriority="high"')}${img('updream-admin-overview.png','','class="hero-shot shot-b" fetchpriority="high"')}${img('naerim-brewing.png','','class="hero-shot shot-c" fetchpriority="high"')}<span class="visual-end">iOS · SwiftUI · React Native</span></div></section>
<div class="facts-strip">${c.hero.facts.map(f => `<div><strong>${e(f.value)}</strong><span>${e(f.label)}</span></div>`).join('')}</div>
<section class="section work-section" id="work">${heading(c.work.kicker,c.work.title,c.work.intro)}<div class="projects-grid">${c.projects.map((p,i) => card(c,p,i)).join('')}</div><p class="small-note">${e(c.work.homeScreenNote)}</p></section>
<section class="section engineering-section" id="engineering">${heading(c.engineering.kicker,c.engineering.title,c.engineering.intro)}<div class="engineering-grid">${c.engineering.groups.map((g,i) => `<article><span class="item-number">0${i+1}</span><h3>${e(g.title)}</h3><p class="tech-line">${e(g.tech)}</p><p>${e(g.body)}</p></article>`).join('')}</div>
<div class="code-feature"><div><p class="eyebrow">${e(c.engineering.codeLabel)}</p><h3>${e(c.engineering.codeTitle)}</h3><p>${e(c.engineering.codeBody)}</p><div class="code-links">${external(sample,c.engineering.codeLink)}${external(ci,c.engineering.testLink)}</div></div><div class="code-visual" aria-hidden="true"><span class="code-file">RecipeDraft.swift · totalDuration</span><pre><span class="code-keyword">let</span> addition = total.addingReportingOverflow(
    step.durationSeconds
)
<span class="code-keyword">guard</span> !addition.overflow <span class="code-keyword">else</span> {
    <span class="code-keyword">return nil</span>
}
total = addition.partialValue</pre><span class="code-footnote">Swift · XCTest · GitHub Actions</span></div></div></section>
<section class="section teams-section">${heading(c.teams.kicker,c.teams.title)}<div class="teams-grid">${c.teams.items.map((t,i) => `<article class="team-card"><span class="item-number">0${i+1}</span><h3>${e(t.name)}</h3><p class="team-role">${e(t.role)}</p><p>${e(t.body)}</p>${external(t.link,t.label)}</article>`).join('')}</div></section>
<section class="section about-section" id="about"><div>${heading(c.about.kicker,c.about.title)}<p class="about-body">${e(c.about.body)}</p></div><div class="about-details"><dl class="timeline">${c.about.timeline.map(t => `<div><dt>${e(t.label)}</dt><dd>${e(t.body)}</dd></div>`).join('')}</dl><div class="learning"><h3>${e(c.about.learning)}</h3><ul>${c.about.learningLinks.map(l => `<li>${external(l.url,l.label)}</li>`).join('')}</ul>${external('https://suheon927.notion.site/11573099573e8045bec2c186c84ba43d?pvs=4',c.about.archive)}</div></div></section>
<section class="contact-section" id="contact"><p class="eyebrow">${e(c.contact.kicker)}</p><div class="contact-grid"><h2>${lines(c.contact.title)}</h2><div><p>${e(c.contact.body)}</p><a class="contact-email" href="mailto:suheon777@icloud.com" aria-label="${e(c.contact.emailLabel)}: suheon777@icloud.com">suheon777@icloud.com ${arrow}</a>${external(gh,c.contact.githubLabel)}</div></div></section>
</main>`;
}
function gallery(c,p) {
  return `<section class="section gallery-section" id="screens"><h2>${e(c.work.screens)}</h2><p class="section-intro">${e(c.work.screenNote)}</p><div class="screenshot-grid count-${p.screens.length}">${p.screens.map((s,i) => `<figure><a class="screenshot-stage ${s.file.includes('ipad') ? 'tablet' : ''}" href="/assets/screenshots/${s.file}" data-lightbox data-caption="${e(s.title)}" aria-label="${e(c.work.fullImage)}: ${e(s.title)}">${img(s.file,s.alt,'loading="lazy" decoding="async"')}<span class="zoom-icon" aria-hidden="true">↗</span></a><figcaption><span class="item-number">0${i+1}</span><h3>${e(s.title)}</h3><p>${e(s.body)}</p><small>${e(c.work.capture)} <time datetime="${s.date}">${new Intl.DateTimeFormat({ko:'ko-KR',ja:'ja-JP',en:'en-US'}[c.locale],{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(s.date))}</time></small></figcaption></figure>`).join('')}</div>${external(provenance,c.notices.captureSource,'text-link provenance')}</section>`;
}
function project(c,p) {
  return `<main id="main" class="case-study ${p.id}">
<section class="case-hero"><a class="back-link" href="${path(c.locale)}#work">← ${e(c.work.back)}</a><p class="eyebrow">${e(p.eyebrow)}</p><h1>${e(p.name)}</h1><p class="case-tagline">${e(p.tagline)}</p><p class="case-description">${e(p.description)}</p><div class="button-row">${external(p.store,c.work.store,'button button-primary')}${external(p.technical,c.work.technical,'button button-outline')}</div><dl class="project-meta"><div><dt>${e(c.work.roleLabel)}</dt><dd>${e(c.work.role)}</dd></div><div><dt>${e(c.work.stackLabel)}</dt><dd>${chips(p.stack)}</dd></div></dl></section>
${gallery(c,p)}
<section class="section architecture-section"><h2>${e(c.work.architecture)}</h2><p class="small-note">${e(c.work.snapshotNote)}</p><ol class="architecture-flow">${p.flow.map((f,i) => `<li><span class="item-number">0${i+1}</span><strong>${e(f)}</strong></li>`).join('')}</ol><p class="section-intro">${e(p.flowNote)}</p></section>
<section class="section decisions-section"><h2>${e(c.work.decisions)}</h2><div class="decisions-grid">${p.decisions.map((d,i) => `<article><span class="item-number">0${i+1}</span><h3>${e(d.title)}</h3><p>${e(d.body)}</p></article>`).join('')}</div></section>
<section class="section process-section"><div class="process-heading"><p class="eyebrow">${e(p.name)}</p><h2>${e(c.work.ai)}</h2></div><div class="prose">${p.ai.map(t => `<p>${e(t)}</p>`).join('')}</div></section>
${p.rights.length ? `<section class="section rights-section"><div><span class="rights-number" aria-hidden="true">66</span><h2>${e(c.work.rights)}</h2></div><div class="prose">${p.rights.map(t => `<p>${e(t)}</p>`).join('')}${external('https://github.com/suheon927/suheon927/blob/main/docs/updream.md#bible-text-permissions-and-66-book-delivery',c.work.technical)}</div></section>` : ''}
<section class="section evidence-section"><div><h2>${e(c.work.evidence)}</h2><p>${e(p.evidence)}</p></div><div class="evidence-links">${external(p.technical,c.work.technical,'button button-outline')}${p.id==='naerim' ? external(sample,c.work.sourceCode,'button button-outline')+external(ci,c.work.tests,'button button-outline') : ''}</div></section>
<section class="section next-section"><h2>${e(c.work.next)}</h2><div class="next-grid">${c.projects.filter(o=>o.id!==p.id).map(o=>`<a href="${path(c.locale,o.id)}"><span>${e(o.eyebrow)}</span><strong>${e(o.name)} <span aria-hidden="true">↗</span></strong></a>`).join('')}</div></section>
</main><dialog class="lightbox" aria-label="${e(c.work.fullImage)}"><button class="lightbox-close" aria-label="${e(c.work.closeImage)}">×</button><img alt=""><p></p></dialog>`;
}
function layout(c,p=null) {
  const url=origin+path(c.locale,p?.id);
  const title=p ? `${p.name} — ${c.name}` : c.meta.title;
  const description=p?.description || c.meta.description;
  const preview=p?.cover || 'naerim-brewing.png';
  const schema={ '@context':'https://schema.org','@type':p?'CreativeWork':'ProfilePage',name:title,url,description,inLanguage:c.locale,...(p ? {author:{'@type':'Person',name:c.name,url:origin+path(c.locale)}} : {mainEntity:{'@type':'Person',name:c.name,url:origin,sameAs:[gh,'https://apps.apple.com/us/developer/suheon-yi/id6797694037']}})};
  return `<!doctype html>
<html lang="${c.locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f4efe6"><title>${e(title)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${url}">
${locales.map(l=>`<link rel="alternate" hreflang="${l}" href="${origin+path(l,p?.id)}">`).join('\n')}<link rel="alternate" hreflang="x-default" href="${origin+path('ko',p?.id)}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Yi Suheon"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="${{ko:'ko_KR',ja:'ja_JP',en:'en_US'}[c.locale]}"><meta property="og:image" content="${origin}/assets/screenshots/${preview}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+JP:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/styles.css?v=20260917"><script defer src="/assets/site.js?v=20260917"></script><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script></head>
<body id="top">${header(c,p?.id)}${p?project(c,p):home(c)}${footer(c)}</body></html>\n`;
}
const pages=[];
for(const locale of locales){
  const c=JSON.parse(await readFile(resolve(root,`content/${locale}.json`),'utf8'));
  for(const p of [null,...c.projects]){
    const route=path(locale,p?.id);
    const target=resolve(root,'.'+route,'index.html');
    await mkdir(dirname(target),{recursive:true}); await writeFile(target,layout(c,p)); pages.push(origin+route);
  }
  if(locale==='ko') await writeFile(resolve(root,'index.html'),layout(c));
}
await writeFile(resolve(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(url=>`<url><loc>${url}</loc></url>`).join('')}</urlset>\n`);
await writeFile(resolve(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: https://yisuheon.dev/sitemap.xml\n');
await writeFile(resolve(root,'.nojekyll'),'');
console.log(`Built ${pages.length+1} localized pages.`);
