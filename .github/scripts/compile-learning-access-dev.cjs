// Update only the entitlement policy and learning link in the deployed runtime.
const fs=require('fs'),ts=require('typescript'),crypto=require('crypto');
const snapshot=JSON.parse(fs.readFileSync('learning-access-ui-snapshot.json','utf8'));
const parse=(name,body)=>ts.createSourceFile(name,body,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const changed={};let providers=0,links=0;
for(const [name,body] of Object.entries(snapshot.files)){
 const sf=parse(name,body);let provider,hook;
 function visit(n){
  if(ts.isBindingElement(n)&&n.propertyName?.getText(sf)==='useGetEnrollmentStatusQuery')hook=n.name.getText(sf);
  if(ts.isFunctionDeclaration(n)&&n.getText(sf).includes('localStorage.setItem')&&n.getText(sf).includes('isEntitlementLoading:')&&n.getText(sf).includes('isCommunityEnrolled:')){if(provider)throw Error('Multiple providers');provider=n;}
  ts.forEachChild(n,visit);
 }visit(sf);
 let out=body;
 if(provider && provider.getText(sf).includes('const __learningAccess=')){
  const [first,second]=provider.body.statements;
  if(first.getText(sf).startsWith('const __learningAccess=')){
   if(!second.getText(sf).includes('.auth.isAuthenticated'))throw Error('Missing authentication before query repair');
   out=body.slice(0,second.end)+first.getText(sf)+body.slice(second.end);
   out=out.slice(0,first.getStart(sf))+out.slice(first.end);
  } else if(!first.getText(sf).includes('.auth.isAuthenticated')||!second.getText(sf).startsWith('const __learningAccess='))throw Error('Unexpected entitlement query order');
  providers++;
 } else if(provider){
  let api;
  function findApi(n){if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='injectEndpoints'&&n.getText(sf).includes('getMyOrgMembership:'))api=n.expression.expression.getText(sf);ts.forEachChild(n,findApi)}findApi(sf);
  if(!api)throw Error('Authenticated API missing');
  hook='__learningAccessApi.useGetCommunityProgramAccessQuery';
  let enrolled,loading,authenticated;const declarations=new Map();
  function vars(n){if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name))declarations.set(n.name.text,n);ts.forEachChild(n,vars)}vars(provider);
  function props(n){if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='isCommunityEnrolled')enrolled=n.initializer.getText(sf);if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='isEntitlementLoading')loading=n.initializer.getText(sf);ts.forEachChild(n,props)}props(provider);
  for(const [key,n]of declarations)if(n.initializer?.getText(sf).includes('=>')&&n.initializer.getText(sf).endsWith('.auth.isAuthenticated)'))authenticated=key;
  if(!authenticated||!declarations.has(enrolled)||!declarations.has(loading))throw Error('Entitlement bindings missing');
  const e=declarations.get(enrolled).initializer,l=declarations.get(loading).initializer;
  if(!ts.isBinaryExpression(l)||l.operatorToken.kind!==ts.SyntaxKind.AmpersandAmpersandToken)throw Error('Unexpected loading gate');
  const edits=[{start:provider.getStart(sf),end:provider.getStart(sf),text:`const __learningAccessApi=${api}.injectEndpoints({endpoints:build=>({getCommunityProgramAccess:build.query({query:()=>"courses/enrollment-status?courseName=admissions",providesTags:["CourseEnrollment"]})})});`},{start:e.getStart(sf),end:e.end,text:`(${e.getText(sf)})||__learningAccess.data?.communityIncluded===true`},{start:l.getStart(sf),end:l.end,text:`!${enrolled}&&(${l.right.getText(sf)}||__learningAccess.isLoading)`},{start:provider.body.statements[0].end,end:provider.body.statements[0].end,text:`const __learningAccess=${hook}("admissions",{skip:!${authenticated},pollingInterval:30000,refetchOnFocus:true,refetchOnReconnect:true});`}];
  for(const edit of edits.sort((a,b)=>b.start-a.start))out=out.slice(0,edit.start)+edit.text+out.slice(edit.end);
  providers++;
 }
 // Match the link by its visible label, since other routes share the same URL.
 if(out.includes('Open My Learning')){
  const ast=parse(name,out),edits=[];
  function link(n){if(ts.isObjectLiteralExpression(n)&&n.properties.some(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)==='children'&&ts.isStringLiteral(p.initializer)&&p.initializer.text==='Open My Learning →')){
   const to=n.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(ast)==='to');
   if(!to||!ts.isStringLiteral(to.initializer))throw Error('Program link destination missing');
   edits.push({start:to.initializer.getStart(ast),end:to.initializer.end});
  }ts.forEachChild(n,link)}link(ast);
  if(edits.length!==1)throw Error('Expected one program learning link');
  const edit=edits[0];out=out.slice(0,edit.start)+'"/student-hub?section=admissions-program"'+out.slice(edit.end);links++;
 }
 if(out!==body)changed[name]=out;
}
if(providers!==1||links!==1)throw Error(`Expected one policy and link, found ${providers}/${links}`);
const suffix='-learning-access-'+crypto.createHash('sha256').update(JSON.stringify(changed)).digest('hex').slice(0,12);
const refs=s=>new Set((s.match(/[A-Za-z0-9_.$-]+\.js/g)||[]).filter(n=>Object.hasOwn(snapshot.files,n)));
const affected=new Set(Object.keys(changed));let added=true;while(added){added=false;for(const [n,s]of Object.entries(snapshot.files))if(!affected.has(n)&&[...refs(s)].some(r=>affected.has(r))){affected.add(n);added=true}}
const mapping=new Map([...affected].map(n=>[n,n.replace(/\.js$/,suffix+'.js')]));
const rewrite=s=>s.replace(/[A-Za-z0-9_.$-]+\.js/g,n=>mapping.get(n)||n);const files={};
for(const n of affected){const out=rewrite(changed[n]??snapshot.files[n]);if(parse(n,out).parseDiagnostics.length){for(const d of parse(n,out).parseDiagnostics)console.error(d.messageText,out.slice(d.start-100,d.start+100));throw Error('Invalid output '+n);}files[mapping.get(n)]=out;}
const html=rewrite(snapshot.html);if(html===snapshot.html)throw Error('No entry change');
fs.writeFileSync('learning-access-ui-bundle.json',JSON.stringify({html,files,entryFiles:snapshot.roots.map(n=>mapping.get(n)||n),component:'Community program entitlement and My Programs learning destination'}));
console.log(JSON.stringify({providers,links,modules:Object.keys(files).length,existingCodePreserved:true}));
