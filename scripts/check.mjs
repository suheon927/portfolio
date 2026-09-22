import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { validatePublicDemos, publicDemoFor } from './public-demos.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const locales=['ko','ja','en'];
const data={};
const demos=validatePublicDemos(JSON.parse(await readFile(resolve(root,'content/public-demos.json'),'utf8')));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nonemptyStrings=(value,label)=>{
  if(typeof value==='string') assert.ok(value.trim(),`${label}: missing translation`);
  else for(const [key,item] of Object.entries(value)) nonemptyStrings(item,`${label}.${key}`);
};
for(const locale of locales) data[locale]=JSON.parse(await readFile(resolve(root,`content/${locale}.json`),'utf8'));
const shape=v=>Array.isArray(v)?v.map(shape):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,v])=>[k,shape(v)])):typeof v;
for(const locale of locales){
  assert.deepEqual(shape(data[locale]),shape(data.en),`${locale}: locale schema drift`);
  assert.equal(data[locale].locale,locale);
  nonemptyStrings(data[locale].demo,`${locale}.demo`);
  assert.equal(data[locale].demo.steps.length,3,`${locale}: expected three demo login steps`);
  assert.deepEqual(Object.keys(data[locale].demo.features).sort(),['updream','updream-admin']);
  data[locale].projects.forEach((p,i)=>{
    const ref=data.en.projects[i];
    for(const field of ['id','store','technical','cover','stack']) assert.deepEqual(p[field],ref[field],`${locale}: ${p.id}.${field}`);
    p.screens.forEach((s,j)=>{assert.equal(s.file,ref.screens[j].file);assert.equal(s.date,ref.screens[j].date);assert.ok(s.alt.trim());});
  });
}
const routes=['/',...locales.flatMap(l=>[`/${l}/`,...data[l].projects.map(p=>`/${l}/projects/${p.id}/`)])];
const html=new Map();
for(const route of routes) html.set(route,await readFile(resolve(root,'.'+route,'index.html'),'utf8'));
let links=0,images=0;
for(const [route,body] of html){
  const locale=route==='/'?'ko':route.split('/')[1];
  assert.ok(body.includes(`<html lang="${locale}">`),`${route}: incorrect lang`);
  assert.equal((body.match(/<h1\b/g)||[]).length,1,`${route}: expected one h1`);
  assert.ok(body.includes('rel="canonical"'));
  for(const l of locales) assert.ok(body.includes(`hreflang="${l}"`));
  assert.ok(!/undefined|\[object Object\]|Your Name/.test(body),`${route}: placeholder leak`);
  for(const match of body.matchAll(/(?:href|src)="([^"]+)"/g)){
    const value=match[1].replaceAll('&amp;','&');
    if(/^(https?:|mailto:)/.test(value)) continue;
    const url=new URL(value,'https://yisuheon.dev'+route);
    let destination=resolve(root,'.'+url.pathname);
    const info=await stat(destination).catch(()=>null);
    assert.ok(info,`${route}: missing ${value}`);
    if(info.isDirectory()) destination=resolve(destination,'index.html');
    if(url.hash){
      const target=await readFile(destination,'utf8');
      assert.ok(target.includes(`id="${url.hash.slice(1)}"`),`${route}: broken fragment ${value}`);
    }
    links++;
  }
  for(const tag of body.matchAll(/<img\b[^>]*>/g)){
    assert.ok(tag[0].includes('alt='),`${route}: missing image alt`);
    if(tag[0].includes('src=')){assert.ok(tag[0].includes('width='));assert.ok(tag[0].includes('height='));images++;}
  }
  if(route.includes('/projects/')){
    const projectId=route.split('/')[3];
    const demo=publicDemoFor(demos,projectId);
    assert.equal(body.includes('id="demo"'),Boolean(demo),`${route}: demo visibility does not match configuration`);
    assert.equal((body.match(/data-copy-credential=/g)||[]).length,demo?2:0,`${route}: expected two copy buttons only for an enabled demo`);
    if(demo){
      for(const field of ['username','password']) assert.ok(body.includes(`id="demo-${field}" type="text" value="${escape(demo[field])}" readonly`),`${route}: incorrect ${field} field`);
      assert.ok(body.includes('id="demo-copy-status" role="status" aria-live="polite" aria-atomic="true"'));
      assert.ok(body.includes(escape(data[locale].demo.notice)),`${route}: missing demo notice`);
      assert.ok(body.includes(escape(data[locale].demo.copyFallback)),`${route}: missing localized copy fallback`);
    }
    for(const l of locales) assert.ok(body.includes(`href="/${l}/projects/${projectId}/"`),`${route}: language route not preserved`);
    assert.ok(body.includes(data[locale].work.snapshotNote));
    assert.equal((body.match(/data-lightbox /g)||[]).length,data[locale].projects.find(p=>p.id===projectId).screens.length);
  }else{
    for(const project of data[locale].projects) assert.equal(body.includes(`href="/${locale}/projects/${project.id}/#demo"`),Boolean(publicDemoFor(demos,project.id)),`${route}: incorrect ${project.id} demo link`);
  }
  const schema=body.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
  JSON.parse(schema);
}
assert.equal((await readFile(resolve(root,'CNAME'),'utf8')).trim(),'yisuheon.dev');
console.log(`PASS: 3 locale schemas, ${routes.length} pages, ${links} local references, ${images} image instances, metadata, gallery routes, public demo visibility, and CNAME.`);
