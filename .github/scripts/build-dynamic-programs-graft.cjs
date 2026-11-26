/* Prepare an immutable frontend overlay from an inspected site. This script never publishes. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ts = require('typescript');
const esbuild = require('esbuild');
const sass = require('sass');
const { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '../..');
const site = path.resolve(process.argv[2] || '');
const out = path.resolve(process.argv[3] || '/tmp/dynamic-programs-frontend-graft');
if (!fs.existsSync(path.join(site, 'index.html'))) throw Error('Pass an inspected frontend dist directory');
fs.mkdirSync(out, { recursive: true });
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const parse = (name, body) => ts.createSourceFile(name, body, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const html = fs.readFileSync(path.join(site, 'index.html'), 'utf8');
const available = new Set(fs.readdirSync(path.join(site, 'assets')).filter(name => name.endsWith('.js')));
const roots = [...new Set((html.match(/\/assets\/[\w.$-]+\.js/g) || []).map(name => name.split('/').pop()))];
if (!roots.length) throw Error('Missing site entry points');
const files = {}, queue = [...roots];
while (queue.length) {
  const name = queue.pop();
  if (files[name] || !available.has(name)) continue;
  files[name] = fs.readFileSync(path.join(site, 'assets', name), 'utf8');
  queue.push(...(files[name].match(/[\w.$-]+\.js/g) || []).filter(ref => available.has(ref) && !files[ref]));
}
const ast = new Map(Object.entries(files).map(([name, body]) => [name, parse(name, body)]));
const unique = (prefix, marker) => {
  const hits = Object.keys(files).filter(name => name.startsWith(prefix) && (!marker || files[name].includes(marker)));
  if (hits.length !== 1) throw Error(`Expected one module ${prefix} ${marker || ''}, found ${hits.length}`);
  return hits[0];
};
const exportsOf = name => {
  const map = new Map();
  for (const node of ast.get(name).statements) if (ts.isExportDeclaration(node)) {
    for (const element of node.exportClause?.elements || []) map.set(element.name.text, (element.propertyName || element.name).text);
  }
  return map;
};
const rootFile = roots.find(name => files[name]?.includes('injectEndpoints') && exportsOf(name).has('aX'));
if (!rootFile) throw Error('Inspected authenticated application runtime not recognized');
const rootExports = exportsOf(rootFile);
const rootRef = (symbol, alias) => {
  if (!rootExports.has(symbol)) throw Error(`Live runtime export missing ${symbol}`);
  return `export {${symbol} as ${alias}} from ${JSON.stringify('./' + rootFile)};`;
};
const context = unique('MentorConsoleContext-');
const apiFile = unique('fullSupportApi-');
const workspace = unique('StudentWorkspacePage-');
const hub = unique('StudentHubRoutes-');
const programModel = unique('programModel-');
const reviews = unique('reviewCounts-');
const edits = new Map();
const addEdit = (name, edit) => edits.set(name, [...(edits.get(name) || []), edit]);
const functionWith = (name, marker) => {
  const sf = ast.get(name), hits = sf.statements.filter(ts.isFunctionDeclaration).filter(node => node.getText(sf).includes(marker));
  if (hits.length !== 1) throw Error(`Expected one function ${marker} in ${name}, found ${hits.length}`);
  return hits[0];
};
const defaultFunction = name => {
  const local = exportsOf(name).get('default');
  const node = ast.get(name).statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === local);
  if (!node) throw Error('Expected a declared default component in ' + name);
  return node;
};
const sharedApps = functionWith(workspace, 'No applications yet. Add one here');
const scheduleFile = unique('SchedulePage-');
const chatButton = functionWith(scheduleFile, 'Could not open the conversation.');
const additions = new Map([[workspace, `\nexport {${sharedApps.name.text} as __PreservedSharedApplications};\n`],[scheduleFile, `\nexport {${chatButton.name.text} as __PreservedSessionChatButton};\n`]]);
// Preserve every existing Full Support hook. Override only the one query whose arguments changed.
const hooks = new Map(), liveApiExports = exportsOf(apiFile);
const publicByLocal = new Map([...liveApiExports].map(([exported, local]) => [local, exported]));
function hookBindings(node) {
  if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name)) {
    for (const element of node.name.elements) {
      const key = (element.propertyName || element.name).getText(ast.get(apiFile));
      const exported = publicByLocal.get(element.name.getText(ast.get(apiFile)));
      if (key.startsWith('use') && exported) hooks.set(key, exported);
    }
  }
  ts.forEachChild(node, hookBindings);
}
hookBindings(ast.get(apiFile));
if (!hooks.has('useGetMentorRosterQuery') || !hooks.has('useGetMentorMilestonesQuery')) throw Error('Live API hook bindings missing');
const fullSupportShim = `import {aX as RtkApi} from './${rootFile}';
const api=RtkApi.injectEndpoints({overrideExisting:true,endpoints:builder=>({getMentorMilestones:builder.query({query:arg=>({url:'/full-support/mentor/milestones',params:typeof arg==='string'?{studentUserId:arg}:{studentUserId:arg.studentUserId,...(arg.enrollmentId?{enrollmentId:arg.enrollmentId}:{})},method:'GET'}),transformResponse:res=>{const raw=res&&typeof res==='object'&&'data'in res?res.data:res;return{data:Array.isArray(raw)?raw:[]}},providesTags:(_res,_err,arg)=>[{type:'FullSupportMentorMilestones',id:typeof arg==='string'?arg:arg.studentUserId}]})})});
export const {useGetMentorMilestonesQuery}=api;
export {${[...hooks].filter(([name]) => name !== 'useGetMentorMilestonesQuery').map(([name, exported]) => `${exported} as ${name}`).join(',')}} from './${apiFile}';`;
const shims = {
  react: `import {r as React} from './${rootFile}';export default React;export const {Children,Component,Fragment,Profiler,PureComponent,StrictMode,Suspense,cloneElement,createContext,createElement,createFactory,createRef,forwardRef,isValidElement,lazy,memo,startTransition,useCallback,useContext,useDebugValue,useDeferredValue,useEffect,useId,useImperativeHandle,useInsertionEffect,useLayoutEffect,useMemo,useReducer,useRef,useState,useSyncExternalStore,useTransition,version,__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED}=React;`,
  'react/jsx-runtime': `import {j as runtime} from './${rootFile}';export const {jsx,jsxs,Fragment}=runtime;`,
  'react/jsx-dev-runtime': `import {j as runtime} from './${rootFile}';export const jsxDEV=runtime.jsx,Fragment=runtime.Fragment;`,
  'react-router-dom': ['e:useNavigate','av:useParams','b6:useSearchParams','ao:useLocation','am:Link','aY:Navigate','cs:Outlet'].map(pair => rootRef(...pair.split(':'))).join(''),
  'react-i18next': rootRef('f', 'useTranslation'),
  api: rootRef('aX', 'RtkApi'),
  store: [rootRef('b', 'useTypedSelector'),rootRef('el', 'useAppDispatch'),rootRef('g$', 'store')].join(''),
  i18n: `import {df as i18n} from './${rootFile}';export default i18n;`,
  orgStaff: rootRef('Y', 'default'),
  loader: rootRef('cz', 'default'),
  context: `import {r as React} from './${rootFile}';import {M as Provider,u as useMentorConsole} from './${context}';export {useMentorConsole};export function MentorConsoleProvider({value,children}){return React.createElement(Provider,{value:{...value,hasFullSupport:value.hasProgramLessons},children})}`,
  fullSupport: fullSupportShim,
  sharedApplications: `export {__PreservedSharedApplications as default} from './${workspace}';`,
  sessionChat: `export {__PreservedSessionChatButton as default} from './${scheduleFile}';`,
  messageList: rootRef('eX', 'default'),
  chatInput: rootRef('eY', 'default'),
  essayReviews: `export {E as EssayReviewList} from './${reviews}';`,
  documentReviews: `export {D as DocumentReviewList} from './${reviews}';`,
  reviewCounts: `export {u as useReviewCounts} from './${reviews}';`,
};
const sourceShims = new Map([
 ['src/app/store.ts','store'], ['src/app/services/api/index.ts','api'], ['src/lib/i18n/index.ts','i18n'],
 ['src/hooks/useOrgStaff.ts','orgStaff'],['src/components/loader/index.tsx','loader'],
 ['src/pages/mentor/console/MentorConsoleContext.tsx','context'],['src/app/services/fullSupportApi.ts','fullSupport'],
 ['src/pages/mentor/console/components/SharedApplications.tsx','sharedApplications'],
 ['src/pages/mentor/console/components/SessionChatButton.tsx','sessionChat'],
 ['src/components/chat/MessageList.tsx','messageList'],['src/components/chat/ChatInput.tsx','chatInput'],
 ['src/pages/mentor/console/components/reviews/EssayReviewList.tsx','essayReviews'],
 ['src/pages/mentor/console/components/reviews/DocumentReviewList.tsx','documentReviews'],
 ['src/pages/mentor/console/components/reviews/reviewCounts.ts','reviewCounts'],
]);
const resolveSource = (request, directory) => {
  const candidate = request.startsWith('src/') ? path.join(root, request) : request.startsWith('.') ? path.resolve(directory, request) : null;
  if (!candidate || !candidate.startsWith(root + '/src/')) return null;
  for (const extension of ['', '.ts', '.tsx', '.js', '/index.ts', '/index.tsx']) {
    const full = candidate + extension;
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  throw Error('Missing source import ' + request + ' from ' + directory);
};
const entry = `import React from 'react';import {ConfigProvider,App} from 'antd';
import Gate from './src/pages/mentor/console/MentorConsoleGate';import Layout from './src/pages/mentor/console/MentorConsoleLayout';
import Schedule from './src/pages/mentor/console/pages/SchedulePage';import Workspace from './src/pages/mentor/console/pages/StudentWorkspacePage';import Students from './src/pages/mentor/console/pages/StudentsPage';import Programs from './src/pages/student-hub/my-programs/MyProgramsStudentPage';
const wrap=Component=>props=><ConfigProvider theme={{token:{colorPrimary:'#7b1f2f',borderRadius:8,fontFamily:'system-ui,sans-serif'}}}><App><Component {...props}/></App></ConfigProvider>;
export const DynamicGate=wrap(Gate),DynamicLayout=wrap(Layout),DynamicSchedule=wrap(Schedule),DynamicWorkspace=wrap(Workspace),DynamicStudents=wrap(Students),DynamicPrograms=wrap(Programs);
export {programNavigation as dynamicProgramNavigation} from './src/pages/student-hub/my-programs/programModel';`;
(async () => {
 const build = await esbuild.build({stdin:{contents:entry,resolveDir:root,sourcefile:'dynamic-programs-entry.tsx',loader:'tsx'},bundle:true,format:'esm',target:'es2020',jsx:'automatic',write:false,minify:true,outdir:'dynamic-programs-out',metafile:true,
 define:{'import.meta.env':JSON.stringify({MODE:'production',PROD:true,DEV:false,BASE_URL:'/',VITE_API_HOST:'',VITE_ADMIN_PANEL_URL:'https://admin.dev.topcoachuni.com/panel'}),'__LOCALE_VERSION__':JSON.stringify('dynamic-programs-staging')},
 loader:{'.svg':'dataurl','.png':'dataurl','.jpg':'dataurl','.jpeg':'dataurl','.webp':'dataurl','.woff':'dataurl','.woff2':'dataurl'},plugins:[{name:'preserved-live-runtime',setup(builder){
 builder.onResolve({filter:/.*/},arg=>{
  if(arg.namespace==='live-shim')return{path:arg.path,external:true};
  if(Object.hasOwn(shims,arg.path)&&['react','react/jsx-runtime','react/jsx-dev-runtime','react-router-dom','react-i18next'].includes(arg.path))return{path:arg.path,namespace:'live-shim'};
  const resolved=resolveSource(arg.path,arg.resolveDir);if(!resolved)return;
  const relative=path.relative(root,resolved),shim=sourceShims.get(relative);return shim?{path:shim,namespace:'live-shim'}:{path:resolved};
 });
 builder.onLoad({filter:/.*/,namespace:'live-shim'},arg=>({contents:shims[arg.path],loader:'js'}));
 builder.onLoad({filter:/\.s?css$/},arg=>({contents:arg.path.endsWith('.scss')?sass.compileString(fs.readFileSync(arg.path,'utf8').replace(/(['\"])\/src\//g,`$1${root}/src/`),{url:pathToFileURL(arg.path),style:'compressed',loadPaths:[root],importers:[{findFileUrl:url=>url.startsWith('/src/')?pathToFileURL(path.join(root,url.slice(1))):null}]}).css:fs.readFileSync(arg.path,'utf8'),loader:arg.path.includes('.module.')?'local-css':'css'}));
 builder.onLoad({filter:/studentProgramsApi\.ts$/},arg=>({contents:fs.readFileSync(arg.path,'utf8').replace('RtkApi.injectEndpoints({','RtkApi.injectEndpoints({overrideExisting:true,'),loader:'ts'}));
 }}]});
 const js=build.outputFiles.find(file=>file.path.endsWith('.js')).text,css=build.outputFiles.find(file=>file.path.endsWith('.css'))?.text||'';
 const version=sha(js+css+html).slice(0,12),suffix='-dynamic-programs-'+version,bundleName='TopCoachPrograms'+suffix+'.js',cssName='TopCoachPrograms'+suffix+'.css';
 const importsByFile=new Map(),targets=[];
 const replace=(name,node,exported)=>{const sf=ast.get(name);addEdit(name,{start:node.getStart(sf),end:node.end,text:`function ${node.name.text}(props){return __${exported}(props)}`});importsByFile.set(name,[...(importsByFile.get(name)||[]),`${exported} as __${exported}`]);targets.push({file:name,function:node.name.text,replacement:exported,beforeSha256:sha(node.getText(sf))});};
 for(const [prefix,marker,exported] of [
  ['MentorConsoleGate-',null,'DynamicGate'],['MentorConsoleLayout-',null,'DynamicLayout'],['SchedulePage-',null,'DynamicSchedule'],
  ['StudentWorkspacePage-',null,'DynamicWorkspace'],['StudentsPage-','Your Full Support students and 1:1 mentees.','DynamicStudents'],
 ]){const name=unique(prefix,marker);replace(name,defaultFunction(name),exported);}
 replace(hub,functionWith(hub,'Your next lessons and tasks across your programs.'),'DynamicPrograms');
 replace(programModel,functionWith(programModel,'My Programs'),'dynamicProgramNavigation');
 const changed={};
 for(const [name,list]of edits){let body=files[name];const sorted=list.sort((a,b)=>b.start-a.start);for(let i=1;i<sorted.length;i++)if(sorted[i-1].start<sorted[i].end)throw Error('Overlapping edits in '+name);for(const edit of sorted)body=body.slice(0,edit.start)+edit.text+body.slice(edit.end);changed[name]=`import {${importsByFile.get(name).join(',')}} from './${bundleName}';\n`+body;}
 for(const [name,extra]of additions)changed[name]=(changed[name]||files[name])+extra;
 const refs=body=>new Set((body.match(/[\w.$-]+\.js/g)||[]).filter(name=>Object.hasOwn(files,name)));
 const affected=new Set(Object.keys(changed));let added=true;while(added){added=false;for(const[name,body]of Object.entries(files))if(!affected.has(name)&&[...refs(body)].some(ref=>affected.has(ref))){affected.add(name);added=true;}}
 const mapping=new Map([...affected].map(name=>[name,name.replace(/\.js$/,suffix+'.js')]));
 const rewrite=body=>body.replace(/[\w.$-]+\.js/g,name=>mapping.get(name)||name),nextFiles={};
 for(const name of affected)nextFiles[mapping.get(name)]=rewrite(changed[name]||files[name]);nextFiles[bundleName]=rewrite(js);nextFiles[cssName]=css;
 for(const[name,body]of Object.entries(nextFiles))if(name.endsWith('.js')&&parse(name,body).parseDiagnostics.length)throw Error('Invalid generated module '+name);
 const nextHtml=rewrite(html).replace('</head>',`<link rel="stylesheet" href="/assets/${cssName}"></head>`);if(nextHtml===html)throw Error('Site entry did not change');
 const composed={...files,...nextFiles},entryFiles=roots.map(name=>mapping.get(name)||name);
 await esbuild.build({entryPoints:entryFiles,bundle:true,format:'esm',write:false,outdir:path.join(out,'link-check'),logLevel:'silent',plugins:[{name:'complete-runtime-graph',setup(builder){builder.onResolve({filter:/.*/},arg=>{const name=arg.path.replace(/^\.\//,'');if(composed[name])return{path:name,namespace:'runtime-graph'};if(name.endsWith('.js'))throw Error('Missing composed JS '+arg.path+' from '+arg.importer);return{path:arg.path,external:true};});builder.onLoad({filter:/.*/,namespace:'runtime-graph'},arg=>({contents:composed[arg.path],loader:'js'}));}}]});
 const manifest={baselineHtmlSha256:sha(html),baselineModules:Object.keys(files).length,targets,liveSingletons:{runtime:rootFile,context,api:apiFile,reviews},preservedFunctions:[{file:workspace,function:sharedApps.name.text,role:'Shared Applications',sha256:sha(sharedApps.getText(ast.get(workspace)))},{file:scheduleFile,function:chatButton.name.text,role:'Session chat and socket integration',sha256:sha(chatButton.getText(ast.get(scheduleFile)))}],preservedModuleBodies:Object.keys(files).filter(name=>!changed[name]),rewrittenOnly:Object.keys(files).filter(name=>affected.has(name)&&!changed[name]),unchangedBodiesRetained:true,oldAssetsMustRemain:true,sourceInputs:Object.keys(build.metafile.inputs).filter(name=>name.startsWith('src/')),generated:{version,bundleName,cssName,newModules:Object.keys(nextFiles).length},linkCheck:'passed'};
 const payload={version,frontend:{html:nextHtml,files:nextFiles,entryFiles},expectedFrontend:{htmlSha256:sha(html),files:Object.fromEntries(Object.entries(files).map(([name,body])=>[name,sha(body)]))},preservedModuleManifest:manifest};
 fs.writeFileSync(path.join(out,'frontend-graft.json'),JSON.stringify(payload));fs.writeFileSync(path.join(out,'preserved-modules.json'),JSON.stringify(manifest,null,2));fs.writeFileSync(path.join(out,'build-metafile.json'),JSON.stringify(build.metafile));
 console.log(JSON.stringify({prepared:true,version,baselineModules:manifest.baselineModules,changedImplementations:targets.length,newAssets:Object.keys(nextFiles).length,bundleBytes:js.length,cssBytes:css.length,fullGraphLinkCheck:true,payload:path.join(out,'frontend-graft.json'),manifest:path.join(out,'preserved-modules.json')}));
})().catch(error=>{console.error(error);process.exit(1)});
