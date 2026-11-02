// From the web directory: node scripts/build-team-domain.cjs ../mobile/node_modules/typescript
const fs=require('node:fs'),path=require('node:path');
const ts=require(path.resolve(process.argv[2]||'../mobile/node_modules/typescript'));
const code=ts.transpileModule(fs.readFileSync('shared/native-domain.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
fs.writeFileSync('worker/team-domain.js','// Generated from shared/native-domain.ts; keep in sync with native source.\nconst ND=(()=>{const exports={};\n'+code+'\nreturn exports;})();\n\nND.today=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());\n');
