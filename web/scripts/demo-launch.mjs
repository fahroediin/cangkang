// Local demo only: starts the seeded dev server on an internal port, then the presenter proxy in front of it.
// Usage: npm run demo (Panduan Demo: steps, prev/next, notes) or npm run fgd (Panduan FGD, FIF layout); open http://localhost:3000/demo.
// The first argument picks the format; extra flags such as --empty go to the dev server.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const web=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const [format='fgd',...flags]=process.argv.slice(2);
if(!['demo','fgd'].includes(format))throw Error('Usage: node scripts/demo-launch.mjs demo|fgd [--empty]');
const appPort=process.env.APP_PORT||'3100';
const children=[];
const stop=code=>{for(const c of children)c.kill();process.exit(code)};
process.on('SIGINT',()=>stop(0));process.on('SIGTERM',()=>stop(0));

// The dev server prefers PORT over --port, so give it its own PORT; the proxy keeps the outer PORT (default 3000).
const app=spawn(process.execPath,['scripts/dev-team.mjs','--demo',...flags],{cwd:web,env:{...process.env,PORT:appPort},stdio:['ignore','pipe','inherit']});
children.push(app);app.on('exit',code=>stop(code??1));
app.stdout.on('data',chunk=>{
 process.stdout.write(chunk);
 if(children.length===1&&String(chunk).includes('development preview')){
  const proxy=spawn(process.execPath,['demo/demo-proxy.mjs','demo/demo.config.json','--format',format],{cwd:web,stdio:'inherit'});
  children.push(proxy);proxy.on('exit',code=>stop(code??1));
 }
});
