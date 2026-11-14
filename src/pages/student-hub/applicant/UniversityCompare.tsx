import { useId, useState } from "react";
import { Select } from "antd";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useGetUniversityDetailQuery } from "src/app/services/universities";
import { getTranslation } from "src/lib/i18n/translationUtils";
import { buildComparableFacts, buildKeyFactRows, qsRankOf, type ComparableFacts } from "./universityKeyFactsModel";
import { verifiedUniversityFinance, type VerifiedUniversityFinance } from "./verifiedUniversityFinance";

export interface CollegeListEntry { universityId: string; universityName: string }

const ROWS: { key: keyof ComparableFacts; label: string }[] = [
  { key: "acceptance", label: "Acceptance rate" },
  { key: "tuition", label: "Tuition" },
  { key: "applicationFee", label: "Application fee" },
  { key: "aid", label: "Financial aid" },
  { key: "qs", label: "QS ranking" },
];

export function UniversityCompare({ currentName, currentFacts, list, onClose }: { currentName: string; currentFacts: ComparableFacts; list: CollegeListEntry[]; onClose: () => void }) {
  const selectId = useId();
  const [otherId, setOtherId] = useState<string>();
  const query = useGetUniversityDetailQuery(otherId ?? "", { skip: !otherId });
  const other = query.data;
  const otherFacts = other ? (() => {
    const finance = verifiedUniversityFinance(other.id, (other as { undergraduateFinanceContent?: VerifiedUniversityFinance | null }).undergraduateFinanceContent);
    return buildComparableFacts(buildKeyFactRows(other, (v) => getTranslation(v as never)), finance?.content, qsRankOf(other));
  })() : undefined;
  const otherName = other ? getTranslation(other.name) : list.find((item) => item.universityId === otherId)?.universityName ?? "";

  return <div className="applicant-university-detail__compare" role="region" aria-label="Compare with your College List">
    <div className="applicant-university-detail__preview-head">
      <h3>Compare with your College List</h3>
      <button type="button" className="applicant-university-detail__icon-btn" aria-label="Close comparison" onClick={onClose}><X size={18} aria-hidden="true" /></button>
    </div>
    {list.length === 0 ? <p>Add universities to your College List to compare. <Link to="/student-hub/universities">Find universities</Link></p> : <>
      <label className="applicant-university-detail__compare-label" htmlFor={selectId}>Choose a university</label>
      <Select id={selectId} className="applicant-university-detail__finder-select" popupClassName="applicant-university-detail__finder-popup" showSearch optionFilterProp="label"
        placeholder="Choose a university from your list…" value={otherId} onChange={setOtherId}
        options={list.map((item) => ({ value: item.universityId, label: item.universityName }))} />
      {otherId && (query.isLoading ? <p aria-busy="true">Loading…</p> : query.isError || !otherFacts ? <p role="alert">Could not load that university.</p> :
        <table className="applicant-university-detail__compare-table">
          <caption className="applicant-sr-only">Comparison of {currentName} and {otherName}</caption>
          <thead><tr><th scope="col"><span className="applicant-sr-only">Fact</span></th><th scope="col">{currentName}</th><th scope="col">{otherName}</th></tr></thead>
          <tbody>{ROWS.map((row) => <tr key={row.key}><th scope="row">{row.label}</th><td>{currentFacts[row.key] ?? "—"}</td><td>{otherFacts[row.key] ?? "—"}</td></tr>)}</tbody>
        </table>)}
    </>}
  </div>;
}
