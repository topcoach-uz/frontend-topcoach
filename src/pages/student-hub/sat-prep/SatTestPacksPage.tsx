/**
 * Test Packs — curated domain×difficulty bundles. Editorial header with
 * total/completed/avg stat row. Per-pack status comes from `packSessions`
 * in the progress summary (latest attempt wins).
 */

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Empty, Spin, message, Input } from "antd";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  FileQuestion,
  Play,
  RotateCcw,
  Search,
  TimerReset,
} from "lucide-react";
import {
  useAggregateSatCountsQuery,
  useLazyFilterSatQuestionsQuery,
} from "src/app/services/sat-prep";
import {
  useGetSatProgressQuery,
  type SessionRecord,
} from "src/app/services/sat-prep/local-progress";
import type {
  SatDifficulty,
  SatSection,
} from "src/app/services/sat-prep/types";
import "src/components/sat-prep/sat-prep-shell.scss";
import "./sat-test-packs.scss";
import "./sat-secondary-pages.scss";

interface PackAttempt {
  attempts: number;
  bestPct: number;
  lastPct: number;
  lastCorrect: number;
  lastTotal: number;
  lastAt: string;
}

interface Pack {
  id: string;
  domain: string;
  section: SatSection;
  difficulty: SatDifficulty;
  questionCount: number;
  estimatedMin: number;
  attempt?: PackAttempt;
}

const QUESTIONS_PER_PACK = 22;
const MIN_PER_QUESTION = 3.4; // ~75 min for a 22-q pack — close to a real DSAT module

// Pack title format used when starting: `${domain} · ${cap(difficulty)}`.
// Parsing it back lets us join sessions to packs without a packId column.
const TITLE_RE = /^(.+?)\s*·\s*(Easy|Medium|Hard)\s*$/;
const parsePackTitle = (
  title: string,
): { domain: string; difficulty: SatDifficulty } | null => {
  const m = title.match(TITLE_RE);
  if (!m) return null;
  return {
    domain: m[1].trim(),
    difficulty: m[2].toLowerCase() as SatDifficulty,
  };
};
const packKey = (
  section: SatSection,
  domain: string,
  difficulty: SatDifficulty,
) => `${section}-${domain}-${difficulty}`;

const SatTestPacksPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: counts, isLoading } = useAggregateSatCountsQuery();
  const { data: progress } = useGetSatProgressQuery();
  const [fetch] = useLazyFilterSatQuestionsQuery();

  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState<SatSection | "all">("all");
  const [filterDifficulty, setFilterDifficulty] = useState<
    SatDifficulty | "all"
  >("all");
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  // Build pack-id → aggregate from packSessions. Sessions arrive newest-first
  // from the backend, so the first one we see for a pack is the latest attempt.
  const attemptByPack = useMemo(() => {
    const map = new Map<string, PackAttempt>();
    const sessions: SessionRecord[] = progress?.packSessions ?? [];
    for (const s of sessions) {
      const parsed = parsePackTitle(s.title);
      if (!parsed) continue;
      const key = packKey(s.section, parsed.domain, parsed.difficulty);
      const pct = s.totalQ ? Math.round((s.correctQ / s.totalQ) * 100) : 0;
      const existing = map.get(key);
      if (existing) {
        existing.attempts += 1;
        existing.bestPct = Math.max(existing.bestPct, pct);
      } else {
        map.set(key, {
          attempts: 1,
          bestPct: pct,
          lastPct: pct,
          lastCorrect: s.correctQ,
          lastTotal: s.totalQ,
          lastAt: s.completedAt,
        });
      }
    }
    return map;
  }, [progress]);

  const packs: Pack[] = useMemo(() => {
    if (!counts) return [];
    const map = new Map<string, Pack>();
    for (const c of counts) {
      const id = packKey(c.section, c.domain, c.difficulty);
      const existing = map.get(id);
      const count = (existing?.questionCount ?? 0) + c.count;
      const cappedCount = Math.min(QUESTIONS_PER_PACK, count);
      map.set(id, {
        id,
        section: c.section,
        domain: c.domain,
        difficulty: c.difficulty,
        questionCount: cappedCount,
        estimatedMin: Math.round((cappedCount * MIN_PER_QUESTION) / 5) * 5,
        attempt: attemptByPack.get(id),
      });
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.section !== b.section) return a.section.localeCompare(b.section);
      if (a.domain !== b.domain) return a.domain.localeCompare(b.domain);
      const diffOrder = { easy: 0, medium: 1, hard: 2 };
      return diffOrder[a.difficulty] - diffOrder[b.difficulty];
    });
  }, [counts, attemptByPack]);

  const completedCount = packs.filter((p) => p.attempt).length;
  const avgAccuracy = useMemo(() => {
    const attempted = packs.filter((p) => p.attempt);
    if (!attempted.length) return null;
    const sum = attempted.reduce((n, p) => n + (p.attempt?.lastPct ?? 0), 0);
    return Math.round(sum / attempted.length);
  }, [packs]);

  const filtered = packs.filter((p) => {
    if (filterSection !== "all" && p.section !== filterSection) return false;
    if (filterDifficulty !== "all" && p.difficulty !== filterDifficulty)
      return false;
    if (search && !p.domain.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const startPack = async (pack: Pack) => {
    setLoadingPack(pack.id);
    try {
      // Deterministic ordering — same questions every retake (the whole
      // point of "test packs"). The backend already sorts by questionId
      // when `order: 'default'`.
      const result = await fetch({
        section: pack.section,
        domain: pack.domain,
        difficulty: pack.difficulty,
        limit: pack.questionCount,
        order: "default",
      }).unwrap();
      if (!result.items.length) {
        message.warning("Pack is empty.");
        return;
      }
      sessionStorage.setItem("sat-mock-test", JSON.stringify(result.items));
      sessionStorage.setItem(
        "sat-mock-test-meta",
        JSON.stringify({
          title: `${pack.domain} · ${cap(pack.difficulty)}`,
          section: pack.section,
          mode: "pack",
        }),
      );
      navigate("/student-hub/sat-prep/runner");
    } catch {
      message.error("Could not load pack.");
    } finally {
      setLoadingPack(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 96 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="sat-packs">
      {/* Header */}
      <header className="sat-packs__header">
        <div className="sat-packs__header-left">
          <div className="sat-eyebrow">Curated sets</div>
          <h1 className="sat-page-title">Test Packs</h1>
          <p className="sat-page-desc">
            Choose a domain and difficulty for a focused practice set. Retake a
            set to compare your accuracy.
          </p>
        </div>
        <div className="sat-packs__header-stats">
          <HeaderStat label="Total" value={String(packs.length)} />
          <HeaderStat
            label="Completed"
            value={String(completedCount)}
            tone={completedCount === 0 ? "muted" : "normal"}
          />
          <HeaderStat
            label="Avg accuracy"
            value={avgAccuracy == null ? "—" : `${avgAccuracy}%`}
            tone={avgAccuracy == null ? "muted" : "normal"}
          />
        </div>
      </header>

      {/* Filter bar */}
      <section className="sat-packs__filters">
        <Input
          allowClear
          placeholder="Search packs by domain…"
          prefix={<Search size={14} style={{ color: "#9ca3af" }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sat-packs__search"
        />
        <div className="sat-chips">
          <button
            className={`sat-chip ${filterSection === "all" ? "sat-chip--active" : ""}`}
            onClick={() => setFilterSection("all")}
          >
            All sections
          </button>
          <button
            className={`sat-chip ${filterSection === "math" ? "sat-chip--active" : ""}`}
            onClick={() => setFilterSection("math")}
          >
            Math
          </button>
          <button
            className={`sat-chip ${filterSection === "reading-writing" ? "sat-chip--active" : ""}`}
            onClick={() => setFilterSection("reading-writing")}
          >
            R&W
          </button>
        </div>
        <div className="sat-chips">
          <button
            className={`sat-chip ${filterDifficulty === "all" ? "sat-chip--active" : ""}`}
            onClick={() => setFilterDifficulty("all")}
          >
            All difficulties
          </button>
          <button
            className={`sat-chip sat-chip--easy ${filterDifficulty === "easy" ? "sat-chip--active" : ""}`}
            onClick={() => setFilterDifficulty("easy")}
          >
            Easy
          </button>
          <button
            className={`sat-chip sat-chip--medium ${filterDifficulty === "medium" ? "sat-chip--active" : ""}`}
            onClick={() => setFilterDifficulty("medium")}
          >
            Medium
          </button>
          <button
            className={`sat-chip sat-chip--hard ${filterDifficulty === "hard" ? "sat-chip--active" : ""}`}
            onClick={() => setFilterDifficulty("hard")}
          >
            Hard
          </button>
        </div>
      </section>

      <div className="sat-packs__count">
        Showing <strong>{filtered.length}</strong> of {packs.length} packs
      </div>

      {filtered.length === 0 ? (
        <Empty
          description="No packs match the filters."
          style={{ padding: 64 }}
        />
      ) : (
        <div className="sat-packs__grid">
          {filtered.map((p) => (
            <PackCard
              key={p.id}
              pack={p}
              loading={loadingPack === p.id}
              onStart={() => startPack(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const HeaderStat: React.FC<{
  label: string;
  value: string;
  tone?: "normal" | "muted";
}> = ({ label, value, tone }) => (
  <div className="sat-packs__hstat">
    <div className="sat-packs__hstat-label">{label}</div>
    <div
      className={`sat-packs__hstat-value ${tone === "muted" ? "sat-packs__hstat-value--muted" : ""}`}
    >
      {value}
    </div>
  </div>
);

const PackCard: React.FC<{
  pack: Pack;
  loading: boolean;
  onStart: () => void;
}> = ({ pack, loading, onStart }) => {
  const isMath = pack.section === "math";
  const attempt = pack.attempt;
  return (
    <article
      className={`sat-packs__card ${attempt ? "sat-packs__card--done" : ""}`}
    >
      <div
        className={`sat-packs__card-stripe sat-packs__card-stripe--${pack.difficulty}`}
      />
      <div className="sat-packs__card-body">
        <div className="sat-packs__card-top">
          <div
            className={`sat-packs__card-icon sat-packs__card-icon--${isMath ? "math" : "rw"}`}
          >
            {isMath ? <Calculator size={16} /> : <BookOpen size={16} />}
          </div>
          <div className="sat-packs__card-top-right">
            {attempt && (
              <span className="sat-packs__card-done-pill">
                <CheckCircle2 size={11} /> Attempted
              </span>
            )}
            <span
              className={`sat-packs__diff sat-packs__diff--${pack.difficulty}`}
            >
              {cap(pack.difficulty)}
            </span>
          </div>
        </div>

        <div className="sat-packs__card-eyebrow">
          {isMath ? "Math" : "Reading & Writing"}
        </div>
        <h3 className="sat-packs__card-title">{pack.domain}</h3>

        <div className="sat-packs__card-meta">
          <span>
            <TimerReset size={13} /> ~{pack.estimatedMin} m
          </span>
          <span>
            <FileQuestion size={13} /> {pack.questionCount} q
          </span>
        </div>

        {attempt ? (
          <div className="sat-packs__card-attempt">
            <div className="sat-packs__card-attempt-label">Last attempt</div>
            <div className="sat-packs__card-attempt-value">
              <span className="sat-packs__card-attempt-frac">
                {attempt.lastCorrect}/{attempt.lastTotal}
              </span>
              <span className="sat-packs__card-attempt-sep">·</span>
              <span className="sat-packs__card-attempt-pct">
                {attempt.lastPct}%
              </span>
            </div>
            <div className="sat-packs__card-attempt-bar">
              <div
                className="sat-packs__card-attempt-bar-fill"
                style={{ width: `${attempt.lastPct}%` }}
              />
            </div>
            {attempt.attempts > 1 && (
              <div className="sat-packs__card-attempt-meta">
                {attempt.attempts} attempts · best {attempt.bestPct}%
              </div>
            )}
          </div>
        ) : (
          <div className="sat-packs__card-status">Not attempted yet</div>
        )}
      </div>

      <button
        className="sat-packs__card-cta"
        disabled={loading}
        onClick={onStart}
      >
        {loading ? (
          "Loading…"
        ) : attempt ? (
          <>
            <RotateCcw size={13} />
            <span>Retake pack</span>
            <ArrowRight size={13} className="sat-packs__card-cta-arrow" />
          </>
        ) : (
          <>
            <Play size={13} />
            <span>Start practice</span>
            <ArrowRight size={13} className="sat-packs__card-cta-arrow" />
          </>
        )}
      </button>
    </article>
  );
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default SatTestPacksPage;
