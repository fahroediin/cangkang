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
await act('farm','monitor.filter.save',params);await act('farm','monitor.filter.save',{...params,name:'Second'});
v=await view('farm');const id=v.savedMonitorFilters[0].id,second=v.savedMonitorFilters[1].id,oldItems=v.savedMonitorFilters,before=domain();
eq(oldItems[0].favorite,undefined);await act('farm','monitor.filter.favorite',{id:second,favorite:true,userId:'farm2',name:'Injected',filters:{query:'Injected'}});
v=await view('farm');eq(v.savedMonitorFilters[1].favorite,true);eq(v.savedMonitorFilters[1].name,'Second');eq(v.savedMonitorFilters[1].filters,filters);eq(v.savedMonitorFilters.map(x=>x.id),oldItems.map(x=>x.id));eq(domain(),before);eq((await view('farm2')).savedMonitorFilters,[]);
for(const favorite of [null,'true',1,{},[]]){const old=raw();eq((await cmd('farm','monitor.filter.favorite',{id,favorite})).status,422);eq(raw(),old)}
for(const u of ['farm2','sales']){const old=raw();eq((await cmd(u,'monitor.filter.favorite',{id,favorite:true,userId:'farm'})).status,u==='sales'?403:422);eq(raw(),old)}
eq((await cmd('farm','monitor.filter.favorite',{id:'missing',favorite:false})).status,422);
await act('farm','monitor.filter.rename',{id:second,name:'Renamed favorite'});await act('farm','monitor.filter.update',{id:second,source:'ledger',filters:{...filters,status:'all',health:'all'}});v=await view('farm');eq(v.savedMonitorFilters[1].favorite,true);
await act('farm','monitor.filter.duplicate',{id:second,name:'Copy'});v=await view('farm');eq(v.savedMonitorFilters[2].favorite,undefined);eq(v.savedMonitorFilters[1].favorite,true);const copy=v.savedMonitorFilters[2].id;
await act('farm','monitor.filter.favorite',{id:second,favorite:false});eq((await view('farm')).savedMonitorFilters[1].favorite,undefined);
// Hidden criteria stay hidden when scope narrows; unmarking own unavailable favorite remains safe.
await act('farm','monitor.filter.favorite',{id,favorite:true});await act('owner','house.assign',{userId:'farm',houses:[]});v=await view('farm');eq(v.savedMonitorFilters[0].favorite,true);eq(v.savedMonitorFilters[0].available,false);eq(v.savedMonitorFilters[0].filters,undefined);const narrowed=raw();eq((await cmd('farm','monitor.filter.favorite',{id:second,favorite:true})).status,403);eq(raw(),narrowed);
await act('farm','monitor.filter.favorite',{id,favorite:false});v=await view('farm');eq(v.savedMonitorFilters[0].favorite,undefined);eq(v.savedMonitorFilters[0].filters,undefined);eq(v.savedMonitorFilters[0].available,false);
await act('owner','house.assign',{userId:'farm',houses:'*'});
// Auditor only marks ledger; new action does not grant transaction rights.
await act('audit','monitor.filter.save',{name:'Audit ledger',source:'ledger',filters:{...filters,status:'all',health:'all'}});const aid=(await view('audit')).savedMonitorFilters[0].id;await act('audit','monitor.filter.favorite',{id:aid,favorite:true});eq((await view('audit')).savedMonitorFilters[0].favorite,true);eq((await cmd('audit','flock.create',{})).status,403);
// Replay uses an explicit boolean so it cannot toggle the flag back.
v=await view('farm');const body={teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),action:'monitor.filter.favorite',params:{id,favorite:true}};eq((await req('farm','action',body)).status,200);const replay=raw();eq((await req('farm','action',body)).status,200);eq(raw(),replay);eq((await view('farm')).savedMonitorFilters[0].favorite,true);
v=await view('farm');const race=await Promise.all([true,false].map(favorite=>req('farm','action',{teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),action:'monitor.filter.favorite',params:{id,favorite}})));eq(race.map(x=>x.status).sort(),[200,409]);
// Favorites do not consume additional slots. GET does not reorder persisted array or write metadata.
for(let i=0;i<7;i++)await act('farm','monitor.filter.save',{...params,name:'Extra '+i});eq((await view('farm')).savedMonitorFilters.length,10);await act('farm','monitor.filter.favorite',{id:copy,favorite:true});eq((await view('farm')).savedMonitorFilters.length,10);const beforeRead=raw();await view('farm');eq(raw(),beforeRead);
const other=await req('farm','create',{name:'Other workspace'}),ov=await req('farm','view?teamId='+other.data.id);eq((await req('farm','action',{teamId:other.data.id,expectedRevision:ov.data.revision,requestId:crypto.randomUUID(),action:'monitor.filter.favorite',params:{id,favorite:true}})).status,422);
// Approved source remains valid after changing favorite metadata.
const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date());await act('farm','request.create',{type:'flock',params:{kind:'in',fromHouseId:null,toHouseId:house.id,date:day,quantity:10,note:'Approval sentinel'}});const rid=(await view('farm')).requests.at(-1).id;await act('manager','request.approve',{id:rid,reason:'Dokumen cocok'});const approved=(await view()).requests.find(x=>x.id===rid),domainBefore=domain();await act('farm','monitor.filter.favorite',{id,favorite:true});eq(domain(),domainBefore);eq((await view()).requests.find(x=>x.id===rid),approved);eq(approved.health,'current');
await act('farm','monitor.filter.delete',{id:copy});eq((await view('farm')).savedMonitorFilters.length,9);eq((await view('farm')).savedMonitorFilters.some(x=>x.id===copy),false);
const backup=await req('owner','export?teamId='+teamId);eq('monitorFilterStores' in backup.data,false);eq(JSON.parse(raw()).monitorFilterStores.find(x=>x.userId==='farm').store.schema,1);
await act('owner','member.revoke',{userId:'farm'});eq((await req('farm','action',{teamId,expectedRevision:999,requestId:crypto.randomUUID(),action:'monitor.filter.favorite',params:{id,favorite:false}})).status,403);
console.log(`PASS v5.9 monitor favorites: ${count} assertions; legacy schema, own/workspace isolation, scope/redaction, roles, cap, explicit boolean, replay/CAS and immutable business data.`);
