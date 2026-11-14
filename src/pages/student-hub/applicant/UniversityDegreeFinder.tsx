import { Select } from "antd";
import { useNavigate } from "react-router-dom";
import { finderCopy, type DegreeOption } from "./universityDegreeOptions";

const GROUPS: DegreeOption["group"][] = ["Degrees", "Study areas"];

export function UniversityDegreeFinder({ options, loading = false }: { options: DegreeOption[]; loading?: boolean }) {
  const navigate = useNavigate();
  const groups = GROUPS.map((label) => ({
    label,
    options: options.filter((option) => option.group === label).map((option) => ({ ...option, key: option.value })),
  })).filter((group) => group.options.length);
  if (!groups.length && !loading) return null;
  const copy = loading ? { label: "Find a degree or study area", placeholder: "Search degrees and study areas…" } : finderCopy(options);

  const open = (_: string, option: unknown) => {
    const picked = option as DegreeOption;
    if (picked.to) navigate(picked.to);
    else if (picked.href) window.open(picked.href, "_blank", "noopener,noreferrer");
  };

  return <div className="applicant-university-detail__finder">
    <label className="applicant-university-detail__finder-label" htmlFor="university-degree-search">{copy.label}</label>
    <Select
      id="university-degree-search"
      className="applicant-university-detail__finder-select"
      showSearch
      disabled={loading}
      loading={loading}
      popupClassName="applicant-university-detail__finder-popup"
      allowClear
      value={null}
      placeholder={copy.placeholder}
      options={groups}
      optionFilterProp="label"
      filterOption={(input, option) => String((option as DegreeOption | undefined)?.label ?? "").toLocaleLowerCase().includes(input.trim().toLocaleLowerCase())}
      notFoundContent="No matching study area"
      onSelect={open}
      optionRender={(option) => {
        const data = option.data as DegreeOption;
        return <span className="applicant-university-detail__finder-option"><span>{data.label}</span>{data.hint && <small>{data.hint}</small>}</span>;
      }}
    />
  </div>;
}
