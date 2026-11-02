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
let before=domain();eq((await view('farm')).savedMonitorFilters,[]);await act('farm','monitor.filter.save',{...params,userId:'farm2'});eq(domain(),before);
v=await view('farm');let saved=v.savedMonitorFilters[0];eq(saved.name,params.name);eq(saved.available,true);eq(saved.filters.query,'Sample');eq((await view('farm2')).savedMonitorFilters,[]);eq((await view()).savedMonitorFilters,[]);eq((await view('audit')).savedMonitorFilters,[]);
for(const u of ['sales']){const old=raw();eq((await cmd(u,'monitor.filter.save',params)).status,403);eq(raw(),old)}
eq((await cmd('farm2','monitor.filter.delete',{id:saved.id,userId:'farm'})).status,422);eq((await view('farm')).savedMonitorFilters.length,1);
// Preferences never invalidate the approved population source.
const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date());await act('farm','request.create',{type:'flock',params:{kind:'in',fromHouseId:null,toHouseId:house.id,date:day,quantity:10,note:'Sample'}});const request=(await view('farm')).requests.at(-1);before=domain();await act('manager','monitor.filter.save',params);eq(domain(),before);eq((await view()).requests.find(r=>r.id===request.id).health,'current');
for(const over of [{name:'ＭＥＮＵＮＧＧＵ  MASUK'},{name:''},{name:'x'.repeat(61)},{source:'bad'},{filters:{...filters,from:'bad'}},{filters:{...filters,house:'unknown'}}]){const old=raw();const res=await cmd('farm','monitor.filter.save',{...params,...over});assert([403,422].includes(res.status));count++;eq(raw(),old)}
eq((await cmd('outside','monitor.filter.save',params)).status,403);
await act('audit','monitor.filter.save',{name:'Ledger',source:'ledger',filters:{...filters,status:'all',health:'all'}});eq((await cmd('audit','monitor.filter.save',{...params,name:'Hidden requests'})).status,403);
// Scope narrowing hides saved criteria but retains owner's name and delete ability.
await act('owner','house.assign',{userId:'farm',houses:[]});v=await view('farm');eq(v.savedMonitorFilters[0].available,false);eq(v.savedMonitorFilters[0].filters,undefined);eq(v.savedMonitorFilters[0].name,params.name);eq((await cmd('farm','monitor.filter.save',{...params,name:'Again'})).status,403);await act('farm','monitor.filter.delete',{id:saved.id});eq((await view('farm')).savedMonitorFilters,[]);
await act('owner','house.assign',{userId:'farm',houses:'*'});
// Same account in another workspace has a separate list.
const other=await req('other','create',{name:'Other workspace'});eq(other.status,200);const tid=other.data.id;let ov=await req('other','view?teamId='+tid);const inv=await req('other','invite',{teamId:tid,expectedRevision:ov.data.revision,requestId:crypto.randomUUID(),email:'farm@farm.test',role:'FA',depots:'*',houses:'*'});eq(inv.status,200);eq((await req('farm','join',{teamId:tid,token:inv.data.token})).status,200);eq((await req('farm','view?teamId='+tid)).data.savedMonitorFilters,[]);
// Ten entries, duplicate guard, replay and CAS.
for(let i=0;i<9;i++)await act('farm','monitor.filter.save',{...params,name:'Filter '+i});
v=await view('farm');const body={teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),action:'monitor.filter.save',params:{...params,name:'Final'}};eq((await req('farm','action',body)).status,200);eq((await req('farm','action',body)).status,200);eq((await view('farm')).savedMonitorFilters.length,10);eq((await cmd('farm','monitor.filter.save',{...params,name:'Eleven'})).status,422);
const toDelete=(await view('farm')).savedMonitorFilters[0].id;v=await view('farm');const race=await Promise.all([1,2].map(i=>req('farm','action',{teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),action:'monitor.filter.delete',params:{id:toDelete}})));eq(race.map(r=>r.status).sort(),[200,409]);
const beforeRead=raw();await view('farm');eq(raw(),beforeRead);const backup=await req('owner','export?teamId='+teamId);eq('monitorFilterStores' in backup.data,false);
await act('owner','member.revoke',{userId:'farm'});eq((await req('farm','view?teamId='+teamId)).status,403);
console.log(`PASS v5.6 saved monitor filters: ${count} assertions; identity/workspace isolation, scope recheck/redaction, role, validation, cap, delete, immutable transactions, unchanged approval source, replay/CAS and revocation.`);
