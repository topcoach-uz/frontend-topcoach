import React, { useState } from "react";
import { RunnerModal } from "src/components/sat-prep/RunnerModal";
import {
  useGetSatStudyGoalQuery,
  useSetSatStudyGoalMutation,
} from "src/app/services/sat-prep/study-goal";
export function validTargetScore(value: string) {
  const n = Number(value);
  return (
    value.trim() !== "" &&
    Number.isInteger(n) &&
    n >= 400 &&
    n <= 1600 &&
    n % 10 === 0
  );
}
const QUICK_TARGETS = [1300, 1400, 1500];
export default function SatTargetScore({ score }: { score: number | null }) {
  const { data, isLoading, isError, refetch } = useGetSatStudyGoalQuery();
  const [save, { isLoading: saving }] = useSetSatStudyGoalMutation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const target = data?.targetScore;
  const submit = async (targetScore: number | null) => {
    setError("");
    try {
      await save({ targetScore }).unwrap();
      setOpen(false);
    } catch {
      setError("Your target could not be saved. Please try again.");
    }
  };
  return (
    <>
      <div className="sat-platform__target">
        <strong>{target ?? "—"}</strong>
        <span>
          {isLoading
            ? "Loading target…"
            : target
              ? "Target score"
              : "Set your target score"}
        </span>
        {!target && !isLoading && !isError && (
          <div className="sat-target-quick" role="group" aria-label="Quick-pick target score">
            <p className="sat-target-nudge">
              A target turns practice into a plan. Pick one to start.
            </p>
            <div className="sat-target-chips">
              {QUICK_TARGETS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="sat-target-chip"
                  disabled={saving}
                  onClick={() => void submit(t)}
                >
                  {t}
                </button>
              ))}
              <button
                type="button"
                className="sat-target-chip sat-target-chip--custom"
                disabled={saving}
                onClick={() => {
                  setValue("");
                  setError("");
                  setOpen(true);
                }}
              >
                Custom
              </button>
            </div>
            {error && !open && (
              <p className="sat-target-error" role="status">
                {error}
              </p>
            )}
          </div>
        )}
        {isError ? (
          <button className="sat-target-link" onClick={() => refetch()}>
            Retry loading target
          </button>
        ) : !target ? null : (
          <button
            className="sat-target-link"
            disabled={isLoading}
            onClick={() => {
              setValue(target?.toString() ?? "");
              setError("");
              setOpen(true);
            }}
          >
            {target ? "Edit target" : "Set target"}
          </button>
        )}
        {target && score != null && (
          <p className="sat-target-gap">
            {score < target
              ? `${target - score} points to target`
              : "Target reached"}
          </p>
        )}
      </div>
      <RunnerModal
        open={open}
        onClose={() => setOpen(false)}
        title="Your SAT target"
        eyebrow="Score journey"
        footer={
          <>
            {target && (
              <button
                className="rm-btn rm-btn--ghost"
                disabled={saving}
                onClick={() => submit(null)}
              >
                Clear target
              </button>
            )}
            <button
              className="rm-btn rm-btn--primary"
              form="sat-target-form"
              type="submit"
              disabled={saving || !validTargetScore(value)}
            >
              {saving ? "Saving…" : "Save target"}
            </button>
          </>
        }
      >
        <form
          id="sat-target-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (validTargetScore(value)) void submit(Number(value));
          }}
        >
          <label className="sat-target-label" htmlFor="sat-target-value">
            Target score
          </label>
          <p id="sat-target-help">
            Choose a score from 400 to 1600, in steps of 10.
          </p>
          <input
            className="sat-target-input"
            id="sat-target-value"
            type="number"
            min={400}
            max={1600}
            step={10}
            required
            value={value}
            aria-describedby="sat-target-help sat-target-error"
            aria-invalid={value !== "" && !validTargetScore(value)}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
          />
          <p id="sat-target-error" className="sat-target-error" role="status">
            {error ||
              (value !== "" && !validTargetScore(value)
                ? "Enter a whole score from 400 to 1600 in steps of 10."
                : "")}
          </p>
        </form>
      </RunnerModal>
    </>
  );
}
