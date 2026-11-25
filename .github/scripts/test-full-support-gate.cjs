const esbuild = require('esbuild');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fs-gate-test-'));
const outfile = path.join(dir, 'gate.cjs');
try {
 esbuild.buildSync({stdin:{contents:`import React from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; import {FullSupportPaymentGate} from './src/pages/student-hub/full-support/FullSupportPaymentGate'; export function render(){return renderToStaticMarkup(React.createElement(FullSupportPaymentGate));}`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'cjs',outfile,loader:{'.scss':'empty','.css':'empty'},alias:{'src/app/services/fullSupportCheckoutApi':path.join(process.cwd(),'.github/scripts/full-support-gate-api.stub.cjs')}});
 global.window={location:{search:''}};
 const {render}=require(outfile); const assert=require('node:assert/strict');
 function state(data,extra={}){global.__fullSupportTestQuery={data:{data},isLoading:false,isError:false,isFetching:false,refetch(){},...extra};return render();}
 let html=state({enrolled:false,accountEmail:'student@gmail.com',offer:null});assert.match(html,/Contact sales/);assert.match(html,/student@gmail.com/);assert.doesNotMatch(html,/Pay with CLICK/);
 html=state({enrolled:false,offer:{id:'approved',amountUzs:12000000,currency:'UZS',status:'authorized'}});assert.match(html,/12,000,000/);assert.match(html,/Pay with CLICK/);assert.match(html,/UZS/);
 html=state({enrolled:false,offer:{id:'previous',amountUzs:12000000,currency:'UZS',status:'paid'}});assert.match(html,/previous payment was received/);assert.doesNotMatch(html,/Pay with CLICK/);
 html=state({}, {isError:true});assert.match(html,/Try again/);assert.doesNotMatch(html,/Pay with CLICK/);
 window.location.search='?fullSupportPayment=returned';html=state({enrolled:false,offer:{id:'approved',amountUzs:12000000,status:'authorized'}});assert.match(html,/Waiting for payment confirmation/);assert.match(html,/Check payment status/);
 console.log('5 Full Support payment UI state checks passed');
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
