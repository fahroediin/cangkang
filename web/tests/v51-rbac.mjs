import fs from 'node:fs';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker from '../dist/server/index.js';
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync('drizzle/0000_cloud_state.sql','utf8'));
const DB={prepare(q){const make=values=>({async first(){return sql.prepare(q).get(...values)||null},async all(){return {results:sql.prepare(q).all(...values)}},async run(){return {meta:{changes:Number(sql.prepare(q).run(...values).changes)}}}});return {...make([]),bind(...v){return make(v)}}}};
const css=await worker.fetch(new Request('https://farm.test/team.css'),{DB});assert(css.headers.get('content-type').startsWith('text/css'));
const users={owner:'owner@farm.test',fa:'fa@farm.test',qc:'qc@farm.test',dp:'dp@farm.test',om:'om@farm.test',sl:'sl@farm.test',fn:'fn@farm.test',ds:'ds@farm.test',dr:'dr@farm.test',cs:'cs@farm.test',au:'au@farm.test',cu:'cu@farm.test',cu2:'cu2@farm.test',sa:'sa@farm.test',outsider:'out@farm.test'};
let assertions=0;
function eq(a,b){assert.equal(a,b);assertions++}
async function req(user,path,body,extra={}){const r=await worker.fetch(new Request('https://farm.test/api/team/'+path,{method:body?'POST':'GET',headers:{...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':users[user]||user+'@farm.test'}:{}),'content-type':'application/json',...extra},...(body?{body:JSON.stringify(body)}:{})}),{DB});return {status:r.status,data:await r.json()}}
eq((await req(null,'me')).status,401);
const create=await req('owner','create',{name:'Farm uji',displayName:'Pemilik'});eq(create.status,200);const teamId=create.data.id;
const view=async(user='owner')=>{const r=await req(user,'view?teamId='+teamId);eq(r.status,200);return r.data};
async function command(user,action,params={},revision=null,requestId=crypto.randomUUID()){const v=await view(user);return req(user,'action',{teamId,expectedRevision:revision??v.revision,requestId,action,params})}
async function act(user,action,params={}){const r=await command(user,action,params);eq(r.status,200);return r.data}
async function invite(user,role,depots='*',houses='*'){const v=await view();const r=await req('owner','invite',{teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),email:users[user],role,depots,houses,category:'Perorangan'});eq(r.status,200);const joined=await req(user,'join',{teamId,token:r.data.token,displayName:user});eq(joined.status,200);return r.data.token}
eq((await req('outsider','view?teamId='+teamId)).status,403);
eq((await req('owner','create',{name:'Duplikat'})).status,409);
for(const [u,r] of Object.entries({fa:'FA',qc:'QC',dp:'DP',om:'OM',sl:'SL',fn:'FN',ds:'DS',dr:'DR',cs:'CS',au:'AU',cu:'CU',cu2:'CU',sa:'SA'}))await invite(u,r,u==='fa'?['anyer']:'*',u==='fa'?['Kandang A']:'*');
eq((await req('fa','view?teamId='+teamId,undefined,{origin:'https://evil.test'})).status,403);
const v=await view();const inv=await req('owner','invite',{teamId,expectedRevision:v.revision,requestId:crypto.randomUUID(),email:'bad@test.dev',role:'OW',depots:'*',houses:'*'});eq(inv.status,422);
const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta'}).format(new Date());
await act('fa','production.create',{depotId:'anyer',house:'Kandang A',date:day,eggs:160,kg:10,broken:0,feed:10,dead:0});
let lots=(await view('qc')).lots;eq(lots.length,1);const lotId=lots[0].id;eq(lots[0].quality,'Karantina');
eq((await command('fa','production.create',{depotId:'cilegon',house:'Kandang A',date:day,eggs:1,kg:1,broken:0,feed:0,dead:0})).status,403);
eq((await command('fa','lot.quality',{id:lotId,product:0,quality:'Aktif',harvest:day,expiry:day,note:'Lulus'})).status,403);
await act('qc','lot.quality',{id:lotId,product:0,quality:'Aktif',harvest:day,expiry:day,note:'Lulus'});
let current=await view();eq(current.lots[0].kg,10);
const order={depotId:'anyer',name:'Pelanggan A',phone:'08123456789',address:'Anyer',category:'Hotel/Resort',date:day,due:day,lines:[{product:0,unit:'kg',quantity:1}]};
await act('cu','order.create',{...order,role:'OW',lines:[{product:0,unit:'kg',quantity:1,price:1}]});
let cv=await view('cu'),orderId=cv.orders[0].id;eq(cv.orders[0].category,'Perorangan');eq(cv.orders[0].total,24000);eq((await view('cu2')).orders.length,0);eq(cv.lots.length,0);
eq((await command('cu2','case.create',{id:orderId,description:'Mencoba data lain'})).status,403);
eq((await req('cu','export?teamId='+teamId)).status,403);
eq((await view('sa')).orders.length,0);eq((await view('sa')).payments.length,0);eq((await view('sa')).lots.length,0);
eq((await command('sa','payment.post',{id:orderId,amount:1,date:day,reference:'bypass'})).status,403);
const qcv=await view('qc');eq(qcv.orders[0].name,undefined);eq(qcv.orders[0].total,undefined);eq((await view('dp')).orders[0].total,undefined);
eq((await view('dr')).orders.length,0);
await act('ds','courier.assign',{id:orderId,userId:'dr'});
const drv=await view('dr');eq(drv.orders.length,1);eq(drv.orders[0].total,undefined);eq(drv.orders[0].financial,undefined);eq(drv.orders[0].lines[0].price,undefined);
await act('dp','order.pack',{id:orderId,measured:(await view('dp')).orders[0].allocations,note:'Timbang fisik'});
await act('dr','order.dispatch',{id:orderId});await act('dr','order.receive',{id:orderId,recipient:'Penerima'});
await act('fn','payment.post',{id:orderId,amount:24000,date:day,reference:'BANK-01'});
eq((await view('sl')).orders[0].financial.paid,undefined);
eq((await command('fn','payment.post',{id:orderId,amount:1,date:day,reference:'Berlebih'})).status,422);
await act('cs','case.create',{id:orderId,description:'Telur pecah'});const caseId=(await view('cs')).cases[0].id;
await act('cs','request.create',{type:'credit',params:{id:caseId,amount:1000}});
let request=(await view()).requests.find(x=>x.type==='credit');eq(request.fingerprint,undefined);
eq((await view('cs')).requests[0].fingerprint,undefined);
eq((await command('cs','request.approve',{id:request.id,reason:'sendiri'})).status,403);
await act('owner','request.approve',{id:request.id,reason:'Disetujui pemilik'});await act('fn','request.execute',{id:request.id});
eq((await view('fn')).cases[0].credit,1000);
eq((await command('fn','request.execute',{id:request.id})).status,422);
await act('fn','request.create',{type:'refund',params:{id:caseId,amount:1000,reference:'RF-01'}});request=(await view()).requests.find(x=>x.type==='refund');
await act('owner','request.approve',{id:request.id,reason:'Dana boleh dikembalikan'});await act('fn','request.execute',{id:request.id});eq((await view('fn')).cases[0].refund,1000);
await act('dp','request.create',{type:'transfer',params:{id:lotId,to:'cilegon',kg:1,eggs:16,note:'Isi depo'}});request=(await view('om')).requests.find(x=>x.type==='transfer');
await act('om','request.approve',{id:request.id,reason:'Distribusi stok'});await act('dp','request.execute',{id:request.id});
eq((await view()).lots.reduce((a,l)=>a+l.kg,0),9);eq((await view('fa')).lots.length,1);
await act('om','request.create',{type:'correction',params:{id:lotId,kg:1,eggs:16,increase:false,note:'Selisih fisik'}});request=(await view('om')).requests.find(x=>x.type==='correction');
eq((await command('om','request.approve',{id:request.id,reason:'Sendiri'})).status,403);
await act('owner','request.approve',{id:request.id,reason:'Pengganti pemeriksa'});
await act('qc','lot.quality',{id:lotId,product:0,quality:'Karantina',harvest:day,expiry:day,note:'Pemeriksaan ulang'});
eq((await command('dp','request.execute',{id:request.id})).status,409);
eq((await command('cu','member.revoke',{userId:'owner'})).status,403);
eq((await command('owner','member.revoke',{userId:'owner'})).status,422);
let ov=await view();const key=crypto.randomUUID();const body={teamId,expectedRevision:ov.revision,requestId:key,action:'member.revoke',params:{userId:'fa'}};
eq((await req('owner','action',body)).status,200);eq((await req('owner','action',body)).data.replayed,true);eq((await req('owner','action',{...body,params:{userId:'om'}})).status,409);
eq((await req('fa','view?teamId='+teamId)).status,403);
eq((await req('fa','action',{teamId,expectedRevision:ov.revision,requestId:crypto.randomUUID(),action:'production.create',params:{}})).status,403);
eq((await command('owner','anything',{role:'OW'})).status,404);
eq((await command('au','order.receive',{id:orderId,recipient:'evil'})).status,403);
// Legacy personal snapshot endpoint cannot target another owner's team.
const legacy=await worker.fetch(new Request('https://farm.test/api/state?teamId='+teamId,{headers:{'oai-authenticated-user-id':'cu'}}),{DB});eq(legacy.status,200);eq((await legacy.json()).data,null);
// Concurrent writers must not both win the same revision.
ov=await view();const racing=await Promise.all(['cs','sl'].map(u=>req(u,'action',{teamId,expectedRevision:ov.revision,requestId:crypto.randomUUID(),action:'case.create',params:{id:orderId,description:'Concurrent '+u}})));assert.deepEqual(racing.map(x=>x.status).sort(),[200,409]);assertions++;
const memberList=await req('owner','me');eq(memberList.data.teams.length,1);
// Revoked invitation, email binding, scope narrowing, and current rights at execution.
users.pending='pending@farm.test';ov=await view();
const invitation=await req('owner','invite',{teamId,expectedRevision:ov.revision,requestId:crypto.randomUUID(),email:users.pending,role:'DP',depots:['anyer'],houses:[]});eq(invitation.status,200);
eq((await req('outsider','join',{teamId,token:invitation.data.token})).status,403);
const iid=(await view()).invitations.find(i=>i.email===users.pending).id;await act('owner','invite.revoke',{id:iid});eq((await req('pending','join',{teamId,token:invitation.data.token})).status,403);
await invite('fa','QC','*','*');
const child=(await view()).lots.find(l=>l.parentId===lotId);
eq((await command('fa','lot.quality',{id:child.id,product:0,quality:'Aktif',harvest:day,expiry:day,note:'Self release after role change'})).status,403);
// Configure a depot through a separate maker and approver.
await act('om','request.create',{type:'depot',params:{id:'anyer',lat:-6.064,lng:105.901,radius:10,verified:true}});
request=(await view()).requests.find(r=>r.type==='depot');await act('owner','request.approve',{id:request.id,reason:'Koordinat diperiksa'});await act('om','request.execute',{id:request.id});eq((await view()).depots.find(d=>d.id==='anyer').verified,true);
const recommended=await req('cu','recommend',{teamId,params:{date:day,lines:[{product:0,unit:'kg',quantity:0.1}],location:{lat:-6.064,lng:105.901}}});eq(recommended.status,200);assert(recommended.data.depots.some(d=>d.available));assertions++;assert(recommended.data.depots.every(d=>typeof d.available==='boolean'&&!Object.hasOwn(d,'lots')));assertions++;
eq((await req('cu','recommend',{teamId,params:{date:day,lines:[{product:0,unit:'kg',quantity:1}],location:{lat:999,lng:0}}})).status,422);
eq((await req('sa','recommend',{teamId,params:{}})).status,403);
const report=await req('au','export?teamId='+teamId);eq(report.status,200);eq(report.data.kind,'scoped-report');
const backup=await req('owner','export?teamId='+teamId);eq(backup.status,200);eq(backup.data.app,'TelurFarm Native');eq(backup.data.members,undefined);
console.log(`PASS v5.1 RBAC: ${assertions} assertions; real SQLite, all 13 roles, scoped projections, CU/DR isolation, price integrity, approvals, stale-source rejection, revocation, replay and concurrent writes.`);
