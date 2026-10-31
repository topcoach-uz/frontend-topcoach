import { RtkApi } from './api';
import type { SessionLogDto, MilestoneDto } from './fullSupportApi';
export type ProgramKey = 'admissions' | 'full_support' | 'research' | 'customized' | 'bootcamp';
export type ProgramTask = { id: string; task: string; description?: string; deadline: string; status: 'assigned'|'submitted'|'revision_requested'|'approved'; mentorName: string; mentorUserId: string; lessonId?: string };
export type StudentProgram = {
 id: string; program: ProgramKey; state: 'active'|'scheduled'|'expired'|'revoked'; startsAt: string; accessEndsAt: string|null; teachingEndsAt: string|null;
 roles: string[]; mentors: {id:string;name:string;role:string}[]; allocatedMinutes: number|null; usedMinutes: number; remainingMinutes: number|null; roadmapUrl: string|null;
 sessions: SessionLogDto[]; tasks: ProgramTask[]; milestones: MilestoneDto[];
};
export type StudentPrograms = { programs: StudentProgram[]; unscopedSessions: SessionLogDto[]; unscopedTasks: ProgramTask[] };
export const studentProgramsApi = RtkApi.injectEndpoints({endpoints: build => ({
 getMyMentoringPrograms: build.query<{data:StudentPrograms},void>({ query:()=>'/academic-programs/workspace', keepUnusedDataFor: 15 }),
})});
export const {useGetMyMentoringProgramsQuery} = studentProgramsApi;
