// Tests the Cloudflare Access gate against the real worker with an in-memory D1 and a locally generated signing key.
// Usage: npm run cf:test
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import app from '../worker/index.js';
import {createGate} from './access-gate.mjs';

const sql=new DatabaseSync(':memory:');
for(const f of ['0000_cloud_state.sql','0001_team_rbac.sql'])sql.exec(fs.readFileSync(new URL('../drizzle/'+f,import.meta.url),'utf8'));
const DB={prepare(q){const make=values=>({async first(){return sql.prepare(q).get(...values)||null},async all(){return {results:sql.prepare(q).all(...values)}},async run(){return {meta:{changes:Number(sql.prepare(q).run(...values).changes)}}}});return {...make([]),bind(...v){return make(v)}}}};

const domain='uji.cloudflareaccess.com',aud='aud-pamanku',env={DB,ACCESS_TEAM_DOMAIN:domain,ACCESS_AUD:aud};
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const other=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'k1',alg:'RS256',use:'sig'};
let certCalls=0;
const fetchKeys=async url=>{certCalls++;assert.equal(url,`https://${domain}/cdn-cgi/access/certs`);return new Response(JSON.stringify({keys:[jwk]}))};
const gate=createGate(app,{fetchKeys});

const enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
async function token(claims={},{kid='k1',key=pair.privateKey}={}){
 const now=Math.floor(Date.now()/1000),head=enc({alg:'RS256',kid,typ:'JWT'});
 const body=enc({aud:[aud],iss:`https://${domain}`,sub:'user-123',email:'Sari@Contoh.id',iat:now,exp:now+3600,...claims});
 const sig=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(head+'.'+body))).toString('base64url');
 return head+'.'+body+'.'+sig;
}
const me=(headers={},e=env)=>gate.fetch(new Request('https://pamanku.example/api/team/me',{headers}),e);
const forged={'oai-authenticated-user-id':'demo-ow','oai-authenticated-user-email':'ow@demo.pamanku.test'};
const results=[];
const check=async(name,fn)=>{await fn();results.push(name)};

await check('tanpa konfigurasi Access: semua ditolak (503)',async()=>assert.equal((await me(forged,{DB})).status,503));
await check('header identitas palsu tanpa token: 401',async()=>assert.equal((await me(forged)).status,401));
await check('token sah: masuk sebagai pemilik token',async()=>{
 const r=await me({'cf-access-jwt-assertion':await token()});assert.equal(r.status,200);
 const body=JSON.stringify(await r.json());assert.match(body,/sari@contoh\.id/);
});
await check('token sah + header palsu: header palsu dibuang',async()=>{
 const r=await me({...forged,'cf-access-jwt-assertion':await token()});const body=JSON.stringify(await r.json());
 assert.match(body,/sari@contoh\.id/);assert.doesNotMatch(body,/ow@demo/);
});
await check('token lewat cookie CF_Authorization: diterima',async()=>assert.equal((await me({cookie:'a=1; CF_Authorization='+await token()})).status,200));
await check('token untuk aplikasi lain (aud salah): 401',async()=>assert.equal((await me({'cf-access-jwt-assertion':await token({aud:['lain']})})).status,401));
await check('penerbit lain (iss salah): 401',async()=>assert.equal((await me({'cf-access-jwt-assertion':await token({iss:'https://jahat.cloudflareaccess.com'})})).status,401));
await check('token kedaluwarsa: 401',async()=>assert.equal((await me({'cf-access-jwt-assertion':await token({exp:Math.floor(Date.now()/1000)-3600})})).status,401));
await check('ditandatangani kunci lain: 401',async()=>assert.equal((await me({'cf-access-jwt-assertion':await token({},{key:other.privateKey})})).status,401));
await check('isi token diubah (email ditukar): 401',async()=>{
 const [h,,s]=(await token()).split('.');const body=enc({aud:[aud],iss:`https://${domain}`,sub:'x',email:'ow@demo.pamanku.test',exp:Math.floor(Date.now()/1000)+3600});
 assert.equal((await me({'cf-access-jwt-assertion':[h,body,s].join('.')})).status,401);
});
await check('alg none: 401',async()=>{const [,b]=(await token()).split('.');assert.equal((await me({'cf-access-jwt-assertion':enc({alg:'none',kid:'k1'})+'.'+b+'.'})).status,401)});
await check('token servis tanpa email: 401',async()=>assert.equal((await me({'cf-access-jwt-assertion':await token({email:undefined})})).status,401));
await check('kid tidak dikenal: ditolak tanpa membanjiri pengambilan kunci',async()=>{const before=certCalls;for(let n=0;n<5;n++)assert.equal((await me({'cf-access-jwt-assertion':await token({},{kid:'k9'})})).status,401);assert.ok(certCalls<=before+1)});
await check('Keluar diarahkan ke logout Access',async()=>{const r=await gate.fetch(new Request('https://pamanku.example/signout-with-chatgpt'),env);assert.equal(r.status,302);assert.equal(r.headers.get('location'),'https://pamanku.example/cdn-cgi/access/logout')});
await check('halaman tim tetap butuh token',async()=>assert.equal((await gate.fetch(new Request('https://pamanku.example/team.html'),env)).status,401));
await check('alur tim jalan: buat ruang kerja dengan token sah',async()=>{
 const t=await token();const r=await gate.fetch(new Request('https://pamanku.example/api/team/create',{method:'POST',headers:{'cf-access-jwt-assertion':t,'content-type':'application/json'},body:JSON.stringify({name:'Peternakan Uji',displayName:'Bu Sari'})}),env);
 assert.equal(r.status,200,JSON.stringify(await r.clone().json()));
});
console.log(results.map(r=>'ok  '+r).join('\n')+`\n${results.length} pemeriksaan lulus`);
