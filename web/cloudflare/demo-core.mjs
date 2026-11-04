// Panduan Demo on Cloudflare: the Worker counterpart of demo/demo-proxy.mjs, format "demo" only.
// /demo switches role without a login, so this must never share a Worker or database with the real app: it stays behind
// Cloudflare Access and refuses to run on a database that scripts/demo-cf-reset.mjs did not prepare.
import {requireAccess} from './access-gate.mjs';

const GUIDE='Panduan Demo',KIND='catatan',IDENTITY=['oai-authenticated-user-id','oai-authenticated-user-email'];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const parseCookies=h=>Object.fromEntries((h||'').split(/;\s*/).filter(Boolean).map(p=>{const i=p.indexOf('=');return [p.slice(0,i),p.slice(i+1)]}));
const send=(status,type,body,extra={})=>new Response(body,{status,headers:{'content-type':type,'cache-control':'no-store',...extra}});
const json=body=>send(200,'application/json; charset=utf-8',JSON.stringify(body));
const message=(status,title,text)=>send(status,'text/html; charset=utf-8',`<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><body style="font:16px system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 16px"><h1>${esc(title)}</h1><p>${esc(text)}</p></body></html>`);
const textOn=hex=>{const m=/^#([0-9a-f]{6})$/i.exec(hex||'');if(!m)return '#fff';const [r,g,b]=[0,2,4].map(i=>parseInt(m[1].slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:((v+.055)/1.055)**2.4);const y=.2126*r+.7152*g+.0722*b,white=1.05/(y+.05);return white>=4.5||white>=(y+.05)/.05?'#fff':'#000'};

export function createDemoWorker(app,{config,steps,panelJS,identityOf,fetchKeys=fetch}){
 const roles=config.roles,home=config.home||'/',roleOf=key=>{let k=key;try{k=decodeURIComponent(key||'')}catch{}return roles.find(r=>r.key===k)||roles[0]};
 // The panel only needs navigation data; presenter notes (say, do, who, ...) stay in the printed rundown.
 const panelSteps=steps.map(({title,as,url,nav,spot,placeholder})=>({title,as,url,nav,spot,placeholder}));
 let prepared=false;
 const isPrepared=async env=>{if(prepared)return true;try{prepared=!!await env.DB.prepare("SELECT value FROM demo_meta WHERE key='seeded_at'").first()}catch{prepared=false}return prepared};
 const stateOf=request=>{const c=parseCookies(request.headers.get('cookie')),i=c.demo_step===undefined||c.demo_step===''?-1:Number(c.demo_step);return {user:roleOf(c.demo_role),index:steps[i]?i:-1}};
 const notesOf=async env=>(await env.DB.prepare('SELECT id,step,kind,text,role,at FROM demo_notes ORDER BY rowid').all()).results;
 const redirect=(request,location,cookies=[])=>{const secure=new URL(request.url).protocol==='https:'?'; Secure':'',headers=new Headers({location,'cache-control':'no-store'});for(const [name,value] of cookies)headers.append('set-cookie',value===null?`${name}=; Path=/; Max-Age=0${secure}`:`${name}=${value}; Path=/; SameSite=Lax${secure}`);return new Response(null,{status:302,headers})};

 function picker(current,noteCount){
  const accent=config.theme?.primary,brand=accent?`:root{--accent:${esc(accent)};--on-accent:${textOn(accent)}}`:'';
  const list=steps.map((s,i)=>`<a class="row" href="/demo?step=${i}"><b>${i}</b><span>${esc(s.title)}</span><small>${esc(roleOf(s.as).name)}</small></a>`).join('');
  const people=[...new Set(roles.map(r=>r.group||''))].map(g=>(g?`<div class="act">${esc(g)}</div>`:'')+roles.filter(r=>(r.group||'')===g).map(r=>`<a class="row${r.key===current.key?' on':''}" href="/demo?as=${encodeURIComponent(r.key)}"><b>${esc(r.role||'')}</b><span>${esc(r.name)}</span></a>`).join('')).join('');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(config.title||'Demo')}</title><style>
:root{--bg:#f6f5f3;--card:#fff;--ink:#23211f;--muted:#66615c;--line:#e2ded8;--accent:#0e3f70;--on-accent:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#1a1918;--card:#252321;--ink:#f0eeeb;--muted:#aaa49e;--line:#393633}}${brand}
body{margin:0;font:16px system-ui,sans-serif;background:var(--bg);color:var(--ink)}main{max-width:640px;margin:0 auto;padding:24px 16px}h1{margin:0 0 6px}h2{margin:32px 0 4px;font-size:18px}p{color:var(--muted)}
.start{display:block;text-align:center;padding:14px;margin:18px 0;background:var(--accent);color:var(--on-accent);border-radius:10px;text-decoration:none;font-weight:600}
.row{display:flex;gap:12px;align-items:center;padding:10px 14px;margin:6px 0;background:var(--card);border:1px solid var(--line);border-radius:10px;color:inherit;text-decoration:none}
.row b{min-width:34px;font-family:ui-monospace,monospace}.row small{margin-left:auto;color:var(--muted);text-align:right}.on{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 25%,transparent)}
.act{margin:18px 0 4px;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}.tools a{color:inherit}</style></head>
<body><main><h1>${esc(config.title||'Demo')}</h1><p>${GUIDE} memandu ${steps.length} langkah (0–${steps.length-1}). Setiap langkah otomatis berganti peran dan membuka layar yang dibahas; tombol Catatan untuk mencatat masukan per langkah. Data di sini contoh dan dipakai bersama semua peserta.</p>
<a class="start" href="/demo?step=0">Mulai ${GUIDE} ▶</a>${list}
<h2>Catatan sesi</h2><p>${noteCount} catatan tersimpan. <span class="tools"><a href="/__demo/notes.md" download>Unduh .md</a> · <a href="/__demo/notes.csv" download>Unduh .csv</a></span></p>
<h2>Masuk bebas sebagai peran</h2><p>Untuk tanya jawab atau peserta yang mencoba sendiri.</p>${people}</main></body></html>`;
 }

 function notesMarkdown(notes){
  const stamp=new Date().toISOString().slice(0,10);
  return `# Catatan Demo ${config.title||''} (${stamp})\n\n`+(steps.map((s,i)=>{const l=notes.filter(n=>n.step===i);return l.length?`## ${i}. ${s.title}\n\n${l.map(n=>'- '+n.text).join('\n')}\n\n`:''}).join('')||'Belum ada catatan.\n');
 }
 function notesCSV(notes){
  const cell=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
  return 'Langkah,Judul,Jenis,Catatan,Waktu\n'+notes.map(n=>[n.step,cell(steps[n.step]?.title),cell('Catatan'),cell(n.text),cell(n.at)].join(',')).join('\n');
 }

 async function notesAPI(request,url,env,user){
  if(request.method==='POST'){
   let b={};try{b=await request.json()}catch{}
   const text=String(b.text||'').trim().slice(0,1000);
   if(text&&steps[b.step]&&b.kind===KIND)await env.DB.prepare('INSERT INTO demo_notes (id,step,kind,text,role,at) VALUES (?,?,?,?,?,?)').bind('n'+crypto.randomUUID(),b.step,KIND,text,user.key,new Date().toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})).run();
  }else if(request.method==='DELETE'){
   if(url.searchParams.get('all')==='1')await env.DB.prepare('DELETE FROM demo_notes').run();
   else await env.DB.prepare('DELETE FROM demo_notes WHERE id=?').bind(url.searchParams.get('id')||'').run();
  }
  return json(await notesOf(env));
 }

 async function toApp(request,env,ctx,user){
  const headers=new Headers(request.headers),identity=identityOf(user.key);
  for(const h of IDENTITY)headers.delete(h);
  headers.set('oai-authenticated-user-id',identity.id);headers.set('oai-authenticated-user-email',identity.email);
  const cookies=Object.entries(parseCookies(headers.get('cookie'))).filter(([k])=>!/^demo_(role|step|theme)$/.test(k)).map(([k,v])=>k+'='+v).join('; ');
  if(cookies)headers.set('cookie',cookies);else headers.delete('cookie');
  const response=await app.fetch(new Request(request,{headers}),env,ctx);
  if(request.method!=='GET'||!(response.headers.get('content-type')||'').includes('text/html'))return response;
  const out=new Headers(response.headers);out.delete('content-length');out.delete('content-security-policy');out.set('cache-control','no-store');
  const tag='<script src="/__demo/panel.js" defer></script>',text=await response.text();
  return new Response(text.includes('</body>')?text.replace(/<\/body>(?![\s\S]*<\/body>)/,tag+'</body>'):text+tag,{status:response.status,headers:out});
 }

 return {async fetch(request,env,ctx){
  const access=await requireAccess(request,env,fetchKeys);
  if(access.response)return access.response;
  if(!await isPrepared(env))return message(503,'Database demo belum disiapkan','Jalankan npm run cf:demo:reset. Worker demo hanya berjalan pada database yang disiapkan khusus untuk demo, bukan database asli.');
  const url=new URL(request.url),{user,index}=stateOf(request);
  if(url.pathname==='/demo'){
   const i=url.searchParams.get('step'),as=url.searchParams.get('as');
   if(i!==null&&steps[i])return redirect(request,steps[i].url||home,[['demo_role',encodeURIComponent(steps[i].as)],['demo_step',Number(i)]]);
   if(as)return redirect(request,home,[['demo_role',encodeURIComponent(roleOf(as).key)],['demo_step',null]]);
   return send(200,'text/html; charset=utf-8',picker(user,(await notesOf(env)).length));
  }
  // The old personal area and sign-out have no place in the demo: both lead back to the guide.
  if(url.pathname==='/'||url.pathname==='/index.html'||url.pathname==='/signout-with-chatgpt')return redirect(request,'/demo');
  if(url.pathname==='/__demo/panel.js')return send(200,'text/javascript; charset=utf-8',panelJS);
  if(url.pathname==='/__demo/state')return json({title:config.title||'Demo',format:'demo',client:config.client||'klien',theme:config.theme||null,questions:{},steps:panelSteps,index,user:{key:user.key,name:user.name,role:user.role,group:user.group||''}});
  if(url.pathname==='/__demo/notes')return notesAPI(request,url,env,user);
  const stamp=new Date().toISOString().slice(0,10);
  if(url.pathname==='/__demo/notes.md')return send(200,'text/markdown; charset=utf-8','﻿'+notesMarkdown(await notesOf(env)),{'content-disposition':`attachment; filename="catatan-demo-${stamp}.md"`});
  if(url.pathname==='/__demo/notes.csv')return send(200,'text/csv; charset=utf-8','﻿'+notesCSV(await notesOf(env)),{'content-disposition':`attachment; filename="catatan-demo-${stamp}.csv"`});
  return toApp(request,env,ctx,user);
 }};
}
