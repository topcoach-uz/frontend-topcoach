/**
 * Practice Flow — "Build a session" editorial layout. Difficulty + length
 * + Adaptive controls on top, two-column domain tree below, sticky CTA.
 *
 * Skill rows show difficulty-availability dots only (no inventory totals,
 * no fake mastery numbers — empty states until attempt tracking lands).
 */

import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spin, message } from "antd";
import {
  BookOpen,
  Calculator,
  ChevronDown,
  ChevronRight,
  Infinity as InfinityIcon,
  Play,
} from "lucide-react";
import {
  useLazyFilterSatQuestionsQuery,
  useSatSkillCountsQuery,
} from "src/app/services/sat-prep";
import type { SatDifficulty } from "src/app/services/sat-prep/types";
import "src/components/sat-prep/sat-prep-shell.scss";
import "./sat-practice-flow.scss";
import "./sat-secondary-pages.scss";

type DiffSet = Set<SatDifficulty>;

interface DomainNode {
  domain: string;
  skills: {
    skill: string;
    total: number;
    byDiff: Record<SatDifficulty, number>;
  }[];
}

const COUNT_OPTIONS: (number | "unlimited")[] = [10, 20, 30, 50, "unlimited"];

const SatPracticeFlowPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const presetSection = params.get("section");
  const presetDomain = params.get("domain");
  const presetSkill = params.get("skill");
  const presetKey =
    (presetSection === "math" || presetSection === "reading-writing") &&
    presetDomain &&
    presetSkill
      ? `${presetSection}/${presetDomain}/${presetSkill}`
      : null;
  const {
    data: counts,
    isLoading,
    isError,
    refetch,
  } = useSatSkillCountsQuery();
  const [fetchQuestions] = useLazyFilterSatQuestionsQuery();

  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(
    () => new Set(presetKey ? [presetKey] : []),
  );
  const [difficulties, setDifficulties] = useState<DiffSet>(
    new Set(["easy", "medium", "hard"]),
  );
  const [count, setCount] = useState<number | "unlimited">(
    params.get("count") === "10" ? 10 : 20,
  );
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(presetKey ? [`${presetSection}/${presetDomain}`] : []),
  );
  const [composing, setComposing] = useState(false);

  const tree = useMemo(() => {
    const result: Record<"math" | "reading-writing", DomainNode[]> = {
      math: [],
      "reading-writing": [],
    };
    if (!counts) return result;
    const bySection: Record<
      string,
      Map<string, Map<string, Record<SatDifficulty, number>>>
    > = {};
    for (const r of counts) {
      bySection[r.section] ??= new Map();
      const dMap = bySection[r.section];
      if (!dMap.has(r.domain)) dMap.set(r.domain, new Map());
      const sMap = dMap.get(r.domain)!;
      if (!sMap.has(r.skill))
        sMap.set(r.skill, { easy: 0, medium: 0, hard: 0 });
      sMap.get(r.skill)![r.difficulty] += r.count;
    }
    for (const section of ["math", "reading-writing"] as const) {
      const dMap = bySection[section];
      if (!dMap) continue;
      for (const [domain, sMap] of dMap) {
        result[section].push({
          domain,
          skills: Array.from(sMap.entries()).map(([skill, byDiff]) => ({
            skill,
            byDiff,
            total: byDiff.easy + byDiff.medium + byDiff.hard,
          })),
        });
      }
    }
    return result;
  }, [counts]);

  const eligibleTotal = useMemo(() => {
    if (!counts || selectedSkills.size === 0) return 0;
    let n = 0;
    for (const r of counts) {
      const key = `${r.section}/${r.domain}/${r.skill}`;
      if (!selectedSkills.has(key)) continue;
      if (!difficulties.has(r.difficulty)) continue;
      n += r.count;
    }
    return n;
  }, [counts, selectedSkills, difficulties]);

  const toggleSkill = (key: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleDifficulty = (d: SatDifficulty) => {
    setDifficulties((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      if (next.size === 0) next.add(d);
      return next;
    });
  };

  const selectAllDomain = (
    section: "math" | "reading-writing",
    domain: DomainNode,
  ) => {
    const keys = domain.skills.map(
      (s) => `${section}/${domain.domain}/${s.skill}`,
    );
    const allSelected = keys.every((k) => selectedSkills.has(k));
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const selectAllSection = (section: "math" | "reading-writing") => {
    const allKeys: string[] = [];
    tree[section].forEach((d) =>
      d.skills.forEach((s) =>
        allKeys.push(`${section}/${d.domain}/${s.skill}`),
      ),
    );
    const allSelected = allKeys.every((k) => selectedSkills.has(k));
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      allKeys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const startPractice = async () => {
    if (selectedSkills.size === 0) {
      message.warning("Pick at least one subtopic");
      return;
    }
    setComposing(true);
    try {
      const skillNames = Array.from(selectedSkills).map((k) =>
        k.split("/").slice(2).join("/"),
      );
      const requested = count === "unlimited" ? 200 : count;
      const result = await fetchQuestions({
        skill: Array.from(new Set(skillNames)).join(","),
        difficulty: Array.from(difficulties).join(","),
        limit: requested,
        order: "random",
      }).unwrap();
      if (!result.items.length) {
        message.warning("No questions matched. Try widening filters.");
        return;
      }
      sessionStorage.setItem("sat-mock-test", JSON.stringify(result.items));
      sessionStorage.setItem(
        "sat-mock-test-meta",
        JSON.stringify({
          title: `Practice · ${selectedSkills.size} topic${selectedSkills.size > 1 ? "s" : ""}`,
          section: result.items[0].section,
          mode: "practice",
        }),
      );
      navigate("/student-hub/sat-prep/runner");
    } catch {
      message.error("Could not load questions.");
    } finally {
      setComposing(false);
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
    <div className="sat-flow">
      {/* Header */}
      <header className="sat-flow__header">
        <div className="sat-eyebrow">Build a session</div>
        <h1 className="sat-page-title">Build your practice set.</h1>
        <p className="sat-page-desc">
          Choose your skills, difficulty, and question count. Start a focused
          set when you’re ready.
        </p>
      </header>

      {isError && (
        <div className="sat-secondary-notice" role="alert">
          We couldn’t load the practice topics.{" "}
          <button className="sat-action" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      )}
      {!isError && counts?.length === 0 && (
        <p className="sat-secondary-notice">
          No practice topics are available yet.
        </p>
      )}
      {/* Controls bar */}
      <section className="sat-flow__controls">
        <div className="sat-flow__controls-row">
          <div className="sat-flow__control-label">Difficulty</div>
          <div className="sat-chips">
            {(["easy", "medium", "hard"] as SatDifficulty[]).map((d) => (
              <button
                key={d}
                aria-pressed={difficulties.has(d)}
                className={`sat-chip sat-chip--${d} ${difficulties.has(d) ? "sat-chip--active" : ""}`}
                onClick={() => toggleDifficulty(d)}
              >
                <span
                  className={`sat-flow__diff-dot sat-flow__diff-dot--${d}`}
                />
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          <div className="sat-flow__control-divider" />

          <div className="sat-flow__control-label">Length</div>
          <div className="sat-chips">
            {COUNT_OPTIONS.map((c) => (
              <button
                key={String(c)}
                aria-pressed={count === c}
                aria-label={
                  c === "unlimited"
                    ? "Unlimited, up to 200 questions"
                    : `${c} questions`
                }
                className={`sat-chip ${count === c ? "sat-chip--active" : ""}`}
                onClick={() => setCount(c)}
              >
                {c === "unlimited" ? <InfinityIcon size={13} /> : c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Two-column */}
      <div className="sat-flow__grid">
        <SectionPanel
          title="Reading & Writing"
          icon={<BookOpen size={15} />}
          section="reading-writing"
          domains={tree["reading-writing"]}
          selectedSkills={selectedSkills}
          onToggleSkill={toggleSkill}
          onToggleDomain={selectAllDomain}
          onSelectAllSection={() => selectAllSection("reading-writing")}
          expanded={expanded}
          onToggleExpand={(d) => {
            setExpanded((prev) => {
              const next = new Set(prev);
              if (next.has(d)) next.delete(d);
              else next.add(d);
              return next;
            });
          }}
        />
        <SectionPanel
          title="Math"
          icon={<Calculator size={15} />}
          section="math"
          domains={tree["math"]}
          selectedSkills={selectedSkills}
          onToggleSkill={toggleSkill}
          onToggleDomain={selectAllDomain}
          onSelectAllSection={() => selectAllSection("math")}
          expanded={expanded}
          onToggleExpand={(d) => {
            setExpanded((prev) => {
              const next = new Set(prev);
              if (next.has(d)) next.delete(d);
              else next.add(d);
              return next;
            });
          }}
        />
      </div>

      {/* Sticky CTA */}
      <div className="sat-flow__sticky">
        <div className="sat-flow__sticky-stat">
          <strong>{selectedSkills.size}</strong>
          <span>
            {" "}
            {selectedSkills.size === 1 ? "skill" : "skills"} selected
          </span>
        </div>
        <div className="sat-flow__sticky-sep" />
        <div className="sat-flow__sticky-stat">
          <strong>{count === "unlimited" ? "∞" : count}</strong>
          <span> questions</span>
        </div>
        <div className="sat-flow__sticky-sep" />
        <div className="sat-flow__sticky-stat sat-flow__sticky-stat--muted">
          ~{count === "unlimited" ? "?" : Math.round((count as number) * 1.4)}{" "}
          min
        </div>
        <div className="sat-flow__sticky-sep" />
        <div className="sat-flow__sticky-stat sat-flow__sticky-stat--muted">
          {Array.from(difficulties).map(cap).join(" · ") || "—"}
        </div>
        <button
          className="sat-flow__sticky-cta"
          disabled={
            composing || selectedSkills.size === 0 || eligibleTotal === 0
          }
          onClick={startPractice}
        >
          <Play size={13} />
          {composing ? "Loading…" : "Start practice session"}
        </button>
      </div>
    </div>
  );
};

const SectionPanel: React.FC<{
  title: string;
  icon: React.ReactNode;
  section: "math" | "reading-writing";
  domains: DomainNode[];
  selectedSkills: Set<string>;
  onToggleSkill: (key: string) => void;
  onToggleDomain: (
    section: "math" | "reading-writing",
    domain: DomainNode,
  ) => void;
  onSelectAllSection: () => void;
  expanded: Set<string>;
  onToggleExpand: (key: string) => void;
}> = ({
  title,
  icon,
  section,
  domains,
  selectedSkills,
  onToggleSkill,
  onToggleDomain,
  onSelectAllSection,
  expanded,
  onToggleExpand,
}) => {
  return (
    <div className="sat-flow__panel">
      <div className="sat-flow__panel-header">
        <div className="sat-flow__panel-title-row">
          <span className="sat-flow__panel-icon">{icon}</span>
          <h2 className="sat-flow__panel-title">{title}</h2>
          <span className="sat-flow__panel-count">
            {domains.length} {domains.length === 1 ? "domain" : "domains"}
          </span>
        </div>
        <button className="sat-flow__select-all" onClick={onSelectAllSection}>
          Select all
        </button>
      </div>

      <div className="sat-flow__domains">
        {domains.map((dom) => {
          const skillKeys = dom.skills.map(
            (s) => `${section}/${dom.domain}/${s.skill}`,
          );
          const selectedInDomain = skillKeys.filter((k) =>
            selectedSkills.has(k),
          ).length;
          const allSelected =
            selectedInDomain === skillKeys.length && skillKeys.length > 0;
          const isExpanded = expanded.has(`${section}/${dom.domain}`);
          return (
            <div key={dom.domain} className="sat-flow__domain">
              <button
                type="button"
                className="sat-flow__domain-header"
                aria-expanded={isExpanded}
                onClick={() => onToggleExpand(`${section}/${dom.domain}`)}
              >
                <input
                  type="checkbox"
                  className="sat-flow__check"
                  aria-label={`Select all ${dom.domain} skills`}
                  checked={allSelected}
                  ref={(el) => {
                    if (el)
                      el.indeterminate = selectedInDomain > 0 && !allSelected;
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => onToggleDomain(section, dom)}
                />
                <span className="sat-flow__domain-name">{dom.domain}</span>
                <span className="sat-flow__domain-skills">
                  {dom.skills.length}{" "}
                  {dom.skills.length === 1 ? "skill" : "skills"}
                </span>
                <Dots domain={dom} />
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
              {isExpanded && (
                <ul className="sat-flow__skills">
                  {dom.skills.map((s) => {
                    const key = `${section}/${dom.domain}/${s.skill}`;
                    return (
                      <li key={s.skill} className="sat-flow__skill">
                        <label className="sat-flow__skill-label">
                          <input
                            type="checkbox"
                            className="sat-flow__check"
                            checked={selectedSkills.has(key)}
                            onChange={() => onToggleSkill(key)}
                          />
                          <span className="sat-flow__skill-name">
                            {s.skill}
                          </span>
                        </label>
                        <div className="sat-flow__skill-pips">
                          {s.byDiff.easy > 0 && (
                            <span
                              className="sat-flow__skill-dot sat-flow__skill-dot--easy"
                              title="Easy items"
                            />
                          )}
                          {s.byDiff.medium > 0 && (
                            <span
                              className="sat-flow__skill-dot sat-flow__skill-dot--medium"
                              title="Medium items"
                            />
                          )}
                          {s.byDiff.hard > 0 && (
                            <span
                              className="sat-flow__skill-dot sat-flow__skill-dot--hard"
                              title="Hard items"
                            />
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Dots: React.FC<{ domain: DomainNode }> = ({ domain }) => {
  const levels = (["easy", "medium", "hard"] as const).map((level) => ({
    level,
    available: domain.skills.some((skill) => skill.byDiff[level] > 0),
  }));
  return (
    <span
      className="sat-dots"
      aria-label={`Available difficulties: ${levels
        .filter((l) => l.available)
        .map((l) => cap(l.level))
        .join(", ")}`}
    >
      {levels.map(({ level, available }) => (
        <span
          key={level}
          title={`${cap(level)} ${available ? "available" : "unavailable"}`}
          className={`sat-dot ${available ? "sat-dot--filled" : ""}`}
        />
      ))}
    </span>
  );
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default SatPracticeFlowPage;
