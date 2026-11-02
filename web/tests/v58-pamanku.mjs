import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.js';
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0000_cloud_state.sql','utf8'));
const DB={prepare(q){const make=v=>({async first(){return sql.prepare(q).get(...v)||null},async all(){return {results:sql.prepare(q).all(...v)}},async run(){return {meta:{changes:Number(sql.prepare(q).run(...v).changes)}}}});return {...make([]),bind(...v){return make(v)}}}};
let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++};
async function req(user,path,body){const r=await worker.fetch(new Request('https://farm.test/api/team/'+path,{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@farm.test','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),{DB});return {status:r.status,data:await r.json()}}
const created=await req('owner','create',{name:'Farm approval v5.4'});eq(created.status,200);const teamId=created.data.id;
const view=async(u='owner')=>{const r=await req(u,'view?teamId='+teamId);eq(r.status,200);return r.data};
async function cmd(u,action,params={}){const v=await view(u);return req(u,'action',{teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),action,params})}
async function act(u,a,p){const r=await cmd(u,a,p);assert.equal(r.status,200,JSON.stringify(r.data));count++;return r.data}
async function invite(u,role,depots='*',houses='*'){const v=await view();const r=await req('owner','invite',{teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),email:u+'@farm.test',role,depots,houses});eq(r.status,200);eq((await req(u,'join',{teamId,token:r.data.token})).status,200)}
await invite('farm','FA',['anyer']);await invite('farm2','FA',['anyer']);await invite('manager','OM',['anyer']);await invite('audit','AU');await invite('sales','SL');await invite('outside','OM',['cilegon']);
await act('owner','house.create',{code:'A56',name:'Kandang A56',farmLocation:'Farm UAT',depotId:'anyer',capacity:200,initialPopulation:100});
let v=await view();const house=v.houses.find(h=>h.code==='A56');
const filters={kind:'in',house:house.id,from:'2026-10-01',to:'2026-10-29',query:'Sample',status:'pending',health:'current'};
const params={name:'Menunggu masuk',source:'requests',filters};
const raw=()=>sql.prepare('SELECT payload FROM telurfarm_teams WHERE id=?').get(teamId).payload;
const domain=()=>{const t=JSON.parse(raw());t.data.revision=0;return JSON.stringify(t.data)};
await act('farm','monitor.filter.save',params);v=await view('farm');const original=v.savedMonitorFilters[0],id=original.id,before=domain();
await act('farm','monitor.filter.duplicate',{id,name:'Salinan',userId:'farm2',source:'ledger',filters:{query:'Injected'},newId:id});
v=await view('farm');const copy=v.savedMonitorFilters[1];eq(copy.name,'Salinan');eq(copy.source,original.source);eq(copy.filters,original.filters);assert.notEqual(copy.id,id);count++;eq(v.savedMonitorFilters[0],original);eq(domain(),before);eq((await view('farm2')).savedMonitorFilters,[]);
for(const name of ['SALINAN','','x'.repeat(61)]){const old=raw();eq((await cmd('farm','monitor.filter.duplicate',{id,name})).status,422);eq(raw(),old)}
for(const u of ['farm2','sales','outside']){const old=raw(),r=await cmd(u,'monitor.filter.duplicate',{id,name:'Unauthorized',userId:'farm'});eq(r.status,u==='sales'?403:422);eq(raw(),old)}
await act('farm','monitor.filter.rename',{id:copy.id,name:'Varian'});await act('farm','monitor.filter.update',{id:copy.id,source:'ledger',filters:{...filters,query:'Separate',status:'all',health:'all'}});v=await view('farm');eq(v.savedMonitorFilters[0],original);eq(v.savedMonitorFilters[1].filters.query,'Separate');
await act('owner','house.assign',{userId:'farm',houses:[]});eq((await view('farm')).savedMonitorFilters[0].available,false);const narrowed=raw();eq((await cmd('farm','monitor.filter.duplicate',{id,name:'Outside now'})).status,403);eq(raw(),narrowed);eq((await view('farm')).savedMonitorFilters[0].filters,undefined);
await act('owner','house.assign',{userId:'farm',houses:'*'});
await act('audit','monitor.filter.save',{name:'Audit ledger',source:'ledger',filters:{...filters,status:'all',health:'all'}});const aid=(await view('audit')).savedMonitorFilters[0].id;await act('audit','monitor.filter.duplicate',{id:aid,name:'Audit copy',source:'requests',filters});eq((await view('audit')).savedMonitorFilters[1].source,'ledger');
// Replayed duplicate creates one new ID; conflict protects cap and concurrent updates.
v=await view('farm');const body={teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),action:'monitor.filter.duplicate',params:{id,name:'Replay copy'}};eq((await req('farm','action',body)).status,200);const replay=raw();eq((await req('farm','action',body)).status,200);eq(raw(),replay);eq((await view('farm')).savedMonitorFilters.length,3);
v=await view('farm');const race=await Promise.all(['Race1','Race2'].map(name=>req('farm','action',{teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),action:'monitor.filter.duplicate',params:{id,name}})));eq(race.map(x=>x.status).sort(),[200,409]);
for(let i=0;i<6;i++)await act('farm','monitor.filter.duplicate',{id,name:'Extra '+i});eq((await view('farm')).savedMonitorFilters.length,10);const full=raw();eq((await cmd('farm','monitor.filter.duplicate',{id,name:'Eleven'})).status,422);eq(raw(),full);
const other=await req('farm','create',{name:'Other workspace'}),ov=await req('farm','view?teamId='+other.data.id);eq((await req('farm','action',{teamId:other.data.id,expectedRevision:ov.data.revision,requestId:crypto.randomUUID(),action:'monitor.filter.duplicate',params:{id,name:'Cross workspace'}})).status,422);
const nativeOld=JSON.parse((await req('owner','export?teamId='+teamId)).data?JSON.stringify((await req('owner','export?teamId='+teamId)).data):'{}');eq(nativeOld.app,'TelurFarm Native');eq('monitorFilterStores' in nativeOld,false);
for(const [file,needle] of [['web/team.html','PamanKu v'+JSON.parse(fs.readFileSync('package.json','utf8')).version.split('.').slice(0,2).join('.')],['web/index.html','PamanKu'],['web/manifest.json','PamanKu'],['web/app.js','PamanKu'],['web/team.js','PamanKu'],['web/stock-alerts.js','PamanKu'],['web/traceability.js','PamanKu']]){assert(fs.readFileSync(file,'utf8').includes(needle));count++}
await act('owner','member.revoke',{userId:'farm'});eq((await req('farm','view?teamId='+teamId)).status,403);
console.log(`PASS v5.8 PamanKu: ${count} assertions; duplication isolation, own/source/scope validation, cap, replay/CAS, compatibility and branding.`);
