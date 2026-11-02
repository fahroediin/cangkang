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
await invite('farm','FA',['anyer']);await invite('manager','OM',['anyer']);await invite('outside','OM',['cilegon']);await invite('reviewer','OM');
for(const role of ['SA','QC','DP','SL','FN','DS','DR','CS','AU','CU'])await invite(role,role);
for(const [code,depotId] of [['A54','anyer'],['B54','anyer'],['C54','cilegon']])await act('owner','house.create',{code,name:code,farmLocation:'Farm UAT',depotId,capacity:200,initialPopulation:100});
let v=await view();const [a,b,c]=['A54','B54','C54'].map(code=>v.houses.find(h=>h.code===code));
const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date());
const p={date:day,kind:'transfer',fromHouseId:a.id,toHouseId:b.id,quantity:20,note:'Pindah terkontrol'};
const raw=()=>sql.prepare('SELECT payload FROM telurfarm_teams WHERE id=?').get(teamId).payload;
const population=async id=>(await view()).houses.find(h=>h.id===id).population;
async function create(u,params=p){await act(u,'request.create',{type:'flock',params});return (await view(u)).requests.at(-1).id}
async function approve(id,u='owner'){await act(u,'request.approve',{id,reason:'Cocok dengan dokumen'})}
// All 13 roles: only OW/OM/FA may propose; no one can use the old direct route.
for(const u of ['owner','manager','farm','SA','QC','DP','SL','FN','DS','DR','CS','AU','CU']){const before=raw();eq((await cmd(u,'flock.create',p)).status,403);eq(raw(),before)}
for(const u of ['SA','QC','DP','SL','FN','DS','DR','CS','AU','CU']){const before=raw();eq((await cmd(u,'request.create',{type:'flock',params:p})).status,403);eq(raw(),before)}
const id=await create('farm',{...p,newId:'injected',fromName:'Forged',quantity:20});eq(await population(a.id),100);eq((await view()).flockMovements.length,0);v=await view();let r=v.requests.find(r=>r.id===id);eq(r.status,'pending');eq(r.params.fromName,undefined);assert.notEqual(r.params.newId,'injected');count++;
eq((await cmd('farm','request.approve',{id,reason:'Self'})).status,403);eq((await cmd('manager','request.execute',{id})).status,422);
await approve(id);eq(await population(a.id),100);eq((await cmd('farm','request.execute',{id})).status,403);
await act('manager','request.execute',{id,quantity:199,note:'ignored'});eq(await population(a.id),80);eq(await population(b.id),120);v=await view();const movement=v.flockMovements[0];eq(movement.quantity,20);eq(movement.approval.requestId,id);eq(movement.approval.maker,'farm');eq(movement.approval.approver,'owner');eq(movement.approval.executor,'manager');eq(v.requests.find(r=>r.id===id).status,'executed');eq((await cmd('manager','request.execute',{id})).status,422);
// Own management request cannot be self-approved; reject/withdraw never affect balances.
const own=await create('owner');eq((await cmd('owner','request.approve',{id:own,reason:'Self'})).status,403);eq((await cmd('owner','request.reject',{id:own,reason:'Self'})).status,403);await act('reviewer','request.reject',{id:own,reason:'Dokumen belum lengkap'});eq((await cmd('manager','request.execute',{id:own})).status,422);eq(await population(a.id),80);
const withdrawn=await create('farm');eq((await cmd('manager','request.withdraw',{id:withdrawn})).status,403);await act('farm','request.withdraw',{id:withdrawn});eq((await cmd('owner','request.approve',{id:withdrawn,reason:'Sudah ditarik'})).status,422);eq(await population(a.id),80);
// Changed source prevents both approval and execution. Population stays intact.
const stale=await create('farm');await act('owner','house.update',{...a,name:'Nama A54 baru'});eq((await cmd('owner','request.approve',{id:stale,reason:'Data sudah berubah'})).status,409);await act('farm','request.withdraw',{id:stale});
const stale2=await create('farm');await approve(stale2);await act('farm','production.create',{date:day,houseId:a.id,depotId:'anyer',eggs:0,kg:0,broken:0,feed:0,dead:1});const before=raw();eq((await cmd('manager','request.execute',{id:stale2})).status,409);eq(raw(),before);eq(await population(a.id),79);await act('farm','request.withdraw',{id:stale2});
// Cross-depot source and hidden request data cannot be reached.
eq((await cmd('farm','request.create',{type:'flock',params:{...p,toHouseId:c.id}})).status,403);const scoped=await create('farm');eq((await cmd('outside','request.approve',{id:scoped,reason:'Di luar cakupan'})).status,403);eq((await view('outside')).requests.some(r=>r.id===scoped),false);
await approve(scoped);await act('owner','house.assign',{userId:'farm',houses:[b.id]});eq((await cmd('manager','request.execute',{id:scoped})).status,403);eq((await view('farm')).requests.some(r=>r.id===scoped),false);await act('owner','house.assign',{userId:'farm',houses:'*'});await act('farm','request.withdraw',{id:scoped});
// Maker/approver revocation is rechecked at approval and execution.
await invite('maker2','FA',['anyer']);const revokedMaker=await create('maker2');await act('owner','member.revoke',{userId:'maker2'});eq((await cmd('owner','request.approve',{id:revokedMaker,reason:'Pembuat dicabut'})).status,403);
const revokedApprover=await create('farm');await approve(revokedApprover,'reviewer');await act('owner','member.revoke',{userId:'reviewer'});eq((await cmd('manager','request.execute',{id:revokedApprover})).status,403);await act('farm','request.withdraw',{id:revokedApprover});
// Both in and out execute via approval; legacy records remain readable without fabricated approvals.
for(const item of [{kind:'in',fromHouseId:null,toHouseId:b.id,quantity:5},{kind:'out',fromHouseId:a.id,toHouseId:null,quantity:3}]){const rid=await create('farm',{...p,...item});await approve(rid);await act('manager','request.execute',{id:rid})}
eq(await population(a.id),76);eq(await population(b.id),125);eq((await view('AU')).flockMovements.length,3);eq((await view('SL')).flockMovements,[]);
const payload=JSON.parse(raw());delete payload.flockApprovals;sql.prepare('UPDATE telurfarm_teams SET payload=? WHERE id=?').run(JSON.stringify(payload),teamId);v=await view();eq(v.flockMovements.length,3);eq(v.flockMovements[0].approval,undefined);
console.log(`PASS v5.4 population approvals: ${count} assertions; all 13 roles, no direct bypass, pending/approved balances unchanged, self-approval guard, reject/withdraw, immutable params, stale source, current scopes, revocations and legacy history.`);
