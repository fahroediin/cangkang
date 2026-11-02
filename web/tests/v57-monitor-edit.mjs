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
let before=domain();
await act('farm','monitor.filter.save',params);await act('farm','monitor.filter.save',{...params,name:'Second'});
v=await view('farm');const id=v.savedMonitorFilters[0].id,second=v.savedMonitorFilters[1].id;
await act('farm','monitor.filter.rename',{id,name:'  Harian   Baru  ',userId:'farm2',filters:{query:'injected'},source:'ledger'});
v=await view('farm');eq(v.savedMonitorFilters.map(x=>x.id),[id,second]);eq(v.savedMonitorFilters[0].name,'Harian Baru');eq(v.savedMonitorFilters[0].source,'requests');eq(v.savedMonitorFilters[0].filters,filters);eq(domain(),before);
for(const name of ['SECOND','ＳＥＣＯＮＤ','','x'.repeat(61)]){const old=raw();eq((await cmd('farm','monitor.filter.rename',{id,name})).status,422);eq(raw(),old)}
for(const action of ['monitor.filter.rename','monitor.filter.update']){
 const old=raw();eq((await cmd('farm2',action,{id,name:'Theft',source:'ledger',filters:{...filters,status:'all',health:'all'},userId:'farm'})).status,422);eq(raw(),old);
 eq((await cmd('sales',action,{id,name:'Denied',source:'ledger',filters:{...filters,status:'all',health:'all'}})).status,403);
 eq((await cmd('farm',action,{id:'missing',name:'Missing',source:'ledger',filters:{...filters,status:'all',health:'all'}})).status,422);
}
const replacement={...filters,kind:'out',query:'Updated',status:'all',health:'all',ignoredSecret:'strip'};
await act('farm','monitor.filter.update',{id,name:'Injected name',source:'ledger',filters:replacement});
v=await view('farm');eq(v.savedMonitorFilters.length,2);eq(v.savedMonitorFilters[0].id,id);eq(v.savedMonitorFilters[0].name,'Harian Baru');eq(v.savedMonitorFilters[0].source,'ledger');eq(v.savedMonitorFilters[0].filters.query,'Updated');eq(v.savedMonitorFilters[0].filters.ignoredSecret,undefined);eq(domain(),before);
for(const bad of [{source:'bad'},{source:'ledger',filters},{filters:{...replacement,from:'2026-02-30'}},{filters:{...replacement,to:'2025-01-01'}},{filters:{...replacement,house:'missing'}}]){const old=raw();const r=await cmd('farm','monitor.filter.update',{id,source:'ledger',filters:replacement,...bad});assert([403,422].includes(r.status));count++;eq(raw(),old)}
await act('owner','house.assign',{userId:'farm',houses:[]});v=await view('farm');eq(v.savedMonitorFilters[0].available,false);eq(v.savedMonitorFilters[0].filters,undefined);
await act('farm','monitor.filter.rename',{id,name:'Repair needed'});v=await view('farm');eq(v.savedMonitorFilters[0].name,'Repair needed');eq(v.savedMonitorFilters[0].filters,undefined);
const prior=raw();eq((await cmd('farm','monitor.filter.update',{id,source:'ledger',filters:replacement})).status,403);eq(raw(),prior);
await act('farm','monitor.filter.update',{id,source:'ledger',filters:{...replacement,house:''}});v=await view('farm');eq(v.savedMonitorFilters[0].available,true);eq(v.savedMonitorFilters[0].filters.house,'');eq(v.savedMonitorFilters[0].name,'Repair needed');
await act('audit','monitor.filter.save',{name:'Audit',source:'ledger',filters:{...replacement,house:''}});let aid=(await view('audit')).savedMonitorFilters[0].id;
await act('audit','monitor.filter.rename',{id:aid,name:'Audit renamed'});await act('audit','monitor.filter.update',{id:aid,source:'ledger',filters:{...replacement,house:'',query:'audit'}});const ar=raw();eq((await cmd('audit','monitor.filter.update',{id:aid,source:'requests',filters})).status,403);eq(raw(),ar);
for(let i=0;i<8;i++)await act('farm','monitor.filter.save',{name:'Extra '+i,source:'ledger',filters:{...replacement,house:''}});
const ids=(await view('farm')).savedMonitorFilters.map(x=>x.id);await act('farm','monitor.filter.rename',{id,name:'Ten entries'});await act('farm','monitor.filter.update',{id,source:'ledger',filters:{...replacement,house:'',query:'cap'}});eq((await view('farm')).savedMonitorFilters.map(x=>x.id),ids);
v=await view('farm');const body={teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),action:'monitor.filter.rename',params:{id,name:'Replayed'}};eq((await req('farm','action',body)).status,200);const replay=raw();eq((await req('farm','action',body)).status,200);eq(raw(),replay);
v=await view('farm');const race=await Promise.all(['A','B'].map(name=>req('farm','action',{teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),action:'monitor.filter.rename',params:{id,name}})));eq(race.map(x=>x.status).sort(),[200,409]);eq((await view('farm')).savedMonitorFilters.length,10);
const other=await req('farm','create',{name:'Other workspace'});eq(other.status,200);const otherId=other.data.id,ov=await req('farm','view?teamId='+otherId);
for(const action of ['monitor.filter.rename','monitor.filter.update'])eq((await req('farm','action',{teamId:otherId,expectedRevision:ov.data.revision,requestId:crypto.randomUUID(),action,params:{id,userId:'farm',name:'Cross workspace',source:'ledger',filters:{...replacement,house:''}}})).status,422);
await act('owner','house.assign',{userId:'farm',houses:'*'});const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date());await act('farm','request.create',{type:'flock',params:{kind:'in',fromHouseId:null,toHouseId:house.id,date:day,quantity:10,note:'Approval sentinel'}});const rid=(await view('farm')).requests.at(-1).id;
await act('manager','request.approve',{id:rid,reason:'Dokumen cocok'});const approved=(await view()).requests.find(x=>x.id===rid);before=domain();await act('farm','monitor.filter.rename',{id,name:'Final'});await act('farm','monitor.filter.update',{id,source:'requests',filters});eq(domain(),before);eq((await view()).requests.find(x=>x.id===rid),approved);eq(approved.health,'current');
const backup=await req('owner','export?teamId='+teamId);eq('monitorFilterStores' in backup.data,false);eq(JSON.parse(raw()).monitorFilterStores.find(x=>x.userId==='farm').store.schema,1);
await act('owner','member.revoke',{userId:'farm'});eq((await req('farm','view?teamId='+teamId)).status,403);
for(const action of ['monitor.filter.rename','monitor.filter.update'])eq((await req('farm','action',{teamId,expectedRevision:999,requestId:crypto.randomUUID(),action,params:{id,name:'Revoked'}})).status,403);
console.log(`PASS v5.7 saved filter editing: ${count} assertions; ownership, workspace/scope, cap, validation, schema1, replay/CAS and unchanged approval source.`);
