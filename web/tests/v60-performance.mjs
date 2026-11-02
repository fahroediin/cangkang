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
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date()),yesterday=new Date(Date.parse(today+'T12:00:00Z')-86400000).toISOString().slice(0,10);
await act('farm','production.create',{houseId:house.id,depotId:'anyer',date:yesterday,eggs:100,kg:6,broken:2,feed:12,dead:1});await act('farm','production.create',{houseId:house.id,depotId:'anyer',date:today,eggs:60,kg:3,broken:1,feed:8,dead:0});
const report=async(u='owner',over={})=>req(u,'performance?'+new URLSearchParams({teamId,from:yesterday,to:today,house:house.id,...over}));
const before=raw();for(const u of ['owner','farm','manager','audit']){const r=await report(u);eq(r.status,200);eq(r.data.days,2);eq(r.data.rows.length,1);eq(r.data.rows[0].population,99);eq(r.data.rows[0].eggs,160);eq(r.data.rows[0].kg,9);eq(r.data.rows[0].feed,20);eq(r.data.rows[0].dead,1);eq(r.data.rows[0].broken,3);eq(r.data.rows[0].recordedDays,2);eq(r.data.rows[0].coveragePercent,100);eq(r.data.rows[0].eggsPerRecordedDay,80);eq(r.data.rows[0].feedPerKg,20/9);eq(r.data.summary.population,99);eq(r.data.summary.eggs,160);eq(r.data.summary.coveragePercent,100)}eq(raw(),before);
for(const u of ['sales','outside']){const r=await report(u);eq(r.status,u==='sales'?403:422)}
for(const over of [{from:'2026-02-30'},{from:today,to:yesterday},{from:'2020-01-01'},{house:'unknown'},{from:''}]){const old=raw();eq((await report('farm',over)).status,422);eq(raw(),old)}
const future=new Date(Date.parse(today+'T12:00:00Z')+86400000).toISOString().slice(0,10),empty=await report('farm',{from:future,to:future});eq(empty.status,200);eq(empty.data.rows[0].eggs,0);eq(empty.data.rows[0].eggsPerRecordedDay,null);eq(empty.data.rows[0].feedPerKg,null);eq(empty.data.rows[0].missingDays,1);eq(empty.data.rows[0].population,99);
const all=await report('owner',{house:''});eq(all.status,200);eq(all.data.summary.population,null);assert(all.data.summary.populationMissing>0);count++;
await act('owner','house.assign',{userId:'farm',houses:[]});eq((await report('farm')).status,422);const noHouses=await report('farm',{house:''});eq(noHouses.status,200);eq(noHouses.data.rows,[]);eq(noHouses.data.summary.eggs,0);eq(noHouses.data.summary.coveragePercent,null);
await act('owner','house.assign',{userId:'farm',houses:'*'});eq((await report('farm')).data.summary.eggs,160);
// The same user cannot read another workspace without membership.
const other=await req('other','create',{name:'Other farm'});eq(other.status,200);eq((await req('farm','performance?'+new URLSearchParams({teamId:other.data.id,from:yesterday,to:today,house:''}))).status,403);
// Report GET neither mutates preferences nor invalidates approval fingerprints.
await act('farm','request.create',{type:'flock',params:{kind:'in',fromHouseId:null,toHouseId:house.id,date:today,quantity:1,note:'Read-only sentinel'}});const rid=(await view('farm')).requests.at(-1).id;await act('manager','request.approve',{id:rid,reason:'Cocok'});const approved=(await view()).requests.find(x=>x.id===rid),old=raw();await report('audit');eq(raw(),old);eq((await view()).requests.find(x=>x.id===rid),approved);eq(approved.health,'current');
await act('owner','member.revoke',{userId:'farm'});eq((await report('farm')).status,403);
console.log(`PASS v6.0 performance: ${count} assertions; calculations, current population, distinct recorded days, empty/unknown, scope/role/workspace, period validation and read-only approval source.`);
