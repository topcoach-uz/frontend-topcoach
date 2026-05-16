import { RtkApi } from './api';
import type { PlacementLevel } from './placementTestApi';

// ── DTO mirrors of `src/modules/roadmap/...` ────────────────────────────────

export type RoadmapSource = 'ai' | 'fallback';
export type RoadmapStrength = 'Developing' | 'Competitive' | 'Strong';
export type RoadmapPriority = 'high' | 'medium' | 'low';
export type RoadmapCategory =
  | 'Testing'
  | 'Research'
  | 'Extracurriculars'
  | 'Essays'
  | 'Financial'
  | 'English';
export type ResourceTier =
  | 'tier1_official'
  | 'tier2_educational'
  | 'tier3_community';

export type RoadmapTimelinePhase = {
  phase: string;
  period: string;
  focus: string;
  milestones: string[];
};

export type RoadmapTopcoachLink = {
  section: string;
  path: string;
  action: string;
};

export type RoadmapExternalResource = {
  title: string;
  url: string;
  tier: ResourceTier;
  why: string;
  how: string;
};

export type RoadmapActionItem = {
  title: string;
  description: string;
  priority: RoadmapPriority;
  category: RoadmapCategory;
  timeline: string;
  topcoachResource?: RoadmapTopcoachLink | null;
  externalResources: RoadmapExternalResource[];
};

export type RoadmapWeeklyDayEntry = {
  time: string;
  activity: string;
  durationMin: number;
};

export type RoadmapWeeklyPlan = {
  totalHoursPerWeek: number;
  days: Record<
    'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun',
    RoadmapWeeklyDayEntry[]
  >;
};

export type RoadmapPayload = {
  personalizedSummary: string;
  strength: RoadmapStrength;
  timeline: RoadmapTimelinePhase[];
  actionItems: RoadmapActionItem[];
  weeklyPlan: RoadmapWeeklyPlan;
};

export type RoadmapMeta = {
  isPreview: boolean;
  studentName: string;
  gradeLevel: number | null;
  satScore: number | null;
  placementLevel: PlacementLevel | null;
  placementScore: number | null;
  strength: RoadmapStrength;
  source: RoadmapSource;
  generatedAt: string;
  totalActionItems: number;
  visibleActionItems: number;
  canRegenerate: boolean;
  regenerateAvailableAt: string | null;
  profileChangedSinceLastRoadmap: boolean;
};

export type RoadmapResponse = {
  meta: RoadmapMeta;
  roadmap: RoadmapPayload;
};

export const roadmapApi = RtkApi.injectEndpoints({
  endpoints: (builder) => ({
    getRoadmap: builder.query<RoadmapResponse, void>({
      query: () => 'roadmap/me',
      providesTags: ['Roadmap'],
    }),
    regenerateRoadmap: builder.mutation<RoadmapResponse, void>({
      query: () => ({
        url: 'roadmap/me/regenerate',
        method: 'POST',
      }),
      invalidatesTags: ['Roadmap'],
    }),
  }),
});

export const { useGetRoadmapQuery, useRegenerateRoadmapMutation } = roadmapApi;
