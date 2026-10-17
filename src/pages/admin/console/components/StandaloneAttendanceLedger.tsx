import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Table,
} from "antd";
import {
  useGetStandaloneAttendanceQuery,
  useGetStandaloneAttendanceHistoryQuery,
  useRecordStandaloneAttendanceMutation,
  type AttendanceInput,
  type AttendanceRow,
} from "src/app/services/sessions";
import LessonRecordModal, {
  type LessonRecordInput,
} from "src/pages/mentor/console/components/LessonRecordModal";

export default function StandaloneAttendanceLedger() {
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useGetStandaloneAttendanceQuery();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<AttendanceRow | null>(null);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const history = useGetStandaloneAttendanceHistoryQuery(historyId ?? "", {
    skip: !historyId,
  });
  const [record, { isLoading: saving }] =
    useRecordStandaloneAttendanceMutation();
  const rows = data.filter((row) => {
    const match = `${row.mentorName} ${row.studentName}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return (
      match &&
      (filter === "all" ||
        (filter === "unmarked"
          ? !row.attendanceRecord &&
            !row.cancelled &&
            new Date(row.dateTime).getTime() <= Date.now()
          : row.attendanceRecord?.outcome === filter))
    );
  });
  const value = useMemo(
    () =>
      selected?.attendanceRecord
        ? {
            ...selected.attendanceRecord,
            attendance:
              selected.attendanceRecord.attendance === "late"
                ? ("late" as const)
                : ("present" as const),
            actualDurationMinutes:
              selected.attendanceRecord.actualDurationMinutes ?? undefined,
          }
        : null,
    [selected],
  );
  const save = async (input: LessonRecordInput) => {
    if (!selected) return;
    await record({
      id: selected.id,
      ...input,
      outcome: input.outcome as AttendanceInput["outcome"],
    }).unwrap();
  };
  return (
    <Card title="Standalone 1:1 attendance" style={{ marginBottom: 24 }}>
      <p>
        Attendance for booked 1:1 sessions across Academic and all other
        departments. Unmarked sessions have no confirmed attendance.
      </p>
      {isError && (
        <Alert
          type="error"
          message="Could not load attendance"
          action={<Button onClick={() => void refetch()}>Retry</Button>}
        />
      )}
      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Student or mentor"
          aria-label="Search 1:1 attendance"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          value={filter}
          onChange={setFilter}
          style={{ minWidth: 180 }}
          aria-label="Filter 1:1 attendance"
          options={[
            { value: "all", label: "All sessions" },
            { value: "unmarked", label: "Awaiting attendance" },
            { value: "held", label: "Held" },
            { value: "student_no_show", label: "Student no-show" },
            { value: "mentor_no_show", label: "Mentor no-show" },
          ]}
        />
      </Space>
      <Table<AttendanceRow>
        rowKey="id"
        dataSource={rows}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 900 }}
        columns={[
          {
            title: "Date",
            dataIndex: "dateTime",
            render: (date: string) => new Date(date).toLocaleString(),
          },
          { title: "Student", dataIndex: "studentName" },
          { title: "Mentor", dataIndex: "mentorName" },
          {
            title: "Outcome",
            render: (_, row) =>
              row.cancelled
                ? "Cancelled"
                : (row.attendanceRecord?.outcome.replaceAll("_", " ") ??
                  "Not recorded"),
          },
          {
            title: "Attendance",
            render: (_, row) =>
              row.attendanceRecord?.attendance ?? "Not recorded",
          },
          {
            title: "Minutes",
            render: (_, row) =>
              row.attendanceRecord?.actualDurationMinutes ?? "—",
          },
          {
            title: "Actions",
            render: (_, row) => (
              <Space>
                <Button
                  size="small"
                  disabled={
                    row.cancelled ||
                    new Date(row.dateTime).getTime() > Date.now()
                  }
                  onClick={() => setSelected(row)}
                >
                  {row.attendanceRecord
                    ? "Correct record"
                    : "Record attendance"}
                </Button>
                {row.attendanceRecord && (
                  <Button size="small" onClick={() => setHistoryId(row.id)}>
                    History
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
      />
      <LessonRecordModal
        open={!!selected}
        title="Record standalone 1:1 attendance"
        value={value}
        plannedMinutes={selected?.type === "individual30m" ? 30 : 60}
        correction={!!selected?.attendanceRecord}
        saving={saving}
        onSave={save}
        onClose={() => setSelected(null)}
      />
      <Modal
        open={!!historyId}
        title="Attendance history"
        footer={null}
        onCancel={() => setHistoryId(null)}
      >
        {history.isError ? (
          <Alert
            type="error"
            message="Could not load history"
            action={
              <Button onClick={() => void history.refetch()}>Retry</Button>
            }
          />
        ) : (
          <Table
            loading={history.isFetching}
            rowKey={(_, index) => String(index)}
            dataSource={history.currentData ?? []}
            pagination={false}
            columns={[
              {
                title: "Recorded at",
                render: (_, entry) =>
                  new Date(entry.after.recordedAt).toLocaleString(),
              },
              {
                title: "Outcome",
                render: (_, entry) =>
                  `${entry.before?.outcome.replaceAll("_", " ") ?? "Unmarked"} → ${entry.after.outcome.replaceAll("_", " ")}`,
              },
              {
                title: "Attendance / minutes",
                render: (_, entry) =>
                  `${entry.after.attendance} / ${entry.after.actualDurationMinutes ?? "—"}`,
              },
              { title: "Reason", dataIndex: "reason" },
            ]}
          />
        )}
      </Modal>
    </Card>
  );
}
