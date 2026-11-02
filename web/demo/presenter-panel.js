// Presenter panel, injected by demo-proxy.mjs and docked at the bottom of every page.
// Format "fgd" follows the FIF FGD guide: step chips, presenter info toggle, spotlight, prev/next, a body with the step
// goal/what to show/questions plus two note columns ("Perlu diubah" / "Sudah diubah / disepakati"), and a download footer.
// Format "demo" is deliberately minimal: step chips, prev/next and a "Catatan" drawer with one note list per step.
// Notes are stored by the proxy so they survive role switches and reloads.
// Colours follow the target app (config.theme overrides detection). The panel lives in a shadow root so app CSS cannot leak in.
(async()=>{
 if(window.__demoPanel)return;window.__demoPanel=true;
 const api=(path,opt)=>fetch('/__demo/'+path,{cache:'no-store',...opt}).then(r=>r.json());
 let s;try{s=await api('state')}catch{return}
 const steps=s.steps||[],client=s.client||'klien',Q=s.questions||{},fgd=s.format!=='demo',TITLE=fgd?'Panduan FGD':'Panduan Demo';
 const pref=(k,d)=>{try{const v=localStorage.getItem('demo_'+k);return v===null?d:v==='1'}catch{return d}};
 const setPref=(k,v)=>{try{localStorage.setItem('demo_'+k,v?'1':'0')}catch{}};
 // The demo format has no spotlight toggle, so it always spotlights.
 const st={open:pref('open',true),small:pref('small',false),focus:fgd?pref('focus',true):true,host:pref('host',false),drawer:pref('drawer',false),notes:[]};
 try{st.notes=await api('notes')}catch{}

 // --- Palette: primary for the bar, accent for the active step / Berikutnya / spotlight ---
 const rgbOf=c=>{if(!c)return null;const e=document.createElement('i');e.style.color=String(c).trim();if(!e.style.color)return null;document.body.append(e);const v=getComputedStyle(e).color;e.remove();const m=v.match(/[\d.]+/g);if(!m)return null;const [r,g,b,a=1]=m.map(Number);return a<.5?null:[r,g,b]};
 const bgOf=e=>{const m=getComputedStyle(e).backgroundColor.match(/[\d.]+/g);if(!m)return null;const [r,g,b,a=1]=m.map(Number);return a<.5?null:[r,g,b]};
 const sat=([r,g,b])=>(Math.max(r,g,b)-Math.min(r,g,b))/255;
 const hue=([r,g,b])=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return 0;const h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return (h*60+360)%360};
 const hueGap=(a,b)=>{const d=Math.abs(hue(a)-hue(b));return Math.min(d,360-d)};
 const lum=c=>{const [r,g,b]=c.map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4});return .2126*r+.7152*g+.0722*b};
 const contrast=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+.05)/(y+.05)};
 const mix=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
 const css=(c,a)=>a===undefined?`rgb(${c.join(',')})`:`rgba(${c.join(',')},${a})`,WHITE=[255,255,255],BLACK=[0,0,0];
 const textOn=c=>contrast(c,WHITE)>=4.5||contrast(c,WHITE)>=contrast(c,BLACK)?WHITE:BLACK;
 const visible=e=>{const r=e.getBoundingClientRect();return r.width>8&&r.height>8&&getComputedStyle(e).visibility!=='hidden'};
 function detect(){
  const root=getComputedStyle(document.documentElement),found=[];
  for(const v of ['--primary','--color-primary','--primary-color','--brand','--brand-color','--color-brand','--navy','--blue','--theme-color','--bs-primary','--mdc-theme-primary','--mui-palette-primary-main']){const c=rgbOf(root.getPropertyValue(v));if(c&&sat(c)>.15){found.push(c);break}}
  let accent=null;for(const v of ['--accent','--secondary','--orange','--color-accent','--bs-warning','--mdc-theme-secondary','--mui-palette-secondary-main']){const c=rgbOf(root.getPropertyValue(v));if(c&&sat(c)>.15){accent=c;break}}
  const meta=rgbOf(document.querySelector('meta[name=theme-color]')?.content);if(meta&&sat(meta)>.15)found.push(meta);
  const votes=new Map();
  document.querySelectorAll('.btn-primary,.primary,[class*="primary"],button,.btn,[role=button],a.active,.active,.on,[aria-current],[aria-pressed=true],header,nav,aside,[role=banner]').forEach(e=>{
   if(e.closest('#demo-guide-host')||!visible(e))return;const c=bgOf(e);if(!c||sat(c)<.2||lum(c)>.9)return;const k=c.join(',');votes.set(k,(votes.get(k)||0)+(/primary/.test(e.className)?3:1))});
  const ranked=[...votes].sort((a,b)=>b[1]-a[1]).map(([k])=>k.split(',').map(Number));
  const primary=found[0]||ranked[0]||null;
  if(!accent&&primary)accent=ranked.find(c=>hueGap(c,primary)>45)||null;
  return {primary,accent};
 }
 const t=s.theme||{},auto=detect();
 const primary=rgbOf(t.primary)||auto.primary||[14,63,112];
 const accent=rgbOf(t.accent)||auto.accent||(hueGap(primary,[245,165,36])>45?[245,165,36]:[14,63,112]);
 const P={primary,onPrimary:rgbOf(t.onPrimary)||textOn(primary),accent,onAccent:textOn(accent)};
 const font=t.font||getComputedStyle(document.body).fontFamily||'system-ui,sans-serif';
 try{document.cookie='demo_theme='+encodeURIComponent(css(primary))+'; Path=/; SameSite=Lax'}catch{}

 // --- Spotlight: four dim panels around the target with an accent frame; never blocks clicks ---
 const step=s.index>=0?steps[s.index]:null,i=s.index;
 const dim=document.createElement('div');dim.style.cssText='position:fixed;inset:0;z-index:2147483600;pointer-events:none';dim.hidden=true;
 for(let k=0;k<5;k++){const p=document.createElement(k<4?'i':'b');p.style.cssText=k<4?'position:fixed;background:rgba(15,23,42,.42);transition:all .2s ease-out':`position:fixed;border:3px solid ${css(P.accent)};border-radius:14px;box-shadow:0 0 0 4px ${css(P.accent,.25)};transition:all .2s ease-out`;dim.append(p)}
 document.body.append(dim);
 function spot(){
  const tgt=st.open&&st.focus&&step?.spot&&document.querySelector(step.spot);if(!tgt){dim.hidden=true;return}
  const r=tgt.getBoundingClientRect(),pad=6,vw=innerWidth,vh=innerHeight,panelTop=host.getBoundingClientRect().top||vh;
  const x0=Math.max(0,r.left-pad),y0=Math.max(0,r.top-pad),x1=Math.min(vw,r.right+pad),y1=Math.min(panelTop,r.bottom+pad),p=dim.children;dim.hidden=false;
  const box=(e,l,tp,w,h)=>Object.assign(e.style,{left:l+'px',top:tp+'px',width:Math.max(0,w)+'px',height:Math.max(0,h)+'px'});
  box(p[0],0,0,vw,y0);box(p[1],0,y1,vw,vh-y1);box(p[2],0,y0,x0,y1-y0);box(p[3],x1,y0,vw-x1,y1-y0);box(p[4],x0,y0,x1-x0,y1-y0);
 }
 let raf=0;const respot=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(spot)};
 addEventListener('scroll',respot,true);addEventListener('resize',respot);addEventListener('click',()=>setTimeout(respot,60),true);

 // --- Panel (shadow DOM) ---
 const host=document.createElement('div');host.id='demo-guide-host';document.body.append(host);
 const root=host.attachShadow({mode:'open'});
 const pad=document.createElement('style');document.head.append(pad);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
 const style=`<style>
:host{all:initial}
*{box-sizing:border-box;font-family:${font}}
.panel{position:fixed;left:0;right:0;bottom:0;z-index:2147483646;background:#fff;color:#1f2937;border-top:3px solid ${css(P.accent)};box-shadow:0 -10px 30px ${css(P.primary,.18)};font-size:13px}
.bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 20px;background:${css(P.primary)};color:${css(P.onPrimary)}}
.title{font-size:14px;font-weight:800}
.steps{display:flex;gap:4px;flex-wrap:wrap}
.steps button{position:relative;min-width:30px;height:30px;padding:0 6px;border-radius:8px;border:1px solid ${css(P.onPrimary,.35)};background:transparent;color:${css(P.onPrimary)};font-weight:700;cursor:pointer;font-size:13px}
.steps button.on{background:${css(P.accent)};border-color:${css(P.accent)};color:${css(P.onAccent)}}
.steps button i{position:absolute;top:-6px;right:-6px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#d7262c;color:#fff;font:700 10px/16px system-ui,sans-serif;font-style:normal}
.now{flex:1 1 200px;min-width:0;font-weight:600;opacity:.88;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sw{display:inline-flex;align-items:center;gap:6px;font-weight:600;cursor:pointer}
.sw input{width:16px;height:16px;accent-color:${css(P.accent)};margin:0}
.btn{min-height:34px;padding:0 14px;border-radius:9px;border:1px solid #c9d6e5;background:#fff;color:${css(mix(P.primary,BLACK,.15))};font-weight:700;font-size:12.5px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
.bar .btn{border-color:${css(P.onPrimary,.5)};background:transparent;color:${css(P.onPrimary)}}
.bar .btn.pri{background:${css(P.accent)};border-color:${css(P.accent)};color:${css(P.onAccent)}}
.btn[aria-disabled=true]{opacity:.4;pointer-events:none}
.btn.ghost{border-color:transparent;color:#6b7280}
.icon{width:34px;height:34px;border-radius:9px;border:1px solid ${css(P.onPrimary,.4)};background:transparent;color:${css(P.onPrimary)};font-size:16px;cursor:pointer}
.btn:focus-visible,.icon:focus-visible,.steps button:focus-visible,input:focus-visible{outline:3px solid ${css(P.accent)};outline-offset:2px}
.body{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr) minmax(0,1fr);gap:16px;padding:12px 20px 8px;height:210px;overflow:hidden}
.bar .btn.on{background:${css(P.onPrimary,.16)}}
.bar.mini .now{flex-basis:60px}
.drawer{padding:10px 20px 12px;max-height:220px;overflow-y:auto}
.drawer.notes{border-left:0}
.notes.catatan li{background:${css(mix(P.primary,WHITE,.93))}}
.dl{display:flex;gap:12px;align-items:center;margin-top:6px;font-size:12px;color:#6b7280}
.dl span{flex:1}.dl a{color:${css(mix(P.primary,BLACK,.15))};font-weight:700}
.guide,.notes{min-width:0;overflow-y:auto}
.goal{margin:0 0 8px;font-size:14px;font-weight:700;color:${css(contrast(P.primary,WHITE)>=4.5?P.primary:mix(P.primary,BLACK,.45))};line-height:1.4}
.k{margin:6px 0 4px;font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;color:#6b7280}
.guide ul{margin:0;padding-left:18px;line-height:1.45}
.q{list-style:none;padding-left:0!important;margin-top:8px!important}
.q li{margin-bottom:3px}
.q b{display:inline-block;min-width:42px;padding:0 6px;margin-right:4px;border-radius:6px;background:${css(mix(P.primary,WHITE,.9))};color:${css(mix(P.primary,BLACK,.1))};font-size:11px;text-align:center}
.hostbox{margin-top:8px;padding:8px 10px;border-radius:9px;background:${css(mix(P.accent,WHITE,.85))};border:1px dashed ${css(mix(P.accent,WHITE,.3))}}
.hostbox .k{margin-top:0;color:${css(mix(P.accent,BLACK,.45))}}
.notes{border-left:1px solid #e5e7eb;padding-left:16px}
.notes.ubah .k{color:#b45309}.notes.berubah .k{color:#15803d}
form{display:flex;gap:6px;margin-bottom:8px}
.notes input{flex:1;min-width:0;min-height:34px;padding:0 10px;border:1px solid #c9d6e5;border-radius:9px;font:inherit;font-size:13px}
.notes ul{list-style:none;margin:0;padding-left:0}
.notes li{display:flex;align-items:flex-start;gap:6px;padding:6px 8px;margin-bottom:4px;border-radius:8px;line-height:1.4}
.notes.ubah li{background:#fff7e6}.notes.berubah li{background:#eaf7ef}
.notes li span{flex:1;min-width:0;overflow-wrap:anywhere}
.notes li button{border:0;background:none;color:#9ca3af;font-size:16px;line-height:1;cursor:pointer;padding:0 2px}
.notes li.empty{background:none;color:#9ca3af;padding-left:0}
.sum{margin-top:8px;padding:8px 10px;border-radius:9px;background:#f3f6fa}.sum ul{list-style:none;padding-left:0;margin:4px 0 0}.sum li.empty{color:#9ca3af}
.foot{display:flex;align-items:center;gap:8px;padding:6px 20px 10px;border-top:1px solid #f0f2f5;flex-wrap:wrap}
.foot span{flex:1;color:#6b7280;font-size:12px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.pill{position:fixed;right:12px;bottom:12px;z-index:2147483646;display:flex;gap:8px;align-items:center;padding:6px 8px 6px 14px;border-radius:999px;background:${css(P.primary)};color:${css(P.onPrimary)};font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,.25)}
.pill a,.pill button{color:${css(P.onPrimary)}}
.pill .btn.pri{background:${css(P.accent)};border-color:${css(P.accent)};color:${css(P.onAccent)};min-height:28px}
@media (max-width:760px){.body{grid-template-columns:1fr;height:46vh;overflow-y:auto}.guide,.notes{overflow:visible}.notes{border-left:0;padding-left:0;border-top:1px solid #e5e7eb;padding-top:8px}.now{flex-basis:100%;order:3}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>`;
 const notesOf=(k,kind)=>st.notes.filter(n=>n.step===k&&n.kind===kind);
 const noteList=kind=>{const list=notesOf(i,kind);return '<ul>'+(list.length?list.map(n=>`<li><span>${esc(n.text)}</span><button type="button" data-del="${esc(n.id)}" title="Hapus catatan" aria-label="Hapus catatan">×</button></li>`).join(''):'<li class="empty">Belum ada catatan.</li>')+'</ul>'};
 const summary=()=>{const rows=steps.map((x,k)=>{const a=notesOf(k,'ubah').length,b=notesOf(k,'berubah').length;return a||b?`<li><b>${k}. ${esc(x.title)}</b> · ${a} perlu diubah · ${b} sudah diubah</li>`:''}).join('');return `<div class="sum"><b>Ringkasan catatan sesi</b><ul>${rows||'<li class="empty">Belum ada catatan di langkah mana pun.</li>'}</ul></div>`};
 const label=(kind)=>kind==='ubah'?`Perlu diubah (masukan ${esc(client)})`:'Sudah diubah / disepakati';
 const placeholder=kind=>esc((step?.placeholder||{})[kind]||(kind==='ubah'?'Mis. alur ini perlu persetujuan atasan':'Mis. disepakati memakai 3 tipe di tahap awal'));

 // Leave room under the page for the docked panel, sized to what is actually shown.
 const reserve=()=>{const p=step&&st.open&&root.querySelector('.panel');pad.textContent=p?`body.demo-guide-on{padding-bottom:${p.offsetHeight+16}px!important}`:''};
 function render(){
  document.body.classList.toggle('demo-guide-on',!!step&&st.open);
  if(!step){root.innerHTML=style+`<div class="pill">Demo: ${esc(s.user.name)}${s.user.group?' · '+esc(s.user.group):''}<a class="btn pri" href="/demo">Ganti peran</a></div>`;reserve();return}
  if(!st.open){root.innerHTML=style+`<div class="pill">${TITLE} · ${i}. ${esc(step.title)}<button type="button" class="btn pri" data-open>Buka panduan</button></div>`;reserve();spot();return}
  const chips=steps.map((x,k)=>{const n=st.notes.filter(m=>m.step===k).length;return `<button type="button" role="tab" aria-selected="${k===i}" class="${k===i?'on':''}" data-step="${k}" title="${esc(x.title)}">${k}${n?`<i>${n}</i>`:''}</button>`}).join('');
  const nav=(k,text,cls)=>`<a class="btn ${cls||''}" href="/demo?step=${k}" ${k<0||k>=steps.length?'aria-disabled="true"':''}>${text}</a>`;
  const who=s.user.name+(s.user.group?' · '+s.user.group:'');
  const hostInfo=st.host?`<div class="hostbox"><p class="k">Info pembawa${step.min?' · menit '+esc(step.min):''}</p>`+
   (step.who?`<div>Dibawakan: ${esc(step.who)}</div>`:'')+`<div>Masuk sebagai: ${esc(who)}</div>`+
   (step.say?.length?`<p class="k">Sampaikan</p><ul>${step.say.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'')+
   (step.do?`<p class="k">Lakukan</p><div>${esc(step.do)}</div>`:'')+'</div>':'';
  // Demo format: only the step chips, prev/next and a Catatan drawer (closed by default) with this step's notes.
  if(!fgd){
   const mine=notesOf(i,'catatan').length;
   root.innerHTML=style+`<section class="panel" aria-label="${TITLE}"><div class="bar mini"><b class="title">${TITLE}</b><div class="steps" role="tablist">${chips}</div>
<span class="now">${esc(step.title)}</span>
${nav(i-1,'‹ Sebelumnya')}${i<steps.length-1?nav(i+1,'Berikutnya ›','pri'):'<a class="btn pri" href="/demo">Selesai</a>'}
<button type="button" class="btn${st.drawer?' on':''}" data-drawer aria-expanded="${st.drawer}">Catatan${mine?` (${mine})`:''}</button>
<button type="button" class="icon" data-close title="Tutup panduan" aria-label="Tutup panduan">×</button></div>`+
   (st.drawer?`<div class="drawer notes catatan"><form data-add="catatan"><label class="sr" for="in-catatan">Tambah catatan</label><input id="in-catatan" autocomplete="off" placeholder="${esc((step.placeholder||{}).catatan||'Catatan untuk langkah '+i+': '+step.title)}"><button type="submit" class="btn">Tambah</button></form>${noteList('catatan')}
<div class="dl"><span>${st.notes.length} catatan di semua langkah</span><a href="/__demo/notes.md" download>Unduh .md</a><a href="/__demo/notes.csv" download>Unduh .csv</a></div></div>`:'')+'</section>';
   reserve();respot();return;
  }
  root.innerHTML=style+`<section class="panel" aria-label="${TITLE}"><div class="bar">
<b class="title">${TITLE}</b><div class="steps" role="tablist">${chips}</div>
<span class="now">${esc(step.title)}${st.host&&step.min?' · menit '+esc(step.min):''}</span>
<label class="sw" title="Tampilkan menit, pembawa, poin bicara dan instruksi klik (hanya untuk tim penyaji)"><input type="checkbox" data-host ${st.host?'checked':''}> Info pembawa</label>
<label class="sw"><input type="checkbox" data-focus ${st.focus?'checked':''}> Sorot</label>
${nav(i-1,'‹ Sebelumnya')}${i<steps.length-1?nav(i+1,'Berikutnya ›','pri'):'<a class="btn pri" href="/demo">Selesai</a>'}
<button type="button" class="icon" data-small title="${st.small?'Perbesar panel':'Perkecil panel'}" aria-label="${st.small?'Perbesar panel':'Perkecil panel'}">${st.small?'▴':'▾'}</button>
<button type="button" class="icon" data-close title="Tutup panduan" aria-label="Tutup panduan">×</button></div>`+
  (st.small?'':`<div class="body"><div class="guide">
<p class="goal">${esc(step.goal||step.title)}</p>
${step.show?.length?`<p class="k">Tampilkan</p><ul>${step.show.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
${step.q?.length?`<ul class="q">${step.q.map(c=>Q[c]?`<li><b>${esc(c)}</b> ${esc(Q[c])}</li>`:`<li>${esc(c)}</li>`).join('')}</ul>`:''}
${hostInfo}${i===steps.length-1?summary():''}</div>`+
  ['ubah','berubah'].map(kind=>`<div class="notes ${kind}"><p class="k">${label(kind)}</p><form data-add="${kind}"><label class="sr" for="in-${kind}">${kind==='ubah'?'Tambah masukan':'Tambah kesepakatan'}</label><input id="in-${kind}" autocomplete="off" placeholder="${placeholder(kind)}"><button type="submit" class="btn">Tambah</button></form>${noteList(kind)}</div>`).join('')+'</div>'+
  `<div class="foot"><span>${st.notes.length} catatan · tersimpan di server demo</span><a class="btn" href="/__demo/notes.md" download>Unduh catatan (.md)</a><a class="btn" href="/__demo/notes.csv" download>Unduh (.csv)</a><button type="button" class="btn ghost" data-clear>Kosongkan catatan</button></div>`)+'</section>';
  reserve();respot();
 }
 root.addEventListener('click',async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-step'))location.href='/demo?step='+b.getAttribute('data-step');
  else if(b.hasAttribute('data-small')){st.small=!st.small;setPref('small',st.small);render()}
  else if(b.hasAttribute('data-drawer')){st.drawer=!st.drawer;setPref('drawer',st.drawer);render();if(st.drawer)root.getElementById('in-catatan')?.focus()}
  else if(b.hasAttribute('data-close')){st.open=false;setPref('open',false);render()}
  else if(b.hasAttribute('data-open')){st.open=true;setPref('open',true);render()}
  else if(b.hasAttribute('data-del')){st.notes=await api('notes?id='+encodeURIComponent(b.getAttribute('data-del')),{method:'DELETE'});render()}
  else if(b.hasAttribute('data-clear')){if(st.notes.length&&confirm(`Hapus semua ${st.notes.length} catatan sesi ini? Unduh dulu kalau masih perlu.`)){st.notes=await api('notes?all=1',{method:'DELETE'});render()}}
 });
 root.addEventListener('change',e=>{
  if(e.target.hasAttribute('data-focus')){st.focus=e.target.checked;setPref('focus',st.focus);spot()}
  else if(e.target.hasAttribute('data-host')){st.host=e.target.checked;setPref('host',st.host);render()}
 });
 root.addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,kind=f.getAttribute('data-add'),inp=f.querySelector('input'),text=inp.value.trim();if(!text){inp.focus();return}
  st.notes=await api('notes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({step:i,kind,text})});render();root.getElementById('in-'+kind)?.focus();
 });
 document.addEventListener('keydown',e=>{
  if(!step||e.altKey||e.ctrlKey||e.metaKey||e.composedPath().some(x=>/INPUT|TEXTAREA|SELECT/.test(x.tagName||''))||e.target.isContentEditable||document.querySelector('dialog[open]'))return;
  if(e.key==='ArrowRight'&&i<steps.length-1)location.href='/demo?step='+(i+1);if(e.key==='ArrowLeft'&&i>0)location.href='/demo?step='+(i-1);
 });
 render();
 if(!step)return;

 // --- Prepare the screen: declarative nav actions, each waits for its target (max 8s), then scroll to and spotlight the focus area ---
 const until=(test,ms=8000)=>new Promise(ok=>{const t0=Date.now(),tick=()=>{let v;try{v=test()}catch{}if(v||Date.now()-t0>ms)ok(v);else setTimeout(tick,100)};tick()});
 const byText=(text,within)=>[...document.querySelectorAll((within?within+' ':'')+'a,button,[role=button],[role=tab],[role=menuitem]')].find(e=>e.textContent.trim()===text);
 for(const a of step.nav||[]){
  if(a.wait){await new Promise(r=>setTimeout(r,a.wait));continue}
  if(a.waitFor){await until(()=>document.querySelector(a.waitFor));continue}
  if(a.select){
   const sel=await until(()=>{const e=document.querySelector(a.select);return e&&e.options?.length?e:null});if(!sel)continue;
   const opt=[...sel.options].find(o=>o.textContent.trim().startsWith(a.option));if(!opt||sel.value===opt.value)continue;
   const old=a.rerender&&document.querySelector(a.rerender);sel.value=opt.value;sel.dispatchEvent(new Event('change',{bubbles:true}));
   if(a.rerender)await until(()=>{const e=document.querySelector(a.rerender);return e&&e!==old});continue;
  }
  if(a.fill){const f=await until(()=>document.querySelector(a.fill));if(f){f.value=a.value??'';f.dispatchEvent(new Event('input',{bubbles:true}));f.dispatchEvent(new Event('change',{bubbles:true}))}continue}
  const target=await until(()=>a.click?document.querySelector(a.click):byText(a.clickText,a.within));
  if(target&&!target.classList.contains('active')&&target.getAttribute('aria-current')===null)target.click();
 }
 if(step.spot){const tgt=await until(()=>document.querySelector(step.spot),4000);if(tgt){tgt.scrollIntoView({block:'start',behavior:'smooth'});setTimeout(respot,400)}}
})();
