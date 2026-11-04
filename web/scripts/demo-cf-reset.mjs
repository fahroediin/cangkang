// Prepares or resets the database of the pamanku-demo Worker. The seed takes about 900 queries, too many for one Worker
// request, so it runs here against an in-memory database and only the resulting rows are uploaded.
// Usage: npm run cf:demo:reset [-- --local] [-- --clear-notes]   (notes are kept unless --clear-notes is given)
import {DatabaseSync} from 'node:sqlite';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import worker from '../worker/index.js';
import {seedDemo} from './dev-demo.mjs';

const web=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CHUNK=30000;// characters; D1 limits one SQL statement to 100 KB and escaped non-ASCII text takes more bytes
const quote=s=>"'"+String(s).replace(/'/g,"''")+"'";

export async function seededRows(){
 const sql=new DatabaseSync(':memory:');
 sql.exec(fs.readFileSync(path.join(web,'drizzle/0000_cloud_state.sql'),'utf8'));
 const DB={prepare(q){const make=values=>({async first(){return sql.prepare(q).get(...values)||null},async all(){return {results:sql.prepare(q).all(...values)}},async run(){return {meta:{changes:Number(sql.prepare(q).run(...values).changes)}}}});return {...make([]),bind(...v){return make(v)}}}};
 await seedDemo(worker,{DB});
 return sql.prepare('SELECT id,owner_id,revision,payload FROM telurfarm_teams').all();
}

function chunks(text){
 const parts=[];
 for(let i=0;i<text.length;){let end=i+CHUNK;const c=text.charCodeAt(end-1);if(c>=0xD800&&c<=0xDBFF)end--;parts.push(text.slice(i,end));i=end}
 return parts.length?parts:[''];
}

// One statement per array item. No BEGIN/COMMIT: D1 refuses manual transactions in a file.
export function buildResetSQL(rows,{clearNotes=false}={}){
 const out=[
  'CREATE TABLE IF NOT EXISTS telurfarm_state (user_id TEXT PRIMARY KEY NOT NULL, revision INTEGER NOT NULL DEFAULT 1, data_json TEXT NOT NULL, updated_at TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS telurfarm_teams (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE, revision INTEGER NOT NULL, payload TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS demo_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);',
  'CREATE TABLE IF NOT EXISTS demo_notes (id TEXT PRIMARY KEY, step INTEGER NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL, role TEXT NOT NULL, at TEXT NOT NULL);',
  'DELETE FROM telurfarm_state;','DELETE FROM telurfarm_teams;'
 ];
 if(clearNotes)out.push('DELETE FROM demo_notes;');
 for(const row of rows){
  const [first,...rest]=chunks(row.payload);
  out.push(`INSERT INTO telurfarm_teams (id,owner_id,revision,payload) VALUES (${quote(row.id)},${quote(row.owner_id)},${Number(row.revision)},${quote(first)});`);
  for(const part of rest)out.push(`UPDATE telurfarm_teams SET payload=payload||${quote(part)} WHERE id=${quote(row.id)};`);
 }
 out.push(`INSERT OR REPLACE INTO demo_meta (key,value) VALUES ('seeded_at',${quote(new Date().toISOString())});`);
 return out;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.env.NODE_ENV==='production')throw Error('demo-cf-reset is for the demo database only.');
 const flags=process.argv.slice(2),local=flags.includes('--local');
 const file=path.join('.wrangler','demo-reset.sql');
 fs.mkdirSync(path.join(web,'.wrangler'),{recursive:true});
 fs.writeFileSync(path.join(web,file),buildResetSQL(await seededRows(),{clearNotes:flags.includes('--clear-notes')}).join('\n')+'\n');
 // The database name and config are fixed here on purpose: this script must not be able to touch the real database.
 const run=spawnSync('npx',['-y','wrangler@4','d1','execute','pamanku-demo','--config','wrangler.demo.toml','--file',file,local?'--local':'--remote','--yes'],{cwd:web,stdio:'inherit',shell:process.platform==='win32'});
 process.exit(run.status??1);
}
