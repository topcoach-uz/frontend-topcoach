import { useMemo } from 'react';

import type { MentorsResponseDto } from 'src/app/api/Api';
import { useGetMentorsQuery } from 'src/app/services/mentors';

/**
 * Personalized mentor ranking shared by the roadmap UI card and the
 * PDF export. Both surfaces must show the same shortlist; if the
 * scoring lived only inside the React component we'd have no good way
 * to feed it into the PDF generator, so it lives here as a pure hook.
 */

const MASTER_PROGRAM_BLOCKLIST = new Set([
  'ahmadullayevarabboy@gmail.com',
  'mamadjanovjamshidbek@gmail.com',
]);

/** Quality bias so we never fall back to a stale junior mentor when
 * the personalization signals don't match anyone. */
const LEVEL_QUALITY_BONUS: Record<string, number> = {
  expert: 3,
  senior: 2,
  uzcombinator: 2,
  junior: 1,
  probono: 0,
};

const norm = (s: string | null | undefined): string =>
  (s ?? '').toLowerCase().trim();

function fuzzyOverlap(a: string, b: string): boolean {
  const aw = norm(a)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2);
  const bw = new Set(
    norm(b)
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2),
  );
  return aw.some((w) => bw.has(w));
}

function scoreMentor(
  mentor: MentorsResponseDto,
  interests: string[],
  targets: string[],
): number {
  const major = norm(mentor.mentorProfile?.major);
  const university = norm(mentor.mentorProfile?.university);
  const tags = (mentor.mentorProfile?.tags ?? []).map(norm);

  let score = 0;

  for (const interest of interests) {
    if (!interest) continue;
    if (fuzzyOverlap(interest, major)) score += 5;
    if (tags.some((t) => fuzzyOverlap(interest, t))) score += 3;
  }

  for (const target of targets) {
    if (!target) continue;
    if (fuzzyOverlap(target, university)) score += 4;
  }

  score += LEVEL_QUALITY_BONUS[mentor.mentorProfile?.level ?? ''] ?? 0;
  return score;
}

export interface UseRankedMentorsResult {
  mentors: MentorsResponseDto[];
  isLoading: boolean;
}

export function useRankedMentors(
  interests: string[],
  targets: string[],
  limit = 3,
): UseRankedMentorsResult {
  const { data: mentors, isLoading } = useGetMentorsQuery();

  const ranked = useMemo<MentorsResponseDto[]>(() => {
    if (!mentors || mentors.length === 0) return [];

    const eligible = mentors.filter(
      (m) =>
        m.mentorProfile &&
        m.mentorProfile.status === 'accepted' &&
        !MASTER_PROGRAM_BLOCKLIST.has((m.email ?? '').toLowerCase()),
    );

    return [...eligible]
      .map((m) => ({ mentor: m, score: scoreMentor(m, interests, targets) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((x) => x.mentor);
  }, [mentors, interests, targets, limit]);

  return { mentors: ranked, isLoading };
}

/** Friendly rate label per mentor level (shared with the PDF too). */
export function rateLabelForLevel(level: string | undefined | null): string {
  switch (level) {
    case 'expert':
      return '$50 – $100 / session';
    case 'senior':
      return '$25 – $50 / session';
    case 'junior':
      return '$12.50 – $25 / session';
    case 'probono':
      return 'Free · Pro-bono';
    default:
      return 'Contact for pricing';
  }
}
