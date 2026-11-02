export type AlertLot = { id: string; depot: string; product: number | null; kg: number; eggs: number; harvest: string; expiry: string; status: string; approved: boolean };
export function stockAlerts(depots: string[], lots: AlertLot[], day: string, minKg = 20, horizon = 3) {
  const stamp = Date.parse(day + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0,10) !== day || !Number.isFinite(minKg) || minKg < 0 || minKg > 1000000 || !Number.isInteger(horizon) || horizon < 0 || horizon > 365) throw Error("Tanggal, ambang kg (0–1.000.000), atau rentang hari (0–365) tidak valid.");
  const end = new Date(stamp + horizon * 86400000).toISOString().slice(0,10);
  const available = (l: AlertLot) => l.kg > 0 && l.eggs > 0 && l.status === "Aktif" && l.product !== null && l.approved && (!l.harvest || l.harvest <= day) && (!l.expiry || l.expiry >= day);
  const balances = depots.flatMap(depot => [0,1,2].map(product => {
    const eligible = lots.filter(l => l.depot === depot && l.product === product && available(l));
    return {depot,product,kg:Number(eligible.reduce((s,l)=>s+l.kg,0).toFixed(6)),eggs:eligible.reduce((s,l)=>s+l.eggs,0)};
  }));
  const low = balances.filter(b => b.kg < minKg);
  const expiring = lots.filter(l => depots.includes(l.depot) && available(l) && l.expiry && l.expiry <= end).sort((a,b)=>a.expiry.localeCompare(b.expiry)||a.id.localeCompare(b.id));
  const review = lots.filter(l => depots.includes(l.depot) && (l.kg > 0 || l.eggs > 0)).map(l => {
    const reasons: string[] = [];
    if(l.status !== "Aktif") reasons.push(l.status);
    if(l.product === null) reasons.push("Belum diklasifikasikan");
    else if(!l.approved) reasons.push("Belum disetujui");
    if(!l.expiry) reasons.push("Batas jual belum diatur");
    else if(l.expiry < day) reasons.push("Lewat batas jual");
    if(l.kg <= 0 || l.eggs <= 0) reasons.push("Periksa saldo kg dan butir");
    return {lot:l,reasons};
  }).filter(r=>r.reasons.length);
  return {balances,low,expiring,review,day,end,minKg,horizon};
}

export type StockReport = ReturnType<typeof stockAlerts>;
export function shortageKg(kg: number, threshold: number) {
  return Math.max(0,Number((threshold-kg).toFixed(6)));
}
export function stockReportRows(report: StockReport, depotName: (id:string)=>string, lotName: (id:string)=>string) {
  const productName = (p:number|null) => p===null ? "Belum diklasifikasikan" : ["Telur reguler","Telur pilihan","Telur ekonomis"][p];
  return [
    ...report.balances.map(b=>["Saldo layak jual",depotName(b.depot),productName(b.product),"",b.kg,b.eggs,"","",""]),
    ...report.low.map(b=>["Stok menipis",depotName(b.depot),productName(b.product),"",b.kg,b.eggs,shortageKg(b.kg,report.minKg),"","Di bawah ambang kg"]),
    ...report.expiring.map(l=>["Mendekati batas jual",depotName(l.depot),productName(l.product),lotName(l.id),l.kg,l.eggs,"",l.expiry,""]),
    ...report.review.map(({lot:l,reasons})=>["Perlu tinjauan",depotName(l.depot),productName(l.product),lotName(l.id),l.kg,l.eggs,"",l.expiry,reasons.join("; ")])
  ];
}
export function stockReportCsv(report: StockReport, depotName: (id:string)=>string, lotName: (id:string)=>string, scope: string, createdAt: string) {
  const headers=["Jenis","Depo","Varian","Batch","Kg bebas","Butir bebas","Kekurangan ke ambang kg","Batas jual","Alasan","Tanggal acuan","Akhir rentang","Ambang kg","Rentang hari","Cakupan depo","Dibuat pada UTC"];
  const quote=(v:unknown)=>{let s=String(v??"");if(typeof v==='string'&&/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
  const rows=stockReportRows(report,depotName,lotName);
  if(!rows.length)rows.push(["Ringkasan kosong","","","","","","","",""]);
  return "\uFEFF"+[headers,...rows.map(row=>[...row,report.day,report.end,report.minKg,report.horizon,scope,createdAt])].map(row=>row.map(quote).join(",")).join("\r\n")+"\r\n";
}
export function stockReportHtml(report: StockReport, depotName: (id:string)=>string, lotName: (id:string)=>string, scope: string, createdAt: string, lots?: AlertLot[]) {
  const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  const rows=stockReportRows(report,depotName,lotName),headers=["Jenis","Depo / varian","Batch","Kg bebas","Butir","Kurang kg","Batas / alasan"];
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Laporan stok PamanKu</title><style>@page{size:A4 landscape;margin:14mm}body{font:12px Arial,sans-serif;color:#33251b;margin:20px}h1{font-size:23px;color:#704529}p{line-height:1.5}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ddd;padding:7px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#faf5eb}thead{display:table-header-group}tr{break-inside:avoid}small{color:#66564a}</style></head><body><h1>PamanKu · Laporan stok v5.0</h1><p>Cakupan: ${esc(scope)}<br>Tanggal acuan: ${esc(report.day)} · Batas peringatan: ${esc(report.end)} · Ambang: ${report.minKg} kg · Rentang: ${report.horizon} hari<br>Dibuat pada UTC: ${esc(createdAt)}</p><p>${report.low.length} varian depo menipis · ${report.expiring.length} batch mendekati batas · ${report.review.length} batch perlu tinjauan</p><table><thead><tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${[row[0],String(row[1])+" / "+String(row[2]),row[3],row[4],row[5],row[6],[row[7],row[8]].filter(Boolean).join(' · ')].map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join(''):'<tr><td colspan="7">Tidak ada data dalam cakupan ini.</td></tr>'}</tbody></table>${transferPlanHtml(report,depotName)}${lots?batchTransferHtml(report,lots,depotName,lotName):''}<p><small>Saldo bebas saat laporan dibuat, sesudah alokasi pesanan. Tanggal acuan bukan rekonstruksi historis. Kekurangan hanya selisih ke ambang kg, bukan ramalan atau pesanan pembelian. Satu batch dapat muncul pada beberapa kategori; jangan jumlahkan semua baris sebagai total stok. Laporan bukan cadangan pemulihan data. Tidak ada perubahan stok atau notifikasi otomatis.</small></p></body></html>`;
}

export function rebalanceStock(report: StockReport) {
  const round=(v:number)=>Number(v.toFixed(6));
  const moves: {from:string;to:string;product:number;kg:number}[]=[];
  const unfilled: {depot:string;product:number;kg:number}[]=[];
  for(const product of [0,1,2]) {
    const balances=report.balances.filter(b=>b.product===product);
    const donors=balances.filter(b=>b.kg>report.minKg).map(b=>({depot:b.depot,kg:round(b.kg-report.minKg)})).sort((a,b)=>b.kg-a.kg||a.depot.localeCompare(b.depot));
    const receivers=balances.filter(b=>b.kg<report.minKg).map(b=>({depot:b.depot,kg:shortageKg(b.kg,report.minKg)})).sort((a,b)=>b.kg-a.kg||a.depot.localeCompare(b.depot));
    for(const receiver of receivers) {
      for(const donor of donors) {
        if(receiver.kg<=0)break;
        if(donor.kg<=0||donor.depot===receiver.depot)continue;
        const kg=round(Math.min(receiver.kg,donor.kg));
        if(kg<=0)continue;
        moves.push({from:donor.depot,to:receiver.depot,product,kg});
        donor.kg=round(donor.kg-kg);receiver.kg=round(receiver.kg-kg);
      }
      if(receiver.kg>0)unfilled.push({depot:receiver.depot,product,kg:receiver.kg});
    }
  }
  return {moves,unfilled,totalKg:round(moves.reduce((s,m)=>s+m.kg,0)),unfilledKg:round(unfilled.reduce((s,m)=>s+m.kg,0))};
}
export function transferPlanCsv(report: StockReport, depotName: (id:string)=>string, scope:string, createdAt:string) {
  const plan=rebalanceStock(report),variant=(p:number)=>["Telur reguler","Telur pilihan","Telur ekonomis"][p];
  const quote=(v:unknown)=>{let s=String(v??"");if(typeof v==='string'&&/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
  const headers=["Jenis","Depo sumber","Depo tujuan","Varian","Usulan kg","Sisa kebutuhan kg","Tanggal acuan","Akhir rentang","Ambang kg","Cakupan depo","Dibuat pada UTC","Keterangan"];
  const rows: (string|number)[][]=[...plan.moves.map(m=>["Simulasi transfer",depotName(m.from),depotName(m.to),variant(m.product),m.kg,"",report.day,report.end,report.minKg,scope,createdAt,"Usulan manual; timbang dan hitung butir sebelum transfer; tidak mengubah stok"]),...plan.unfilled.map(m=>["Belum tertutup","",depotName(m.depot),variant(m.product),"",m.kg,report.day,report.end,report.minKg,scope,createdAt,"Perlu pasokan atau pemeriksaan lain; bukan order pembelian"])];
  if(!rows.length)rows.push(["Tidak ada usulan","","","","","",report.day,report.end,report.minKg,scope,createdAt,"Tidak ada kebutuhan transfer dalam cakupan ini"]);
  return "\uFEFF"+[headers,...rows].map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n';
}
export function transferPlanHtml(report: StockReport,depotName:(id:string)=>string) {
  const plan=rebalanceStock(report),variant=(p:number)=>["Telur reguler","Telur pilihan","Telur ekonomis"][p];
  const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  return `<h2>Simulasi transfer antar depo v3.3</h2><p>Usulan ${plan.totalKg} kg · Belum tertutup ${plan.unfilledKg} kg. Hanya saldo bebas layak jual dalam cakupan filter. Sumber tetap menyisakan ambang kg setelah simulasi.</p><table><thead><tr><th>Sumber</th><th>Tujuan</th><th>Varian</th><th>Usulan kg</th></tr></thead><tbody>${plan.moves.length?plan.moves.map(m=>`<tr><td>${esc(depotName(m.from))}</td><td>${esc(depotName(m.to))}</td><td>${variant(m.product)}</td><td>${m.kg}</td></tr>`).join(''):'<tr><td colspan="4">Tidak ada usulan transfer dalam cakupan ini. Pilih Semua depo untuk meninjau jaringan.</td></tr>'}</tbody></table>${plan.unfilled.length?`<h3>Kebutuhan yang belum tertutup</h3><table><thead><tr><th>Depo</th><th>Varian</th><th>Sisa kg</th></tr></thead><tbody>${plan.unfilled.map(m=>`<tr><td>${esc(depotName(m.depot))}</td><td>${variant(m.product)}</td><td>${m.kg}</td></tr>`).join('')}</tbody></table>`:''}<p><small>Simulasi kg tidak memilih batch atau rute termurah dan tidak memindahkan stok. Periksa batch, tanggal transfer, hitung butir, timbang fisik, dan konfirmasikan transfer melalui menu Batch. Menjalankan transfer setelah laporan dibuat dapat mengubah kebutuhan; buat ulang simulasi sebelum tindakan berikutnya.</small></p>`;
}

export function batchTransferPlan(report: StockReport, lots: AlertLot[]) {
  const plan=rebalanceStock(report);
  const available=(l:AlertLot)=>l.kg>0&&l.eggs>0&&l.status==='Aktif'&&l.approved&&l.product!==null&&(!l.harvest||l.harvest<=report.day)&&(!l.expiry||l.expiry>=report.day);
  const pool=lots.filter(available).map(l=>({...l,microKg:Math.round(l.kg*1000000)}));
  pool.sort((a,b)=>Number(!a.expiry)-Number(!b.expiry)||a.expiry.localeCompare(b.expiry)||Number(!a.harvest)-Number(!b.harvest)||a.harvest.localeCompare(b.harvest)||a.id.localeCompare(b.id));
  const totals=new Map<string,number>();
  for(const lot of pool){const key=lot.depot+'|'+lot.product;totals.set(key,(totals.get(key)||0)+lot.microKg)}
  const threshold=Math.ceil(report.minKg*1000000),budgets=new Map<string,number>(),needs=new Map<string,number>();
  for(const b of report.balances){const key=b.depot+'|'+b.product,kg=totals.get(key)||0;budgets.set(key,Math.max(0,kg-threshold));needs.set(key,Math.max(0,threshold-kg))}
  const allocations:{from:string;to:string;product:number;lotId:string;kg:number;harvest:string;expiry:string}[]=[];
  const unallocated:{from:string;to:string;product:number;kg:number}[]=[];
  for(const move of plan.moves) {
    const requested=Math.round(move.kg*1000000),sourceKey=move.from+'|'+move.product,targetKey=move.to+'|'+move.product;
    let remaining=Math.min(requested,budgets.get(sourceKey)||0,needs.get(targetKey)||0),allocated=0;
    for(const lot of pool) {
      if(remaining<=0)break;
      if(lot.depot!==move.from||lot.product!==move.product||lot.microKg<=0)continue;
      const take=Math.min(remaining,lot.microKg);
      allocations.push({from:move.from,to:move.to,product:move.product,lotId:lot.id,kg:take/1000000,harvest:lot.harvest,expiry:lot.expiry});
      lot.microKg-=take;remaining-=take;allocated+=take;
      budgets.set(sourceKey,(budgets.get(sourceKey)||0)-take);needs.set(targetKey,(needs.get(targetKey)||0)-take);
    }
    if(requested>allocated)unallocated.push({...move,kg:(requested-allocated)/1000000});
  }
  return {allocations,unallocated,allocatedKg:Number(allocations.reduce((s,a)=>s+a.kg,0).toFixed(6)),unallocatedKg:Number(unallocated.reduce((s,a)=>s+a.kg,0).toFixed(6))};
}
export function batchTransferCsv(report:StockReport,lots:AlertLot[],depotName:(id:string)=>string,lotName:(id:string)=>string,scope:string,createdAt:string) {
  const detail=batchTransferPlan(report,lots),variant=(p:number)=>['Telur reguler','Telur pilihan','Telur ekonomis'][p];
  const quote=(v:unknown)=>{let s=String(v??'');if(typeof v==='string'&&/^[\s]*[=+@\-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'};
  const headers=['Jenis','Depo sumber','Depo tujuan','Varian','ID batch','Kode batch','Usulan kg','Tanggal panen','Batas jual','Tanggal acuan','Ambang kg','Cakupan depo','Dibuat pada UTC','Keterangan'];
  const rows:(string|number)[][]=[...detail.allocations.map(a=>['Kandidat batch FEFO',depotName(a.from),depotName(a.to),variant(a.product),a.lotId,lotName(a.lotId),a.kg,a.harvest,a.expiry,report.day,report.minKg,scope,createdAt,'Kandidat saja; butir wajib dihitung dan berat ditimbang sebelum transfer; tidak mereservasi stok']),...detail.unallocated.map(a=>['Belum dirinci ke batch',depotName(a.from),depotName(a.to),variant(a.product),'','',a.kg,'','',report.day,report.minKg,scope,createdAt,'Saldo atau kelayakan batch berubah; buat ulang laporan'])];
  if(!rows.length)rows.push(['Tidak ada kandidat','','','','','','','','',report.day,report.minKg,scope,createdAt,'Pilih Semua depo dan periksa surplus serta kekurangan']);
  return '\uFEFF'+[headers,...rows].map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n';
}
export function batchTransferHtml(report:StockReport,lots:AlertLot[],depotName:(id:string)=>string,lotName:(id:string)=>string) {
  const detail=batchTransferPlan(report,lots),variant=(p:number)=>['Telur reguler','Telur pilihan','Telur ekonomis'][p];
  const esc=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  return `<h2>Kandidat batch transfer FEFO v3.4</h2><p>${detail.allocatedKg} kg dirinci · ${detail.unallocatedKg} kg usulan belum dapat dirinci ke batch. FEFO mendahulukan batas jual terdekat; tanggal kosong berada setelah tanggal yang diketahui.</p><table><thead><tr><th>Sumber → tujuan</th><th>Varian</th><th>Batch</th><th>Usulan kg</th><th>Panen</th><th>Batas jual</th></tr></thead><tbody>${detail.allocations.length?detail.allocations.map(a=>`<tr><td>${esc(depotName(a.from))} → ${esc(depotName(a.to))}</td><td>${variant(a.product)}</td><td>${esc(lotName(a.lotId))}<br><small>${esc(a.lotId)}</small></td><td>${a.kg}</td><td>${esc(a.harvest||'Belum diketahui')}</td><td>${esc(a.expiry||'Belum diatur')}</td></tr>`).join(''):'<tr><td colspan="6">Tidak ada kandidat batch transfer dalam cakupan ini.</td></tr>'}</tbody></table>${detail.unallocated.length?`<h3>Usulan yang belum dirinci</h3><ul>${detail.unallocated.map(a=>`<li>${esc(depotName(a.from))} → ${esc(depotName(a.to))} · ${variant(a.product)} · ${a.kg} kg</li>`).join('')}</ul>`:''}<p><small>Rincian hanya kandidat pada snapshot dan tanggal acuan ini. Tidak mereservasi batch, tidak menetapkan butir aktual, dan tidak memindahkan stok. Periksa kembali batch pada tanggal transfer, timbang dan hitung fisik, lalu catat transfer melalui menu Batch. Batas jual kosong tetap perlu pemeriksaan.</small></p>`;
}

export type CandidateAllocation = ReturnType<typeof batchTransferPlan>['allocations'][number];
export type CandidateTransferDraft = {day:string;minKg:number;horizon:number;depots:string[];choice:CandidateAllocation;fingerprint:string};
export function candidateFingerprint(depots:string[],lots:AlertLot[]) {
  const scope=new Set(depots);
  return JSON.stringify(lots.filter(l=>scope.has(l.depot)).slice().sort((a,b)=>a.id.localeCompare(b.id)).map(l=>[l.id,l.depot,l.product,l.kg,l.eggs,l.harvest,l.expiry,l.status,l.approved]));
}
export function prepareCandidateTransfer(report:StockReport,lots:AlertLot[],choice:CandidateAllocation,today:string):CandidateTransferDraft {
  if(report.day!==today)throw Error('Transfer kandidat hanya untuk tanggal acuan hari ini. Terapkan ulang tanggal hari ini.');
  const depots=[...new Set(report.balances.map(b=>b.depot))].sort();
  const fresh=stockAlerts(depots,lots,report.day,report.minKg,report.horizon);
  const match=batchTransferPlan(fresh,lots).allocations.find(a=>a.from===choice.from&&a.to===choice.to&&a.product===choice.product&&a.lotId===choice.lotId&&a.kg===choice.kg);
  if(!match)throw Error('Kandidat berubah atau tidak tersedia. Buat ulang simulasi.');
  return {day:report.day,minKg:report.minKg,horizon:report.horizon,depots,choice:{...match},fingerprint:candidateFingerprint(depots,lots)};
}
export function assertCandidateCurrent(draft:CandidateTransferDraft,lots:AlertLot[],today:string) {
  if(draft.day!==today)throw Error('Tanggal sudah berubah. Buat ulang kandidat untuk hari ini.');
  if(candidateFingerprint(draft.depots,lots)!==draft.fingerprint)throw Error('Saldo atau kondisi batch berubah. Batalkan formulir dan buat ulang simulasi.');
  prepareCandidateTransfer(stockAlerts(draft.depots,lots,draft.day,draft.minKg,draft.horizon),lots,draft.choice,today);
}
export function validateCandidateTransfer(draft:CandidateTransferDraft,lots:AlertLot[],today:string,v:{lotId:string;to:string;kg:number;eggs:number;note:string}) {
  assertCandidateCurrent(draft,lots,today);
  const source=lots.find(l=>l.id===draft.choice.lotId);
  if(v.lotId!==draft.choice.lotId||v.to!==draft.choice.to||!source||source.depot!==draft.choice.from||source.product!==draft.choice.product)throw Error('Batch atau tujuan tidak sesuai kandidat.');
  if(!Number.isFinite(v.kg)||v.kg<=0||Number(v.kg.toFixed(6))!==v.kg||v.kg>draft.choice.kg||v.kg>source.kg)throw Error('Kg fisik harus positif, maksimal enam desimal, dan tidak melebihi usulan.');
  if(!Number.isSafeInteger(v.eggs)||v.eggs<=0||v.eggs>source.eggs)throw Error('Isi butir fisik bulat positif sesuai hasil hitung dan saldo batch.');
  const kgLeft=Number((source.kg-v.kg).toFixed(6)),eggsLeft=source.eggs-v.eggs;
  if((kgLeft===0)!==(eggsLeft===0))throw Error('Sisa kg dan butir harus sama-sama kosong atau sama-sama positif. Periksa hasil hitung.');
  if(typeof v.note!=='string'||!v.note.trim()||v.note.length>300)throw Error('Isi catatan pemeriksaan maksimal 300 karakter.');
  return {lotId:v.lotId,to:v.to,kg:v.kg,eggs:v.eggs,note:v.note.trim()};
}
