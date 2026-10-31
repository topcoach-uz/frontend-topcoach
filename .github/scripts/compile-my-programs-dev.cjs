const fs=require('fs'),path=require('path'),ts=require('typescript'),esbuild=require('esbuild'),sass=require('sass'),crypto=require('crypto');
const snapshot=JSON.parse(fs.readFileSync('my-programs-ui-snapshot.json','utf8'));
const parse=(name,body)=>ts.createSourceFile(name,body,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const findFile=prefix=>{const found=Object.keys(snapshot.files).filter(n=>n.startsWith(prefix));if(found.length!==1)throw Error('Expected unique live module '+prefix);return found[0]};
const index=findFile('index-L-'),hub=findFile('StudentHubRoutes-'),tasks=findFile('ApplicantTasksPage-'),mentor=findFile('StudentWorkspacePage-'),context=findFile('MentorConsoleContext-'),applicant=findFile('ApplicantPage-');
function imports(sf){const out=new Map;for(const n of sf.statements)if(ts.isImportDeclaration(n))for(const e of n.importClause?.namedBindings?.elements??[])out.set(e.name.text,{exported:(e.propertyName??e.name).text,file:n.moduleSpecifier.text});return out}
const functionBy=(name,marker)=>{const sf=parse(name,snapshot.files[name]);const nodes=sf.statements.filter(ts.isFunctionDeclaration).filter(n=>n.getText(sf).includes(marker));if(nodes.length!==1)throw Error('Expected unique function '+marker+' in '+name);return {sf,node:nodes[0]}};
function exportedName(name,exported){const sf=parse(name,snapshot.files[name]);for(const n of sf.statements)if(ts.isExportDeclaration(n)&&n.exportClause?.elements){const e=n.exportClause.elements.find(e=>e.name.text===exported);if(e)return (e.propertyName??e.name).text;}throw Error('Missing live export '+exported+' in '+name);}
function exportedFunction(name,exported){const sf=parse(name,snapshot.files[name]),local=exportedName(name,exported),node=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===local);if(!node)throw Error('Missing live exported function '+local);return {sf,node};}
let api;for(const [n,b]of Object.entries(snapshot.files))if(n.startsWith('fullSupportApi-')){const sf=parse(n,b),bindings=imports(sf);function visit(x){if(ts.isCallExpression(x)&&ts.isPropertyAccessExpression(x.expression)&&x.expression.name.text==='injectEndpoints')api=bindings.get(x.expression.expression.getText(sf));ts.forEachChild(x,visit)}visit(sf)}if(!api)throw Error('Live authenticated API missing');
const rootImport=(names)=>`import {${names}} from ${JSON.stringify('./'+index)};`;
const shims={
 react:rootImport('r as React')+`export default React;export const {__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,Children,Component,Fragment,Profiler,PureComponent,StrictMode,Suspense,cloneElement,createContext,createElement,createFactory,createRef,forwardRef,isValidElement,lazy,memo,startTransition,useCallback,useContext,useDebugValue,useDeferredValue,useEffect,useId,useImperativeHandle,useInsertionEffect,useLayoutEffect,useMemo,useReducer,useRef,useState,useSyncExternalStore,useTransition,version}=React;`,
 'react/jsx-runtime':rootImport('j as runtime')+'export const jsx=runtime.jsx,jsxs=runtime.jsxs,Fragment=runtime.Fragment;',
 'react/jsx-dev-runtime':rootImport('j as runtime')+'export const jsxDEV=runtime.jsx,Fragment=runtime.Fragment;',
 'react-router-dom':rootImport('s as useNavigate,aJ as useParams,bm as useSearchParams,aD as useLocation,aB as Link,bc as Navigate')+'export {useNavigate,useParams,useSearchParams,useLocation,Link,Navigate};',
 'react-i18next':rootImport('v as useTranslation')+'export {useTranslation};',
 i18n:rootImport('cY as i18n')+'export default i18n;',
 store:rootImport('o as useTypedSelector,e6 as useAppDispatch')+'export {useTypedSelector,useAppDispatch};',
 api:`import {${api.exported} as RtkApi} from ${JSON.stringify(api.file)};export {RtkApi};`,
 mentor:`export {u as useMentorConsole,M as MentorConsoleProvider} from ${JSON.stringify('./'+context)};`,
 applicant:`export {A as ApplicantPage,B as Breadcrumb,Q as QueryState,R as RelatedApplicationLabel,U as UniversityIdentity,d as displayDate,p as applicationStatusLabel,c as applicationStatusLabels} from ${JSON.stringify('./'+applicant)};`,
};

const entry=`export {default as ProgramsPage} from './src/pages/student-hub/my-programs/MyProgramsStudentPage';export {default as ProgramsNav} from './src/pages/student-hub/my-programs/ProgramNavigationLink';`;
(async()=>{
const built=await esbuild.build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'programs-entry.tsx',loader:'tsx'},bundle:true,format:'esm',target:'es2020',jsx:'automatic',write:false,minify:true,outdir:'programs-out',define:{'import.meta.env':JSON.stringify({MODE:'production',PROD:true,DEV:false,BASE_URL:'/',VITE_API_HOST:'',VITE_APPLICANT_WORKSPACE_ENABLED:'true'})},plugins:[{name:'live-program-runtime',setup(b){
 b.onResolve({filter:/^(react|react\/jsx-runtime|react\/jsx-dev-runtime|react-router-dom|react-i18next)$/},a=>({path:a.path,namespace:'shim'}));
 b.onResolve({filter:/.*/},a=>{if(a.namespace==='shim')return{path:a.path,external:true};if(a.path==='src/app/store')return{path:'store',namespace:'shim'};if(a.path==='src/app/services/api'||((a.path==='../api'||a.path==='./api')&&a.importer.includes('/services/')))return{path:'api',namespace:'shim'};if(a.path.startsWith('src/'))return{path:path.resolve(a.path)+(/\.[a-z]+$/.test(a.path)?'':fs.existsSync(a.path+'.tsx')?'.tsx':fs.existsSync(a.path+'.ts')?'.ts':'/index.ts')};});
 b.onLoad({filter:/.*/,namespace:'shim'},a=>({contents:shims[a.path],loader:'js'}));
 b.onLoad({filter:/\.s?css$/},a=>({contents:path.basename(a.path)==='myPrograms.scss'?sass.compile(a.path,{style:'compressed'}).css:'',loader:'css'}));
}}]});
const js=built.outputFiles.find(f=>f.path.endsWith('.js')).text,css=built.outputFiles.find(f=>f.path.endsWith('.css'))?.text??'';
const version=crypto.createHash('sha256').update(js+css+snapshot.html).digest('hex').slice(0,12),suffix='-my-programs-'+version,bundleName='student'+suffix+'.js',cssName='student'+suffix+'.css';
const changed={},sf=parse(hub,snapshot.files[hub]);let jsx;for(const [local,imp]of imports(sf))if(imp.exported==='j'&&imp.file.endsWith(index))jsx=local;if(!jsx)throw Error('JSX runtime missing');
const nav=functionBy(hub,'applicant.workspaceNavigation'),legacy=functionBy(hub,'__WorkspaceStudent');
const onNavigate=nav.node.parameters[0].name.elements.find(e=>e.propertyName?.text==='onNavigate')?.name.text;if(!onNavigate)throw Error('Sidebar callback missing');
const edits=[{start:legacy.node.getStart(sf),end:legacy.node.end,text:`function ${legacy.node.name.text}(props){return ${jsx}.jsx(__ProgramsPage,props)}`}];let navCount=0,routeCount=0;
function walk(n){if(ts.isCallExpression(n)){
 if(n.arguments[0]&&ts.isPropertyAccessExpression(n.arguments[0])&&n.arguments[0].name.text==='fullSupport'&&n.arguments[1]?.getText(sf).includes('applicant.fullSupport')){edits.push({start:n.getStart(sf),end:n.end,text:`${jsx}.jsx(__ProgramsNav,{onNavigate:${onNavigate}})`});navCount++;}
 const props=n.arguments[1];if(props&&ts.isObjectLiteralExpression(props)&&props.properties.some(p=>p.name?.getText(sf)==='path'&&p.initializer?.text==='/full-support')){edits.push({start:n.getStart(sf),end:n.end,text:`[${n.getText(sf)},${jsx}.jsx(${n.arguments[0].getText(sf)},{path:"/my-programs",element:${jsx}.jsx(__ProgramsPage,{})})]`});routeCount++;}
 }ts.forEachChild(n,walk);}walk(sf);if(navCount!==1||routeCount!==1)throw Error('Unexpected navigation/route matches '+navCount+'/'+routeCount);
let body=snapshot.files[hub];for(const e of edits.sort((a,b)=>b.start-a.start))body=body.slice(0,e.start)+e.text+body.slice(e.end);changed[hub]=`import {ProgramsPage as __ProgramsPage,ProgramsNav as __ProgramsNav} from "./${bundleName}";\n`+body;
const refs=s=>new Set((s.match(/[A-Za-z0-9_.$-]+\.js/g)||[]).filter(n=>Object.hasOwn(snapshot.files,n)));const affected=new Set(Object.keys(changed));let added=true;while(added){added=false;for(const [n,s]of Object.entries(snapshot.files))if(!affected.has(n)&&[...refs(s)].some(r=>affected.has(r))){affected.add(n);added=true}}
const mapping=new Map([...affected].map(n=>[n,n.replace(/\.js$/,suffix+'.js')]));const rewrite=s=>s.replace(/[A-Za-z0-9_.$-]+\.js/g,n=>mapping.get(n)||n);const files={};for(const n of affected)files[mapping.get(n)]=rewrite(changed[n]??snapshot.files[n]);files[bundleName]=rewrite(js);files[cssName]=css;
for(const [n,b]of Object.entries(files))if(n.endsWith('.js')&&parse(n,b).parseDiagnostics.length)throw Error('Invalid generated JS '+n);
const html=rewrite(snapshot.html).replace('</head>',`<link rel="stylesheet" href="/assets/${cssName}"></head>`);if(html===snapshot.html)throw Error('Entry not updated');
fs.writeFileSync('my-programs-ui-bundle.json',JSON.stringify({html,files,entryFiles:snapshot.roots.map(n=>mapping.get(n)||n),component:'Student programs and adaptive navigation',version}));console.log(JSON.stringify({compiled:true,version,modules:Object.keys(files).length,bundleBytes:js.length,cssBytes:css.length,navCount,routeCount}));
})().catch(e=>{console.error(e);process.exit(1)});
