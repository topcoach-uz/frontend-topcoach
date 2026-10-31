import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  message,
} from "antd";
import {
  requirementRows,
  setRequirementCount,
  toggleRequirement,
  type Requirements,
} from "./requirementChecklistModel";

export default function ApplicationRequirements({
  requirements = {},
  updatedAt,
  onSave,
}: {
  requirements?: Requirements;
  updatedAt?: string;
  onSave?: (
    requirements: Requirements,
    expectedUpdatedAt?: string,
  ) => Promise<unknown>;
}) {
  const [draft, setDraft] = useState<Requirements | null>(null);
  useEffect(() => {
    if (!onSave) setDraft(null);
  }, [onSave]);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("other");
  const rows = requirementRows(requirements);
  const draftRows = requirementRows(draft || {});
  const add = () => {
    if (!title.trim() || !draft || (draft.custom?.items?.length || 0) >= 100)
      return;
    setDraft({
      ...draft,
      custom: {
        ...draft.custom,
        items: [
          ...(draft.custom?.items || []),
          {
            id: `custom-${crypto.randomUUID()}`,
            title: title.trim(),
            completed: false,
            type: kind,
          },
        ],
      },
    });
    setTitle("");
  };
  return (
    <section aria-label="Application requirements checklist">
      <Space wrap style={{ marginBottom: 12 }}>
        <strong>
          {rows.filter((r) => r.completed).length} of {rows.length} requirements
          complete
        </strong>
        {onSave && (
          <Button
            onClick={() => {
              setDraft(structuredClone(requirements));
              setDraftUpdatedAt(updatedAt);
              setTitle("");
            }}
          >
            Edit checklist
          </Button>
        )}
      </Space>
      {!rows.length && <p>No requirements added yet.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {rows.map((row) => (
          <li key={`${row.section}-${row.id}`} style={{ padding: "4px 0" }}>
            <span aria-label={row.completed ? "Complete" : "Incomplete"}>
              {row.completed ? "✓" : "○"}
            </span>{" "}
            {row.title}
          </li>
        ))}
      </ul>
      <Modal
        title="Edit application requirements"
        open={draft !== null}
        onCancel={() => !saving && setDraft(null)}
        destroyOnClose
        okText="Save checklist"
        okButtonProps={{
          disabled:
            !!title.trim() ||
            !!draft?.custom?.items?.some((item: any) => !item.title.trim()),
        }}
        confirmLoading={saving}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        maskClosable={!saving}
        onOk={async () => {
          if (!draft || !onSave) return;
          setSaving(true);
          try {
            await onSave(draft, draftUpdatedAt);
            setDraft(null);
            message.success("Requirements checklist saved.");
          } catch (error: any) {
            message.error(
              error?.data?.message ||
                "Could not save checklist. Your changes are still here.",
            );
          } finally {
            setSaving(false);
          }
        }}
      >
        {draft && (
          <Space direction="vertical" style={{ width: "100%" }} size="middle">
            <Button
              disabled={saving}
              onClick={() => {
                setDraft(structuredClone(requirements));
                setDraftUpdatedAt(updatedAt);
                setTitle("");
              }}
            >
              Reload saved checklist
            </Button>
            <Alert
              type="info"
              message="Track the university’s requirements here. Completing a checkbox records your progress; it does not submit a file or request a review."
            />
            <Space wrap>
              {[
                ["essays", "Essays"],
                ["recommendations", "Recommendations"],
                ["supplements", "Supplements"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}{" "}
                  <InputNumber
                    aria-label={`${label} required`}
                    min={0}
                    max={50}
                    precision={0}
                    disabled={saving}
                    value={draft[key]?.required || 0}
                    onChange={(n) =>
                      setDraft(setRequirementCount(draft, key, Number(n) || 0))
                    }
                  />
                </label>
              ))}
            </Space>
            <Space wrap>
              {[
                ["transcripts", "Transcript"],
                ["interviews", "Interview"],
              ].map(([key, label]) => (
                <Checkbox
                  key={key}
                  disabled={saving}
                  checked={
                    !!draft[key] &&
                    (key !== "interviews" || draft.interviews.required)
                  }
                  onChange={(event) => {
                    const next = { ...draft };
                    if (event.target.checked)
                      next[key] =
                        key === "transcripts"
                          ? { status: "pending", verified: false }
                          : { required: true };
                    else delete next[key];
                    setDraft(next);
                  }}
                >
                  Require {label.toLowerCase()}
                </Checkbox>
              ))}
            </Space>
            {draftRows.map((row) => (
              <Space
                key={`${row.section}-${row.id}`}
                style={{ display: "flex" }}
              >
                <Checkbox
                  disabled={saving}
                  aria-label={row.section === "custom" ? row.title : undefined}
                  checked={row.completed}
                  onChange={(event) =>
                    setDraft(
                      toggleRequirement(draft, row, event.target.checked),
                    )
                  }
                >
                  {row.section !== "custom" && row.title}
                </Checkbox>
                {row.section === "custom" && (
                  <>
                    <Input
                      aria-label="Requirement title"
                      maxLength={255}
                      disabled={saving}
                      value={row.title}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          custom: {
                            ...draft.custom,
                            items: draft.custom.items.map((item: any) =>
                              item.id === row.id
                                ? { ...item, title: event.target.value }
                                : item,
                            ),
                          },
                        })
                      }
                    />
                    <Button
                      disabled={saving}
                      aria-label={`Remove ${row.title}`}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          custom: {
                            ...draft.custom,
                            items: draft.custom.items.filter(
                              (item: any) => item.id !== row.id,
                            ),
                          },
                        })
                      }
                    >
                      Remove
                    </Button>
                  </>
                )}
              </Space>
            ))}
            <Space wrap>
              <Select
                aria-label="Requirement type"
                value={kind}
                disabled={saving}
                onChange={setKind}
                options={[
                  "other",
                  "essay",
                  "recommendation",
                  "transcript",
                  "test_score",
                  "interview",
                  "portfolio",
                  "financial_aid",
                ].map((value) => ({
                  value,
                  label: value.replaceAll("_", " "),
                }))}
              />
              <Input
                aria-label="New requirement"
                placeholder="e.g. IELTS score report"
                maxLength={255}
                disabled={saving}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onPressEnter={add}
              />
              <Button
                disabled={
                  saving ||
                  !title.trim() ||
                  (draft.custom?.items?.length || 0) >= 100
                }
                onClick={add}
              >
                Add requirement
              </Button>
            </Space>
            {!!title.trim() && (
              <span>Add this requirement before saving the checklist.</span>
            )}
          </Space>
        )}
      </Modal>
    </section>
  );
}
