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
await invite('farm','FA',['anyer']);await invite('manager','OM',['anyer']);await invite('audit','AU');await invite('sales','SL');await invite('outside','OM',['cilegon']);
for(const [code,depotId] of [['A55','anyer'],['B55','anyer'],['C55','cilegon']])await act('owner','house.create',{code,name:code,farmLocation:'Farm UAT',depotId,capacity:200,initialPopulation:100});
let v=await view();const [a,b,c]=['A55','B55','C55'].map(code=>v.houses.find(h=>h.code===code));
const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date());
const p={date:day,kind:'transfer',fromHouseId:a.id,toHouseId:b.id,quantity:20,note:'Pindah terkontrol'};
const raw=()=>sql.prepare('SELECT payload FROM telurfarm_teams WHERE id=?').get(teamId).payload;
async function create(u,params=p){await act(u,'request.create',{type:'flock',params});return (await view(u)).requests.at(-1).id}
const health=async id=>(await view()).requests.find(r=>r.id===id).health;
const id=await create('farm');let before=raw();eq(await health(id),'current');eq(raw(),before);eq((await view('outside')).requests.length,0);eq((await view('audit')).requests.length,0);eq((await view('sales')).requests.length,0);
await act('owner','request.approve',{id,reason:'Diperiksa'});eq(await health(id),'current');await act('owner','house.update',{...a,name:'Nama baru A55'});before=raw();eq(await health(id),'changed');eq(raw(),before);eq((await cmd('manager','request.execute',{id})).status,409);
await act('farm','request.withdraw',{id});eq(await health(id),'closed');
const rejected=await create('farm');await act('owner','request.reject',{id:rejected,reason:'Tolak uji'});eq(await health(rejected),'closed');
await invite('maker2','FA',['anyer']);const blockedMaker=await create('maker2');await act('owner','member.revoke',{userId:'maker2'});before=raw();eq(await health(blockedMaker),'blocked');eq(raw(),before);
const blockedApprover=await create('farm');await act('manager','request.approve',{id:blockedApprover,reason:'Diperiksa'});await act('owner','member.revoke',{userId:'manager'});eq(await health(blockedApprover),'blocked');
const scope=await create('farm');await act('owner','house.assign',{userId:'farm',houses:[b.id]});eq((await view('farm')).requests.some(r=>r.id===scope),false);eq(await health(scope),'blocked');
// Requests and health stay confined to existing projection; no source fingerprint exposed.
v=await view();eq(v.requests.some(r=>'fingerprint' in r),false);eq((await view('farm')).houses.some(h=>h.id===a.id),false);eq((await view('sales')).houses,[]);
// Shared report runtime parity: exact filtering and CSV behavior in generated browser script.
const vm=await import('node:vm');const FR=vm.runInNewContext(fs.readFileSync('web/flock-report.js','utf8')+';FR');
const rows=[{id:'r1',date:day,kind:'transfer',fromHouseId:null,toHouseId:b.id,fromName:'Di luar cakupan',toName:'B55',quantity:20,note:'Catatan dibatasi',status:'executed',health:'closed'}];
const filters=FR.emptyMonitorFilters();const filtered=FR.filterMonitorRows(rows,filters,[b.id]);eq(filtered.length,1);const csv=FR.monitorCsv(filtered,filters,[b.id],{workspace:'Farm',role:'FA',source:'Mutasi',generated:day});eq(csv.includes('Di luar cakupan'),true);eq(csv.includes('Nama baru A55'),false);eq(csv.includes('C55'),false);eq(csv.includes('Pindah terkontrol'),false);eq(JSON.stringify(rows),JSON.stringify(filtered));
const asset=await worker.fetch(new Request('https://farm.test/flock-report.js'),{DB});eq(asset.status,200);eq((await asset.text()).includes('filterMonitorRows'),true);
console.log(`PASS v5.5 monitor: ${count} assertions; current/changed/blocked/closed indicators, read-only GET, role/scope isolation, no hidden fingerprint, scoped CSV and browser report runtime.`);
