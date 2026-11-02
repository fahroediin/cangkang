import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as native from '../src/stock-alerts.ts';
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('./fixtures/stock-alerts.web.js',import.meta.url),'utf8'),ctx);
const clean=x=>JSON.parse(JSON.stringify(x));
const lot=(id,kg,extra={})=>({id,depot:'A',product:0,kg,eggs:Math.max(1,Math.round(kg*16)),harvest:'2026-10-20',expiry:'2026-11-10',status:'Aktif',approved:true,...extra});
const report=(api,lots,depots=['A','B','C'],threshold=20)=>api.stockAlerts(depots,lots,'2026-10-27',threshold,3);
const stamp='2026-10-27T07:00:00Z';
function sample(){return [lot('late',20),lot('early',5,{expiry:'2026-10-28'}),lot('middle',25,{expiry:'2026-11-02'}),lot('unknown',10,{expiry:''}),lot('receiver',5,{depot:'C'})]}
for(const [name,api] of [['native',native],['web',ctx]]){
 test(name+': FEFO splits one source lot across receivers without reserving twice',()=>{
 const lots=sample(),r=report(api,lots),before=JSON.stringify({r,lots}),p=api.batchTransferPlan(r,lots);
 assert.deepEqual(clean(p.allocations).map(a=>[a.lotId,a.to,a.kg]),[['early','B',5],['middle','B',15],['middle','C',10],['late','C',5]]);
 assert.equal(p.allocatedKg,35);assert.equal(p.unallocatedKg,0);assert.equal(JSON.stringify({r,lots}),before);
 for(const l of lots)assert(p.allocations.filter(a=>a.lotId===l.id).reduce((s,a)=>s+a.kg,0)<=l.kg);
 });
 test(name+': missing dates follow known dates; harvest and ID break equal expiry ties',()=>{
 const lots=[lot('unknown',30,{expiry:'',harvest:''}),lot('Z',5,{harvest:''}),lot('B',5),lot('A',5),lot('max-date',5,{expiry:'9999-12-31'})];
 const p=api.batchTransferPlan(report(api,lots,['A','B']),lots);assert.deepEqual(clean(p.allocations).map(a=>a.lotId),['A','B','Z','max-date']);
 });
 test(name+': revoked, quarantined, blocked, future, expired, null variant, and zero eggs excluded',()=>{
 const bad=[lot('revoked',100,{approved:false}),lot('q',100,{status:'Karantina'}),lot('b',100,{status:'Diblokir'}),lot('future',100,{harvest:'2026-10-28'}),lot('expired',100,{expiry:'2026-10-26'}),lot('null',100,{product:null}),lot('empty-eggs',100,{eggs:0})],lots=[...bad,lot('today',25,{expiry:'2026-10-27'})];
 const p=api.batchTransferPlan(report(api,lots,['A','B']),lots);assert.equal(p.allocatedKg,5);assert(p.allocations.every(a=>a.lotId==='today'));
 });
 test(name+': variants and filter scopes do not cross; partial source stays above threshold',()=>{
 const lots=[lot('A0',50),lot('A1',100,{product:1}),lot('B1',20,{depot:'B',product:1})];
 const scoped=api.batchTransferPlan(report(api,lots,['B']),lots);assert.equal(scoped.allocations.length,0);
 const p=api.batchTransferPlan(report(api,lots,['A','B']),lots);assert.equal(p.allocations.filter(a=>a.product===0).reduce((s,a)=>s+a.kg,0),20);assert(p.allocations.every(a=>a.product===0||a.product===2));
 });
 test(name+': stale source or receiver never exhausts donor reserve or overfills receiver',()=>{
 const original=[lot('L',50)],r=report(api,original,['A','B']);
 const reduced=[lot('L',25)],p=api.batchTransferPlan(r,reduced);assert.equal(p.allocatedKg,5);assert.equal(p.unallocatedKg,15);
 assert.equal(api.batchTransferPlan(r,[lot('L',10)]).allocatedKg,0);
 assert.equal(api.batchTransferPlan(r,[lot('L',50),lot('received',20,{depot:'B'})]).allocatedKg,0);
 });
 test(name+': six decimal stock is retained and micro allocations conserve quantity',()=>{
 const lots=[lot('tiny',20.000003),lot('target',19.999998,{depot:'B'})],r=report(api,lots,['A','B']);assert.equal(r.balances[0].kg,20.000003);const p=api.batchTransferPlan(r,lots);assert.equal(p.allocatedKg,.000002);assert.equal(p.unallocatedKg,0);assert.equal(p.allocations.length,1);
 });
 test(name+': batch CSV and HTML escape names and include IDs, dates, scope, metadata and safety context',()=>{
 const lots=sample(),r=report(api,lots),csv=api.batchTransferCsv(r,lots,()=> '=DEPOT,"x"',()=> '+batch','@scope',stamp),html=api.batchTransferHtml(r,lots,()=>'<img src=x>',()=>'<script>x</script>');
 assert(csv.startsWith('\uFEFF'));assert(csv.includes('"\'=DEPOT,""x"""'));assert(csv.includes('"\'+batch"'));assert(csv.includes('"\'@scope"'));assert(csv.includes('early'));assert(csv.includes('2026-10-28'));assert(csv.includes(stamp));assert(csv.includes('tidak mereservasi stok'));
 assert(!html.includes('<script>'));assert(!html.includes('<img '));assert(html.includes('&lt;script&gt;'));assert(html.includes('FEFO v3.4'));assert(html.includes('Tidak mereservasi batch'));
 assert(api.stockReportHtml(r,id=>id,id=>id,'All',stamp,lots).includes('Kandidat batch transfer FEFO v3.4'));
 });
 test(name+': empty report and snapshot mismatch remain explicit',()=>{
 const r=report(api,[],[]),csv=api.batchTransferCsv(r,[],id=>id,id=>id,'All',stamp);assert(csv.includes('Tidak ada kandidat'));assert(csv.includes(stamp));assert(api.batchTransferHtml(r,[],id=>id,id=>id).includes('Tidak ada kandidat'));
 const old=report(api,[lot('L',50)],['A','B']),p=api.batchTransferPlan(old,[]);assert.equal(p.unallocatedKg,20);assert(api.batchTransferCsv(old,[],id=>id,id=>id,'All',stamp).includes('Belum dirinci ke batch'));
 });
}
test('web/native batch proposals and exports match exactly',()=>{const lots=sample(),r=report(native,lots);assert.deepEqual(clean(native.batchTransferPlan(r,lots)),clean(ctx.batchTransferPlan(r,lots)));assert.equal(native.batchTransferCsv(r,lots,id=>id,id=>id,'All',stamp),ctx.batchTransferCsv(r,lots,id=>id,id=>id,'All',stamp));assert.equal(native.batchTransferHtml(r,lots,id=>id,id=>id),ctx.batchTransferHtml(r,lots,id=>id,id=>id));});
