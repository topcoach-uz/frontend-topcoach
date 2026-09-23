import type { MM3Answer } from './components/MM3Inputs';
import { clampMm3Index } from './mm3-navigation';
import { isKnownMm3Slug } from './mm3-payload';

export interface MM3Draft {
  answers: Record<string, MM3Answer>;
  currentIndex: number;
  step: 'questions' | 'review';
}

export const mm3DraftKey = (profileKey: string) => `topcoach_mm3_draft_${profileKey}`;

export const loadMm3Draft = (profileKey: string, storage: Pick<Storage, 'getItem'> = localStorage): MM3Draft | null => {
  try {
    const raw = storage.getItem(mm3DraftKey(profileKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MM3Draft>;
    if (!parsed || typeof parsed !== 'object' || !parsed.answers || typeof parsed.answers !== 'object') return null;

    const answers: Record<string, MM3Answer> = {};
    for (const [slug, value] of Object.entries(parsed.answers)) {
      if (isKnownMm3Slug(slug)) answers[slug] = value as MM3Answer;
    }

    return {
      answers,
      currentIndex: typeof parsed.currentIndex === 'number' ? clampMm3Index(parsed.currentIndex) : 0,
      step: parsed.step === 'review' ? 'review' : 'questions',
    };
  } catch {
    return null;
  }
};

export const saveMm3Draft = (
  profileKey: string,
  draft: MM3Draft,
  storage: Pick<Storage, 'setItem'> = localStorage,
) => {
  try {
    storage.setItem(mm3DraftKey(profileKey), JSON.stringify(draft));
  } catch {
    // Draft persistence is best-effort when storage is unavailable or full.
  }
};

export const clearMm3Draft = (profileKey: string, storage: Pick<Storage, 'removeItem'> = localStorage) => {
  try {
    storage.removeItem(mm3DraftKey(profileKey));
  } catch {
    // No action is needed when browser storage is unavailable.
  }
};
