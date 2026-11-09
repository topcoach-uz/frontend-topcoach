import { useEffect, useRef, useState } from "react";
import { baseUrl } from 'src/app/services/api/const';
import { ACCESS_TOKEN } from 'src/constants/storage';
import "./StructuredSessionReports.css";
type Row = {
  source: string;
  sessionId: string;
  studentUserId: string;
  studentName: string;
  mentorName: string;
  date: string;
  topic: string;
  program: string;
  status: string;
  attendance: string;
  revision: number;
  report: any;
};
const labels: Record<string, string> = {
  en: "English",
  uz: "O‘zbek",
  ru: "Русский",
  submitted: "Submitted",
  submitted_late: "Submitted late",
  incomplete: "Incomplete",
  not_submitted: "Not submitted",
  none: "No homework set",
  not_understood: "Did not understand the task",
  no_time: "Not enough time",
  forgot: "Forgot",
  technical: "Technical problems",
  not_specified: "Not specified",
  illness: "Illness",
  family: "Family circumstances",
  school: "School exam or event",
  lateness: "Lateness",
  focus: "Low focus",
  behaviour: "Behaviour",
  materials: "Without materials",
};
const day = (d: Date) =>
  new Date(d.getTime() + 5 * 3600000).toISOString().slice(0, 10);
async function request(path: string, body?: any) {
  const response = await fetch(baseUrl + "/lesson-reports" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + localStorage.getItem(ACCESS_TOKEN),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await response.json();
  if (!response.ok)
    throw Error(
      Array.isArray(json.message)
        ? json.message.join(", ")
        : json.message || "Could not load reports",
    );
  return json.data;
}
export default function StructuredSessionReports() {
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false),
    [rows, setRows] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState<Row | null>(null),
    [form, setForm] = useState<any>({}),
    [onlyDue, setOnlyDue] = useState(false);
  const [from, setFrom] = useState(() =>
      day(new Date(Date.now() - 30 * 86400000)),
    ),
    [to, setTo] = useState(() => day(new Date()));
  async function load() {
    setBusy(true);
    setError("");
    try {
      const result = await request(
        "/sessions?" + new URLSearchParams({ from, to }),
      );
      if (result.length > 1000)
        throw Error("Choose a shorter period (maximum 1,000 records).");
      setRows(result);
    } catch (e: any) {
      setError(e.message);
      setRows([]);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (open) void load();
  }, [open]);
  function edit(row: Row) {
    setEditing(row);
    setError("");
    setForm(
      row.report ?? {
        topic: row.topic || "",
        attendance: ["present", "late", "absent"].includes(row.attendance)
          ? row.attendance
          : "present",
        lateMinutes: "",
        absenceReason: "not_specified",
        absenceDetail: "",
        participation: "moderate",
        homework: "none",
        grade: "",
        homeworkReason: "not_specified",
        homeworkFeedback: "",
        issues: [],
        parentComment: "",
        internalNote: "",
        language: "en",
      },
    );
  }
  const field = (key: string, value: any) =>
    setForm((old: any) => ({ ...old, [key]: value }));
  const options = (key: string, items: string[]) => (
    <select
      value={form[key] ?? ""}
      onChange={(e) => field(key, e.target.value)}
      required
    >
      {items.map((value) => (
        <option key={value} value={value}>
          {labels[value] || value[0].toUpperCase() + value.slice(1)}
        </option>
      ))}
    </select>
  );
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      await request("", {
        source: editing.source,
        sessionId: editing.sessionId,
        studentUserId: editing.studentUserId,
        date: day(new Date(editing.date)),
        revision: editing.revision ?? 0,
        data: {
          ...form,
          lateMinutes:
            form.lateMinutes === "" ? null : Number(form.lateMinutes),
          grade: form.grade === "" ? null : Number(form.grade),
        },
      });
      setEditing(null);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current
      ?.querySelector<HTMLElement>("button, input, select, textarea")
      ?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input,select,textarea,a[href]",
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
      const first = items[0],
        last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", keys);
    return () => {
      document.removeEventListener("keydown", keys);
      document.body.style.overflow = overflow;
      (previous ?? triggerRef.current)?.focus();
    };
  }, [open, busy]);
  const due = (r: Row) =>
    !r.report &&
    new Date(r.date) < new Date() &&
    !["cancelled", "rescheduled", "mentor_no_show"].includes(r.status);
  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="sr-launch"
        onClick={() => setOpen(true)}
      >
        Session reports
      </button>
      {open && (
        <div className="sr-backdrop" onClick={() => !busy && setOpen(false)}>
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sr-title"
            className="sr-dialog"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape" && !busy) setOpen(false);
            }}
          >
            <header>
              <div>
                <h2 id="sr-title">Session reports</h2>
                <p>Record each student’s progress after their lesson.</p>
              </div>
              <button
                aria-label="Close reports"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>
            <div className="sr-body">
              <form
                className="sr-toolbar"
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditing(null);
                  void load();
                }}
              >
                <label>
                  From
                  <input
                    type="date"
                    required
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </label>
                <label>
                  Through
                  <input
                    type="date"
                    required
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </label>
                <button disabled={busy}>Apply</button>
                <label className="sr-check">
                  <input
                    type="checkbox"
                    checked={onlyDue}
                    onChange={(e) => setOnlyDue(e.target.checked)}
                  />
                  Awaiting report ({rows.filter(due).length})
                </label>
              </form>
              {error && (
                <p role="alert" className="sr-error">
                  {error}
                </p>
              )}
              {busy && <p role="status">Loading…</p>}
              {!editing ? (
                <div className="sr-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date / program</th>
                        <th>Student / topic</th>
                        <th>Attendance</th>
                        <th>Homework</th>
                        <th>Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows
                        .filter((r) => !onlyDue || due(r))
                        .map((r) => (
                          <tr
                            className={
                              r.report &&
                              (["late", "absent"].includes(
                                r.report.attendance,
                              ) ||
                                ["not_submitted", "incomplete"].includes(
                                  r.report.homework,
                                ) ||
                                r.report.issues?.length)
                                ? "sr-flag"
                                : ""
                            }
                            key={r.source + r.sessionId + r.studentUserId}
                          >
                            <td>
                              {new Date(r.date).toLocaleString("en-GB", {
                                timeZone: "Asia/Tashkent",
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              <small>{r.program.replaceAll("_", " ")}</small>
                            </td>
                            <td>
                              {r.studentName}
                              <small>{r.report?.topic || r.topic}</small>
                            </td>
                            <td>{r.report?.attendance || r.attendance}</td>
                            <td>
                              {labels[r.report?.homework] || "—"}
                              {r.report?.grade != null
                                ? " · " + r.report.grade + "/10"
                                : ""}
                            </td>
                            <td>
                              {new Date(r.date) < new Date() &&
                              ![
                                "cancelled",
                                "rescheduled",
                                "mentor_no_show",
                              ].includes(r.status) ? (
                                <button onClick={() => edit(r)}>
                                  {r.report ? "Edit report" : "Log session"}
                                </button>
                              ) : (
                                r.status
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {!rows.length && !busy && <p>No sessions in this period.</p>}
                </div>
              ) : (
                <form className="sr-form" onSubmit={save}>
                  <h3>{editing.studentName}</h3>
                  <p>
                    {new Date(editing.date).toLocaleDateString("en-GB", {
                      timeZone: "Asia/Tashkent",
                    })}{" "}
                    · {editing.program.replaceAll("_", " ")}
                  </p>
                  <label>
                    Topic covered
                    <input
                      required
                      maxLength={2000}
                      value={form.topic}
                      onChange={(e) => field("topic", e.target.value)}
                    />
                  </label>
                  <div className="sr-fields">
                    <label>
                      Attendance
                      {options("attendance", ["present", "late", "absent"])}
                    </label>
                    {form.attendance === "late" && (
                      <label>
                        Minutes late
                        <input
                          type="number"
                          required
                          min={1}
                          max={480}
                          value={form.lateMinutes ?? ""}
                          onChange={(e) => field("lateMinutes", e.target.value)}
                        />
                      </label>
                    )}
                  </div>
                  {form.attendance === "absent" ? (
                    <>
                      <label>
                        Absence reason
                        {options("absenceReason", [
                          "illness",
                          "family",
                          "school",
                          "technical",
                          "not_specified",
                        ])}
                      </label>
                      <label>
                        Absence details
                        <input
                          maxLength={1000}
                          value={form.absenceDetail}
                          onChange={(e) =>
                            field("absenceDetail", e.target.value)
                          }
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <div className="sr-fields">
                        <label>
                          Participation
                          {options("participation", [
                            "active",
                            "moderate",
                            "passive",
                          ])}
                        </label>
                        <label>
                          Homework from last session
                          {options("homework", [
                            "submitted",
                            "submitted_late",
                            "incomplete",
                            "not_submitted",
                            "none",
                          ])}
                        </label>
                      </div>
                      {["submitted", "submitted_late", "incomplete"].includes(
                        form.homework,
                      ) && (
                        <div className="sr-fields">
                          <label>
                            Grade out of 10
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step="0.1"
                              required
                              value={form.grade ?? ""}
                              onChange={(e) => field("grade", e.target.value)}
                            />
                          </label>
                          <label>
                            Homework feedback
                            <textarea
                              required
                              maxLength={4000}
                              value={form.homeworkFeedback}
                              onChange={(e) =>
                                field("homeworkFeedback", e.target.value)
                              }
                            />
                          </label>
                        </div>
                      )}
                      {form.homework === "not_submitted" && (
                        <label>
                          Reason
                          {options("homeworkReason", [
                            "not_understood",
                            "no_time",
                            "forgot",
                            "technical",
                            "not_specified",
                          ])}
                        </label>
                      )}
                      <fieldset>
                        <legend>Issues during the session</legend>
                        <div className="sr-checks">
                          {[
                            "lateness",
                            "focus",
                            "behaviour",
                            "technical",
                            "materials",
                          ].map((k) => (
                            <label key={k} className="sr-check">
                              <input
                                type="checkbox"
                                checked={form.issues.includes(k)}
                                onChange={(e) =>
                                  field(
                                    "issues",
                                    e.target.checked
                                      ? [...form.issues, k]
                                      : form.issues.filter(
                                          (v: string) => v !== k,
                                        ),
                                  )
                                }
                              />
                              {labels[k]}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </>
                  )}
                  <label>
                    Comment language{options("language", ["en", "uz", "ru"])}
                  </label>
                  <label>
                    Comment for parents
                    <textarea
                      maxLength={4000}
                      value={form.parentComment}
                      onChange={(e) => field("parentComment", e.target.value)}
                    />
                  </label>
                  <label>
                    Internal note · never shown to parents
                    <textarea
                      maxLength={4000}
                      value={form.internalNote}
                      onChange={(e) => field("internalNote", e.target.value)}
                    />
                  </label>
                  <p>
                    Attendance is updated when you save. Record the lesson
                    outcome and actual duration through the lesson controls.
                  </p>
                  <div className="sr-toolbar">
                    <button className="sr-primary" disabled={busy}>
                      Save session report
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
