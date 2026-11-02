// Local development only. Fixed identity, isolated SQLite; never deploy this server.
// --demo: seeded demo data and the identity of the role in the pamanku_demo cookie (set by the Panduan FGD proxy in ../demo); add --empty to skip the seed.
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import worker from '../dist/server/index.js';
import {demoUser,seedDemo} from './dev-demo.mjs';
if(process.env.NODE_ENV==='production')throw Error('Development identity is disabled in production.');
const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync(new URL('../drizzle/0000_cloud_state.sql',import.meta.url),'utf8'));
const DB={prepare(q){const make=values=>({async first(){return sql.prepare(q).get(...values)||null},async all(){return {results:sql.prepare(q).all(...values)}},async run(){return {meta:{changes:Number(sql.prepare(q).run(...values).changes)}}}});return {...make([]),bind(...v){return make(v)}}}};
const port=Number(process.env.PORT||(process.argv.includes('--port')?process.argv[process.argv.indexOf('--port')+1]:null)||3000);
const demo=process.argv.includes('--demo');
if(demo&&!process.argv.includes('--empty')){const r=await seedDemo(worker,{DB});console.log(`Demo seeded: ${r.workspaces} workspaces, ${r.users} users, ${r.production} production records, ${r.orders} orders`)}
const cookieUser=req=>demoUser((req.headers.cookie||'').match(/(?:^|;\s*)pamanku_demo=(\w+)/)?.[1]);
http.createServer(async(req,res)=>{try{
 const user=demo?cookieUser(req):{id:'development-owner',email:'development@telurfarm.test'};
 if(demo&&req.url.startsWith('/signout-with-chatgpt')){res.writeHead(302,{location:'/demo'});return res.end()}
 const chunks=[];for await(const chunk of req)chunks.push(chunk);const headers=new Headers(req.headers);headers.set('oai-authenticated-user-id',user.id);headers.set('oai-authenticated-user-email',user.email);const response=await worker.fetch(new Request('http://'+req.headers.host+req.url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}),{DB});
 res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch{res.writeHead(500);res.end('Development request failed')}}).listen(port,'0.0.0.0',()=>console.log('TelurFarm development preview on port '+port+(demo?' (demo identities)':'')));
