import { useRef, useState } from "react";
import { Select } from "antd";
import type { BaseSelectRef } from "rc-select";
import { ArrowUpRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ClampedText } from "./ClampedText";
import { finderCopy, type DegreeOption, type StudyPreview } from "./universityDegreeOptions";

function isDegreeOption(value: unknown): value is DegreeOption {
  return typeof value === "object" && value !== null && "value" in value && "label" in value && "group" in value;
}

const GROUPS: DegreeOption["group"][] = ["Degrees", "Study areas"];

export function UniversityDegreeFinder({ options, loading = false, getPreview }: { options: DegreeOption[]; loading?: boolean; getPreview?: (option: DegreeOption) => StudyPreview }) {
  const navigate = useNavigate();
  const selectRef = useRef<BaseSelectRef>(null);
  const [open, setOpen] = useState(false);
  const dropdownOpen = useRef(false);
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<DegreeOption | null>(null);
  const groups = GROUPS.map((label) => ({
    label,
    options: options.filter((option) => option.group === label).map((option) => ({ ...option, key: option.value })),
  })).filter((group) => group.options.length);
  if (!groups.length && !loading) return null;
  const copy = loading ? { label: "Find a degree or study area", placeholder: "Search degrees and study areas…" } : finderCopy(options);
  const preview = picked && getPreview ? getPreview(picked) : null;

  const close = () => { setPicked(null); setSearch(""); selectRef.current?.focus(); };
  const choose = (_: string, option: unknown) => {
    if (!isDegreeOption(option)) return;
    const next = option;
    if (!getPreview) { if (next.to) navigate(next.to); else if (next.href) window.open(next.href, "_blank", "noopener,noreferrer"); return; }
    setPicked(next);
    setSearch("");
    dropdownOpen.current = false;
    setOpen(false);
  };

  return <div className="applicant-university-detail__finder" onKeyDownCapture={(event) => { if (event.key === "Escape" && picked && !dropdownOpen.current) { event.stopPropagation(); close(); } }}>
    <label className="applicant-university-detail__finder-label" htmlFor="university-degree-search">{copy.label}</label>
    <Select
      ref={selectRef}
      id="university-degree-search"
      className="applicant-university-detail__finder-select"
      showSearch
      disabled={loading}
      loading={loading}
      popupClassName="applicant-university-detail__finder-popup"
      allowClear
      value={picked?.value}
      placeholder={copy.placeholder}
      options={groups}
      optionFilterProp="label"
      filterOption={(input, option) => String(isDegreeOption(option) ? option.label : "").toLocaleLowerCase().includes(input.trim().toLocaleLowerCase())}
      notFoundContent="No matching study area"
      onSelect={choose}
      onClear={() => setPicked(null)}
      open={open}
      searchValue={search}
      onSearch={setSearch}
      onDropdownVisibleChange={(next) => { dropdownOpen.current = next; setOpen(next); if (!next) setSearch(""); }}
      optionRender={(option) => {
        const data: unknown = option.data;
        if (!isDegreeOption(data)) return null;
        return <span className="applicant-university-detail__finder-option"><span>{data.label}</span>{data.hint && <small>{data.hint}</small>}</span>;
      }}
    />
    {preview && <div className="applicant-university-detail__preview" key={picked?.value} role="region" aria-label={`${preview.title} preview`}>
      <div className="applicant-university-detail__preview-head">
        <h3>{preview.title}</h3>
        <button type="button" className="applicant-university-detail__icon-btn" aria-label="Close preview" onClick={close}><X size={18} aria-hidden="true" /></button>
      </div>
      {preview.pending ? <p className="applicant-university-detail__preview-empty">We haven't checked the course content for this study area yet. The full page has the entry requirements, scores, costs and how to apply.</p> : <dl className="applicant-university-detail__preview-body">
        {preview.curriculum && <div><dt>Curriculum</dt><dd><ClampedText text={preview.curriculum} lines={3} /></dd></div>}
        {preview.entry && <div><dt>Entry requirements</dt><dd><ClampedText text={preview.entry} lines={3} /></dd></div>}
      </dl>}
      <div className="applicant-university-detail__preview-actions">
        {preview.to && <button type="button" className="applicant-university-detail__save" onClick={() => navigate(preview.to!)}>Open full page</button>}
        {preview.url && <a href={preview.url} target="_blank" rel="noopener noreferrer">Official programme page <ArrowUpRight size={16} aria-hidden="true" /></a>}
      </div>
    </div>}
  </div>;
}
