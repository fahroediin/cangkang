import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stockAlerts} from '../src/stock-alerts.ts';
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('./fixtures/stock-alerts.web.js',import.meta.url),'utf8'),context);
const web=(...args)=>JSON.parse(JSON.stringify(context.stockAlerts(...args)));
const lot=(id,extra={})=>({id,depot:'A',product:0,kg:10,eggs:160,harvest:'2026-10-01',expiry:'2026-10-18',status:'Aktif',approved:true,...extra});
const variants=[['native',stockAlerts],['web',web]];
for(const [name,report] of variants){
 test(name+': free eligible balance, inclusive sell-by, zero stock, and no mutation',()=>{
  const lots=[lot('good'),lot('today',{expiry:'2026-10-15',kg:2}),lot('expired',{expiry:'2026-10-14'}),lot('future',{harvest:'2026-10-16'}),lot('hold',{status:'Karantina'}),lot('blocked',{status:'Diblokir'}),lot('legacy',{approved:false}),lot('unknown',{product:null}),lot('depleted',{kg:0,eggs:0}),lot('outside',{depot:'B'})];
  const before=JSON.stringify(lots);const r=report(['A'],lots,'2026-10-15',20,3);
  assert.equal(r.balances[0].kg,12);assert.equal(r.balances[0].eggs,320);assert.equal(r.low.length,3);assert.equal(r.balances[1].kg,0);assert.deepEqual(Array.from(r.expiring,l=>l.id),['today','good']);assert.equal(r.review.length,5);assert.equal(JSON.stringify(lots),before);
 });
 test(name+': exact threshold, horizon zero, unknown dates, and validation',()=>{
  const r=report(['A'],[lot('equal',{kg:20}),lot('undated',{product:1,harvest:'',expiry:''}),lot('one-side',{kg:0})],'2026-10-15',20,0);
  assert.equal(r.low.length,2);assert.equal(r.expiring.length,0);assert.equal(r.review.length,2);assert.equal(r.review.find(x=>x.lot.id==='undated').reasons[0],'Batas jual belum diatur');
  for(const args of [['2026-02-30',20,3],['bad',20,3],['2026-10-15',-1,3],['2026-10-15',20,1.5],['2026-10-15',Infinity,3],['2026-10-15',20,366]])assert.throws(()=>report([],[],...args));
  assert.equal(report([],[],'2026-10-15',0,0).low.length,0);
 });
}
test('web and native outputs match on year boundary',()=>{const ls=[lot('x',{expiry:'2027-01-02'})];assert.equal(JSON.stringify(stockAlerts(['A'],ls,'2026-12-31',10,2)),JSON.stringify(web(['A'],ls,'2026-12-31',10,2)));});
