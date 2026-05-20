import React from 'react';
import { Lock, Star, BookOpen } from 'lucide-react';

/**
 * Static "first page" of Research Prep, rendered as a teaser behind the
 * community-lock modal for non-enrolled users. We don't render the real
 * ResearchPrepPage here because it shows a Spin while waiting on
 * `useGetResearchWeeks` / `useGetResearchLockState`, and those queries
 * don't return useful data for users without research-prep entitlement
 * — the page would just show a spinner forever behind the blur.
 *
 * This component is intentionally hard-coded and presentational only.
 * Numbers mirror the real 8-week curriculum so the silhouette feels
 * truthful. No data fetching, no router state, nothing interactive.
 */

type Milestone = {
  label: string;
  week: number;
  caption: string;
};

const MILESTONES: Milestone[] = [
  { label: 'Lab shortlist', week: 2, caption: 'Formulating a Research Question' },
  { label: 'Research proposal', week: 5, caption: 'Advisors & Outreach' },
  { label: 'Final portfolio', week: 8, caption: 'Finalizing & Publishing' },
];

type Module = {
  week: number;
  title: string;
  state: 'active' | 'locked' | 'milestone';
  sub: string;
};

const MODULES: Module[] = [
  { week: 1, title: 'Introduction to Research', state: 'active', sub: 'Quiz unlocked' },
  { week: 2, title: 'Formulating a Research Question', state: 'locked', sub: 'Unlocks after previous week' },
  { week: 3, title: 'Methodology & Literature', state: 'locked', sub: 'Unlocks after previous week' },
  { week: 4, title: 'Citations & Proposal', state: 'locked', sub: 'Unlocks after previous week' },
  { week: 5, title: 'Advisors & Outreach', state: 'locked', sub: 'Unlocks after previous week' },
  { week: 6, title: 'Data Visualization', state: 'locked', sub: 'Unlocks after previous week' },
  { week: 7, title: 'Deep Analysis & Results', state: 'locked', sub: 'Unlocks after previous week' },
  { week: 8, title: 'Finalizing & Publishing', state: 'milestone', sub: 'Grand Milestone' },
];

export default function ResearchPrepLockedPreview() {
  return (
    <div style={{ padding: '24px 32px', maxWidth: 1200, margin: '0 auto', fontFamily: 'inherit' }}>
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#6b6258' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              background: '#f5ecec',
              color: '#8b1f2f',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <BookOpen size={14} /> Research Program
          </span>
          <span style={{ fontSize: 14 }}>›</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8a7f70' }}>
              Program Progress
            </span>
            <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 600 }}>0 / 8 Weeks</span>
          </div>
          <div style={{ width: 120, height: 6, background: '#efe9df', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: '0%', height: '100%', background: '#8b1f2f' }} />
          </div>
          <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 600 }}>0%</span>
          <button
            type="button"
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              border: '1px solid #e5e3da',
              background: '#fff',
              fontSize: 13,
              fontWeight: 500,
              color: '#1a1a1a',
            }}
          >
            ← Back to main menu
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          borderBottom: '1px solid #e5e3da',
          marginBottom: 24,
        }}
      >
        <span style={{ padding: '10px 0', borderBottom: '2px solid #8b1f2f', color: '#8b1f2f', fontWeight: 600, fontSize: 14 }}>
          Overview
        </span>
        <span style={{ padding: '10px 0', color: '#8a7f70', fontSize: 14 }}>Module</span>
      </div>

      {/* Major milestones */}
      <section
        style={{
          border: '1px solid #e5e3da',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 22,
          background: '#fff',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#8a7f70',
            fontWeight: 600,
            marginBottom: 22,
          }}
        >
          <Star size={14} color="#8b1f2f" /> Major milestones
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            position: 'relative',
          }}
        >
          {MILESTONES.map((m) => (
            <div key={m.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span
                aria-hidden
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#f7f3ec',
                  border: '1px solid #e5e3da',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8a7f70',
                }}
              >
                <Lock size={20} />
              </span>
              <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: 15 }}>{m.label}</div>
              <div style={{ fontSize: 13, color: '#8a7f70' }}>Week {m.week}</div>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  background: '#efe9df',
                  color: '#8a7f70',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                Locked
              </span>
              <div style={{ fontSize: 12, color: '#8a7f70', textAlign: 'center', marginTop: 4 }}>{m.caption}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Program modules */}
      <section
        style={{
          border: '1px solid #e5e3da',
          borderRadius: 16,
          padding: '22px 26px',
          background: '#fff',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#8a7f70',
            fontWeight: 600,
            marginBottom: 18,
          }}
        >
          <BookOpen size={14} color="#8b1f2f" /> Program Modules — 8 Weeks
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {MODULES.map((m) => {
            const isActive = m.state === 'active';
            return (
              <article
                key={m.week}
                style={{
                  border: '1px solid #e5e3da',
                  borderRadius: 14,
                  padding: '14px 16px',
                  background: isActive ? '#8b1f2f' : '#fff',
                  color: isActive ? '#fff' : '#1a1a1a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  minHeight: 150,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      color: isActive ? 'rgba(255,255,255,0.85)' : '#8a7f70',
                    }}
                  >
                    Week {m.week}
                  </span>
                  {m.state === 'milestone' ? (
                    <Star size={14} color="#8b1f2f" />
                  ) : isActive ? (
                    <span
                      aria-hidden
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.8)',
                      }}
                    />
                  ) : (
                    <Lock size={14} color="#8a7f70" />
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: 15, lineHeight: 1.3 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: isActive ? 'rgba(255,255,255,0.85)' : '#8a7f70' }}>
                  {m.sub}
                </div>
                {isActive && (
                  <div
                    style={{
                      marginTop: 'auto',
                      background: '#fff',
                      color: '#8b1f2f',
                      borderRadius: 999,
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ▶ Resume module
                  </div>
                )}
                {m.state === 'locked' && (
                  <div
                    style={{
                      marginTop: 'auto',
                      background: '#f4eee2',
                      color: '#8a7f70',
                      borderRadius: 999,
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Lock size={11} /> Locked
                  </div>
                )}
                {m.state === 'milestone' && (
                  <div
                    style={{
                      marginTop: 'auto',
                      background: '#f4eee2',
                      color: '#8a7f70',
                      borderRadius: 999,
                      padding: '8px 12px',
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Lock size={11} /> Locked
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
