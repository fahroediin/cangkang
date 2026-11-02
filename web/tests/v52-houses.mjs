import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.js';
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0000_cloud_state.sql','utf8'));
const DB={prepare(q){const make=v=>({async first(){return sql.prepare(q).get(...v)||null},async all(){return {results:sql.prepare(q).all(...v)}},async run(){return {meta:{changes:Number(sql.prepare(q).run(...v).changes)}}}});return {...make([]),bind(...v){return make(v)}}}};
let count=0;const eq=(a,b)=>{assert.equal(a,b);count++};
async function req(user,path,body){const r=await worker.fetch(new Request('https://farm.test/api/team/'+path,{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@farm.test','content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),{DB});return {status:r.status,data:await r.json()}}
const created=await req('owner','create',{name:'Farm master kandang'});eq(created.status,200);const teamId=created.data.id;
const view=async(u='owner')=>{const r=await req(u,'view?teamId='+teamId);eq(r.status,200);return r.data};
async function cmd(u,action,params={},revision=null,id=crypto.randomUUID()){const v=await view(u);return req(u,'action',{teamId,expectedRevision:revision??v.revision,requestId:id,action,params})}
async function act(u,a,p){const r=await cmd(u,a,p);if(r.status!==200)console.log(r.data);eq(r.status,200);return r.data}
async function invite(u,role,depots,houses){const v=await view();const r=await req('owner','invite',{teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),email:u+'@farm.test',role,depots,houses});eq(r.status,200);eq((await req(u,'join',{teamId,token:r.data.token})).status,200)}
await invite('operator','FA',['anyer'],['Kandang A']);await invite('sales','SL','*','*');await invite('manager','OM',['cilegon'],'*');await invite('auditor','AU','*','*');
const master={code:'KDG-D',name:'Kandang D',farmLocation:'Farm Anyer Timur',depotId:'anyer',capacity:5000,initialPopulation:4000};
eq((await cmd('sales','house.create',master)).status,403);eq((await cmd('operator','house.create',master)).status,403);eq((await cmd('manager','house.create',master)).status,403);
await act('owner','house.create',master);let h=(await view()).houses.find(h=>h.code==='KDG-D');assert(h);count++;eq(h.active,true);eq((await view('operator')).houses.some(x=>x.id===h.id),false);
const raw=()=>sql.prepare('SELECT payload FROM telurfarm_teams WHERE id=?').get(teamId).payload;
for(const p of [{...master},{...master,code:'OTHER',name:'Ｋａｎｄａｎｇ D'},{...master,code:'D2',name:'D2',capacity:1.5},{...master,code:'D2',name:'D2',initialPopulation:6000}]){const before=raw();eq((await cmd('owner','house.create',p)).status,422);eq(raw(),before)}
const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date());
const production={houseId:h.id,depotId:'anyer',date:day,kg:10,eggs:160,broken:0,feed:10,dead:2};
eq((await cmd('operator','production.create',production)).status,403);
await act('owner','house.assign',{userId:'operator',houses:[h.id]});eq((await view('operator')).houses.length,1);eq((await view('operator')).houses[0].id,h.id);
await act('operator','production.create',production);let history=(await view()).production;eq(history[0].house,'Kandang D');eq(history[0].houseId,h.id);eq((await view()).houses.find(x=>x.id===h.id).population,3998);
await act('owner','house.update',{...master,id:h.id,name:'Kandang Timur'});eq((await view()).production[0].house,'Kandang D');eq((await cmd('operator','production.create',production)).status,422);
eq((await cmd('owner','house.update',{...master,id:h.id,name:'Kandang Timur',initialPopulation:4500})).status,422);
eq((await cmd('owner','house.update',{...master,id:h.id,name:'Kandang Timur',depotId:'cilegon'})).status,422);
await act('owner','house.status',{id:h.id,active:false});const before=raw();eq((await cmd('operator','production.create',{...production,date:'2026-01-01'})).status,422);eq(raw(),before);eq((await view()).production.length,1);
await act('owner','house.status',{id:h.id,active:true});eq((await cmd('operator','production.create',{...production,date:'2026-01-01',depotId:'cilegon'})).status,403);
eq((await cmd('operator','production.create',{...production,date:'2026-01-01',dead:4001})).status,422);
eq((await cmd('operator','production.create',{...production,houseId:'invented'})).status,403);
eq((await cmd('operator','house.assign',{userId:'operator',houses:'*'})).status,403);eq((await cmd('auditor','house.status',{id:h.id,active:false})).status,403);
// Scope narrowing takes effect without re-login; existing records remain for owner.
await act('owner','house.assign',{userId:'operator',houses:[]});eq((await view('operator')).production.length,0);eq((await view('operator')).houses.length,0);eq((await cmd('operator','production.create',{...production,date:'2026-01-01'})).status,403);
await act('manager','house.create',{...master,code:'KDG-E',name:'Kandang E',depotId:'cilegon'});const e=(await view('manager')).houses.find(x=>x.code==='KDG-E');assert(e);count++;
eq((await cmd('owner','house.assign',{userId:'operator',houses:[e.id]})).status,422);
// Two writers with the same revision cannot both overwrite a master.
const v=await view();const race=await Promise.all([true,false].map(active=>req('owner','action',{teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),action:'house.status',params:{id:h.id,active}})));assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);count++;
await act('owner','house.assign',{userId:'operator',houses:'*'});eq((await view('operator')).houses.some(h=>h.id===e.id),false);eq((await cmd('operator','production.create',{...production,houseId:e.id,depotId:'cilegon',date:'2026-01-01'})).status,403);
// Existing 5.1 payload: lazy, deterministic migration; GET never rewrites data.
const old=JSON.parse(raw());delete old.data.houses;delete old.houseAccessVersion;old.members.find(m=>m.userId==='operator').houses=['Kandang A'];old.data.production[0].house='Kandang A';delete old.data.production[0].houseId;
sql.prepare('UPDATE telurfarm_teams SET payload=? WHERE id=?').run(JSON.stringify(old),teamId);const beforeRead=raw();const upgraded=await view('operator');eq(upgraded.houses[0].id,'house-a');eq(upgraded.production[0].houseId,'house-a');eq(upgraded.production[0].kg,10);eq(raw(),beforeRead);
await act('owner','house.assign',{userId:'operator',houses:['house-a']});const saved=JSON.parse(raw());eq(saved.houseAccessVersion,1);eq(saved.data.production[0].houseId,'house-a');eq(saved.members.find(m=>m.userId==='operator').houses[0],'house-a');
const backup=await req('owner','export?teamId='+teamId);eq(backup.status,200);assert(backup.data.houses.length>=3);count++;
console.log(`PASS v5.2 Master Kandang: ${count} assertions; role/scope, create/edit/status, assignment, history, stable ID, migration, validation, population and concurrent CAS.`);
