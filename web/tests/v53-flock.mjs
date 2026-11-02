import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.js';
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0000_cloud_state.sql','utf8'));
const DB={prepare(q){const make=v=>({async first(){return sql.prepare(q).get(...v)||null},async all(){return {results:sql.prepare(q).all(...v)}},async run(){return {meta:{changes:Number(sql.prepare(q).run(...v).changes)}}}});return {...make([]),bind(...v){return make(v)}}}};
let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++};
async function req(user,path,body){const r=await worker.fetch(new Request('https://farm.test/api/team/'+path,{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@farm.test','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),{DB});return {status:r.status,data:await r.json()}}
const created=await req('owner','create',{name:'Farm mutasi ayam'});eq(created.status,200);const teamId=created.data.id;
const view=async(u='owner')=>{const r=await req(u,'view?teamId='+teamId);eq(r.status,200);return r.data};
async function cmd(u,action,params={},revision=null,id=crypto.randomUUID()){if(action==='flock.create'){action='request.create';params={type:'flock',params}}const v=await view(u);return req(u,'action',{teamId,expectedRevision:revision??v.revision,requestId:id,action,params})}
async function act(u,a,p){const r=await cmd(u,a,p);if(r.status!==200)console.log(r.data);eq(r.status,200);if(a==='flock.create'){const id=(await view(u)).requests.at(-1).id;await act('reviewer','request.approve',{id,reason:'Diperiksa'});await act(u,'request.execute',{id})}return r.data}
async function invite(u,role,depots,houses){const v=await view();const r=await req('owner','invite',{teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),email:u+'@farm.test',role,depots,houses});eq(r.status,200);eq((await req(u,'join',{teamId,token:r.data.token})).status,200)}
for(const [u,role,depots] of [['reviewer','OM','*'],['manager','OM',['anyer']],['farm','FA',['anyer']],['audit','AU','*'],['sales','SL','*']])await invite(u,role,depots,'*');
const master=(code,depotId='anyer')=>({code,name:code,farmLocation:'Farm uji',depotId,capacity:150,initialPopulation:100});
for(const [code,depot] of [['ASAL','anyer'],['TUJUAN','anyer'],['LUAR','cilegon']])await act('owner','house.create',master(code,depot));
let v=await view();const a=v.houses.find(h=>h.code==='ASAL'),b=v.houses.find(h=>h.code==='TUJUAN'),c=v.houses.find(h=>h.code==='LUAR');
const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date());
const movement={date:day,kind:'transfer',fromHouseId:a.id,toHouseId:b.id,quantity:20,note:'Uji perpindahan'};
const raw=()=>sql.prepare('SELECT payload FROM telurfarm_teams WHERE id=?').get(teamId).payload;
for(const u of ['audit','sales']){const before=raw();eq((await cmd(u,'flock.create',movement)).status,403);eq(raw(),before)}
await act('manager','flock.create',movement);v=await view();eq(v.houses.find(h=>h.id===a.id).population,80);eq(v.houses.find(h=>h.id===b.id).population,120);eq(v.flockMovements.length,1);
for(const over of [{quantity:81},{quantity:31},{quantity:0},{quantity:1.2},{toHouseId:a.id},{date:'2999-01-01'},{date:'2020-01-01'},{note:''},{kind:'in'},{kind:'invented'}]){const before=raw();eq((await cmd('owner','flock.create',{...movement,...over})).status,422);eq(raw(),before)}
const before=raw();eq((await cmd('manager','flock.create',{...movement,toHouseId:c.id})).status,403);eq(raw(),before);
await act('owner','flock.create',{...movement,toHouseId:c.id,quantity:10,note:'Referensi rahasia tujuan'});v=await view('manager');const partial=v.flockMovements.at(-1);eq(partial.toHouseId,null);eq(partial.toName,'Di luar cakupan');eq(partial.note,'Catatan dibatasi');eq(partial.restricted,true);eq((await view('sales')).flockMovements,[]);
await act('owner','house.assign',{userId:'farm',houses:[b.id]});v=await view('farm');eq(v.flockMovements.length,1);eq(v.flockMovements[0].fromName,'Di luar cakupan');eq(v.flockMovements[0].fromHouseId,null);
await act('owner','house.update',{...master('ASAL'),id:a.id,name:'Asal baru'});v=await view();eq(v.flockMovements[0].fromName,'ASAL');
eq((await cmd('owner','house.update',{...master('ASAL'),id:a.id,name:'Asal baru',initialPopulation:110})).status,422);
await act('owner','flock.create',{date:day,kind:'in',fromHouseId:null,toHouseId:a.id,quantity:5,note:'Pembelian'});await act('owner','flock.create',{date:day,kind:'out',fromHouseId:a.id,toHouseId:null,quantity:3,note:'Afkir'});
v=await view();eq(v.houses.find(h=>h.id===a.id).population,72);
await act('owner','house.status',{id:b.id,active:false});eq((await cmd('owner','flock.create',movement)).status,422);await act('owner','house.status',{id:b.id,active:true});
// Replay execution and simultaneous CAS retain atomic population updates in v5.4 approval flow.
async function prepared(quantity){await act('owner','request.create',{type:'flock',params:{...movement,quantity}});const id=(await view()).requests.at(-1).id;await act('reviewer','request.approve',{id,reason:'Diperiksa'});return id}
const approved=await prepared(1);v=await view();const body={teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),action:'request.execute',params:{id:approved}};eq((await req('owner','action',body)).status,200);eq((await req('owner','action',body)).status,200);eq((await view()).flockMovements.length,5);
const pair=[await prepared(1),await prepared(2)];v=await view();const race=await Promise.all(pair.map(id=>req('owner','action',{...body,expectedRevision:v.revision,requestId:crypto.randomUUID(),params:{id}})));eq(race.map(r=>r.status).sort(),[200,409]);
v=await view();eq(v.houses.filter(h=>[a.id,b.id,c.id].includes(h.id)).reduce((n,h)=>n+h.population,0),302);
const backup=await req('owner','export?teamId='+teamId);eq(backup.status,200);eq(backup.data.flockMovements.length,6);
console.log(`PASS v5.3 ledger regression via v5.4 approvals: ${count} assertions; RBAC, both-end scope, redaction, balances, capacity, history, dates, immutable baseline, replay and concurrent CAS.`);
