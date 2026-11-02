import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as native from '../src/stock-alerts.ts';
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(new URL('./fixtures/stock-alerts.web.js',import.meta.url),'utf8'),ctx);
const stamp='2026-10-27T05:00:00.000Z';
function parseCsv(csv){let rows=[],row=[],value='',quoted=false;for(let i=1;i<csv.length;i++){const c=csv[i];if(c==='"'){if(quoted&&csv[i+1]==='"'){value+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(value);value=''}else if(c==='\r'&&csv[i+1]==='\n'&&!quoted){row.push(value);rows.push(row);row=[];value='';i++}else value+=c}return rows}
function sample(api){return api.stockAlerts(['A'],[{id:'L',depot:'A',product:0,kg:2.125,eggs:34,harvest:'2026-10-20',expiry:'2026-10-28',status:'Aktif',approved:true},{id:'Q',depot:'A',product:null,kg:3,eggs:48,harvest:'',expiry:'',status:'Karantina',approved:false},{id:'outside',depot:'B',product:1,kg:1,eggs:16,harvest:'',expiry:'',status:'Aktif',approved:true}],'2026-10-27',20,3)}
for(const [label,api] of [['native',native],['web',ctx]]){
 test(label+': CSV follows scope, includes zero balances and fixed metadata without mutation',()=>{
 const r=sample(api),before=JSON.stringify(r),csv=api.stockReportCsv(r,id=>'Depo '+id,id=>'Batch '+id,'Depo A',stamp),rows=parseCsv(csv);
 assert(csv.startsWith('\uFEFF'));assert.equal(rows.length,9);assert(rows.every(row=>row.length===15));
 assert.deepEqual(rows[1].slice(9),['2026-10-27','2026-10-30','20','3','Depo A',stamp]);
 assert(!rows.some(row=>row.includes('Batch outside')));assert.equal(rows.filter(row=>row[0]==='Saldo layak jual').length,3);assert.equal(rows.find(row=>row[0]==='Stok menipis'&&row[2]==='Telur reguler')[6],'17.875');assert.equal(JSON.stringify(r),before);
 });
 test(label+': CSV quotes delimiters and multiline text and neutralizes formulas',()=>{
 const csv=api.stockReportCsv(sample(api),()=> ' \t=SUM(1,2)',()=> '+cmd,"x"\r\nline','@scope',stamp),rows=parseCsv(csv);
 assert.equal(rows[1][1],"' \t=SUM(1,2)");assert.equal(rows[1][13],"'@scope");assert(rows.some(row=>row[3]==="'+cmd,\"x\"\r\nline"));assert.equal(rows[1][4],'2.125');
 for(const name of ['-1+1','+1','\n=1','@x'])assert(parseCsv(api.stockReportCsv(sample(api),()=>name,id=>id,'A',stamp))[1][1].startsWith("'"));
 });
 test(label+': HTML escapes names and retains counts, scope and non-backup warning',()=>{
 const html=api.stockReportHtml(sample(api),()=>'<img src=x onerror=alert(1)>',()=>'</td><script>x</script>','<b>A</b>',stamp);
 assert(!html.includes('<script>'));assert(!html.includes('<img '));assert(html.includes('&lt;script&gt;'));assert(html.includes('&lt;b&gt;A&lt;/b&gt;'));assert(html.includes('17.875'));assert(html.includes('3 varian depo menipis'));assert(html.includes('bukan cadangan'));assert(html.includes('jangan jumlahkan'));
 });
 test(label+': empty export retains filters and all-valid stock still has balances',()=>{
 const r=api.stockAlerts([],[],'2026-10-27',0,0),rows=parseCsv(api.stockReportCsv(r,id=>id,id=>id,'Semua depo',stamp));assert.equal(rows.length,2);assert.equal(rows[1][0],'Ringkasan kosong');assert.equal(rows[1][9],'2026-10-27');assert(api.stockReportHtml(r,id=>id,id=>id,'Semua depo',stamp).includes('Tidak ada data'));
 assert.equal(api.stockReportRows(api.stockAlerts(['A'],[],'2026-10-27',0,0),id=>id,id=>id).length,3);
 });
 test(label+': shortage avoids floating artifacts and clamps excess stock',()=>{assert.equal(api.shortageKg(.02,.1),.08);assert.equal(api.shortageKg(30,20),0);assert.equal(api.shortageKg(20,20),0)});
}
test('CSV and printable HTML match exactly between web and native',()=>{const a=sample(native),b=sample(ctx);for(const method of ['stockReportCsv','stockReportHtml'])assert.equal(native[method](a,id=>id,id=>id,'A',stamp),ctx[method](b,id=>id,id=>id,'A',stamp));});
