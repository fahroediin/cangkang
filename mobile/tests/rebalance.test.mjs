import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as native from '../src/stock-alerts.ts';
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('./fixtures/stock-alerts.web.js',import.meta.url),'utf8'),ctx);
const clean=x=>JSON.parse(JSON.stringify(x));
function report(balances,minKg=20){return {balances,low:balances.filter(b=>b.kg<minKg),expiring:[],review:[],day:'2026-10-27',end:'2026-10-30',minKg,horizon:3}}
const b=(depot,kg,product=0)=>({depot,kg,product,eggs:Math.floor(kg*16)});
const stamp='2026-10-27T06:00:00Z';
for(const [name,api] of [['native',native],['web',ctx]]){
 test(name+': transfer fills shortages without emptying donor threshold or changing input',()=>{
 const r=report([b('A',50),b('B',5),b('C',10)]),before=JSON.stringify(r),p=api.rebalanceStock(r);
 assert.deepEqual(clean(p.moves),[{from:'A',to:'B',product:0,kg:15},{from:'A',to:'C',product:0,kg:10}]);assert.equal(p.totalKg,25);assert.equal(p.unfilledKg,0);assert.equal(JSON.stringify(r),before);
 });
 test(name+': insufficient surplus and separate variants remain explicit',()=>{
 const p=api.rebalanceStock(report([b('A',25),b('B',0),b('A',100,1),b('B',20,1)]));
 assert.equal(p.totalKg,5);assert.equal(p.unfilledKg,15);assert.deepEqual(clean(p.unfilled),[{depot:'B',product:0,kg:15}]);assert(p.moves.every(m=>m.product===0&&m.from!==m.to));
 });
 test(name+': no surplus, exact threshold, zero threshold and scoped depot',()=>{
 assert.equal(api.rebalanceStock(report([b('A',20),b('B',20)])).moves.length,0);
 assert.equal(api.rebalanceStock(report([b('A',10)])).unfilledKg,10);
 assert.equal(api.rebalanceStock(report([b('A',0),b('B',50)],0)).totalKg,0);
 assert.equal(api.rebalanceStock(report([])).totalKg,0);
 const p=api.rebalanceStock(report([b('A',20.3),b('B',19.7)]));assert.equal(p.totalKg,.3);assert.equal(p.unfilledKg,0);
 });
 test(name+': simulation excludes quarantined, expired, future harvest and out of scope lots',()=>{
 const lot=(id,extra={})=>({id,depot:'A',product:0,kg:50,eggs:800,harvest:'2026-10-20',expiry:'2026-11-01',status:'Aktif',approved:true,...extra});
 const lots=[lot('q',{status:'Karantina'}),lot('e',{expiry:'2026-10-26'}),lot('f',{harvest:'2026-10-28'}),lot('outside',{depot:'Z'}),lot('good',{kg:25,eggs:400})];
 const p=api.rebalanceStock(api.stockAlerts(['A','B'],lots,'2026-10-27',20,3));assert.equal(p.totalKg,5);assert.equal(p.moves[0].from,'A');assert.equal(p.moves[0].to,'B');assert(p.moves.every(m=>m.product===0));
 });
 test(name+': exports state manual simulation, escape text, and retain scope for no-move report',()=>{
 const r=report([b('A',30),b('B',10)]),csv=api.transferPlanCsv(r,id=>id==='A'?'=SUM(1,2)':'Hotel,"B"','All',stamp),html=api.transferPlanHtml(r,()=>'<img src=x>');
 assert(csv.includes("\"'=SUM(1,2)\""));assert(csv.includes('"Hotel,""B"""'));assert(csv.includes('2026-10-27'));assert(csv.includes('tidak mengubah stok'));assert(!html.includes('<img '));assert(html.includes('&lt;img'));assert(html.includes('tidak memilih batch'));
 const empty=api.transferPlanCsv(report([b('A',20)]),id=>id,'Depo A',stamp);assert(empty.includes('Tidak ada usulan'));assert(empty.includes('Depo A'));assert(empty.includes(stamp));
 });
 test(name+': conservation and donor/receiver limits across many stock distributions',()=>{
 for(let seed=1;seed<=60;seed++){
 const balances=['A','B','C','D'].flatMap((d,i)=>[0,1,2].map(p=>b(d,((seed*(i+3)*(p+7))%601)/10,p))),r=report(balances),plan=api.rebalanceStock(r),state=new Map(balances.map(x=>[x.depot+'-'+x.product,x.kg]));
 for(const m of plan.moves){assert(m.kg>0);assert.notEqual(m.from,m.to);state.set(m.from+'-'+m.product,state.get(m.from+'-'+m.product)-m.kg);state.set(m.to+'-'+m.product,state.get(m.to+'-'+m.product)+m.kg)}
 for(const x of balances){const after=state.get(x.depot+'-'+x.product);if(x.kg>20)assert(after>=20-1e-6);if(x.kg<20)assert(after<=20+1e-6);assert(after>=0)}
 const before=balances.reduce((s,x)=>s+x.kg,0),after=[...state.values()].reduce((s,x)=>s+x,0);assert(Math.abs(before-after)<1e-6);
 }
 });
}
test('web and native simulation and exports match',()=>{const r=report([b('A',25),b('B',1),b('C',100,2),b('D',0,2)]);assert.deepEqual(clean(native.rebalanceStock(r)),clean(ctx.rebalanceStock(r)));assert.equal(native.transferPlanCsv(r,id=>id,'All',stamp),ctx.transferPlanCsv(r,id=>id,'All',stamp));assert.equal(native.transferPlanHtml(r,id=>id),ctx.transferPlanHtml(r,id=>id));});
