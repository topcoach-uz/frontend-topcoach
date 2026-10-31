import { Link, useLocation } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { useGetMyMentoringProgramsQuery } from 'src/app/services/studentProgramsApi';
import { programNavigation } from './programModel';
export default function ProgramNavigationLink({onNavigate,className='applicant-nav-link'}:{onNavigate?:()=>void;className?:string}) {
 const q=useGetMyMentoringProgramsQuery(undefined,{pollingInterval:30000,refetchOnMountOrArgChange:true,refetchOnFocus:true});
 const location=useLocation();const nav=programNavigation(q.currentData?.data.programs??[]);
 const active=location.pathname==='/student-hub/my-programs'||location.pathname==='/student-hub/full-support'||(new URLSearchParams(location.search).get('target')==='full-support');
 return <Link to={nav.url} onClick={onNavigate} className={className+(active?' is-active':'')} aria-current={active?'page':undefined}><Layers size={20} aria-hidden/><span>{nav.label}</span></Link>;
}
