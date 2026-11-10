// Bundle the new gate against the live React/Redux runtime and replace only its old gate.
const fs=require('fs'),path=require('path'),ts=require('typescript'),esbuild=require('esbuild'),crypto=require('crypto');
const snapshot=JSON.parse(fs.readFileSync('full-support-ui-snapshot.json','utf8'));
function parse(name,s){return ts.createSourceFile(name,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS)}
function imports(sf){const map=new Map();for(const node of sf.statements.filter(ts.isImportDeclaration)){for(const e of node.importClause?.namedBindings?.elements??[])map.set(e.name.text,{exported:(e.propertyName??e.name).text,file:node.moduleSpecifier.text});}return map}
const candidates=[];
for(const [name,body]of Object.entries(snapshot.files))if(body.includes('full-support-lock-title')){const sf=parse(name,body);function visit(n){if(ts.isFunctionDeclaration(n)&&n.getText(sf).includes('full-support-lock-title'))candidates.push({name,body,sf,node:n,size:n.getWidth(sf)});ts.forEachChild(n,visit)}visit(sf)}
const candidate=candidates.sort((a,b)=>a.size-b.size)[0];if(!candidate||candidate.size>10000)throw Error('Unique old Full Support gate not found');
const {name,body,sf,node}=candidate,bindings=imports(sf);
const ret=node.body.statements.find(ts.isReturnStatement)?.expression;
if(!ret||!ts.isCallExpression(ret)||!ts.isPropertyAccessExpression(ret.expression)||ret.expression.name.text!=='jsx'||!ts.isIdentifier(ret.arguments[0]))throw Error('Unexpected gate wrapper');
const runtimeLocal=ret.expression.expression.getText(sf),wrapper=ret.arguments[0].text,jsx=bindings.get(runtimeLocal);if(!jsx)throw Error('Shared JSX runtime missing');
const counts=new Map();function count(n){if(ts.isPropertyAccessExpression(n)&&['useState','useEffect'].includes(n.name.text)&&ts.isIdentifier(n.expression)&&bindings.has(n.expression.text))counts.set(n.expression.text,(counts.get(n.expression.text)||0)+1);ts.forEachChild(n,count)}count(sf);
const react=bindings.get([...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]);if(!react)throw Error('Shared React runtime missing');
let api;
for(const [n,s]of Object.entries(snapshot.files))if(n.startsWith('fullSupportApi-')){const ast=parse(n,s),i=imports(ast);function visit(x){if(ts.isCallExpression(x)&&ts.isPropertyAccessExpression(x.expression)&&x.expression.name.text==='injectEndpoints')api=i.get(x.expression.expression.getText(ast));ts.forEachChild(x,visit)}visit(ast)}
if(!api)throw Error('Shared authenticated API missing');
const shims={
 react:`import {${react.exported} as React} from ${JSON.stringify(react.file)};export default React;export const useState=React.useState,useEffect=React.useEffect;`,
 'react/jsx-runtime':`import {${jsx.exported} as runtime} from ${JSON.stringify(jsx.file)};export const jsx=runtime.jsx,jsxs=runtime.jsxs,Fragment=runtime.Fragment;`,
 api:`import {${api.exported} as RtkApi} from ${JSON.stringify(api.file)};export {RtkApi};`,
};
(async()=>{
 const built=await esbuild.build({entryPoints:[path.resolve('src/pages/student-hub/full-support/FullSupportPaymentGate.tsx')],bundle:true,format:'esm',target:'es2020',jsx:'automatic',write:false,minify:true,plugins:[{name:'live-runtime',setup(b){
 b.onResolve({filter:/^(react|react\/jsx-runtime)$/},a=>({path:a.path,namespace:'shim'}));
 b.onResolve({filter:/^\.\/api$/},a=>{if(a.importer.endsWith('fullSupportCheckoutApi.ts'))return{path:'api',namespace:'shim'}});
 b.onResolve({filter:/^src\/app\/services\/fullSupportCheckoutApi$/},()=>({path:path.resolve('src/app/services/fullSupportCheckoutApi.ts')}));
 b.onLoad({filter:/.*/,namespace:'shim'},a=>({contents:shims[a.path],loader:'js'}));
 b.onResolve({filter:/\.js$/},a=>{if(a.namespace==='shim')return{path:a.path,external:true}});
 }}]});
 const gate=built.outputFiles[0].text;
 const version=crypto.createHash('sha256').update(gate+body).digest('hex').slice(0,10),suffix='-fs-pay-'+version;
 const gateName='FullSupportSalesGate'+suffix+'.js';
 const replacement=`function ${node.name.text}(){return ${runtimeLocal}.jsx(${wrapper},{title:"Full Support Mentorship Program",subtitle:"Contact sales, review your agreed price and pay securely with CLICK.",children:${runtimeLocal}.jsx(__FullSupportSalesGate,{salesEmail:"support@topcoach.uz",programUrl:"https://topcoachuni.com/programs"})})}`;
 const changed='import {FullSupportPaymentGate as __FullSupportSalesGate} from "./'+gateName+'";\n'+body.slice(0,node.getStart(sf))+replacement+body.slice(node.end);
 // Rename reverse dependencies together so circular imports still share one runtime.
 const references=s=>new Set((s.match(/[A-Za-z0-9_.$-]+\.js/g)||[]).filter(n=>Object.hasOwn(snapshot.files,n)));
 const affected=new Set([name]);let added=true;while(added){added=false;for(const [n,s]of Object.entries(snapshot.files))if(!affected.has(n)&&[...references(s)].some(r=>affected.has(r))){affected.add(n);added=true}}
 const mapping=new Map([...affected].map(n=>[n,n.replace(/\.js$/,suffix+'.js')]));
 function rewrite(s){return s.replace(/[A-Za-z0-9_.$-]+\.js/g,n=>mapping.get(n)||n)}
 const files={};for(const n of affected)files[mapping.get(n)]=rewrite(n===name?changed:snapshot.files[n]);files[gateName]=rewrite(gate);
 const html=rewrite(snapshot.html),entryFiles=snapshot.roots.map(n=>mapping.get(n)||n);
 for(const [n,s]of Object.entries(files)){const ast=parse(n,s);if(ast.parseDiagnostics.length)throw Error('Invalid generated module '+n)}
 if(!html.includes(mapping.get(snapshot.roots.find(n=>mapping.has(n)))))throw Error('Entry references not updated');
 fs.writeFileSync('full-support-ui-bundle.json',JSON.stringify({html,files,entryFiles,component:name}));
 console.log(JSON.stringify({component:name,sharedRuntime:{react,jsx,api},newModules:Object.keys(files).length,existingCodePreserved:true}));
})().catch(e=>{console.error(e.message);process.exit(1)});
