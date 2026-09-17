import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root=resolve(dirname(fileURLToPath(import.meta.url)), '..');
const locales=['ko','ja','en'];
const data={};
for(const locale of locales) data[locale]=JSON.parse(await readFile(resolve(root,`content/${locale}.json`),'utf8'));
const shape=v=>Array.isArray(v)?v.map(shape):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,v])=>[k,shape(v)])):typeof v;
for(const locale of locales){
  assert.deepEqual(shape(data[locale]),shape(data.en),`${locale}: locale schema drift`);
  assert.equal(data[locale].locale,locale);
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
    for(const l of locales) assert.ok(body.includes(`href="/${l}/projects/${projectId}/"`),`${route}: language route not preserved`);
    assert.ok(body.includes(data[locale].work.snapshotNote));
    assert.equal((body.match(/data-lightbox /g)||[]).length,data[locale].projects.find(p=>p.id===projectId).screens.length);
  }
  const schema=body.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
  JSON.parse(schema);
}
assert.equal((await readFile(resolve(root,'CNAME'),'utf8')).trim(),'yisuheon.dev');
console.log(`PASS: 3 locale schemas, ${routes.length} pages, ${links} local references, ${images} image instances, metadata, gallery routes, and CNAME.`);
