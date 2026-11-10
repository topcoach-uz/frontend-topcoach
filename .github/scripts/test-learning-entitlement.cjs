const esbuild = require('esbuild');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learning-entitlement-'));
(async()=>{
try {
 const outfile = path.join(dir, 'test.cjs');
 await esbuild.build({stdin:{contents:`import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {JourneyExperienceProvider,useJourneyExperience} from './src/contexts/JourneyExperienceContext'; function State(){const {isCommunityEnrolled,isEntitlementLoading}=useJourneyExperience();return React.createElement('span',null,JSON.stringify({isCommunityEnrolled,isEntitlementLoading}));} export function render(){return renderToStaticMarkup(React.createElement(JourneyExperienceProvider,null,React.createElement(State)));}`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',outfile,define:{'import.meta.env.DEV':'false'},alias:{'src/lib':path.join(process.cwd(),'src/lib'),'src/contexts':path.join(process.cwd(),'src/contexts')},plugins:[{name:'query-stubs',setup(b){
 b.onResolve({filter:/^src\/app\//},a=>({path:a.path,namespace:'stub'}));
 b.onLoad({filter:/.*/,namespace:'stub'},a=>({contents:a.path.endsWith('/store')?`export const useTypedSelector=fn=>fn({auth:{isAuthenticated:true,profile:{}}});`:a.path.endsWith('/courses')?`export const useGetEnrollmentStatusQuery=(course,options)=>{if(course!=='admissions'||options.pollingInterval!==30000)throw Error('Wrong entitlement query');return {isLoading:false,...global.__access};};`:a.path.endsWith('/subscription')?`export const useGetCurrentSubscriptionQuery=()=>({isLoading:false});`:a.path.endsWith('/orgMembershipApi')?`export const useGetMyOrgMembershipQuery=()=>({isLoading:false});`:`export const useGetUserPreferencesQuery=()=>({isLoading:false});export const useCreateUserPreferencesMutation=()=>[()=>{}];export const useUpdateUserPreferencesMutation=()=>[()=>{}];`,loader:'js'}));
 }}]});
 const {render}=require(outfile);
 for(const [access,enrolled,loading] of [[{data:{communityIncluded:true}},true,false],[{data:{isEnrolled:true,canAccessLearning:true}},false,false],[{data:{communityIncluded:false}},false,false],[{isLoading:true},false,true],[{isError:true},false,false]]){
 global.__access=access;const html=render().replaceAll('&quot;','"');assert.ok(html.includes(JSON.stringify({isCommunityEnrolled:enrolled,isEntitlementLoading:loading})),html);
 }
 console.log('5 learning entitlement checks passed');
} finally {fs.rmSync(dir,{recursive:true,force:true});}

})().catch(error=>{console.error(error);process.exit(1)});
