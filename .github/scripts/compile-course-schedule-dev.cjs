const fs=require('fs'),path=require('path'),ts=require('typescript'),esbuild=require('esbuild'),sass=require('sass'),crypto=require('crypto');
const snapshot=JSON.parse(fs.readFileSync('course-schedule-ui-snapshot.json','utf8'));
const parse=(name,body)=>ts.createSourceFile(name,body,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const findFile=prefix=>{const found=Object.keys(snapshot.files).filter(n=>n.startsWith(prefix));if(found.length!==1)throw Error('Expected unique live module '+prefix);return found[0]};
const index=findFile('index-L-'),hub=findFile('StudentHubRoutes-'),tasks=findFile('ApplicantTasksPage-'),mentor=findFile('StudentWorkspacePage-'),context=findFile('MentorConsoleContext-'),applicant=findFile('ApplicantPage-');
function imports(sf){const out=new Map;for(const n of sf.statements)if(ts.isImportDeclaration(n))for(const e of n.importClause?.namedBindings?.elements??[])out.set(e.name.text,{exported:(e.propertyName??e.name).text,file:n.moduleSpecifier.text});return out}
const functionBy=(name,marker)=>{const sf=parse(name,snapshot.files[name]);const nodes=sf.statements.filter(ts.isFunctionDeclaration).filter(n=>n.getText(sf).includes(marker));if(nodes.length!==1)throw Error('Expected unique function '+marker+' in '+name);return {sf,node:nodes[0]}};
function exportedName(name,exported){const sf=parse(name,snapshot.files[name]);for(const n of sf.statements)if(ts.isExportDeclaration(n)&&n.exportClause?.elements){const e=n.exportClause.elements.find(e=>e.name.text===exported);if(e)return (e.propertyName??e.name).text;}throw Error('Missing live export '+exported+' in '+name);}
function exportedFunction(name,exported){const sf=parse(name,snapshot.files[name]),local=exportedName(name,exported),node=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===local);if(!node)throw Error('Missing live exported function '+local);return {sf,node};}
const schedule=findFile('SchedulePage-'),scheduleFn=exportedFunction(schedule,'default');
const apps=findFile('ApplicantApplicationsPage-'),form=findFile('ApplicantApplicationFormPage-'),studentHook=findFile('useStudentHub-');
const listFn=exportedFunction(apps,'default'),detailFn=exportedFunction(apps,'ApplicantApplicationPage'),formFn=exportedFunction(form,'default'),mentorFn=exportedFunction(mentor,'default');
const overviewFn=functionBy(hub,'Applicant overview requires ApplicantShell'),overviewExport=(()=>{const sf=parse(hub,snapshot.files[hub]);for(const n of sf.statements)if(ts.isExportDeclaration(n)&&n.exportClause?.elements){const e=n.exportClause.elements.find(e=>(e.propertyName??e.name).text===overviewFn.node.name.text);if(e)return e.name.text;}throw Error('Live applicant overview hook not exported');})();
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
shims.overview=`export {${overviewExport} as useApplicantOverview} from ${JSON.stringify('./'+hub)};`;
shims.studentProfile=`export {a as useStudentProfile,u as useStudentHub} from ${JSON.stringify('./'+studentHook)};`;
shims.sessionSources=`export {u as useMentorBookings} from ${JSON.stringify('./'+findFile('sessionSources-'))};`;
const entry=`import React from 'react';import {ConfigProvider} from 'antd';import Schedule from './src/pages/mentor/console/pages/SchedulePage';export function MentorSchedule(p){return <ConfigProvider theme={{token:{colorPrimary:'#7b1f2f',borderRadius:8,fontFamily:'system-ui,sans-serif'}}}><Schedule {...p}/></ConfigProvider>}`;

(async()=>{
const built=await esbuild.build({stdin:{contents:entry,resolveDir:process.cwd(),sourcefile:'workspace-entry.tsx',loader:'tsx'},bundle:true,format:'esm',target:'es2020',jsx:'automatic',write:false,minify:true,outdir:'workspace-out',define:{'import.meta.env':JSON.stringify({MODE:'production',PROD:true,DEV:false,BASE_URL:'/',VITE_API_HOST:'',VITE_APPLICANT_WORKSPACE_ENABLED:'true'})},loader:{'.svg':'dataurl','.png':'dataurl','.jpg':'dataurl','.webp':'dataurl','.woff':'dataurl','.woff2':'dataurl'},plugins:[{name:'live-workspace-runtime',setup(b){
b.onResolve({filter:/^(react|react\/jsx-runtime|react\/jsx-dev-runtime|react-router-dom|react-i18next)$/},a=>({path:a.path,namespace:'shim'}));
b.onResolve({filter:/.*/},a=>{if(a.namespace==='shim')return{path:a.path,external:true};if(/(^|\/)i18n(\/index)?$/.test(a.path)||(a.path==='./index'&&a.importer.endsWith('/lib/i18n/translationUtils.ts')))return{path:'i18n',namespace:'shim'};if(a.path.endsWith('ApplicantOverviewContext'))return{path:'overview',namespace:'shim'};if(a.path==='src/hooks/useStudentHub')return{path:'studentProfile',namespace:'shim'};if(a.path==='src/app/store'||(a.path.startsWith('.')&&path.resolve(path.dirname(a.importer),a.path)===path.resolve('src/app/store')))return{path:'store',namespace:'shim'};if(a.path==='src/app/services/api'||((a.path==='../api'||a.path==='./api'||a.path==='../../api')&&a.importer.includes('/services/')))return{path:'api',namespace:'shim'};if(a.path.endsWith('sessionSources')&&a.importer.endsWith('/pages/SchedulePage.tsx'))return{path:'sessionSources',namespace:'shim'};if(a.path.endsWith('MentorConsoleContext'))return{path:'mentor',namespace:'shim'};if(a.path.endsWith('ApplicantPage'))return{path:'applicant',namespace:'shim'};if(a.path.startsWith('src/'))return{path:path.resolve(a.path)+(/\.[a-z]+$/.test(a.path)?'':fs.existsSync(a.path+'.tsx')?'.tsx':fs.existsSync(a.path+'.ts')?'.ts':fs.existsSync(a.path+'/index.tsx')?'/index.tsx':'/index.ts')};});
b.onLoad({filter:/.*/,namespace:'shim'},a=>({contents:shims[a.path],loader:'js'}));
b.onLoad({filter:/\.s?css$/},a=>{const keep=['SchedulePage.scss'].includes(path.basename(a.path));return{contents:keep?sass.compile(a.path,{style:'compressed'}).css:'',loader:'css'}});
}}]});
const js=built.outputFiles.find(f=>f.path.endsWith('.js')).text,css=built.outputFiles.find(f=>f.path.endsWith('.css'))?.text??'';
const version=crypto.createHash('sha256').update(js+css+snapshot.html).digest('hex').slice(0,12),suffix='-course-schedule-'+version,bundleName='course-schedule'+suffix+'.js',cssName='course-schedule'+suffix+'.css';
const changed={};
function patch(name,fn,replacement){const current=changed[name]??snapshot.files[name];const text=fn.node.getText(fn.sf);if(!current.includes(text))throw Error('Missing original function');changed[name]=current.replace(text,replacement)}
function jsxAlias(name){const bindings=imports(parse(name,snapshot.files[name]));for(const [local,value] of bindings)if(value.exported==='j'&&value.file.endsWith(index))return local;throw Error('Live JSX runtime alias missing '+name);}
patch(schedule,scheduleFn,`function ${scheduleFn.node.name.text}(props){return ${jsxAlias(schedule)}.jsx(__MentorSchedule,props)}`);
changed[schedule]=`import {MentorSchedule as __MentorSchedule} from "./${bundleName}";\n`+changed[schedule];
const refs=s=>new Set((s.match(/[A-Za-z0-9_.$-]+\.js/g)||[]).filter(n=>Object.hasOwn(snapshot.files,n)));const affected=new Set(Object.keys(changed));let added=true;while(added){added=false;for(const [n,s]of Object.entries(snapshot.files))if(!affected.has(n)&&[...refs(s)].some(r=>affected.has(r))){affected.add(n);added=true}}
const mapping=new Map([...affected].map(n=>[n,n.replace(/\.js$/,suffix+'.js')]));const rewrite=s=>s.replace(/[A-Za-z0-9_.$-]+\.js/g,n=>mapping.get(n)||n);const files={};for(const n of affected)files[mapping.get(n)]=rewrite(changed[n]??snapshot.files[n]);files[bundleName]=rewrite(js);files[cssName]=css;
for(const [n,b]of Object.entries(files))if(n.endsWith('.js')&&parse(n,b).parseDiagnostics.length)throw Error('Invalid generated JS '+n);
const html=rewrite(snapshot.html).replace('</head>',`<link rel="stylesheet" href="/assets/${cssName}"></head>`);if(html===snapshot.html)throw Error('Entry not updated');
fs.writeFileSync('course-schedule-ui-bundle.json',JSON.stringify({html,files,entryFiles:snapshot.roots.map(n=>mapping.get(n)||n),component:'Unified mentor schedule',version}));console.log(JSON.stringify({compiled:true,version,modules:Object.keys(files).length,bundleBytes:js.length,cssBytes:css.length,preservedShellProviders:true,targets:[schedule]}));
})().catch(e=>{console.error(e);process.exit(1)});
