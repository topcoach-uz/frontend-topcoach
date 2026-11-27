import { RtkApi } from './api';
import type { SessionLogDto, MilestoneDto } from './fullSupportApi';
export type ProgramKey = string;
export type ProgramProgressItem = { key: string; percent: number; target?: string | null };
export type ProgramTask = { id: string; task: string; description?: string; deadline: string; status: 'assigned'|'submitted'|'revision_requested'|'approved'; mentorName: string; mentorUserId: string; lessonId?: string };
export type StudentProgram = {
 id: string; name?: string; description?: string; capabilities?: string[]; enabledTools?: string[]; program: ProgramKey; state: 'active'|'scheduled'|'expired'|'revoked'; startsAt: string; accessEndsAt: string|null; teachingEndsAt: string|null;
 roles: string[]; mentors: {id:string;name:string;role:string}[]; allocatedMinutes: number|null; usedMinutes: number; remainingMinutes: number|null; roadmapUrl: string|null;
 progress?: ProgramProgressItem[]; sessions: SessionLogDto[]; tasks: ProgramTask[]; milestones: MilestoneDto[];
};
export type StudentPrograms = { programs: StudentProgram[]; unscopedSessions: SessionLogDto[]; unscopedTasks: ProgramTask[]; unscopedMilestones?: MilestoneDto[]; legacyHistoryLabel?: string };
export const studentProgramsApi = RtkApi.injectEndpoints({endpoints: build => ({
 getProgramEnrollmentProgress: build.query<{data:{items:ProgramProgressItem[];updatedAt?:string|null}},string>({
  query:id=>`/academic-programs/enrollments/${encodeURIComponent(id)}/progress`,
  providesTags:(_res,_err,id)=>[{type:'FullSupportCurriculumProgress',id:'program:'+id}],
 }),
 setProgramEnrollmentProgress: build.mutation<{data:{items:ProgramProgressItem[];updatedAt?:string|null}}, {id:string;items:ProgramProgressItem[];expectedUpdatedAt:string|null}>({
  query:({id,items,expectedUpdatedAt})=>({url:`/academic-programs/enrollments/${encodeURIComponent(id)}/progress`,method:'PUT',body:{items,expectedUpdatedAt}}),
  invalidatesTags:(_res,_err,{id})=>[{type:'FullSupportCurriculumProgress',id:'program:'+id},{type:'FullSupportCurriculumProgress',id:'program-workspace'}],
 }),
 getMyMentoringPrograms: build.query<{data:StudentPrograms},void>({ query:()=>'/academic-programs/workspace', keepUnusedDataFor: 15, providesTags:[{type:'FullSupportCurriculumProgress',id:'program-workspace'}] }),
})});
export const {useGetMyMentoringProgramsQuery,useGetProgramEnrollmentProgressQuery,useSetProgramEnrollmentProgressMutation} = studentProgramsApi;
