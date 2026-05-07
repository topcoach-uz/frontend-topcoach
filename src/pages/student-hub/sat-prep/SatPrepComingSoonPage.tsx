/**
 * SAT Prep "coming soon" placeholder. Shown to anyone who isn't on the
 * SuperAdmin / Owner allowlist while the product is gated by
 * SAT_PREP_SHOW_ALL = false. Sits inside the existing SatPrepLayout so
 * the breadcrumb + tabs still render — keeps the user oriented and lets
 * them go back without a separate top bar.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react';
import 'src/components/sat-prep/sat-prep-shell.scss';
import './sat-prep-coming-soon.scss';

const SatPrepComingSoonPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="sat-soon">
      <div className="sat-soon__card">
        <div className="sat-soon__glyph">
          <GraduationCap size={28} />
        </div>
        <div className="sat-soon__eyebrow">
          <span className="sat-soon__eyebrow-dot" />
          In private preview
        </div>
        <h1 className="sat-soon__title">SAT Prep is coming soon.</h1>
        <p className="sat-soon__desc">
          We're putting the finishing touches on a Bluebook-style mock-test
          simulator, an adaptive question bank with 3,400+ College Board items,
          and per-skill mastery tracking. It will land in your dashboard soon
          — sit tight.
        </p>

        <ul className="sat-soon__features">
          <li>
            <Sparkles size={14} />
            <span>Bluebook-style timed mock tests with section scoring</span>
          </li>
          <li>
            <Sparkles size={14} />
            <span>Practice by domain, skill, and difficulty</span>
          </li>
          <li>
            <Sparkles size={14} />
            <span>Vocabulary builder + Mark-for-Review across sessions</span>
          </li>
          <li>
            <Sparkles size={14} />
            <span>Projected SAT score with progress over time</span>
          </li>
        </ul>

        <button
          type="button"
          className="sat-soon__cta"
          onClick={() => navigate('/student-hub')}
        >
          Back to My Journey
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default SatPrepComingSoonPage;
