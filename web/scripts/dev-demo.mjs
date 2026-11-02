// Local demo only: role identities and seed data for presentations/FGD. The Panduan FGD panel lives in ../demo (demo-proxy.mjs).
// Seeds through the real worker API so RBAC and workspace isolation stay enforced.
const MAIN='Peternakan Demo Banten',OTHER='Peternakan Maju Serang';
export const DEMO_USERS=[
 {key:'ow',role:'OW',name:'Bu Sari (Pemilik)'},
 {key:'om',role:'OM',name:'Pak Budi (Manajer Operasional)'},
 {key:'fa',role:'FA',name:'Joko (Operator Farm)'},
 {key:'qc',role:'QC',name:'Rina (Petugas Mutu)'},
 {key:'dp',role:'DP',name:'Agus (Operator Depo)'},
 {key:'sl',role:'SL',name:'Dewi (Penjualan)'},
 {key:'fn',role:'FN',name:'Lina (Keuangan)'},
 {key:'ds',role:'DS',name:'Hendra (Koordinator Distribusi)'},
 {key:'dr',role:'DR',name:'Udin (Kurir)'},
 {key:'cs',role:'CS',name:'Maya (Layanan Pelanggan)'},
 {key:'au',role:'AU',name:'Pak Teguh (Auditor, 2 usaha)'},
 {key:'sa',role:'SA',name:'Admin Sistem'},
 {key:'cu',role:'CU',name:'Toko Berkah (Pelanggan)'},
 {key:'ow2',role:'OW',name:'Pak Hasan (Pemilik usaha lain)',team:OTHER},
 {key:'fa2',role:'FA',name:'Rudi (Operator Farm usaha lain)',team:OTHER}
].map(u=>({team:MAIN,...u,id:'demo-'+u.key,email:u.key+'@demo.pamanku.test'}));
export const demoUser=key=>DEMO_USERS.find(u=>u.key===key)||DEMO_USERS[0];

const HOUSES=[
 {id:'house-a',code:'KDG-A',name:'Kandang A',farmLocation:'Farm Anyer Blok 1',depotId:'anyer',capacity:1000,initialPopulation:950,gap:0},
 {id:'house-b',code:'KDG-B',name:'Kandang B',farmLocation:'Farm Anyer Blok 2',depotId:'anyer',capacity:1200,initialPopulation:1100,gap:0},
 {id:'house-c',code:'KDG-C',name:'Kandang C',farmLocation:'Farm Cilegon',depotId:'cilegon',capacity:800,initialPopulation:760,gap:4}
];
const OTHER_HOUSES=[
 {id:'house-a',code:'SRG-1',name:'Kandang Kragilan 1',farmLocation:'Farm Kragilan',depotId:'serang',capacity:1500,initialPopulation:1400,gap:0},
 {id:'house-b',code:'SRG-2',name:'Kandang Kragilan 2',farmLocation:'Farm Kragilan',depotId:'serang',capacity:1500,initialPopulation:1350,gap:0},
 {id:'house-c',code:'SRG-3',name:'Kandang Ciruas',farmLocation:'Farm Ciruas',depotId:'serang',capacity:900,initialPopulation:880,gap:0}
];
const jakartaDate=daysAgo=>new Date(Date.now()+7*3600e3-daysAgo*864e5).toISOString().slice(0,10);

// One API session per workspace; requests run through the real worker with the given user's identity headers.
function session(worker,env){
 let teamId,revision,seq=0;
 const call=async(user,method,path,body)=>{const headers=new Headers({'oai-authenticated-user-id':user.id,'oai-authenticated-user-email':user.email});if(body)headers.set('content-type','application/json');const url='http://demo.local/api/team/'+path+(method==='GET'?'?teamId='+encodeURIComponent(teamId):'');const res=await worker.fetch(new Request(url,{method,headers,...(body?{body:JSON.stringify(body)}:{})}),env);const data=await res.json();if(!res.ok)throw Error(path+' '+(body?.action||'')+': '+data.error);if(data.revision)revision=data.revision;return data};
 const write=(user,path,body)=>call(user,'POST',path,{teamId,expectedRevision:revision,requestId:'seed-'+(++seq),...body});
 const create=async(owner,name,members)=>{({id:teamId}=await call(owner,'POST','create',{name,displayName:owner.name}));revision=1;
  for(const u of members){const {token}=await write(owner,'invite',{email:u.email,role:u.role,depots:'*',houses:'*',category:u.role==='CU'?'Wholesale':'Perorangan'});await call(u,'POST','join',{teamId,token,displayName:u.name})}};
 return {call,write,create};
}

// Seeds 29 past days (today stays empty for a live demo entry). Kandang C skips every 4th day to show incomplete records.
async function seedProduction(write,fa,houses,days){
 let n=0;for(let d=days;d>=1;d--)for(const h of houses){
  if(h.gap&&d%h.gap===0)continue;n++;
  const wobble=((d*7+h.capacity)%13)/100,eggs=Math.round(h.initialPopulation*(0.8+wobble)),dead=(d+h.capacity)%9===0?1:0;
  await write(fa,'action',{action:'production.create',params:{date:jakartaDate(d),houseId:h.id,depotId:h.depotId,eggs,kg:Math.round(eggs*0.062*10)/10,broken:4+(d%6),feed:Math.round(h.initialPopulation*0.11),dead}});
 }
 return n;
}

export async function seedDemo(worker,env,{days=29}={}){
 const main=session(worker,env),{call,write}=main,owner=DEMO_USERS[0],fa=demoUser('fa'),qc=demoUser('qc');
 await main.create(owner,MAIN,DEMO_USERS.filter(u=>u.team===MAIN&&u.role!=='OW'));
 for(const {gap,...h} of HOUSES)await write(owner,'action',{action:'house.update',params:h});
 const n=await seedProduction(write,fa,HOUSES,days);
 // QC releases older batches; the last 2 days stay in quarantine so the QC flow can be shown live.
 const view=await call(qc,'GET','view');const cutoff=jakartaDate(2);
 for(const l of view.lots.filter(l=>l.quality==='Karantina'&&l.harvest<cutoff))await write(qc,'action',{action:'lot.quality',params:{id:l.id,product:0,quality:'Aktif',harvest:l.harvest,expiry:'',note:'Lolos cek mutu (data demo)'}});
 const orders=await seedOrders(write,call);
 // Second tenant: separate owner and data; the auditor belongs to both workspaces.
 const other=session(worker,env);
 await other.create(demoUser('ow2'),OTHER,[demoUser('fa2'),demoUser('au')]);
 for(const {gap,...h} of OTHER_HOUSES)await other.write(demoUser('ow2'),'action',{action:'house.update',params:h});
 const n2=await seedProduction(other.write,demoUser('fa2'),OTHER_HOUSES,days);
 return {workspaces:2,users:DEMO_USERS.length,production:n+n2,orders};
}

// Orders cannot be backdated, so all are dated today and stopped at different stages: each role has something to show live.
const ORDERS=[
 {stage:'paid',params:{name:'Toko Berkah',phone:'081200000001',address:'Jl. Raya Anyer No. 12',customer:'cu',depotId:'anyer',lines:[{product:0,unit:'kg',quantity:30}]},pay:'all',complaint:'3 butir retak saat diterima'},
 {stage:'received',params:{name:'Hotel Pantai Anyer',phone:'081200000002',address:'Jl. Pantai Anyer Km 5',category:'Hotel/Resort',depotId:'anyer',lines:[{product:0,unit:'butir',quantity:600}]},pay:'half'},
 {stage:'dispatched',params:{name:'Warung Bu Ani',phone:'081200000003',address:'Kp. Cikoneng RT 02',category:'Perorangan',depotId:'anyer',lines:[{product:0,unit:'kg',quantity:10}]}},
 {stage:'packed',params:{name:'Rumah Makan Sederhana',phone:'081200000004',address:'Jl. Serang-Anyer No. 88',category:'Wholesale',depotId:'anyer',lines:[{product:0,unit:'kg',quantity:20}]}},
 {stage:'new',params:{name:'Katering Bunda',phone:'081200000005',address:'Jl. Ahmad Yani No. 3, Cilegon',category:'Wholesale',depotId:'cilegon',lines:[{product:0,unit:'kg',quantity:15}]}}
];
async function seedOrders(write,call){
 const owner=DEMO_USERS[0],[sl,dp,ds,dr,fn,cs]=['sl','dp','ds','dr','fn','cs'].map(demoUser);
 const today=jakartaDate(0),due=jakartaDate(-14),order=async id=>(await call(owner,'GET','view')).orders.find(o=>o.id===id);
 const steps=['new','packed','dispatched','received','paid'];
 for(const o of ORDERS){
  const {customer,...p}=o.params,before=new Set((await call(owner,'GET','view')).orders.map(o=>o.id));
  await write(sl,'action',{action:'order.create',params:{...p,...(customer?{customerUserId:demoUser(customer).id}:{}),date:today,due,slot:'Pagi',notes:''}});
  const id=(await call(owner,'GET','view')).orders.find(x=>!before.has(x.id)).id,reached=s=>steps.indexOf(o.stage)>=steps.indexOf(s);
  if(reached('packed'))await write(dp,'action',{action:'order.pack',params:{id,measured:(await order(id)).allocations,note:'Ditimbang di depo (data demo)'}});
  if(reached('dispatched')){await write(ds,'action',{action:'courier.assign',params:{id,userId:dr.id}});await write(dr,'action',{action:'order.dispatch',params:{id}})}
  if(reached('received'))await write(dr,'action',{action:'order.receive',params:{id,recipient:p.name}});
  if(o.pay){const total=(await order(id)).total;await write(fn,'action',{action:'payment.post',params:{id,amount:o.pay==='all'?total:Math.round(total/2),date:today,reference:'TRF-DEMO-'+id.slice(0,6)}})}
  if(o.complaint)await write(cs,'action',{action:'case.create',params:{id,description:o.complaint}});
 }
 return ORDERS.length;
}
