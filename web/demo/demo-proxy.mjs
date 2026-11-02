#!/usr/bin/env node
// Demo presenter proxy: sits in front of any web app, switches identity per role, injects the presenter panel
// and stores the session notes. Local demos only.
// Usage: node demo-proxy.mjs path/to/demo.config.json [--format demo|fgd]  (--format overrides the config's format)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

if(process.env.NODE_ENV==='production')throw Error('demo-proxy is for local demos only.');
const configPath=path.resolve(process.argv[2]||'demo.config.json'),base=path.dirname(configPath);
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
const steps=JSON.parse(fs.readFileSync(path.resolve(base,config.steps||'steps.json'),'utf8'));
const questions=typeof config.questions==='string'?JSON.parse(fs.readFileSync(path.resolve(base,config.questions),'utf8')):config.questions||{};
const upstream=new URL(config.upstream),port=Number(process.env.PORT||config.port||4000),home=config.home||'/';
const roles=config.roles||[];if(!roles.length)throw Error('Config needs at least one role.');
// "demo": minimal panel (steps, prev/next, one note list per step); "fgd": FIF layout with guide, questions and two note columns.
const flag=process.argv.indexOf('--format'),format=flag>0?process.argv[flag+1]:config.format;
if(!['demo','fgd'].includes(format))throw Error('Set "format" in the config (or pass --format) to "demo" or "fgd".');
const fgd=format==='fgd',GUIDE=fgd?'Panduan FGD':'Panduan Demo',KINDS=fgd?['ubah','berubah']:['catatan'];
for(const [i,s] of steps.entries()){
 if(!roles.some(r=>r.key===s.as))throw Error(`Step ${i} uses unknown role "${s.as}".`);
 if(fgd)for(const c of s.q||[])if(/^[A-Z]{1,3}\d|^P\d/.test(c)&&!questions[c])console.warn(`Step ${i}: question code "${c}" is not in questions; it will be shown as plain text.`);
}
const panelJS=fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)),'presenter-panel.js'));

// Session notes live next to the config, one file per format, so they survive reloads, role switches and proxy restarts.
const notesPath=path.resolve(base,config.notesFile||`catatan-${format}.json`);
let notes=[];try{notes=JSON.parse(fs.readFileSync(notesPath,'utf8'))}catch{}
const saveNotes=()=>fs.writeFileSync(notesPath,JSON.stringify(notes,null,1));
const kindLabel=k=>({ubah:'Perlu diubah',berubah:'Sudah diubah / disepakati',catatan:'Catatan'})[k]||k;
function notesMarkdown(){
 const stamp=new Date().toISOString().slice(0,10);
 const heads={ubah:`Perlu diubah (masukan ${config.client||'klien'})`,berubah:'Sudah diubah / disepakati'};
 return `# Catatan ${fgd?'FGD':'Demo'} ${config.title||''} (${stamp})\n\n`+steps.map((s,i)=>{
  const parts=KINDS.map(k=>[k,notes.filter(n=>n.step===i&&n.kind===k)]).filter(([,l])=>l.length);if(!parts.length)return '';
  return `## ${i}. ${s.title}\n\n`+parts.map(([k,l])=>(fgd?`**${heads[k]}**\n`:'')+l.map(n=>'- '+n.text).join('\n')+'\n\n').join('');
 }).join('')||'Belum ada catatan.\n';
}
function notesCSV(){
 const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 return 'Langkah,Judul,Jenis,Catatan,Waktu\n'+notes.map(n=>[n.step,cell(steps[n.step]?.title),cell(kindLabel(n.kind)),cell(n.text),cell(n.at)].join(',')).join('\n');
}

if(config.seed){const seed=(await import(pathToFileURL(path.resolve(base,config.seed)).href)).default;const summary=await seed({upstream:upstream.href,roles,config});console.log('Demo seeded:',summary??'ok')}

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const parseCookies=h=>Object.fromEntries((h||'').split(/;\s*/).filter(Boolean).map(p=>{const i=p.indexOf('=');return [p.slice(0,i),p.slice(i+1)]}));
const roleOf=key=>roles.find(r=>r.key===decodeURIComponent(key||''))||roles[0];
const state=req=>{const c=parseCookies(req.headers.cookie),i=c.demo_step===undefined||c.demo_step===''?-1:Number(c.demo_step);return {user:roleOf(c.demo_role),index:steps[i]?i:-1}};
// Picker colours: config.theme, else the colours the panel detected inside the app (demo_theme cookie).
const parseColor=c=>{c=decodeURIComponent(c||'').trim();let m=c.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(m){const h=m[1].length===3?[...m[1]].map(x=>x+x).join(''):m[1];return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16))}m=c.match(/^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/i);return m?m.slice(1,4).map(Number):null};
const textOn=([r,g,b])=>{const l=[r,g,b].map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});const y=.2126*l[0]+.7152*l[1]+.0722*l[2];const white=1.05/(y+.05);return white>=4.5||white>=(y+.05)/.05?'#fff':'#000'};
const accentOf=req=>parseColor(config.theme?.primary)||parseColor(parseCookies(req.headers.cookie).demo_theme);
const redirect=(res,location,cookies)=>{res.writeHead(302,{location,'set-cookie':cookies,'cache-control':'no-store'});res.end()};
const setCookie=(name,value)=>value===null?`${name}=; Path=/; Max-Age=0`:`${name}=${value}; Path=/; SameSite=Lax`;
const send=(res,status,type,body,extra={})=>{res.writeHead(status,{'content-type':type,'cache-control':'no-store',...extra});res.end(body)};

function picker(current,accent){
 const brand=accent?`:root{--accent:rgb(${accent.join(',')});--on-accent:${textOn(accent)}}`:'';
 let act='';const list=steps.map((s,i)=>(s.act&&s.act!==act?`<div class="act">${esc(act=s.act)}</div>`:'')+`<a class="row" href="/demo?step=${i}"><b>${i}</b><span>${esc(s.title)}${s.min?` <small class="min">menit ${esc(s.min)}</small>`:''}</span><small>${esc(roleOf(s.as).name)}</small></a>`).join('');
 const groups=[...new Set(roles.map(r=>r.group||''))];
 const people=groups.map(g=>(g?`<div class="act">${esc(g)}</div>`:'')+roles.filter(r=>(r.group||'')===g).map(r=>`<a class="row${r.key===current.key?' on':''}" href="/demo?as=${encodeURIComponent(r.key)}"><b>${esc(r.role||'')}</b><span>${esc(r.name)}</span></a>`).join('')).join('');
 const minutes=config.durationMinutes?` Perkiraan ${config.durationMinutes} menit.`:'';
 return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(config.title||'Demo')}</title><style>
:root{--bg:#f6f5f3;--card:#fff;--ink:#23211f;--muted:#66615c;--line:#e2ded8;--accent:#0e3f70;--on-accent:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#1a1918;--card:#252321;--ink:#f0eeeb;--muted:#aaa49e;--line:#393633;--accent:#8fb3e0;--on-accent:#000}}${brand}
body{margin:0;font:16px system-ui,sans-serif;background:var(--bg);color:var(--ink)}main{max-width:640px;margin:0 auto;padding:24px 16px}h1{margin:0 0 6px}h2{margin:32px 0 4px;font-size:18px}p{color:var(--muted)}
.start{display:block;text-align:center;padding:14px;margin:18px 0;background:var(--accent);color:var(--on-accent);border-radius:10px;text-decoration:none;font-weight:600}
.row{display:flex;gap:12px;align-items:center;padding:10px 14px;margin:6px 0;background:var(--card);border:1px solid var(--line);border-radius:10px;color:inherit;text-decoration:none}
.row b{min-width:34px;font-family:ui-monospace,monospace}.row small{margin-left:auto;color:var(--muted);text-align:right}.row small.min{margin-left:6px}.on{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 25%,transparent)}
.act{margin:18px 0 4px;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}.row b,.act{color:color-mix(in srgb,var(--accent) 80%,var(--ink))}
.tools{display:flex;gap:8px;flex-wrap:wrap}.tools a{color:inherit}</style></head>
<body><main><h1>${esc(config.title||'Demo')}</h1><p>${GUIDE} memandu ${steps.length} langkah (0–${steps.length-1}). Setiap langkah otomatis berganti peran dan membuka layar yang dibahas${fgd?', serta menyediakan kolom catatan peserta':'; tombol Catatan untuk mencatat masukan per langkah'}.${minutes}</p>
<a class="start" href="/demo?step=0">Mulai ${GUIDE} ▶</a>${list}
<h2>Catatan sesi</h2><p>${notes.length} catatan tersimpan. <span class="tools"><a href="/__demo/notes.md" download>Unduh .md</a> · <a href="/__demo/notes.csv" download>Unduh .csv</a></span></p>
<h2>Masuk bebas sebagai peran</h2><p>Untuk tanya jawab atau peserta yang mencoba sendiri dari perangkatnya.</p>${people}</main></body></html>`;
}

function upstreamHeaders(req,user){
 const headers={...req.headers};delete headers.host;delete headers['accept-encoding'];headers.host=upstream.host;
 if(headers.origin)headers.origin=upstream.origin;if(headers.referer)headers.referer=headers.referer.replace(/^https?:\/\/[^/]+/,upstream.origin);
 for(const [k,v] of Object.entries(user.headers||{}))headers[k.toLowerCase()]=v;
 const cookies=Object.fromEntries(Object.entries(parseCookies(req.headers.cookie)).filter(([k])=>!/^demo_(role|step|theme)$/.test(k)));
 Object.assign(cookies,user.cookies||{});const cookie=Object.entries(cookies).map(([k,v])=>k+'='+v).join('; ');
 if(cookie)headers.cookie=cookie;else delete headers.cookie;return headers;
}

async function readJSON(req){const chunks=[];for await(const c of req)chunks.push(c);try{return JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}')}catch{return {}}}

http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://'+(req.headers.host||'localhost')),{user,index}=state(req);
 if(url.pathname==='/demo'){
  const i=url.searchParams.get('step'),as=url.searchParams.get('as');
  if(i!==null&&steps[i])return redirect(res,steps[i].url||home,[setCookie('demo_role',encodeURIComponent(steps[i].as)),setCookie('demo_step',Number(i))]);
  if(as)return redirect(res,home,[setCookie('demo_role',encodeURIComponent(roleOf(as).key)),setCookie('demo_step',null)]);
  return send(res,200,'text/html; charset=utf-8',picker(user,accentOf(req)));
 }
 if(url.pathname==='/__demo/panel.js')return send(res,200,'text/javascript; charset=utf-8',panelJS);
 if(url.pathname==='/__demo/state')return send(res,200,'application/json; charset=utf-8',JSON.stringify({
  title:config.title||'Demo',format,client:config.client||'klien',theme:config.theme||null,questions,steps,index,
  user:{key:user.key,name:user.name,role:user.role,group:user.group||''}}));
 if(url.pathname==='/__demo/notes'){
  if(req.method==='POST'){const b=await readJSON(req),text=String(b.text||'').trim().slice(0,1000);
   if(text&&steps[b.step]&&KINDS.includes(b.kind)){notes.push({id:'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),step:b.step,kind:b.kind,text,role:user.key,at:new Date().toLocaleString('id-ID')});saveNotes()}}
  else if(req.method==='DELETE'){if(url.searchParams.get('all')==='1')notes=[];else notes=notes.filter(n=>n.id!==url.searchParams.get('id'));saveNotes()}
  return send(res,200,'application/json; charset=utf-8',JSON.stringify(notes));
 }
 const stamp=new Date().toISOString().slice(0,10);
 if(url.pathname==='/__demo/notes.md')return send(res,200,'text/markdown; charset=utf-8','﻿'+notesMarkdown(),{'content-disposition':`attachment; filename="catatan-${format}-${stamp}.md"`});
 if(url.pathname==='/__demo/notes.csv')return send(res,200,'text/csv; charset=utf-8','﻿'+notesCSV(),{'content-disposition':`attachment; filename="catatan-${format}-${stamp}.csv"`});

 const proxied=http.request({protocol:upstream.protocol,hostname:upstream.hostname,port:upstream.port,method:req.method,path:req.url,headers:upstreamHeaders(req,user)},up=>{
  const headers={...up.headers};
  if(headers.location?.startsWith(upstream.origin))headers.location=headers.location.slice(upstream.origin.length)||'/';
  const html=req.method==='GET'&&(headers['content-type']||'').includes('text/html')&&!headers['content-encoding'];
  if(!html){res.writeHead(up.statusCode,headers);return up.pipe(res)}
  const chunks=[];up.on('data',c=>chunks.push(c));up.on('end',()=>{
   const tag='<script src="/__demo/panel.js" defer></script>',text=Buffer.concat(chunks).toString('utf8');
   const body=Buffer.from(text.includes('</body>')?text.replace(/<\/body>(?![\s\S]*<\/body>)/,tag+'</body>'):text+tag);
   delete headers['content-length'];delete headers['content-security-policy'];headers['cache-control']='no-store';
   res.writeHead(up.statusCode,headers);res.end(body);
  });
 });
 proxied.on('error',e=>send(res,502,'text/plain; charset=utf-8','Aplikasi di '+upstream.href+' tidak dapat dihubungi: '+e.message));
 req.pipe(proxied);
}).listen(port,'0.0.0.0',()=>console.log(`${GUIDE}: http://localhost:${port}/demo  (meneruskan ke ${upstream.href}; catatan: ${notesPath})`));
