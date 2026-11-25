import { vi } from 'vitest';

// ApplicantPage.tsx imports the RTK API layer, which reads localStorage at module
// load. Node has none, so give the module graph an in-memory one first.
vi.hoisted(() => {
  const store = new Map<string, string>();
  (globalThis as { localStorage?: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  };
});

import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import {
  EmptyState,
  ErrorState,
  ListRow,
  Panel,
  ProgressBar,
  SectionHeader,
  SkeletonBlock,
  Spinner,
  StatTile,
  StatusPill,
} from '.';

import { ApplicantPage, QueryState } from 'src/pages/student-hub/applicant/ApplicantPage';

const html = (el: ReactElement) => renderToStaticMarkup(<MemoryRouter>{el}</MemoryRouter>);

describe('ApplicantPage', () => {
  it('renders exactly the old markup when the new props are absent', () => {
    expect(html(<ApplicantPage title="Tasks" subtitle="All your work" actions={<button>Add</button>}>body</ApplicantPage>)).toBe(
      '<section class="applicant-page"><header class="applicant-page__heading"><div><h1>Tasks</h1><p>All your work</p></div>' +
        '<div class="applicant-page__actions"><button>Add</button></div></header>body</section>',
    );
  });

  it('renders breadcrumb, eyebrow, title addon and meta in order', () => {
    const out = html(
      <ApplicantPage title="Research Program" eyebrow="8-week program" breadcrumb="My learning" titleAddon={<span>In progress</span>} meta={<div>29%</div>}>
        body
      </ApplicantPage>,
    );
    const order = ['applicant-breadcrumb', 'applicant-page__eyebrow', '<h1>Research Program</h1>', 'In progress', 'applicant-page__meta', 'body'];
    const positions = order.map((s) => out.indexOf(s));
    expect(positions.every((p) => p >= 0), JSON.stringify(positions)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(out).toContain('class="applicant-page__title-row"');
  });
});

describe('QueryState', () => {
  it('shows the error with a retry button, announced', () => {
    const out = html(<QueryState error retry={() => {}}>PAGE-BODY</QueryState>);
    expect(out).toContain('role="alert"');
    expect(out).toContain('Try again');
    expect(out).not.toContain('PAGE-BODY');
  });

  it('shows a skeleton while loading', () => {
    expect(html(<QueryState loading retry={() => {}}>content</QueryState>)).toContain('aria-busy="true"');
  });

  it('shows the empty state when empty', () => {
    expect(html(<QueryState empty emptyState={<p>Nothing yet</p>} retry={() => {}}>content</QueryState>)).toContain('Nothing yet');
  });

  it('shows the content otherwise', () => {
    expect(html(<QueryState retry={() => {}}>content</QueryState>)).toBe('content');
  });
});

describe('Panel', () => {
  it('defaults to a glass section with medium padding and renders its header', () => {
    const out = html(
      <Panel title="Lessons" subtitle="2 videos" actions={<button>Open</button>}>
        body
      </Panel>,
    );
    expect(out).toMatch(/^<section class="tc-panel tc-panel--glass tc-panel--pad-md"/);
    expect(out).toContain('<h2>Lessons</h2>');
    expect(out).toContain('2 videos');
    expect(out).toContain('body');
  });

  it('supports inset tone and a custom element', () => {
    expect(html(<Panel as="div" tone="inset" padding="none">x</Panel>)).toMatch(
      /^<div class="tc-panel tc-panel--inset tc-panel--pad-none"/,
    );
  });
});

describe('SectionHeader', () => {
  it('renders the heading level, subtitle, meta and actions', () => {
    const out = html(<SectionHeader level={3} title="Tasks" subtitle="Open" meta="3" actions={<a href="#">All</a>} />);
    expect(out).toContain('class="tc-section-head"');
    expect(out).toContain('<h3>Tasks</h3>');
    expect(out).toContain('class="tc-section-head__meta">3<');
    expect(out).toContain('class="tc-section-head__actions"');
  });
});

describe('StatTile', () => {
  it('renders label, value, hint and tone', () => {
    const out = html(<StatTile label="Applications" value={12} hint="3 due soon" tone="brand" />);
    expect(out).toContain('tc-stat tc-stat--brand');
    expect(out).toContain('class="tc-stat__value">12<');
    expect(out).toContain('3 due soon');
  });
});

describe('ListRow', () => {
  it('renders a link when to is set', () => {
    const out = html(<ListRow to="/student-hub/tasks" title="Essay draft" meta="Due Friday" />);
    expect(out).toMatch(/^<a class="tc-row tc-row--no-leading" href="\/student-hub\/tasks"/);
    expect(out).toContain('Essay draft');
  });

  it('renders a button when onClick is set', () => {
    expect(html(<ListRow onClick={() => {}} title="Open" leading={<Inbox />} />)).toMatch(
      /^<button type="button" class="tc-row"/,
    );
  });

  it('renders a plain row otherwise', () => {
    expect(html(<ListRow title="Static" />)).toMatch(/^<div class="tc-row tc-row--no-leading"/);
  });
});

describe('StatusPill', () => {
  it('renders the tone and wraps the label for truncation', () => {
    expect(html(<StatusPill tone="success">Completed</StatusPill>)).toBe(
      '<span class="tc-pill tc-pill--success"><span>Completed</span></span>',
    );
  });
});

describe('ProgressBar', () => {
  it('exposes the value to assistive tech and fills with scaleX', () => {
    const out = html(<ProgressBar value={25} label="Program progress" />);
    expect(out).toContain('role="progressbar"');
    expect(out).toContain('aria-valuenow="25"');
    expect(out).toContain('transform:scaleX(0.25)');
  });

  it('clamps values outside 0–100', () => {
    const out = html(<ProgressBar value={140} ariaLabel="Done" />);
    expect(out).toContain('aria-valuenow="100"');
    expect(out).toContain('transform:scaleX(1)');
    expect(html(<ProgressBar value={-5} ariaLabel="Done" />)).toContain('aria-valuenow="0"');
  });
});

describe('EmptyState', () => {
  it('renders the existing applicant-empty composition', () => {
    const out = html(<EmptyState icon={Inbox} title="No tasks yet" description="Add one." actions={<button>Add</button>} />);
    expect(out).toMatch(/^<div class="applicant-empty"/);
    expect(out).toContain('<svg');
    expect(out).toContain('<h3>No tasks yet</h3>');
    expect(out).toContain('<p>Add one.</p>');
    expect(out).toContain('class="applicant-actions"');
  });
});

describe('ErrorState', () => {
  it('is announced and offers a retry', () => {
    const out = html(<ErrorState onRetry={() => {}} />);
    expect(out).toContain('role="alert"');
    expect(out).toContain('Try again');
    expect(out).toContain('<button');
  });

  it('omits the retry button without onRetry', () => {
    expect(html(<ErrorState title="Nope" />)).not.toContain('<button');
  });
});

describe('Loading', () => {
  it('SkeletonBlock is busy and labelled for screen readers', () => {
    const out = html(<SkeletonBlock variant="list" lines={3} />);
    expect(out).toContain('aria-busy="true"');
    expect(out).toContain('tc-visually-hidden');
    expect(out.split('tc-skeleton__row').length - 1).toBe(3);
  });

  it('Spinner is a status with a label', () => {
    const out = html(<Spinner size={16} label="Saving" />);
    expect(out).toContain('role="status"');
    expect(out).toContain('Saving');
    expect(out).toContain('--tc-spinner-size:16px');
  });
});

import { FilterChips, GateCard, ViewTabs } from '.';
import { CollegeListTabs } from 'src/pages/student-hub/applicant/ApplicantPage';

describe('ViewTabs', () => {
  it('marks the active link with aria-current=page and is-active', () => {
    const out = html(
      <ViewTabs
        ariaLabel="Views"
        value="b"
        items={[
          { key: 'a', label: 'All', to: '/a' },
          { key: 'b', label: 'Assigned', to: '/b', count: 3 },
        ]}
      />,
    );
    expect(out).toContain('<nav class="applicant-view-tabs" aria-label="Views">');
    expect(out).toContain('<a class="is-active" aria-current="page" href="/b">Assigned<span class="tc-tab-count">3</span></a>');
    expect(out).toContain('<a href="/a">All</a>');
  });

  it('renders buttons with aria-pressed when items have no link', () => {
    const out = html(<ViewTabs ariaLabel="Views" value="a" onChange={() => {}} items={[{ key: 'a', label: 'All' }, { key: 'b', label: 'Mine' }]} />);
    expect(out).toContain('<button type="button" class="is-active" aria-pressed="true">All</button>');
    expect(out).toContain('<button type="button" aria-pressed="false">Mine</button>');
  });
});

describe('CollegeListTabs', () => {
  it('renders exactly what it rendered before moving onto ViewTabs', () => {
    expect(html(<CollegeListTabs current="deadlines" />)).toBe(
      '<nav class="applicant-view-tabs" aria-label="College List views"><span class="applicant-view-tabs__lens" style="opacity:0" aria-hidden="true"></span><a href="/student-hub/applications">Applications</a><a class="is-active" aria-current="page" href="/student-hub/applications?tab=timeline">Deadlines</a><a href="/student-hub/applications?tab=scholarships">Scholarships</a><a href="/student-hub/applications?view=archived">Archived</a></nav>',
    );
    expect(html(<CollegeListTabs current="applications" masters />)).toContain('<a class="is-active" aria-current="page" href="/student-hub/applications">Programs</a>');
  });
});

describe('FilterChips', () => {
  it('marks selected values with aria-pressed in a labelled group', () => {
    const out = html(
      <FilterChips ariaLabel="Difficulty" value={['easy']} multiple onChange={() => {}} options={[{ value: 'easy', label: 'Easy', count: 4 }, { value: 'hard', label: 'Hard' }]} />,
    );
    expect(out).toContain('<div class="tc-chips" role="group" aria-label="Difficulty">');
    expect(out).toContain('aria-pressed="true"><span>Easy</span><span class="tc-chip__count">4</span>');
    expect(out).toContain('aria-pressed="false"><span>Hard</span>');
  });
});

describe('GateCard', () => {
  it('renders main and aside regions', () => {
    const out = html(
      <GateCard eyebrow="Full Support" title="Start with a conversation" description="Contact sales." aside={<ul><li>Mentors</li></ul>} asideTitle="What's included" fill={false}>
        <button>Contact sales</button>
      </GateCard>,
    );
    expect(out).toMatch(/^<section class="tc-gate"/);
    expect(out).toContain('class="tc-gate__main"');
    expect(out).toContain('<h1 class="tc-gate__title"');
    expect(out).toContain('class="tc-gate__body"><button>Contact sales</button>');
    expect(out).toContain('<aside class="tc-gate__aside"');
    expect(out).toContain('What&#x27;s included');
  });
});

import fs from 'node:fs';
import path from 'node:path';

describe('studentUi strings', () => {
  const load = (lng: string) =>
    JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../../../public/locales/${lng}.json`), 'utf8')) as Record<string, string>;
  const en = load('en');
  const keys = Object.keys(en).filter((k) => k.startsWith('studentUi.'));

  it('has the kit strings in English', () => {
    expect(keys.sort()).toEqual(['studentUi.error.body', 'studentUi.error.retry', 'studentUi.error.title', 'studentUi.loading']);
  });

  it.each(['ru', 'uz', 'kk'])('has every studentUi key translated in %s', (lng) => {
    const other = load(lng);
    for (const k of keys) {
      expect(other[k], `${lng}: ${k}`).toBeTruthy();
      expect(other[k], `${lng}: ${k} is untranslated`).not.toBe(en[k]);
    }
  });
});

import { viewTabsSignature } from './ViewTabs';

describe('ViewTabs thumb', () => {
  it('re-measures when a count or the active view changes', () => {
    const a = viewTabsSignature([{ key: 'x', label: 'X' }, { key: 'y', label: 'Y' }], 'y');
    const b = viewTabsSignature([{ key: 'x', label: 'X', count: 12 }, { key: 'y', label: 'Y' }], 'y');
    const c = viewTabsSignature([{ key: 'x', label: 'X', count: 12 }, { key: 'y', label: 'Y' }], 'x');
    expect(new Set([a, b, c]).size).toBe(3);
  });
});
