export type TraceLot = {id:string;parentId:string|null;depot:string;product:number|null;kg:number;eggs:number;status:string;harvest:string;expiry:string};
export function traceBatch(lots:TraceLot[], selected:string) {
  const byId=new Map<string,TraceLot>(),children=new Map<string,TraceLot[]>();
  for(const l of lots){if(byId.has(l.id))throw Error("ID batch ganda.");byId.set(l.id,l);if(l.parentId){const list=children.get(l.parentId)||[];list.push(l);children.set(l.parentId,list);}}
  let item=byId.get(selected);if(!item)throw Error("Batch tidak ditemukan.");
  const ancestors:TraceLot[]=[],seen=new Set<string>();
  while(item){if(seen.has(item.id))throw Error("Rantai asal batch berulang.");seen.add(item.id);ancestors.push({...item});if(!item.parentId)break;item=byId.get(item.parentId);if(!item)throw Error("Batch induk tidak ditemukan.");}
  ancestors.reverse();
  const family:(TraceLot & {depth:number})[]=[],queue=[{...ancestors[0],depth:0}];
  for(let i=0;i<queue.length;i++){if(i>=10000)throw Error("Keluarga batch terlalu besar untuk ditampilkan.");const l=queue[i];family.push(l);for(const child of (children.get(l.id)||[]).slice().sort((a,b)=>a.id.localeCompare(b.id)))queue.push({...child,depth:l.depth+1});}
  return {selected,rootId:ancestors[0].id,ancestors,family,kg:Number(family.reduce((s,l)=>s+l.kg,0).toFixed(6)),eggs:family.reduce((s,l)=>s+l.eggs,0)};
}
export function traceBatchCsv(trace:ReturnType<typeof traceBatch>,depotName:(id:string)=>string,createdAt:string){
 const quote=(v:unknown)=>{let s=String(v??"");if(typeof v==='string'&&/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 const headers=["Batch dipilih","Akar batch","Batch","Induk","Kedalaman","Depo","Varian","Kg bebas saat ini","Butir bebas saat ini","Kualitas","Panen","Batas jual","Dibuat pada UTC","Keterangan"];
 const rows=trace.family.map(l=>[trace.selected,trace.rootId,l.id,l.parentId||"",l.depth,depotName(l.depot),l.product===null?"Belum diklasifikasikan":["Telur reguler","Telur pilihan","Telur ekonomis"][l.product],l.kg,l.eggs,l.status,l.harvest,l.expiry,createdAt,"Hubungan batch tercatat; bukan jumlah transfer awal atau bukti asal panen"]);
 return "\uFEFF"+[headers,...rows].map(row=>row.map(quote).join(",")).join("\r\n")+"\r\n";
}

export type TraceOrder = {id:string;name:string;category:string;status:string;date:string;depot:string;allocations:{lotId:string;kg:number;eggs:number}[]};
export type TraceOrderScope = "batch"|"family";
export type TraceOrderStatus = "all"|"notCancelled"|"Diproses"|"Dalam pengiriman"|"Selesai"|"Dibatalkan";
export type TraceOrderFilters = {category:string;from:string;to:string;query?:string;depot?:string;sort?:string};
const traceOrderSortLabels:Record<string,string>={dateAsc:"Tanggal kirim terlama",dateDesc:"Tanggal kirim terbaru",nameAsc:"Nama pelanggan A–Z",idAsc:"Nomor pesanan A–Z"};
export function traceOrderSortLabel(sort="dateAsc"){return traceOrderSortLabels[sort]||"Urutan tidak valid";}
export function traceOrderStatusLabel(status:TraceOrderStatus){return status==="all"?"Semua status":status==="notCancelled"?"Tanpa dibatalkan":status;}
export function validateTraceOrderFilters(input:TraceOrderFilters):TraceOrderFilters {
 const {category,from,to}=input;
 if(!["","Perorangan","Wholesale","Hotel/Resort"].includes(category)||typeof from!=="string"||typeof to!=="string"||(from&&!traceOrderDateValid(from))||(to&&!traceOrderDateValid(to))||(from&&to&&from>to))throw Error("Kategori atau rentang tanggal pengiriman tidak valid. Gunakan YYYY-MM-DD dan tanggal awal tidak melewati akhir.");
 if(input.query!==undefined&&typeof input.query!=="string")throw Error("Pencarian harus berupa teks.");
 const query=(input.query||"").trim().replace(/\s+/g," ");
 if([...query].length>100)throw Error("Pencarian maksimal 100 karakter.");
 const depot=input.depot??"",sort=input.sort??"dateAsc";
 if(typeof depot!=="string"||depot.length>120||!Object.prototype.hasOwnProperty.call(traceOrderSortLabels,sort))throw Error("Depo atau urutan pesanan tidak valid.");
 return {category,from,to,query,depot,sort};
}
function traceOrderDateValid(day:string) {
 const time=Date.parse(day+"T00:00:00Z");return /^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(time)&&new Date(time).toISOString().slice(0,10)===day;
}
export function traceOrders(trace:ReturnType<typeof traceBatch>,orders:TraceOrder[],scope:TraceOrderScope="family",status:TraceOrderStatus="all",input:TraceOrderFilters={category:"",from:"",to:""}) {
 if(!["batch","family"].includes(scope)||!["all","notCancelled","Diproses","Dalam pengiriman","Selesai","Dibatalkan"].includes(status))throw Error("Filter pesanan tidak valid.");
 const filters=validateTraceOrderFilters(input);
 const searchKey=(v:string)=>v.normalize("NFKC").toLowerCase().replace(/\s+/g," ").trim(),query=searchKey(filters.query||"");
 const ids=new Set(scope==="batch"?[trace.selected]:trace.family.map(l=>l.id)),seen=new Set<string>();
 const rows=orders.flatMap(o=>{
  if(seen.has(o.id))throw Error("ID pesanan ganda.");seen.add(o.id);
  if(status==="notCancelled"&&o.status==="Dibatalkan")return [];
  if(!["all","notCancelled"].includes(status)&&o.status!==status)return [];
  if(filters.depot&&o.depot!==filters.depot)return [];
  if(filters.category&&o.category!==filters.category)return [];
  if(query&&!searchKey(o.id).includes(query)&&!searchKey(o.name).includes(query))return [];
  if((filters.from||filters.to)&&(!traceOrderDateValid(o.date)||(filters.from&&o.date<filters.from)||(filters.to&&o.date>filters.to)))return [];
  const matches=o.allocations.filter(a=>ids.has(a.lotId));if(!matches.length)return [];
  if(matches.some(a=>!Number.isFinite(a.kg)||a.kg<0||!Number.isSafeInteger(a.eggs)||a.eggs<0))throw Error("Jumlah alokasi tidak valid.");
  return [{id:o.id,name:o.name,category:o.category,status:o.status,date:o.date,depot:o.depot,lotIds:[...new Set(matches.map(a=>a.lotId))].sort(),kg:Number(matches.reduce((s,a)=>s+a.kg,0).toFixed(6)),eggs:matches.reduce((s,a)=>s+a.eggs,0)}];
 }).sort((a,b)=>{const primary=filters.sort==="dateDesc"?b.date.localeCompare(a.date):filters.sort==="nameAsc"?searchKey(a.name).localeCompare(searchKey(b.name)):filters.sort==="idAsc"?a.id.localeCompare(b.id):a.date.localeCompare(b.date);return primary||a.id.localeCompare(b.id)});
 return {selected:trace.selected,rootId:trace.rootId,scope,status,filters,rows,count:rows.length,cancelled:rows.filter(o=>o.status==="Dibatalkan").length};
}
export function traceOrdersCsv(report:ReturnType<typeof traceOrders>,depotName:(id:string)=>string,createdAt:string){
 const quote=(v:unknown)=>{let s=String(v??"");if(typeof v==='string'&&/^\s*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
 const headers=["Batch dipilih","Akar","Cakupan","Filter status","Pesanan","Pelanggan","Kategori","Status","Tanggal kirim","Depo pesanan","ID batch cocok","Kg alokasi cocok","Butir alokasi cocok","Dibuat pada UTC","Keterangan","Filter kategori pembeli","Tanggal kirim mulai","Tanggal kirim sampai","Pencarian nomor/nama","Filter depo pesanan","Urutan"];
 const meta=[report.selected,report.rootId,report.scope==="batch"?"Batch ini saja":"Seluruh keluarga",traceOrderStatusLabel(report.status)];
 const note="Alokasi tercatat, bukan jumlah terkirim atau saldo stok; batal dapat tetap memiliki referensi; retur tidak dikurangkan; bukan daftar recall terverifikasi";
 const rows=report.rows.map(o=>[...meta,o.id,o.name,o.category,o.status,o.date,depotName(o.depot),o.lotIds.join("; "),o.kg,o.eggs,createdAt,note]);
 if(!rows.length)rows.push([...meta,"","","","","","","","","",createdAt,"Tidak ada pesanan dengan referensi alokasi yang cocok. "+note]);
 return "\uFEFF"+[headers,...rows.map(row=>[...row,report.filters.category||"Semua kategori",report.filters.from,report.filters.to,report.filters.query||"",report.filters.depot?depotName(report.filters.depot):"Semua depo pesanan",traceOrderSortLabel(report.filters.sort)])].map(row=>row.map(quote).join(",")).join("\r\n")+"\r\n";
}

export function traceOrdersSummary(report:ReturnType<typeof traceOrders>) {
 const categories=new Map<string,number>(["Perorangan","Wholesale","Hotel/Resort"].map(x=>[x,0])),statuses=new Map<string,number>(["Diproses","Dalam pengiriman","Selesai","Dibatalkan"].map(x=>[x,0])),batchIds=new Set<string>();
 const depots=new Map<string,number>();
 for(const o of report.rows){depots.set(o.depot,(depots.get(o.depot)||0)+1);categories.set(o.category,(categories.get(o.category)||0)+1);statuses.set(o.status,(statuses.get(o.status)||0)+1);for(const id of o.lotIds)batchIds.add(id);}
 return {count:report.rows.length,batchCount:batchIds.size,categories:[...categories].map(([label,count])=>({label,count})),statuses:[...statuses].map(([label,count])=>({label,count})),depots:[...depots].sort(([a],[b])=>a.localeCompare(b)).map(([label,count])=>({label,count}))};
}
export function traceOrdersHtml(report:ReturnType<typeof traceOrders>,depotName:(id:string)=>string,createdAt:string) {
 const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const summary=traceOrdersSummary(report),scope=report.scope==="batch"?"Batch ini saja":"Seluruh keluarga",status=traceOrderStatusLabel(report.status);
 const table=(headers:string[],rows:unknown[][])=>`<table><thead><tr>${headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
 return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>PamanKu — Pesanan terkait batch</title><style>@page{size:A4 landscape;margin:14mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#39291e;margin:16px}h1{font-size:24px;color:#754b31}h2{font-size:16px;margin:18px 0 8px}p{line-height:1.5;overflow-wrap:anywhere}.notice{background:#fff5dc;border-left:4px solid #e5ad36;padding:10px}.summary{display:flex;gap:18px}.summary section{flex:1;min-width:0}table{width:100%;border-collapse:collapse;table-layout:fixed;margin:8px 0 16px;font-size:11px}th,td{border:1px solid #decfbb;padding:7px;text-align:left;vertical-align:top;overflow-wrap:anywhere;white-space:pre-wrap}th{background:#f7eddd}thead{display:table-header-group}tr{break-inside:avoid}small{color:#6b5747}</style></head><body><h1>PamanKu · Pesanan terkait batch v5.0</h1><p>Batch dipilih: ${esc(report.selected)}<br>Akar keluarga: ${esc(report.rootId)}<br>Cakupan: ${esc(scope)} · Filter status: ${esc(status)}<br>Depo pesanan: ${esc(report.filters.depot?depotName(report.filters.depot):"Semua depo pesanan")}<br>Urutan: ${esc(traceOrderSortLabel(report.filters.sort))}<br>Pencarian nomor/nama: ${esc(report.filters.query||"Tanpa pencarian")}<br>Kategori pembeli: ${esc(report.filters.category||"Semua kategori")}<br>Tanggal kirim: ${esc(report.filters.from||"Tanpa batas awal")} s.d. ${esc(report.filters.to||"Tanpa batas akhir")} (inklusif)<br>Dibuat pada UTC: ${esc(createdAt)}</p><p><strong>${summary.count} pesanan · ${summary.batchCount} ID batch dengan alokasi cocok</strong></p><div class="summary"><section><h2>Jumlah pesanan per kategori</h2>${table(["Kategori pembeli","Pesanan"],summary.categories.map(x=>[x.label,x.count]))}</section><section><h2>Jumlah pesanan per status</h2>${table(["Status","Pesanan"],summary.statuses.map(x=>[x.label,x.count]))}</section></div><h2>Jumlah pesanan per depo</h2>${summary.depots.length?table(["Depo pesanan","Pesanan"],summary.depots.map(x=>[depotName(x.label),x.count])):"<p>Tidak ada depo dengan pesanan cocok.</p>"}<h2>Rincian alokasi yang cocok</h2>${report.rows.length?table(["Pesanan","Pelanggan / kategori","Status","Tanggal kirim / depo","ID batch cocok","Kg alokasi cocok","Butir alokasi cocok"],report.rows.map(o=>[o.id,o.name+" / "+o.category,o.status,(o.date||"Belum diatur")+" / "+depotName(o.depot),o.lotIds.join("; "),o.kg,o.eggs])):'<p>Tidak ada pesanan dengan referensi alokasi yang cocok.</p>'}<p class="notice">Alokasi tercatat, bukan jumlah terkirim atau saldo stok. Pesanan batal dapat tetap memiliki referensi; retur tidak dikurangkan. Cakupan keluarga mencakup akar, saudara dan seluruh cabang; bukan pernyataan semua pesanan terdampak masalah kualitas. Pesanan tanpa referensi batch tidak ditemukan. Daftar ini bukan daftar recall terverifikasi dan tidak menjalankan tindakan penarikan.</p><p><small>Snapshot seluruh hasil filter saat laporan dibuat, mencakup semua halaman daftar. Saat rentang tanggal aktif, pesanan tanpa tanggal pengiriman valid dikecualikan. Ringkasan menghitung setiap pesanan sekali; jumlah kategori, status dan depo adalah tiga pengelompokan atas pesanan yang sama, jangan dijumlahkan antar tabel. Laporan bukan cadangan pemulihan data dan bukan bukti asal panen. Laporan memuat nama pelanggan; bagikan sesuai kebutuhan operasional.</small></p></body></html>`;
}

export function traceOrdersPage(report:ReturnType<typeof traceOrders>,page=1,pageSize=20) {
 if(!Number.isSafeInteger(page)||page<1||!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>100)throw Error("Halaman atau ukuran daftar tidak valid.");
 const count=report.rows.length,pages=Math.max(1,Math.ceil(count/pageSize)),current=Math.min(page,pages),offset=(current-1)*pageSize;
 return {page:current,pages,count,pageSize,start:count?offset+1:0,end:Math.min(count,offset+pageSize),rows:report.rows.slice(offset,offset+pageSize)};
}

export function traceOrdersSummaryCsv(report:ReturnType<typeof traceOrders>,depotName:(id:string)=>string,createdAt:string){
 const s=traceOrdersSummary(report),quote=(v:unknown)=>{let value=String(v??"");if(typeof v==='string'&&/^\s*[=+@-]/.test(value))value="'"+value;return '"'+value.replace(/"/g,'""')+'"'};
 const headers=["Kelompok","Label","Jumlah","Satuan","Batch dipilih","Akar keluarga","Cakupan","Status","Kategori","Tanggal kirim mulai","Tanggal kirim sampai","Pencarian nomor/nama","Depo pesanan","Urutan","Dibuat pada UTC","Catatan"];
 const groups:(string|number)[][]=[["Ringkasan","Total pesanan",s.count,"pesanan"],["Ringkasan","ID batch cocok",s.batchCount,"batch"],...s.categories.map(x=>["Kategori",x.label,x.count,"pesanan"]),...s.statuses.map(x=>["Status",x.label,x.count,"pesanan"]),...s.depots.map(x=>["Depo",depotName(x.label),x.count,"pesanan"])];
 const meta=[report.selected,report.rootId,report.scope==="batch"?"Batch ini saja":"Seluruh keluarga",traceOrderStatusLabel(report.status),report.filters.category||"Semua kategori",report.filters.from,report.filters.to,report.filters.query||"",report.filters.depot?depotName(report.filters.depot):"Semua depo pesanan",traceOrderSortLabel(report.filters.sort),createdAt,"Seluruh hasil filter, semua halaman; pengelompokan atas pesanan yang sama, jangan dijumlahkan antar kelompok; bukan volume terkirim atau recall terverifikasi"];
 return "\uFEFF"+[headers,...groups.map(row=>[...row,...meta])].map(row=>row.map(quote).join(",")).join("\r\n")+"\r\n";
}

export type TraceOrderQuickChoice = "processingToday"|"shippingToday"|"overdueProcessing";
export function traceOrderQuickFilter(current:TraceOrderFilters,choice:TraceOrderQuickChoice,today:string) {
 if(typeof today!=="string"||!traceOrderDateValid(today))throw Error("Tanggal acuan pilihan cepat tidak valid.");
 if(!["processingToday","shippingToday","overdueProcessing"].includes(choice))throw Error("Pilihan cepat tidak valid.");
 const previous=validateTraceOrderFilters(current),overdue=choice==="overdueProcessing";
 const yesterday=new Date(Date.parse(today+"T00:00:00Z")-86400000).toISOString().slice(0,10);
 if(overdue&&!traceOrderDateValid(yesterday))throw Error("Tanggal acuan di luar rentang pilihan cepat.");
 const filters=validateTraceOrderFilters({...previous,category:"",query:"",from:overdue?"":today,to:overdue?yesterday:today});
 const status:TraceOrderStatus=choice==="shippingToday"?"Dalam pengiriman":"Diproses";
 const label=choice==="shippingToday"?"Dalam pengiriman hari ini":overdue?"Diproses lewat tanggal":"Diproses hari ini";
 return {filters,status,label,asOf:today};
}

export type TraceOrderDimension = "category"|"status"|"depot";
export function traceOrderDrilldown(current:TraceOrderFilters,status:TraceOrderStatus,dimension:TraceOrderDimension,value:string) {
 if(!["category","status","depot"].includes(dimension)||typeof value!=="string")throw Error("Pilihan ringkasan tidak valid.");
 if(!["all","notCancelled","Diproses","Dalam pengiriman","Selesai","Dibatalkan"].includes(status))throw Error("Status pesanan tidak valid.");
 const previous=validateTraceOrderFilters(current);
 if(dimension==="status"){
  if(!["all","notCancelled","Diproses","Dalam pengiriman","Selesai","Dibatalkan"].includes(value))throw Error("Status ringkasan tidak valid.");
  return {filters:previous,status:value as TraceOrderStatus};
 }
 const filters=validateTraceOrderFilters({...previous,[dimension]:value});
 return {filters,status};
}

export type TraceOrderView = {lotId:string;scope:TraceOrderScope;status:TraceOrderStatus;page:number;pageSize?:number;filters:TraceOrderFilters};
export function traceOrderViewSnapshot(view:TraceOrderView,currentLotId=view.lotId):TraceOrderView {
 if(typeof view.lotId!=="string"||!view.lotId||view.lotId.length>200||view.lotId!==currentLotId)throw Error("Riwayat filter bukan untuk batch ini.");
 if(!["batch","family"].includes(view.scope)||!["all","notCancelled","Diproses","Dalam pengiriman","Selesai","Dibatalkan"].includes(view.status)||!Number.isSafeInteger(view.page)||view.page<1)throw Error("Riwayat tampilan tidak valid.");
 return {lotId:view.lotId,scope:view.scope,status:view.status,page:view.page,pageSize:traceOrderPageSize(view.pageSize??20),filters:validateTraceOrderFilters(view.filters)};
}

export function traceOrderPageSize(value:number) {
 if(![10,20,50].includes(value))throw Error("Pilih 10, 20 atau 50 pesanan per halaman.");
 return value;
}
export function traceOrderPagination(report:ReturnType<typeof traceOrders>,page:unknown=1,pageSize=20) {
 const size=traceOrderPageSize(pageSize);
 if(typeof page!=="number"&&(typeof page!=="string"||!/^\d+$/.test(page.trim())))throw Error("Nomor halaman harus bilangan bulat positif.");
 return traceOrdersPage(report,typeof page==="number"?page:Number(page.trim()),size);
}

export type TraceSavedFilters = {schema:1;revision:number;items:{id:string;name:string;view:TraceOrderView}[]};
export function emptyTraceSavedFilters():TraceSavedFilters{return {schema:1,revision:0,items:[]};}
export function validateTraceSavedFilters(value:unknown):TraceSavedFilters {
 const raw=value as TraceSavedFilters;
 if(!raw||raw.schema!==1||!Number.isSafeInteger(raw.revision)||raw.revision<0||!Array.isArray(raw.items)||raw.items.length>10)throw Error("Daftar filter tersimpan tidak valid atau melebihi 10.");
 const ids=new Set<string>(),names=new Set<string>();
 const items=raw.items.map(item=>{
  if(!item||typeof item.id!=="string"||!/^[-A-Za-z0-9]{1,100}$/.test(item.id)||ids.has(item.id)||typeof item.name!=="string"||!item.view||typeof item.view!=="object")throw Error("Isi filter tersimpan tidak valid.");
  const name=item.name.trim().replace(/\s+/g," ");if(!name||[...name].length>60)throw Error("Nama filter wajib diisi, maksimal 60 karakter.");
  const view=traceOrderViewSnapshot(item.view),nameKey=view.lotId+"\0"+name.normalize("NFKC").toLowerCase();
  if(names.has(nameKey))throw Error("Nama filter untuk batch ini sudah digunakan.");names.add(nameKey);ids.add(item.id);
  return {id:item.id,name,view};
 });
 return {schema:1,revision:raw.revision,items};
}
export function addTraceSavedFilter(store:TraceSavedFilters,id:string,name:string,view:TraceOrderView):TraceSavedFilters {
 const previous=validateTraceSavedFilters(store);
 return validateTraceSavedFilters({schema:1,revision:previous.revision+1,items:[...previous.items,{id,name,view:traceOrderViewSnapshot({...view,page:1})}]});
}
export function removeTraceSavedFilter(store:TraceSavedFilters,id:string):TraceSavedFilters {
 const previous=validateTraceSavedFilters(store);
 if(!previous.items.some(x=>x.id===id))throw Error("Filter tersimpan tidak ditemukan.");
 return validateTraceSavedFilters({schema:1,revision:previous.revision+1,items:previous.items.filter(x=>x.id!==id)});
}
