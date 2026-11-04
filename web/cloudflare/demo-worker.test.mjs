// Tests the /demo Worker against the real app with an in-memory D1 restored from the reset SQL, and a local signing key.
// Usage: npm run cf:demo:test
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import app from '../worker/index.js';
import {demoUser} from '../scripts/dev-demo.mjs';
import {createDemoWorker} from './demo-core.mjs';
import {buildResetSQL,seededRows} from '../scripts/demo-cf-reset.mjs';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const config=JSON.parse(read('../demo/demo.config.json')),steps=JSON.parse(read('../demo/steps.json'));
const openDB=sql=>({prepare(q){const make=values=>({async first(){return sql.prepare(q).get(...values)||null},async all(){return {results:sql.prepare(q).all(...values)}},async run(){return {meta:{changes:Number(sql.prepare(q).run(...values).changes)}}}});return {...make([]),bind(...v){return make(v)}}}});

const domain='uji.cloudflareaccess.com',aud='aud-demo';
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'k1',alg:'RS256',use:'sig'};
const fetchKeys=async()=>new Response(JSON.stringify({keys:[jwk]}));
const enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
async function token(){
 const now=Math.floor(Date.now()/1000),head=enc({alg:'RS256',kid:'k1',typ:'JWT'}),body=enc({aud:[aud],iss:`https://${domain}`,sub:'peserta-1',email:'peserta@contoh.id',exp:now+3600});
 const sig=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(head+'.'+body))).toString('base64url');
 return head+'.'+body+'.'+sig;
}

const rows=await seededRows(),script=buildResetSQL(rows);
const sql=new DatabaseSync(':memory:');sql.exec(script.join('\n'));
const env={DB:openDB(sql),ACCESS_TEAM_DOMAIN:domain,ACCESS_AUD:aud};
const panelJS='/* panel */';
const worker=createDemoWorker(app,{config,steps,panelJS,identityOf:demoUser,fetchKeys});
const jwt=await token(),base='https://demo.example';
const get=(path,headers={},e=env)=>worker.fetch(new Request(base+path,{headers:{'cf-access-jwt-assertion':jwt,...headers}}),e);
const send=(method,path,body)=>worker.fetch(new Request(base+path,{method,headers:{'cf-access-jwt-assertion':jwt,cookie:'demo_role=fa; demo_step=4','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env);
const asFa={cookie:'demo_role=fa; demo_step=4'},results=[];
const check=async(name,fn)=>{await fn();results.push(name)};

await check('tanpa konfigurasi Access: semua ditolak (503)',async()=>assert.equal((await get('/demo',{},{DB:env.DB})).status,503));
await check('tanpa token: 401, walau peran dan header identitas dipalsukan',async()=>{
 const r=await worker.fetch(new Request(base+'/api/team/me',{headers:{cookie:'demo_role=ow','oai-authenticated-user-id':'demo-ow','oai-authenticated-user-email':'ow@demo.pamanku.test'}}),env);
 assert.equal(r.status,401);
});
await check('database tanpa penanda demo (mis. database asli): ditolak (503)',async()=>{
 const empty=new DatabaseSync(':memory:');empty.exec('CREATE TABLE telurfarm_teams (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE, revision INTEGER NOT NULL, payload TEXT NOT NULL)');
 const fresh=createDemoWorker(app,{config,steps,panelJS,identityOf:demoUser,fetchKeys});
 assert.equal((await fresh.fetch(new Request(base+'/api/team/me',{headers:{'cf-access-jwt-assertion':jwt}}),{...env,DB:openDB(empty)})).status,503);
});
await check('/demo menampilkan Panduan Demo dan semua langkah',async()=>{
 const r=await get('/demo'),html=await r.text();assert.equal(r.status,200);
 assert.match(html,/Mulai Panduan Demo/);assert.match(html,new RegExp(steps[15].title));
});
await check('/demo?step=4 berganti peran dan membuka halaman langkah',async()=>{
 const r=await get('/demo?step=4');assert.equal(r.status,302);assert.equal(r.headers.get('location'),'/team.html');
 const set=r.headers.getSetCookie().join('; ');assert.match(set,new RegExp('demo_role='+steps[4].as));assert.match(set,/demo_step=4/);
});
await check('/demo?as=ow masuk bebas sebagai peran, keluar dari panduan',async()=>{
 const r=await get('/demo?as=ow');assert.equal(r.status,302);assert.match(r.headers.getSetCookie().join('; '),/demo_role=ow/);
});
await check('identitas aplikasi mengikuti peran, header palsu dibuang',async()=>{
 const r=await get('/api/team/me',{...asFa,'oai-authenticated-user-id':'demo-ow','oai-authenticated-user-email':'ow@demo.pamanku.test'});assert.equal(r.status,200);
 const body=JSON.stringify(await r.json());assert.match(body,/fa@demo\.pamanku\.test/);assert.doesNotMatch(body,/"ow@demo/);
});
await check('peran tidak dikenal jatuh ke peran pertama, tidak error',async()=>assert.equal((await get('/api/team/me',{cookie:'demo_role=hantu'})).status,200));
await check('data hasil reset terbaca aplikasi (2 usaha milik pemilik berbeda)',async()=>{
 const r=await get('/api/team/me',{cookie:'demo_role=au'});assert.match(JSON.stringify(await r.json()),/Maju Serang/);
});
await check('halaman aplikasi disisipi panel dan CSP dibuang',async()=>{
 const r=await get('/team.html',asFa),html=await r.text();assert.match(html,/\/__demo\/panel\.js/);assert.equal(r.headers.get('content-security-policy'),null);
});
await check('panel disajikan',async()=>{const r=await get('/__demo/panel.js');assert.equal(await r.text(),panelJS);assert.match(r.headers.get('content-type'),/javascript/)});
await check('state: format demo, naskah pembawa tidak ikut terkirim',async()=>{
 const s=await (await get('/__demo/state',asFa)).json();assert.equal(s.format,'demo');assert.equal(s.index,4);assert.equal(s.user.key,'fa');assert.equal(s.steps.length,steps.length);
 assert.ok(s.steps[4].spot);assert.deepEqual(s.steps[4].nav,steps[4].nav);
 for(const f of ['say','do','who','min','goal','show','q'])assert.equal(s.steps[4][f],undefined,f);
});
await check('catatan: tambah, jenis salah diabaikan, tersimpan lintas peran',async()=>{
 let list=await (await send('POST','/__demo/notes',{step:4,kind:'catatan',text:'Kolom telur kotor dipisah'})).json();assert.equal(list.length,1);assert.equal(list[0].step,4);assert.equal(list[0].role,'fa');
 list=await (await send('POST','/__demo/notes',{step:4,kind:'ubah',text:'jenis FGD'})).json();assert.equal(list.length,1);
 list=await (await send('POST','/__demo/notes',{step:99,kind:'catatan',text:'langkah tidak ada'})).json();assert.equal(list.length,1);
 assert.equal((await (await get('/__demo/notes',{cookie:'demo_role=ow'})).json()).length,1);
});
await check('catatan: unduh .md dan .csv, teks dengan tanda kutip aman',async()=>{
 await send('POST','/__demo/notes',{step:0,kind:'catatan',text:'Kata "cepat", maksudnya?'});
 const md=await (await get('/__demo/notes.md')).text();assert.match(md,/Kolom telur kotor dipisah/);assert.match(md,/## 4\./);
 const csv=await (await get('/__demo/notes.csv')).text();assert.match(csv,/"Kata ""cepat"", maksudnya\?"/);
});
await check('catatan: hapus satu, hapus semua',async()=>{
 const list=await (await get('/__demo/notes')).json();
 assert.equal((await (await send('DELETE','/__demo/notes?id='+list[0].id)).json()).length,list.length-1);
 assert.equal((await (await send('DELETE','/__demo/notes?all=1')).json()).length,0);
});
await check('/ dan Keluar kembali ke /demo',async()=>{
 for(const p of ['/','/index.html','/signout-with-chatgpt']){const r=await get(p);assert.equal(r.status,302,p);assert.equal(r.headers.get('location'),'/demo',p)}
});
await check('reset: tiap perintah SQL di bawah 100 KB dan data utuh setelah dipulihkan',async()=>{
 for(const s of script)assert.ok(Buffer.byteLength(s)<100000,'statement '+Buffer.byteLength(s));
 assert.ok(script.length>rows.length,'baris besar harus dipecah');
 for(const row of rows)assert.equal(sql.prepare('SELECT payload FROM telurfarm_teams WHERE id=?').get(row.id).payload,row.payload);
 assert.ok(script.every(s=>!/^\s*(BEGIN|COMMIT)/i.test(s)),'D1 menolak transaksi manual');
});
await check('reset: catatan dipertahankan kecuali diminta dihapus',async()=>{
 assert.ok(!buildResetSQL(rows).join('\n').includes('DELETE FROM demo_notes'));
 assert.ok(buildResetSQL(rows,{clearNotes:true}).join('\n').includes('DELETE FROM demo_notes'));
});
await check('alur tulis: operator mencatat produksi lewat Worker',async()=>{
 const view=await (await get('/api/team/me',asFa)).json();
 const teamId=JSON.stringify(view).match(/"(?:id|teamId)":"([0-9a-f-]{36})"/)?.[1];assert.ok(teamId,'teamId');
 const data=await (await get('/api/team/view?teamId='+teamId,asFa)).json();
 const today=new Date(Date.now()+7*3600e3).toISOString().slice(0,10);
 const r=await worker.fetch(new Request(base+'/api/team/action',{method:'POST',headers:{'cf-access-jwt-assertion':jwt,...asFa,'content-type':'application/json'},body:JSON.stringify({teamId,expectedRevision:data.revision,requestId:'uji-1',action:'production.create',params:{date:today,houseId:'house-a',depotId:data.lots?.find(l=>l.houseId==='house-a')?.depotId||'anyer',eggs:1000,kg:62,broken:5,feed:100,dead:0}})}),env);
 assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
});
console.log(results.map(r=>'ok  '+r).join('\n')+`\n${results.length} pemeriksaan lulus`);
