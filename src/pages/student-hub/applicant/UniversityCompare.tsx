import { useEffect, useId, useMemo, useState } from "react";
import { Select } from "antd";
import { X } from "lucide-react";
import { useGetReviewedUniversitiesQuery, useGetUniversityDetailQuery } from "src/app/services/universities";
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

/** Value for a compare cell; tuition keeps its billing period and is never converted. */
const cell = (facts: ComparableFacts, key: keyof ComparableFacts) => {
  const value = facts[key];
  if (!value) return "—";
  return key === "tuition" && facts.tuitionPeriod ? `${value} / ${facts.tuitionPeriod}` : value;
};

export function UniversityCompare({ currentId, currentName, currentFacts, list, onClose }: { currentId: string; currentName: string; currentFacts: ComparableFacts; list: CollegeListEntry[]; onClose: () => void }) {
  const selectId = useId();
  const [otherId, setOtherId] = useState<string>();
  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => { const timer = window.setTimeout(() => setSearch(typed.trim()), 250); return () => window.clearTimeout(timer); }, [typed]);

  // Same catalogue search as the Find universities page; skipped until something is typed to keep it light.
  const results = useGetReviewedUniversitiesQuery({ search }, { skip: !search });
  const query = useGetUniversityDetailQuery(otherId ?? "", { skip: !otherId });
  const other = query.data;

  const options = useMemo(() => {
    const listed = list.filter((item) => item.universityId !== currentId);
    const listedIds = new Set(listed.map((item) => item.universityId));
    const needle = typed.trim().toLocaleLowerCase();
    const groups: { label: string; options: { value: string; label: string }[] }[] = [];
    const mine = listed.filter((item) => !needle || item.universityName.toLocaleLowerCase().includes(needle)).map((item) => ({ value: item.universityId, label: item.universityName }));
    if (mine.length) groups.push({ label: "Your College List", options: mine });
    const found = (search ? results.data?.data ?? [] : []).filter((u) => u.id !== currentId && !listedIds.has(u.id)).slice(0, 20).map((u) => ({ value: u.id, label: getTranslation(u.name) }));
    if (found.length) groups.push({ label: "All universities", options: found });
    return groups;
  }, [list, currentId, typed, search, results.data]);

  const otherFacts = other ? (() => {
    const finance = verifiedUniversityFinance(other.id, (other as { undergraduateFinanceContent?: VerifiedUniversityFinance | null }).undergraduateFinanceContent);
    return buildComparableFacts(buildKeyFactRows(other, (v) => getTranslation(v as never)), finance?.content, qsRankOf(other));
  })() : undefined;
  const otherName = other ? getTranslation(other.name) : "";

  return <div className="applicant-university-detail__compare" role="region" aria-label="Compare universities">
    <div className="applicant-university-detail__preview-head">
      <h3>Compare universities</h3>
      <button type="button" className="applicant-university-detail__icon-btn" aria-label="Close comparison" onClick={onClose}><X size={18} aria-hidden="true" /></button>
    </div>
    <label className="applicant-university-detail__compare-label" htmlFor={selectId}>Choose a university</label>
    <Select id={selectId} className="applicant-university-detail__finder-select" popupClassName="applicant-university-detail__finder-popup"
      showSearch allowClear filterOption={false} placeholder="Search a university to compare…" value={otherId}
      searchValue={typed} onSearch={setTyped} onChange={(value) => { setOtherId(value); setTyped(""); }} onClear={() => setOtherId(undefined)}
      loading={!!search && results.isFetching} options={options} notFoundContent={search && results.isFetching ? "Searching…" : "No universities found"} />
    {otherId && (query.isLoading || query.isFetching && !other ? <div className="applicant-university-detail__compare-skeleton" aria-busy="true">{[0, 1, 2, 3, 4].map((i) => <span key={i} className="applicant-university-detail__skel-bar" />)}</div>
      : query.isError || !otherFacts ? <p role="alert">Couldn’t load this university.</p> :
        <table className="applicant-university-detail__compare-table">
          <caption className="applicant-sr-only">Comparison of {currentName} and {otherName}</caption>
          <thead><tr><th scope="col"><span className="applicant-sr-only">Fact</span></th><th scope="col">{currentName}</th><th scope="col">{otherName}</th></tr></thead>
          <tbody>{ROWS.map((row) => <tr key={row.key}><th scope="row">{row.label}</th><td>{cell(currentFacts, row.key)}</td><td>{cell(otherFacts, row.key)}</td></tr>)}</tbody>
        </table>)}
  </div>;
}
