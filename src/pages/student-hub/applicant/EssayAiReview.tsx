import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useReviewEssayMutation, type EssayReviewResponse } from "src/app/services/student-hub/essayManagementApi";
import { useGetDocumentsQuery } from "src/app/services/student-hub/documentManagementApi";
import { useTypedSelector } from "src/app/store";
import { DocumentsPicker, SourceChips } from "./EssayAnglesPanel";
import { documentsSummary, loadDocumentSelection, sanitiseDocumentSelection, saveDocumentSelection } from "./essayAngles";
import { COMMENT_KIND_LABELS, reviewErrorMessage } from "./essayReview";

export interface StoredReview {
  response: EssayReviewResponse;
  /** Draft text that was reviewed, to detect later edits. */
  content: string;
}

interface Props {
  essayId: string;
  content: string;
  /** False while the draft has unsaved changes or is saving. */
  saved: boolean;
  result?: StoredReview;
  onResult: (essayId: string, result: StoredReview) => void;
  /** Selects the quote in the editor; returns false when it can't be found. */
  onFind: (paragraph: number, quote: string) => boolean;
}

const FIT_LABELS = { strong: "Strong fit", partial: "Partial fit", weak: "Weak fit" } as const;

export function EssayAiReview({ essayId, content, saved, result, onResult, onFind }: Props) {
  const [review, state] = useReviewEssayMutation();
  const [error, setError] = useState<string>();
  const [notFound, setNotFound] = useState<string>();
  const ownerId = useTypedSelector((s) => s.auth.profile?.id) ?? "anon";
  const [docIds, setDocIds] = useState<string[]>(() => loadDocumentSelection(ownerId));
  const { data: docsData } = useGetDocumentsQuery({ page: 1, limit: 100 });
  const availableIds = useMemo(() => docsData?.data.map((d) => d.id), [docsData]);
  useEffect(() => {
    if (!availableIds) return;
    setDocIds((prev) => {
      const next = sanitiseDocumentSelection(prev, availableIds);
      return next.length === prev.length ? prev : next;
    });
  }, [availableIds]);
  const changeDocs = (ids: string[]) => {
    setDocIds(ids);
    saveDocumentSelection(ownerId, ids);
  };
  const run = async (refresh: boolean) => {
    setError(undefined);
    setNotFound(undefined);
    try {
      const response = await review({ essayId, refresh, documentIds: docIds }).unwrap();
      onResult(essayId, { response, content });
    } catch (e) {
      setError(reviewErrorMessage(e));
    }
  };
  const loading = state.isLoading;
  const r = result?.response;
  const changed = Boolean(result) && result!.content !== content;
  const canRun = saved && Boolean(content.trim()) && !loading;
  const find = (id: string, paragraph: number, quote: string) => {
    setNotFound(onFind(paragraph, quote) ? undefined : id);
  };
  return (
    <section className="essay-review" aria-label="AI review">
      <h3 className="essay-review__title">AI review</h3>
      <p className="essay-review__muted">Comments and questions on your saved draft. It never rewrites your essay. Not mentor feedback.</p>
      <DocumentsPicker selected={docIds} onChange={changeDocs} />
      <div className="essay-review__actions">
        <button type="button" className="essay-angles__primary" disabled={!canRun} onClick={() => void run(Boolean(r))}>
          <Sparkles size={15} aria-hidden="true" />{r ? "Review again" : "Review my draft"}
        </button>
        {r && typeof r.remainingToday === "number" && <small className="essay-angles__left">{r.remainingToday} left today</small>}
      </div>
      {!saved && <p className="essay-review__muted" role="status">Save your changes first</p>}
      <div aria-live="polite" className="essay-angles__live">
        {loading && <span className="essay-angles__sr">Reviewing your draft…</span>}
      </div>
      {loading && (
        <div className="essay-review__skeleton" aria-hidden="true">
          <span className="essay-angles__bar essay-angles__bar--title" />
          <span className="essay-angles__bar essay-angles__bar--short" />
          {[0, 1, 2].map((i) => <span key={i} className="essay-review__skeleton-card essay-angles__bar" />)}
        </div>
      )}
      {error && <p className="essay-angles__notice" role="status">{error}</p>}
      {r && !loading && (
        <div className="essay-review__result">
          {changed && <p className="essay-review__changed" role="status">Your draft changed since this review.</p>}
          <p className="essay-review__summary">{r.summary}</p>
          <div className="essay-review__fit">
            <span className={`essay-review__chip is-${r.promptFit.rating}`}>{FIT_LABELS[r.promptFit.rating] ?? "Prompt fit"}</span>
            <span className="essay-review__fit-note">{r.promptFit.note}</span>
          </div>
          {r.strengths.length > 0 && (
            <>
              <h4 className="essay-review__heading">What works</h4>
              <ul className="essay-review__list">{r.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
            </>
          )}
          {r.comments.length > 0 && (
            <>
              <h4 className="essay-review__heading">Comments</h4>
              <ul className="essay-review__comments">
                {r.comments.map((c) => (
                  <li key={c.id} className="essay-review__comment">
                    <div className="essay-review__eyebrow">
                      <span>Paragraph {c.paragraph + 1}</span>
                      <span aria-hidden="true">·</span>
                      <span>{COMMENT_KIND_LABELS[c.kind] ?? c.kind}</span>
                    </div>
                    <blockquote className="essay-review__quote">{c.quote}</blockquote>
                    <p className="essay-review__text">{c.comment}</p>
                    {c.question && <p className="essay-review__question">{c.question}</p>}
                    <button type="button" className="essay-review__find" onClick={() => find(c.id, c.paragraph, c.quote)}>Find in draft</button>
                    {notFound === c.id && <small className="essay-review__notfound" role="status">Couldn't find that passage. It may have been edited.</small>}
                  </li>
                ))}
              </ul>
            </>
          )}
          {r.unusedMaterial.length > 0 && (
            <>
              <h4 className="essay-review__heading">Material you haven't used</h4>
              <ul className="essay-review__material">
                {r.unusedMaterial.map((m) => (
                  <li key={`${m.kind}-${m.label}`}>
                    <SourceChips sources={[{ kind: m.kind, label: m.label }]} />
                    <span className="essay-review__why">{m.why}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {documentsSummary(r.documents) && <p className="essay-angles__docs-note essay-angles__docs-summary">{documentsSummary(r.documents)}</p>}
        </div>
      )}
    </section>
  );
}
