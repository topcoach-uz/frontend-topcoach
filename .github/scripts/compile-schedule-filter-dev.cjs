const fs=require('fs'),ts=require('typescript'),crypto=require('crypto'),sass=require('sass');
const snapshot=JSON.parse(fs.readFileSync('schedule-filter-ui-snapshot.json','utf8'));
const parse=(n,b)=>ts.createSourceFile(n,b,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const unique=prefix=>{const names=Object.keys(snapshot.files).filter(n=>n.startsWith(prefix));if(names.length!==1)throw Error('Expected unique '+prefix);return names[0]};
const changed={};
function patch(name,build){const body=snapshot.files[name],sf=parse(name,body),edits=[];build(sf,(node,text)=>edits.push({start:node.getStart(sf),end:node.end,text}));for(const e of edits.sort((a,b)=>b.start-a.start))changed[name]=(changed[name]??body).slice(0,e.start)+e.text+(changed[name]??body).slice(e.end);if(!edits.length)throw Error('No edits for '+name);}
function walk(n,visit){visit(n);ts.forEachChild(n,c=>walk(c,visit));}
function prop(n,name){return n.properties?.find(p=>p.name?.getText().replace(/["']/g,'')===name)?.initializer;}
const layout=unique('MentorConsoleLayout-');
patch(layout,(sf,edit)=>{let nav=0,active=0;walk(sf,n=>{
 if(ts.isArrayLiteralExpression(n)&&n.elements.some(e=>ts.isObjectLiteralExpression(e)&&prop(e,'key')?.text==='schedule')&&n.elements.some(e=>ts.isObjectLiteralExpression(e)&&prop(e,'key')?.text==='full-support')){edit(n,'['+n.elements.filter(e=>prop(e,'key')?.text!=='full-support').map(e=>e.getText(sf)).join(',')+']');nav++;}
 if(ts.isConditionalExpression(n)&&n.whenTrue.text==='full-support'&&n.condition.getText(sf).includes('URLSearchParams')){edit(n,n.whenFalse.getText(sf));active++;}
 });if(nav!==1||active!==1)throw Error('Unexpected sidebar baseline');});
const schedule=unique('SchedulePage-');
patch(schedule,(sf,edit)=>{let query,setQuery,only,scope,hasSupport,jsx;
 for(const n of sf.statements)if(ts.isImportDeclaration(n))for(const x of n.importClause?.namedBindings?.elements??[])if((x.propertyName??x.name).text==='j')jsx=x.name.text;
 walk(sf,n=>{if(!ts.isVariableDeclaration(n)||!n.initializer)return;const body=n.initializer.getText(sf);
 if(ts.isArrayBindingPattern(n.name)&&ts.isCallExpression(n.initializer)){const callee=n.initializer.expression.getText(sf);let isSearch=false;for(const imp of sf.statements)if(ts.isImportDeclaration(imp))for(const x of imp.importClause?.namedBindings?.elements??[])if((x.propertyName??x.name).text==='bm'&&x.name.text===callee)isSearch=true;if(isSearch)[query,setQuery]=n.name.elements.map(e=>e.name.text);}
 if(ts.isIdentifier(n.name)&&body.includes('.get("program")')&&body.endsWith('"full-support"'))only=n.name.text;
 if(ts.isIdentifier(n.name)&&body.includes('.get("scope")')&&ts.isConditionalExpression(n.initializer))scope=n.name.text;
 if(ts.isObjectBindingPattern(n.name))for(const e of n.name.elements)if(e.propertyName?.text==='hasFullSupport')hasSupport=e.name.text;
 });if(![query,setQuery,only,scope,hasSupport,jsx].every(Boolean))throw Error('Expected schedule bindings');let tab=0,title=0;
 walk(sf,n=>{if(ts.isCallExpression(n)&&n.arguments[1]&&ts.isObjectLiteralExpression(n.arguments[1])&&prop(n.arguments[1],'className')?.text==='mc-sched-tabbar'){
 const filter=`(${hasSupport}||${only})&&${jsx}.jsxs("div",{className:"mc-sched-program-filter",children:[${jsx}.jsx("label",{htmlFor:"mentor-schedule-program",children:"Sessions"}),${jsx}.jsxs("select",{id:"mentor-schedule-program","aria-label":"Filter sessions by program",value:${only}?"full-support":"all",onChange:event=>{const value=event.target.value;${setQuery}(params=>{params.set("scope",${scope});if(value==="full-support")params.set("program",value);else params.delete("program");return params})},children:[${jsx}.jsx("option",{value:"all",children:"All sessions"}),${jsx}.jsx("option",{value:"full-support",children:"Full Support"})]})]})`;
 edit(n,`${jsx}.jsxs(${jsx}.Fragment,{children:[${filter},${n.getText(sf)}]})`);tab++;}
 if(ts.isConditionalExpression(n)&&n.condition.getText(sf)===only&&n.whenTrue.text==='Full Support'){edit(n,n.whenFalse.getText(sf));title++;}
 });if(tab!==1||title!==1)throw Error('Unexpected schedule baseline');});
const scss=fs.readFileSync('src/pages/mentor/console/pages/SchedulePage.scss','utf8');const css=sass.compileString(scss.slice(scss.indexOf('.mc-sched-program-filter')),{style:'compressed'}).css;
const version=crypto.createHash('sha256').update(JSON.stringify(changed)+css+snapshot.html).digest('hex').slice(0,12),suffix='-schedule-filter-'+version;
const refs=s=>new Set((s.match(/[A-Za-z0-9_.$-]+\.js/g)||[]).filter(n=>Object.hasOwn(snapshot.files,n))),affected=new Set(Object.keys(changed));let added=true;while(added){added=false;for(const [n,s]of Object.entries(snapshot.files))if(!affected.has(n)&&[...refs(s)].some(r=>affected.has(r))){affected.add(n);added=true}}
const mapping=new Map([...affected].map(n=>[n,n.replace(/\.js$/,suffix+'.js')]));const rewrite=s=>s.replace(/[A-Za-z0-9_.$-]+\.js/g,n=>mapping.get(n)||n);const files={};for(const n of affected)files[mapping.get(n)]=rewrite(changed[n]??snapshot.files[n]);const cssName='mentor'+suffix+'.css';files[cssName]=css;
for(const [n,b]of Object.entries(files))if(n.endsWith('.js')&&parse(n,b).parseDiagnostics.length)throw Error('Invalid module '+n);
const html=rewrite(snapshot.html).replace('</head>',`<link rel="stylesheet" href="/assets/${cssName}"></head>`);if(html===snapshot.html)throw Error('Entry unchanged');
fs.writeFileSync('schedule-filter-ui-bundle.json',JSON.stringify({html,files,entryFiles:snapshot.roots.map(n=>mapping.get(n)||n),component:'Mentor schedule filter',version}));console.log(JSON.stringify({compiled:true,version,modules:Object.keys(files).length,changedComponents:[layout,schedule]}));
