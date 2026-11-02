const fs=require('node:fs'),path=require('node:path');
const ts=require(path.resolve(process.argv[2]||'../mobile/node_modules/typescript'));
const code=ts.transpileModule(fs.readFileSync('shared/house-performance.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
fs.writeFileSync('web/house-performance.js','// Generated from shared/house-performance.ts\nconst HP=(()=>{const exports={};\n'+code+'\nreturn exports;})();\n');
