import {describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
const state=vi.hoisted(()=>({data:{data:[] as {id:string;program:string;programName:string;amountUzs:number}[]},isLoading:false,isError:false,refetch:vi.fn()}));
vi.mock('src/app/services/api',()=>({RtkApi:{injectEndpoints:()=>({useProgramPaymentOffersQuery:()=>state})}}));
vi.mock('src/app/services/fullSupportCheckoutApi',()=>({useCreateFullSupportCheckoutMutation:()=>[vi.fn(),{isLoading:false}]}));
import {ProgramPayments} from './ProgramPayments';
describe('Program payment options',()=>{
 it('labels each quote with its own dynamic program and amount',()=>{state.data.data=[{id:'a',program:'new_program',programName:'New Program',amountUzs:250000},{id:'b',program:'research',programName:'Research',amountUzs:600000}];const html=renderToStaticMarkup(<ProgramPayments/>);expect(html).toContain('Pay for New Program');expect(html).toContain('Pay for Research');expect(html).toContain('250,000');expect(html).toContain('600,000');expect(html).toContain('after CLICK confirms payment');});
 it('does not invent an offer for an account without quotes',()=>{state.data.data=[];expect(renderToStaticMarkup(<ProgramPayments/>)).toBe('');});
 it('shows retry instead of hiding a failed payment lookup',()=>{state.isError=true;expect(renderToStaticMarkup(<ProgramPayments/>)).toContain('Retry payments');state.isError=false;});
});
