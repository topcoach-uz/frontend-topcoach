import type { ReactNode } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

export function SaveToListButton({ saved, disabled, onAdd, onOpen }: { saved: boolean; disabled?: boolean; onAdd: () => void; onOpen: () => void }) {
  return <button type="button" className={`applicant-university-detail__save${saved ? " applicant-university-detail__save--saved" : ""}`} disabled={disabled} onClick={saved ? onOpen : onAdd}>
    {saved ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
    {saved ? "Saved to College List" : "Save to College List"}
  </button>;
}

/** Hero card shared by the university and degree pages: logo tile, title, muted meta line, action on the right. */
export function DetailHero({ mark, title, titleText, meta, subtitle, overview, action, notice }: {
  mark: ReactNode; title: ReactNode; titleText?: string; meta?: ReactNode; subtitle?: ReactNode; overview?: ReactNode; action: ReactNode; notice?: ReactNode;
}) {
  return <section className="applicant-university-detail__hero">
    <div className="applicant-university-detail__hero-top">
      <div className="applicant-university-detail__identity">
        {mark}
        <div>
          <h1 title={titleText}>{title}</h1>
          {subtitle && <p className="applicant-university-detail__subtitle">{subtitle}</p>}
          {meta && <p className="applicant-university-detail__meta">{meta}</p>}
        </div>
      </div>
      {action}
    </div>
    {overview && <p className="applicant-university-detail__overview">{overview}</p>}
    {notice}
  </section>;
}
