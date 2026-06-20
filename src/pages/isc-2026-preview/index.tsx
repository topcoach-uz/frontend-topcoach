// ISC 2026 — standalone clickable preview.
// One route (/isc-2026) that lets you flip between the public applicant
// site and the admissions console (Admin / Reviewer). Mock data only —
// no backend, no auth. Components here lift onto the real API later.
import React, { useEffect, useState } from 'react';
import s from './isc.module.scss';
import ApplicantSite from './ApplicantSite';
import Console from './Console';

type Mode = 'applicant' | 'console';

function initialMode(): Mode {
  if (typeof window === 'undefined') return 'applicant';
  return new URLSearchParams(window.location.search).get('view') === 'console'
    ? 'console'
    : 'applicant';
}

export default function Isc2026Preview() {
  const [mode, setMode] = useState<Mode>(initialMode);

  useEffect(() => {
    document.title = 'ISC 2026 — Preview';
    return () => {
      document.title = 'Top Coach';
    };
  }, []);

  return (
    <div className={s.root}>
      <div className={s.previewBar}>
        <div className={s.previewBrand}>
          International Summer Camp 2026
          <span className={s.previewBadge}>PREVIEW · mock data</span>
        </div>
        <div className={s.previewTabs}>
          <button className={`${s.previewTab} ${mode === 'applicant' ? s.active : ''}`}
            onClick={() => setMode('applicant')}>
            Applicant site
          </button>
          <button className={`${s.previewTab} ${mode === 'console' ? s.active : ''}`}
            onClick={() => setMode('console')}>
            Admissions console
          </button>
        </div>
      </div>

      <div className={s.previewBody}>
        {mode === 'applicant' ? <ApplicantSite /> : <Console variant="preview" />}
      </div>
    </div>
  );
}
