import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../src/domain.ts';
const house=overrides=>({id:'house-d',code:'KDG-D',name:'Kandang D',farmLocation:'Farm Anyer',depotId:'anyer',capacity:5000,initialPopulation:4000,active:true,...overrides});
const production=(s,id='house-d',name='Kandang D')=>s.production.push({id:'prd-1',houseId:id,house:name,date:D.today(),eggs:3000,kg:180,broken:2,feed:200,dead:2});
test('master kandang: create, normalized unique code/name, and atomic invalid input',()=>{
 const s=D.baseState();D.saveHouse(s,house({code:' kdg-d ',name:' Kandang  D '}));assert.equal(s.houses.at(-1).code,'KDG-D');assert.equal(s.houses.at(-1).name,'Kandang D');
 for(const h of [house({id:'x'}),house({id:'x',code:'X',name:'Ｋａｎｄａｎｇ D'}),house({id:'x',code:'X',name:'X',capacity:1.5}),house({id:'x',code:'X',name:'X',initialPopulation:5001}),house({id:'x',code:'X',name:'X',depotId:'unknown'})]){const before=JSON.stringify(s);assert.throws(()=>D.saveHouse(s,h));assert.equal(JSON.stringify(s),before)}
});
test('master kandang: active state gates new production and preserves history',()=>{
 const s=D.baseState();D.saveHouse(s,house());production(s);const before=JSON.stringify(s.production);D.setHouseActive(s,'house-d',false);assert.throws(()=>D.houseForProduction(s,'house-d','2026-01-01','anyer',0),/tidak aktif/);assert.equal(JSON.stringify(s.production),before);D.setHouseActive(s,'house-d',true);assert.equal(D.housePopulation(s,'house-d'),3998);assert.throws(()=>D.houseForProduction(s,'house-d',D.today(),'anyer',0),/sudah dicatat/);
});
test('master kandang: rename retains stable IDs, duplicate protection, population and depot locks',()=>{
 const s=D.baseState();D.saveHouse(s,house());production(s);D.saveHouse(s,house({name:'Kandang Timur'}));assert.equal(s.production[0].house,'Kandang D');assert.equal(s.production[0].houseId,'house-d');assert.throws(()=>D.saveHouse(s,house({name:'Kandang Timur',initialPopulation:4500})),/terkunci/);assert.throws(()=>D.saveHouse(s,house({name:'Kandang Timur',depotId:'cilegon'})),/terkunci/);assert.throws(()=>D.houseForProduction(s,'house-d','2026-01-01','cilegon',0),/sesuai master/);assert.throws(()=>D.houseForProduction(s,'house-d','2026-01-01','anyer',3999),/Mortalitas/);
});
test('master kandang: schema 2 legacy migration is deterministic, idempotent and preserves values',()=>{
 const s=D.baseState();delete s.houses;production(s,undefined,'Kandang A');delete s.production[0].houseId;const old=structuredClone(s.production[0]);s.production.push({...old,id:'prd-2',house:'Kandang Lama'});const out=D.validateState(s);assert.equal(out.production[0].houseId,'house-a');assert(out.houses.some(h=>h.name==='Kandang Lama'));assert.equal(out.production[0].kg,old.kg);assert.equal(out.production[0].house,old.house);const before=JSON.stringify(out);D.validateState(out);assert.equal(JSON.stringify(out),before);assert.deepEqual(D.validateState(JSON.parse(JSON.stringify(out))),out);
});
test('master kandang: invalid references and malformed backup masters fail validation',()=>{
 const s=D.baseState();production(s,'unknown');assert.throws(()=>D.validateState(s));const a=D.baseState();a.houses[0].capacity=-1;assert.throws(()=>D.validateState(a));
});
