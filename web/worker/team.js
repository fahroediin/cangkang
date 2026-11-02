// PamanKu 6.0. All shared writes go through commands, never client snapshots.
const TF_ROLES={
 OW:['Pemilik Usaha','house.read','house.manage','flock.request','flock.approve','flock.execute','house.assign','overview','stock.read','production.read','orders.read','finance.read','prices.read','members.read','members.manage','approve.financial','approve.operational','backup','audit'],
 SA:['Administrator Sistem','members.read','audit'],
 OM:['Manajer Operasional','house.read','house.manage','flock.request','flock.approve','flock.execute','overview','stock.read','production.read','orders.read','prices.read','approve.operational','stock.request','expense.request','depot.request'],
 FA:['Operator Farm','flock.request','house.read','production.read','production.create','stock.read','stock.request','expense.request'],
 QC:['Petugas Mutu','stock.read','lot.quality','orders.read'],
 DP:['Operator Depo','stock.read','stock.request','stock.execute','orders.read','order.pack','return.execute'],
 SL:['Penjualan','stock.read','orders.read','order.create','cancel.request','prices.read','price.request','case.create','balance.read'],
 FN:['Keuangan','orders.read','finance.read','payment.post','credit.request','refund.request','financial.execute','expense.request','prices.read'],
 DS:['Koordinator Distribusi','orders.read','courier.assign','order.dispatch','order.receive'],
 DR:['Kurir','orders.read','order.dispatch','order.receive','case.create'],
 CS:['Layanan Pelanggan','orders.read','case.create','case.resolve','credit.request','balance.read'],
 AU:['Auditor','house.read','overview','stock.read','production.read','orders.read','finance.read','prices.read','audit','members.read','export'],
 CU:['Pelanggan','orders.read','order.create','prices.read','case.create']
};
const tfCan=(m,p)=>Boolean(m?.active&&TF_ROLES[m.role]?.slice(1).includes(p));
const tfError=(msg,status=422)=>{throw Object.assign(Error(msg),{status})};
const tfNeed=(m,p)=>{if(!tfCan(m,p))tfError('Peran Anda tidak diizinkan menjalankan '+p+'.',403)};
const tfId=()=>crypto.randomUUID();
const tfText=(v,n=300,required=true)=>{if(typeof v!=='string'||v.length>n||(required&&!v.trim()))tfError('Teks tidak valid.');return v.trim()};
const tfHash=async v=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)))).map(b=>b.toString(16).padStart(2,'0')).join('');
const tfDepot=(m,id)=>m.depots==='*'||m.depots.includes(id);
const tfHouse=(m,id)=>m.houses==='*'||m.houses.includes(id);
function tfOrder(t,m,id){const o=t.data.orders.find(x=>x.id===id);if(!o||!tfDepot(m,o.depotId)||(m.role==='CU'&&t.orderOwners[id]!==m.userId)||(m.role==='DR'&&o.courier!==m.userId))tfError('Pesanan tidak tersedia dalam cakupan akses.',403);return o}
function tfLot(t,m,id){const l=t.data.lots.find(x=>x.id===id);if(!l||!tfDepot(m,l.depotId))tfError('Batch tidak tersedia dalam cakupan akses.',403);return l}
function tfCase(t,m,id){const c=t.data.cases.find(x=>x.id===id);if(!c)tfError('Kasus tidak tersedia.',403);tfOrder(t,m,c.orderId);return c}
function tfMember(t,userId){const m=t.members.find(x=>x.userId===userId&&x.active);if(!m)tfError('Keanggotaan tidak aktif atau ruang kerja tidak tersedia.',403);return m}
function tfScope(t,role,p){if(!Object.hasOwn(TF_ROLES,role)||role==='OW')tfError('Peran tidak dapat diberikan.');const scope=(v,known)=>v==='*'?'*':Array.isArray(v)&&v.length<=100&&v.every(x=>known.includes(x))?[...new Set(v)]:tfError('Cakupan tidak valid.');return {depots:scope(p.depots,t.data.depots.map(d=>d.id)),houses:p.houses==='*'?'*':scope(Array.isArray(p.houses)?p.houses.map(id=>t.data.houses.find(h=>h.id===id||h.name===id)?.id||id):p.houses,t.data.houses.map(h=>h.id)),category:ND.categories.includes(p.category)?p.category:'Perorangan'}}
function tfUpgradeHouses(t){
 ND.ensureHouseMaster(t.data);
 if(!t.houseAccessVersion){
  for(const m of [...t.members,...t.invitations])if(m.houses!=='*')m.houses=m.houses.map(value=>t.data.houses.find(h=>h.id===value||h.name===value)?.id).filter(Boolean);
  for(const r of t.data.production){const meta=t.productionScopes[r.id];if(meta)meta.houseId=r.houseId;}
  t.houseAccessVersion=1;
 }
}
function tfHouseVisible(m,h){return tfHouse(m,h.id)&&(!h.depotId||tfDepot(m,h.depotId))}
function tfManageHouse(t,m,id){tfNeed(m,'house.manage');const h=t.data.houses.find(h=>h.id===id);if(!h||!tfHouseVisible(m,h)||(h.depotId===null&&m.depots!=='*'))tfError('Kandang di luar cakupan pengelolaan.',403);return h}
async function tfSchema(DB){await DB.prepare('CREATE TABLE IF NOT EXISTS telurfarm_teams (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE, revision INTEGER NOT NULL, payload TEXT NOT NULL)').run()}
async function tfRow(DB,id){return DB.prepare('SELECT id, revision, payload FROM telurfarm_teams WHERE id = ?').bind(id).first()}
const tfPublicMember=m=>({userId:m.userId,email:m.email,name:m.name,role:m.role,depots:m.depots,houses:m.houses,category:m.category,active:m.active});
function tfFlockHealth(t,r){
 if(!['pending','approved'].includes(r.status))return 'closed';
 if(r.fingerprint!==tfFingerprint(t,'flock',r.params))return 'changed';
 try{const maker=t.members.find(m=>m.active&&m.userId===r.maker);tfNeed(maker,'flock.request');tfRequestScope(t,maker,'flock',r.params);if(r.status==='approved'){const approver=t.members.find(m=>m.active&&m.userId===r.approver);tfNeed(approver,'flock.approve');tfRequestScope(t,approver,'flock',r.params)}}catch{return 'blocked'}
 return 'current';
}
function tfMonitorStore(t,m){return FR.validateMonitorFilterStore((t.monitorFilterStores||[]).find(x=>x.userId===m.userId)?.store||FR.emptyMonitorFilterStore())}
function tfMonitorFilterAllowed(t,m,item){
 if(!tfCan(m,'house.read'))return false;
 if(item.source==='requests'&&!['flock.request','flock.approve','flock.execute'].some(p=>tfCan(m,p)))return false;
 return !item.filters.house||t.data.houses.some(h=>h.id===item.filters.house&&tfHouseVisible(m,h));
}
function tfProjection(t,m){
 const s=t.data,finance=tfCan(m,'finance.read'),readOrders=tfCan(m,'orders.read'),priced=tfCan(m,'prices.read')&&m.role!=='DR';
 const allowedOrders=readOrders?s.orders.filter(o=>{try{tfOrder(t,m,o.id);return true}catch{return false}}):[];
 const orderIds=new Set(allowedOrders.map(o=>o.id));
 const stock=tfCan(m,'stock.read')?s.lots.filter(l=>tfDepot(m,l.depotId)):[],lotIds=new Set(stock.map(l=>l.id));
 const memberView=tfCan(m,'members.read')?t.members.map(tfPublicMember):[];
 return {name:t.name,me:tfPublicMember(m),permissions:TF_ROLES[m.role].slice(1),roles:Object.fromEntries(Object.entries(TF_ROLES).map(([k,v])=>[k,v[0]])),
 depots:s.depots.filter(d=>tfDepot(m,d.id)).map(d=>({...d})),
 savedMonitorFilters:tfCan(m,'house.read')?tfMonitorStore(t,m).items.map(item=>tfMonitorFilterAllowed(t,m,item)?{...item,available:true}:{id:item.id,name:item.name,source:item.source,...(item.favorite?{favorite:true}:{}),available:false}):[],
 houses:tfCan(m,'house.read')?s.houses.filter(h=>tfHouseVisible(m,h)).map(h=>({...h,population:ND.housePopulation(s,h.id)})):[],
 flockMovements:tfCan(m,'house.read')?(s.flockMovements||[]).filter(r=>[r.fromHouseId,r.toHouseId].some(id=>id&&s.houses.some(h=>h.id===id&&tfHouseVisible(m,h)))).map(r=>{const visible=id=>id===null||s.houses.some(h=>h.id===id&&tfHouseVisible(m,h));const full=visible(r.fromHouseId)&&visible(r.toHouseId);return {...r,fromHouseId:visible(r.fromHouseId)?r.fromHouseId:null,toHouseId:visible(r.toHouseId)?r.toHouseId:null,fromName:visible(r.fromHouseId)?r.fromName:'Di luar cakupan',toName:visible(r.toHouseId)?r.toName:'Di luar cakupan',note:full?r.note:'Catatan dibatasi',restricted:!full,...(full&&t.flockApprovals?.[r.id]?{approval:t.flockApprovals[r.id]}:{})}}):[],
 lots:stock.map(l=>({...l,parentId:lotIds.has(l.parentId)?l.parentId:null,note:l.note,restrictedParent:Boolean(l.parentId&&!lotIds.has(l.parentId))})),
 production:tfCan(m,'production.read')?s.production.filter(r=>t.productionScopes[r.id]&&tfDepot(m,t.productionScopes[r.id].depotId)&&tfHouse(m,r.houseId)):[],
 orders:allowedOrders.map(o=>{const out={id:o.id,depotId:o.depotId,date:o.date,status:o.status,packed:o.packed,courier:o.courier,recipient:o.recipient,lines:o.lines.map(l=>({product:l.product,unit:l.unit,quantity:l.quantity})),allocations:o.allocations.map(a=>({lotId:a.lotId,line:a.line,kg:a.kg,eggs:a.eggs}))};
  if(m.role!=='QC')Object.assign(out,{name:o.name,phone:o.phone,address:o.address,slot:o.slot,notes:o.notes});
  if(priced||finance)Object.assign(out,{category:o.category,total:o.total,lines:o.lines,due:o.due});
  if(finance||tfCan(m,'balance.read')||m.role==='CU')out.financial=ND.financial(s,o);
  // Sales and support need only the remaining balance, never payment/refund totals.
  if(!finance&&m.role!=='CU'&&out.financial)out.financial={balance:out.financial.balance};return out}),
 cases:readOrders?s.cases.filter(c=>orderIds.has(c.orderId)).map(c=>({id:c.id,orderId:c.orderId,description:c.description,created:c.created,resolution:c.resolution,returns:c.returns,...(finance||m.role==='CU'?{credit:c.credit,refund:c.refund,reference:c.reference}:{})})):[],
 payments:finance?s.payments.filter(p=>orderIds.has(p.orderId)):[],expenses:finance&&m.depots==='*'?s.expenses:[],
 prices:priced?(m.role==='CU'?{[m.category]:s.prices[m.category]}:s.prices):{},
 members:memberView,couriers:tfCan(m,'courier.assign')?t.members.filter(x=>x.active&&x.role==='DR'&&(x.depots==='*'||x.depots.some(d=>tfDepot(m,d)))).map(x=>({userId:x.userId,name:x.name})):[],
 customers:tfCan(m,'order.create')&&m.role!=='CU'?t.members.filter(x=>x.active&&x.role==='CU'&&(x.depots==='*'||x.depots.some(d=>tfDepot(m,d)))).map(x=>({userId:x.userId,name:x.name,category:x.category})):[],
 invitations:tfCan(m,'members.manage')?t.invitations.map(({hash,...i})=>i):[],
 requests:t.requests.filter(r=>{try{tfRequestScope(t,m,r.type,r.params);return r.maker===m.userId||tfCan(m,TF_CHANGES[r.type].approve)||tfCan(m,TF_CHANGES[r.type].execute)}catch{return false}}).map(({fingerprint,...r})=>({...r,...(r.type==='flock'?{health:tfFlockHealth(t,{...r,fingerprint})}:{})})),
 events:tfCan(m,'audit')?t.events.filter(e=>m.role==='OW'||m.role==='SA'||(e.depots||[]).every(d=>tfDepot(m,d))).map(e=>({...e})):[]};
}
const TF_CHANGES={
 flock:{request:'flock.request',approve:'flock.approve',execute:'flock.execute'},
 depot:{request:'depot.request',approve:'approve.financial',execute:'depot.request'},
 transfer:{request:'stock.request',approve:'approve.operational',execute:'stock.execute'},
 correction:{request:'stock.request',approve:'approve.operational',execute:'stock.execute'},
 cancel:{request:'cancel.request',approve:'approve.operational',execute:'cancel.request'},
 price:{request:'price.request',approve:'approve.financial',execute:'financial.execute'},
 expense:{request:'expense.request',approve:'approve.financial',execute:'financial.execute'},
 credit:{request:'credit.request',approve:'approve.financial',execute:'financial.execute'},
 refund:{request:'refund.request',approve:'approve.financial',execute:'financial.execute'},
 return:{request:'stock.request',approve:'approve.operational',execute:'return.execute'}
};
function tfRequestScope(t,m,type,p){
 if(!Object.hasOwn(TF_CHANGES,type))tfError('Jenis permintaan tidak tersedia.');
 if(type==='flock'){for(const id of [p.fromHouseId,p.toHouseId])if(id!==null){const h=t.data.houses.find(h=>h.id===id);if(!h||!tfHouseVisible(m,h))tfError('Kandang mutasi di luar cakupan.',403)}}
 if(type==='depot'&&(!t.data.depots.some(d=>d.id===p.id)||!tfDepot(m,p.id)))tfError('Depo di luar cakupan.',403);
 if(['transfer','correction'].includes(type)){tfLot(t,m,p.id);if(type==='transfer'&&(!t.data.depots.some(d=>d.id===p.to)||!tfDepot(m,p.to)))tfError('Depo tujuan di luar cakupan.',403)}
 if(type==='cancel')tfOrder(t,m,p.id);
 if(['credit','refund','return'].includes(type))tfCase(t,m,p.id);
 if(['price','expense'].includes(type)&&m.depots!=='*')tfError('Perubahan keuangan global memerlukan cakupan semua depo.',403);
}
function tfFingerprint(t,type,p){
 if(type==='flock'){const ids=[p.fromHouseId,p.toHouseId].filter(Boolean);return JSON.stringify([t.data.houses.filter(h=>ids.includes(h.id)),t.data.production.filter(r=>ids.includes(r.houseId)),(t.data.flockMovements||[]).filter(r=>ids.includes(r.fromHouseId)||ids.includes(r.toHouseId))])}

 if(['transfer','correction'].includes(type))return JSON.stringify(t.data.lots.find(l=>l.id===p.id));
 if(type==='depot')return JSON.stringify(t.data.depots.find(d=>d.id===p.id));
 if(type==='price')return JSON.stringify(t.data.prices);
 if(type==='expense')return JSON.stringify(t.data.expenses);
 const c=['credit','refund','return'].includes(type)?t.data.cases.find(c=>c.id===p.id):null;
 const o=t.data.orders.find(o=>o.id===(c?c.orderId:p.id));
 return JSON.stringify([o,t.data.cases.filter(c=>c.orderId===o?.id),t.data.payments.filter(x=>x.orderId===o?.id)]);
}
function tfChange(t,type,p){const s=t.data;
 if(type==='flock')ND.recordFlockMovement(s,{id:p.newId,date:p.date,kind:p.kind,fromHouseId:p.fromHouseId,toHouseId:p.toHouseId,quantity:p.quantity,note:p.note});
 if(type==='depot'){const d=s.depots.find(d=>d.id===p.id);if(!d||!Number.isFinite(p.lat)||!Number.isFinite(p.lng)||Math.abs(p.lat)>90||Math.abs(p.lng)>180||!Number.isFinite(p.radius)||p.radius<0||p.radius>1000||typeof p.verified!=='boolean')tfError('Lokasi depo tidak valid.');Object.assign(d,{lat:p.lat,lng:p.lng,radius:p.radius,verified:p.verified});}
 if(type==='transfer'){ND.transfer(s,p.id,p.to,p.kg,p.eggs,p.newId,p.note);if(t.lotMakers[p.id])t.lotMakers[p.newId]=t.lotMakers[p.id];}
 if(type==='correction'){if(typeof p.increase!=='boolean')tfError('Jenis koreksi tidak valid.');ND.correctLot(s,p.id,p.kg,p.eggs,p.increase,p.note)}
 if(type==='cancel')ND.cancelOrder(s,p.id);
 if(type==='price'){if(!ND.categories.includes(p.category)||![0,1,2].includes(p.product)||!Number.isSafeInteger(p.kg)||p.kg<=0||!Number.isSafeInteger(p.butir)||p.butir<=0)tfError('Harga tidak valid.');s.prices[p.category][p.product]=[p.kg,p.butir]}
 if(type==='expense')s.expenses.push({id:p.newId,date:p.date,label:tfText(p.label),amount:p.amount});
 if(type==='credit')ND.creditCase(s,p.id,p.amount);
 if(type==='refund')ND.refundCase(s,p.id,p.amount,tfText(p.reference,150));
 if(type==='return')ND.intakeReturn(s,p.id,p.items);
 ND.validateState(s);
}
function tfAction(t,m,action,p){const s=t.data;
 const need=x=>tfNeed(m,x),order=()=>tfOrder(t,m,p.id);
 if(['monitor.filter.save','monitor.filter.delete','monitor.filter.rename','monitor.filter.update','monitor.filter.duplicate','monitor.filter.favorite'].includes(action)){
  need('house.read');const previous=tfMonitorStore(t,m);
  let next;
  if(action==='monitor.filter.save'||action==='monitor.filter.update'){
   if(action==='monitor.filter.update'&&!previous.items.some(x=>x.id===p.id))tfError('Filter monitor tidak ditemukan.');
   const candidate={source:p.source,filters:p.filters};
   if(!tfMonitorFilterAllowed(t,m,candidate))tfError('Sumber laporan atau kandang filter di luar cakupan.',403);
   FR.validateMonitorFilters(p.filters,s.houses.filter(h=>tfHouseVisible(m,h)).map(h=>h.id));
   next=action==='monitor.filter.save'?FR.addMonitorSavedFilter(previous,tfId(),tfText(p.name,240),p.source,p.filters):FR.updateMonitorSavedFilter(previous,p.id,p.source,p.filters);
  }else if(action==='monitor.filter.favorite'){
   const original=previous.items.find(x=>x.id===p.id);if(!original)tfError('Filter monitor tidak ditemukan.');
   if(p.favorite===true&&!tfMonitorFilterAllowed(t,m,original))tfError('Filter tidak tersedia dalam cakupan sekarang.',403);
   next=FR.setMonitorSavedFavorite(previous,p.id,p.favorite);
  }else if(action==='monitor.filter.duplicate'){
   const original=previous.items.find(x=>x.id===p.id);if(!original)tfError('Filter monitor tidak ditemukan.');
   if(!tfMonitorFilterAllowed(t,m,original))tfError('Filter tidak tersedia dalam cakupan sekarang.',403);
   FR.validateMonitorFilters(original.filters,s.houses.filter(h=>tfHouseVisible(m,h)).map(h=>h.id));
   next=FR.duplicateMonitorSavedFilter(previous,p.id,tfId(),tfText(p.name,240));
  }else if(action==='monitor.filter.rename')next=FR.renameMonitorSavedFilter(previous,p.id,tfText(p.name,240));
  else next=FR.removeMonitorSavedFilter(previous,p.id);
  t.monitorFilterStores=(t.monitorFilterStores||[]).filter(x=>x.userId!==m.userId);t.monitorFilterStores.push({userId:m.userId,store:next});
 }
 else if(action==='house.create'||action==='house.update'){

  need('house.manage');const old=action==='house.update'?tfManageHouse(t,m,p.id):null;
  if(!tfDepot(m,p.depotId))tfError('Depo kandang di luar cakupan.',403);
  if(!old&&m.houses!=='*')tfError('Penambahan kandang memerlukan cakupan Semua kandang.',403);
  ND.saveHouse(s,{id:old?.id||tfId(),code:tfText(p.code,30),name:tfText(p.name,100),farmLocation:tfText(p.farmLocation),depotId:p.depotId,capacity:p.capacity,initialPopulation:p.initialPopulation,active:old?old.active:true});
 }
 else if(action==='flock.create')tfError('Mutasi populasi wajib melalui pengajuan dan persetujuan. Gunakan request.create dengan jenis flock.',403);
 else if(action==='house.status'){const h=tfManageHouse(t,m,p.id);ND.setHouseActive(s,h.id,p.active);}
 else if(action==='house.assign'){
  need('house.assign');const member=t.members.find(x=>x.active&&x.role==='FA'&&x.userId===p.userId);if(!member)tfError('Pilih operator farm aktif.');
  const scope=tfScope(t,'FA',{depots:member.depots,houses:p.houses,category:member.category});
  const selected=scope.houses==='*'?s.houses:s.houses.filter(h=>scope.houses.includes(h.id));
  if(scope.houses!=='*'&&selected.some(h=>h.depotId&&!tfDepot(member,h.depotId)))tfError('Depo operator belum mencakup kandang yang dipilih.');
  member.houses=scope.houses;
 }
 else if(action==='production.create'){
  need(action);const id=p.houseId||s.houses.find(h=>h.name===p.house)?.id;
  if(!tfDepot(m,p.depotId)||!tfHouse(m,id))tfError('Farm atau depo di luar cakupan.',403);
  if(!ND.dateOK(p.date)||p.date>ND.today())tfError('Tanggal produksi tidak valid.');
  const h=ND.houseForProduction(s,id,p.date,p.depotId,p.dead);
  if((p.eggs===0)!==(p.kg===0))tfError('Berat dan butir hasil baik harus sama-sama nol atau positif.');
  const r={id:tfId(),date:p.date,houseId:h.id,house:h.name,eggs:p.eggs,kg:p.kg,broken:p.broken,feed:p.feed,dead:p.dead};s.production.push(r);t.productionScopes[r.id]={depotId:p.depotId,houseId:h.id};
  const l={id:tfId(),parentId:null,depotId:p.depotId,product:null,kg:p.kg,eggs:p.eggs,harvest:p.date,expiry:'',quality:'Karantina',note:'Produksi '+r.id};if(p.kg>0&&p.eggs>0){ND.addLot(s,l);t.lotMakers[l.id]=m.userId}
 }
 else if(action==='lot.quality'){need(action);const l=tfLot(t,m,p.id);if(t.lotMakers[l.id]===m.userId)tfError('Pemeriksa mutu harus berbeda dari pencatat produksi.',403);if(![0,1,2].includes(p.product)||!['Aktif','Karantina','Diblokir'].includes(p.quality))tfError('Varian atau status tidak valid.');Object.assign(l,{product:p.product,quality:p.quality,harvest:p.harvest,expiry:p.expiry,note:tfText(p.note)});}
 else if(action==='order.create'){need(action);if(!tfDepot(m,p.depotId))tfError('Depo di luar cakupan.',403);let customer=null;if(m.role==='CU')customer=m;else if(p.customerUserId){customer=t.members.find(x=>x.active&&x.role==='CU'&&x.userId===p.customerUserId);if(!customer||!tfDepot(customer,p.depotId))tfError('Pelanggan atau depo tidak sesuai.',403)}const category=customer?.category||p.category;if(!ND.categories.includes(category))tfError('Kategori tidak valid.');if(!Array.isArray(p.lines)||p.lines.length<1||p.lines.length>30||p.lines.some(l=>![0,1,2].includes(l.product)||!['kg','butir'].includes(l.unit)||!ND.qty(l.quantity,l.unit==='butir')||l.quantity<=0))tfError('Baris pesanan tidak valid.');const id=tfId();ND.placeOrder(s,{id,name:tfText(p.name,100),phone:tfText(p.phone,30),address:tfText(p.address),category,depotId:p.depotId,date:p.date,due:p.due,slot:tfText(p.slot||'',100,false),notes:tfText(p.notes||'',300,false),lines:p.lines.map(l=>({product:l.product,unit:l.unit,quantity:l.quantity,price:0}))});if(customer)t.orderOwners[id]=customer.userId;}
 else if(action==='order.pack'){need(action);order();if(!Array.isArray(p.measured)||p.measured.length>200)tfError('Hasil packing tidak valid.');ND.packOrder(s,p.id,p.measured,tfText(p.note));}
 else if(action==='courier.assign'){need(action);const o=order(),c=t.members.find(x=>x.active&&x.userId===p.userId&&x.role==='DR');if(o.status!=='Diproses'||!c||!tfDepot(c,o.depotId))tfError('Kurir atau status tidak sesuai.');o.courier=c.userId;}
 else if(action==='order.dispatch'){need(action);const o=order(),c=t.members.find(x=>x.active&&x.role==='DR'&&x.userId===o.courier);if(!c||!tfDepot(c,o.depotId))tfError('Kurir aktif belum ditugaskan.');ND.dispatch(s,o.id,c.userId);}
 else if(action==='order.receive'){need(action);order();if(m.role==='DS')tfText(p.reason);ND.receive(s,p.id,tfText(p.recipient,100));}
 else if(action==='payment.post'){need(action);const o=order();ND.recordPayment(s,{id:tfId(),orderId:o.id,amount:p.amount,date:p.date,reference:tfText(p.reference,150)});}
 else if(action==='case.create'){need(action);const o=order();ND.createCase(s,{id:tfId(),orderId:o.id,description:tfText(p.description,500),created:new Date().toISOString(),returns:[],credit:0,refund:0,reference:'',resolution:''});}
 else if(action==='case.resolve'){need(action);const c=tfCase(t,m,p.id);if(c.resolution)tfError('Kasus sudah ditutup.');if(c.credit>c.refund&&ND.financial(s,s.orders.find(o=>o.id===c.orderId)).refundDue>0)tfError('Selesaikan hak refund sebelum menutup kasus.');c.resolution=tfText(p.resolution,500);}
 else if(action==='request.create'){const rule=Object.hasOwn(TF_CHANGES,p.type)&&TF_CHANGES[p.type];if(!rule)tfError('Jenis permintaan tidak tersedia.');need(rule.request);tfRequestScope(t,m,p.type,p.params);const params=p.type==='flock'?{date:p.params.date,kind:p.params.kind,fromHouseId:p.params.fromHouseId,toHouseId:p.params.toHouseId,quantity:p.params.quantity,note:tfText(p.params.note)}:structuredClone(p.params);if(['transfer','expense','flock'].includes(p.type))params.newId=tfId();if(p.type==='return'){if(!Array.isArray(params.items)||params.items.length>30)tfError('Rincian retur tidak valid.');params.items=params.items.map(i=>({line:i.line,kg:i.kg,eggs:i.eggs,lotId:tfId()}))}tfChange(structuredClone(t),p.type,params);if(t.requests.filter(r=>r.status==='pending'||r.status==='approved').length>=100)tfError('Maksimal 100 permintaan terbuka.');t.requests.push({id:tfId(),type:p.type,params,maker:m.userId,status:'pending',fingerprint:tfFingerprint(t,p.type,params),created:new Date().toISOString()});}
 else if(action==='request.approve'||action==='request.reject'){const r=t.requests.find(r=>r.id===p.id);if(!r||r.status!=='pending')tfError('Permintaan tidak menunggu persetujuan.');need(TF_CHANGES[r.type].approve);tfRequestScope(t,m,r.type,r.params);if(r.maker===m.userId)tfError('Pembuat tidak boleh menyetujui atau menolak permintaannya sendiri.',403);if(action==='request.approve'&&r.fingerprint!==tfFingerprint(t,r.type,r.params))tfError('Data sumber berubah. Buat permintaan baru.',409);if(r.type==='flock'&&action==='request.approve'){const maker=t.members.find(x=>x.active&&x.userId===r.maker);tfNeed(maker,'flock.request');tfRequestScope(t,maker,r.type,r.params);tfChange(structuredClone(t),r.type,r.params)}r.status=action==='request.approve'?'approved':'rejected';r.approver=m.userId;r.reason=tfText(p.reason);r.decidedAt=new Date().toISOString();}
 else if(action==='request.withdraw'){const r=t.requests.find(r=>r.id===p.id);if(!r||r.maker!==m.userId||!['pending','approved'].includes(r.status))tfError('Permintaan tidak dapat ditarik.',403);r.status='withdrawn';r.withdrawnAt=new Date().toISOString();}
 else if(action==='request.execute'){const r=t.requests.find(r=>r.id===p.id);if(!r||r.status!=='approved')tfError('Permintaan belum disetujui atau sudah dijalankan.');need(TF_CHANGES[r.type].execute);tfRequestScope(t,m,r.type,r.params);const maker=t.members.find(x=>x.userId===r.maker&&x.active),approver=t.members.find(x=>x.userId===r.approver&&x.active);if(!maker||!approver||r.maker===r.approver||!tfCan(maker,TF_CHANGES[r.type].request)||!tfCan(approver,TF_CHANGES[r.type].approve))tfError('Penugasan pembuat atau pemeriksa berubah.',403);tfRequestScope(t,maker,r.type,r.params);tfRequestScope(t,approver,r.type,r.params);if(r.fingerprint!==tfFingerprint(t,r.type,r.params))tfError('Data sumber berubah. Buat permintaan baru.',409);tfChange(t,r.type,r.params);r.status='executed';r.executor=m.userId;r.executedAt=new Date().toISOString();if(r.type==='flock'){t.flockApprovals??={};t.flockApprovals[r.params.newId]={requestId:r.id,maker:r.maker,approver:r.approver,executor:r.executor,executedAt:r.executedAt}}}
 else if(action==='member.revoke'){need('members.manage');const member=t.members.find(x=>x.userId===p.userId);if(!member||member.role==='OW'||member.userId===m.userId)tfError('Pemilik dan diri sendiri tidak dapat dicabut.');member.active=false;}
 else if(action==='invite.revoke'){need('members.manage');const i=t.invitations.find(i=>i.id===p.id);if(!i)tfError('Undangan tidak ditemukan.');i.revoked=true;}
 else tfError('Tindakan tidak tersedia.',404);
 ND.validateState(s);
}
async function teamAPI(request,env){
 const userId=request.headers.get('oai-authenticated-user-id'),email=(request.headers.get('oai-authenticated-user-email')||'').toLowerCase();
 if(!userId||userId.length>256||!email||email.length>254)return json({error:'Masuk melalui ChatGPT dengan email untuk akses tim.'},401);
 if(!env.DB)return json({error:'Database belum tersedia.'},503);
 const url=new URL(request.url),origin=request.headers.get('origin');if((origin&&origin!==url.origin)||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Asal permintaan tidak diizinkan.'},403);
 await tfSchema(env.DB);
 if(request.method==='GET'&&url.pathname==='/api/team/me'){
  const result=await env.DB.prepare("SELECT id, revision, payload FROM telurfarm_teams WHERE EXISTS (SELECT 1 FROM json_each(json_extract(payload,'$.members')) WHERE json_extract(value,'$.userId') = ? AND json_extract(value,'$.active') = 1)").bind(userId).all();
  return json({userId,email,teams:result.results.map(row=>{const t=JSON.parse(row.payload),m=tfMember(t,userId);return {id:row.id,name:t.name,role:m.role,revision:row.revision}})});
 }
 if(!['GET','POST'].includes(request.method))return json({error:'Metode tidak diizinkan.'},405);
 let body={};if(request.method==='POST'){if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return json({error:'Gunakan JSON.'},415);body=await boundedJSON(request);if(!body||typeof body!=='object'||Array.isArray(body))tfError('Payload tidak valid.',400)}
 if(url.pathname==='/api/team/create'&&request.method==='POST'){
  const id=tfId(),data=ND.baseState(),name=tfText(body.name,100),owner={userId,email,name:tfText(body.displayName||email,100),role:'OW',depots:'*',houses:'*',category:'Perorangan',active:true};
  const t={name,members:[owner],invitations:[],requests:[],events:[],data,orderOwners:{},productionScopes:{},lotMakers:{},replays:[]};
  const r=await env.DB.prepare('INSERT INTO telurfarm_teams(id,owner_id,revision,payload) VALUES(?,?,1,?) ON CONFLICT(owner_id) DO NOTHING').bind(id,userId,JSON.stringify(t)).run();if(r.meta.changes!==1)tfError('Anda sudah memiliki ruang kerja pribadi. Pilih ruang kerja tersebut.',409);return json({id,revision:1});
 }
 const id=request.method==='GET'?url.searchParams.get('teamId'):body.teamId;if(typeof id!=='string'||id.length>100)tfError('ID ruang kerja tidak valid.',400);
 const row=await tfRow(env.DB,id);if(!row)tfError('Ruang kerja tidak tersedia.',403);const t=JSON.parse(row.payload);tfUpgradeHouses(t);
 if(url.pathname==='/api/team/join'&&request.method==='POST'){
  const hash=await tfHash(tfText(body.token,200)),i=t.invitations.find(i=>i.hash===hash&&!i.used&&!i.revoked&&i.expires>Date.now()&&i.email===email);
  if(!i||t.members.some(m=>m.userId===userId&&m.active))tfError('Undangan tidak sah, sudah dipakai, kadaluarsa atau email tidak cocok.',403);
  const scope=tfScope(t,i.role,i),member={userId,email,name:tfText(body.displayName||email,100),role:i.role,...scope,active:true};t.members=t.members.filter(m=>m.userId!==userId);t.members.push(member);i.used=true;t.events.push({time:new Date().toISOString(),actor:userId,action:'member.join',depots:member.depots==='*'?[]:member.depots});
 }else{
  const m=tfMember(t,userId);
  if(url.pathname==='/api/team/view'&&request.method==='GET')return json({id,revision:row.revision,...tfProjection(t,m)});
  if(url.pathname==='/api/team/recommend'&&request.method==='POST'){tfNeed(m,'order.create');const p=body.params||{};if(!ND.dateOK(p.date)||!Array.isArray(p.lines)||p.lines.length<1||p.lines.length>30||p.lines.some(l=>![0,1,2].includes(l.product)||!['kg','butir'].includes(l.unit)||!ND.qty(l.quantity,l.unit==='butir')||l.quantity<=0))tfError('Kebutuhan pesanan tidak valid.');if(p.location&&(!Number.isFinite(p.location.lat)||!Number.isFinite(p.location.lng)||Math.abs(p.location.lat)>90||Math.abs(p.location.lng)>180))tfError('Koordinat tidak valid.');return json({depots:ND.rankedDepots(t.data,p.lines.map(l=>({...l,price:t.data.prices[m.role==='CU'?m.category:(ND.categories.includes(p.category)?p.category:'Perorangan')][l.product][l.unit==='kg'?0:1]})),p.date,p.location||null).filter(r=>tfDepot(m,r.depot.id)).map(r=>({id:r.depot.id,name:r.depot.name,available:r.available,km:r.km,reason:r.available?'Tersedia':'Tidak tersedia untuk kebutuhan ini'}))})}
  if(url.pathname==='/api/team/performance'&&request.method==='GET'){
   tfNeed(m,'house.read');tfNeed(m,'production.read');const projection=tfProjection(t,m),filters={from:url.searchParams.get('from'),to:url.searchParams.get('to'),house:url.searchParams.get('house')||''};
   try{HP.validatePerformanceFilters(filters,projection.houses.map(h=>h.id))}catch{tfError('Pilih periode valid maksimal 366 hari dan kandang dalam cakupan.');}
   return json({workspace:t.name,revision:row.revision,...HP.housePerformance(projection.houses,projection.production,filters)});
  }
  if(url.pathname==='/api/team/export'&&request.method==='GET'){if(!tfCan(m,'backup')&&!tfCan(m,'export'))tfError('Ekspor tidak diizinkan.',403);if(m.role==='OW')return json({schema:2,app:'TelurFarm Native',...t.data});return json({kind:'scoped-report',id,revision:row.revision,...tfProjection(t,m)})}
  if(request.method!=='POST')tfError('Endpoint tidak tersedia.',404);
  const requestId=tfText(body.requestId,100),signature=await tfHash(JSON.stringify([url.pathname,body.action,body.params,body.email,body.role,body.depots,body.houses,body.category]));
  const prior=t.replays.find(r=>r.actor===userId&&r.requestId===requestId);if(prior){if(prior.signature!==signature)tfError('ID permintaan sudah dipakai untuk tindakan lain.',409);return json({id,revision:row.revision,replayed:true})}
  if(!Number.isSafeInteger(body.expectedRevision)||body.expectedRevision!==row.revision)tfError('Data atau hak akses berubah. Muat ulang sebelum melanjutkan.',409);
  if(url.pathname==='/api/team/invite'){
   tfNeed(m,'members.manage');if(t.members.length>=100)tfError('Maksimal 100 anggota.');if(t.invitations.filter(i=>!i.used&&!i.revoked&&i.expires>Date.now()).length>=30)tfError('Maksimal 30 undangan aktif.');const recipient=tfText(body.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)||recipient===email||t.members.some(x=>x.active&&x.email===recipient))tfError('Email sudah menjadi anggota atau tidak valid.');const scope=tfScope(t,body.role,body),token=tfId()+tfId();t.invitations.push({id:tfId(),hash:await tfHash(token),email:recipient,role:body.role,...scope,expires:Date.now()+72*3600000,used:false,revoked:false});body._token=token;
  }else if(url.pathname==='/api/team/action'){try{tfAction(t,m,tfText(body.action,100),body.params||{})}catch(e){if(!e.status)e.status=422;throw e}}
  else tfError('Endpoint tidak tersedia.',404);
  t.events.push({time:new Date().toISOString(),actor:userId,action:url.pathname==='/api/team/invite'?'member.invite':body.action,depots:m.depots==='*'?[]:m.depots});
  t.replays.push({actor:userId,requestId,signature});t.replays=t.replays.slice(-500);
 }
 t.data.revision++;t.events=t.events.slice(-1000);const payload=JSON.stringify(t);if(new TextEncoder().encode(payload).length>1400000)tfError('Ruang kerja mendekati batas 1,4 MB. Ekspor dan tinjau kapasitas.',413);
 const updated=await env.DB.prepare('UPDATE telurfarm_teams SET revision=revision+1,payload=? WHERE id=? AND revision=?').bind(payload,id,row.revision).run();
 if(updated.meta.changes!==1)tfError('Data berubah bersamaan. Muat ulang sebelum melanjutkan.',409);
 return json({id,revision:row.revision+1,...(body._token?{token:body._token}:{})});
}
