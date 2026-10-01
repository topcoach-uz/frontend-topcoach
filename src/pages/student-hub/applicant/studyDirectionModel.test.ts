import { describe, expect, it } from 'vitest';
import { directionIdeas, hasDirectionChoices, readStudyDirectionChoices } from './studyDirectionModel';

describe('study direction choices', () => {
  it('keeps an unsaved or empty profile free of invented suggestions', () => {
    const choices = readStudyDirectionChoices({});
    expect(hasDirectionChoices(choices)).toBe(false);
    expect(directionIdeas(choices)).toEqual([]);
  });

  it('explains a direction from an actual saved interest', () => {
    const choices = readStudyDirectionChoices({
      studyDirection: {
        interests: ['Artificial intelligence'],
        goals: ['Prepare for research'],
        countries: ['United Kingdom'],
      },
    });
    expect(directionIdeas(choices)).toEqual([expect.objectContaining({
      title: 'Advanced computer science',
      because: expect.stringContaining('You selected Artificial intelligence'),
    })]);
  });
});
