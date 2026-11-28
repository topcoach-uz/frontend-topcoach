import { useState } from "react";
import { Button, Dropdown, Input, Modal, Select, Tag, message } from "antd";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import {
  useDeleteScholarshipApplicationMutation,
  useGetScholarshipApplicationsQuery,
  useUpdateScholarshipApplicationMutation,
} from "src/app/services/student-hub/applicationTrackingApi";
import type { ScholarshipApplication } from "src/app/services/student-hub/types";
import {
  ApplicantPage,
  Breadcrumb,
  QueryState,
  displayDate,
} from "./ApplicantPage";
import ScholarshipForm, {
  scholarshipLabel,
  scholarshipStatuses,
  scholarshipTypes,
} from "./ScholarshipForm";
import { parseApplicantDate } from "./applicantDate";

export default function ScholarshipManagement() {
  const navigate = useNavigate();
  const query = useGetScholarshipApplicationsQuery(
    { page: 1, limit: 100 },
    { pollingInterval: 10000 },
  );
  const [editing, setEditing] = useState<ScholarshipApplication>();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("deadline");
  const [update, updateState] = useUpdateScholarshipApplicationMutation();
  const [remove] = useDeleteScholarshipApplicationMutation();
  const entries = (query.data?.data ?? [])
    .filter(
      (item) =>
        (status === "all" || item.status === status) &&
        [item.scholarshipName, item.organization].some((value) =>
          value?.toLowerCase().includes(search.trim().toLowerCase()),
        ),
    )
    .sort((a, b) =>
      sort === "name"
        ? (a.scholarshipName ?? "").localeCompare(b.scholarshipName ?? "")
        : (a.applicationDeadline
            ? parseApplicantDate(a.applicationDeadline).getTime()
            : Infinity) -
          (b.applicationDeadline
            ? parseApplicantDate(b.applicationDeadline).getTime()
            : Infinity),
    );
  return (
    <ApplicantPage
      title="Your scholarships"
      subtitle="Manage funding applications, decisions and deadlines."
      actions={
        <Button
          type="primary"
          onClick={() => navigate("/student-hub/applications/scholarships/new")}
        >
          Add scholarship
        </Button>
      }
    >
      <Breadcrumb>
        <Link to="/student-hub/applications">Applications</Link>
        <span>/</span>Scholarships
      </Breadcrumb>
      <div
        className="application-toolbar"
        role="search"
        aria-label="Filter scholarships"
      >
        <Input.Search
          aria-label="Search scholarships"
          placeholder="Search scholarships or organizations"
          allowClear
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          aria-label="Scholarship status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All statuses" },
            ...scholarshipStatuses.map((value) => ({
              value,
              label: scholarshipLabel(value),
            })),
          ]}
        />
        <Select
          aria-label="Sort scholarships"
          value={sort}
          onChange={setSort}
          options={[
            { value: "deadline", label: "Nearest deadline" },
            { value: "name", label: "Scholarship name" },
          ]}
        />
      </div>
      <QueryState
        hasData={query.data !== undefined}
        loading={query.isLoading}
        error={query.isError}
        retry={query.refetch}
      >
        {!query.data?.data.length ? (
          <div className="applicant-panel applicant-empty">
            <h2>Find funding for your next step</h2>
            <p>
              Save a scholarship now, then add its amount, requirements and
              deadline as you research.
            </p>
            <Button
              type="primary"
              onClick={() =>
                navigate("/student-hub/applications/scholarships/new")
              }
            >
              Add your first scholarship
            </Button>
          </div>
        ) : !entries.length ? (
          <div className="applicant-panel applicant-empty">
            <h2>No matching scholarships</h2>
            <Button
              onClick={() => {
                setSearch("");
                setStatus("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          entries.map((scholarship) => (
            <section
              key={scholarship.id}
              className="applicant-panel"
              aria-label={scholarship.scholarshipName}
            >
              <div className="applicant-page__heading">
                <div>
                  <h2>{scholarship.scholarshipName || "Scholarship"}</h2>
                  <p>{scholarship.organization}</p>
                </div>
                <Tag>{scholarshipLabel(scholarship.status)}</Tag>
              </div>
              <div className="applicant-actions">
                <span>
                  Deadline: {displayDate(scholarship.applicationDeadline)}
                </span>
                <span>
                  {scholarship.amount != null
                    ? `${new Intl.NumberFormat().format(Number(scholarship.amount))} ${scholarship.currency ?? "USD"}`
                    : "Amount not confirmed"}
                </span>
                {scholarship.scholarshipType && (
                  <Tag>
                    {scholarshipTypes.find(
                      (type) => type.value === scholarship.scholarshipType,
                    )?.label ?? scholarship.scholarshipType}
                  </Tag>
                )}
              </div>
              {(scholarship.notes ||
                scholarship.eligibility ||
                scholarship.essayPrompt) && (
                <details className="application-details">
                  <summary>Requirements & notes</summary>
                  {scholarship.eligibility && (
                    <p>
                      <strong>Eligibility:</strong> {scholarship.eligibility}
                    </p>
                  )}
                  {scholarship.essayPrompt && (
                    <p>
                      <strong>Application requirements:</strong>{" "}
                      {scholarship.essayPrompt}
                    </p>
                  )}
                  {scholarship.notes && <p>{scholarship.notes}</p>}
                </details>
              )}
              <div className="applicant-actions">
                <Button onClick={() => setEditing(scholarship)}>
                  Edit scholarship
                </Button>
                <Dropdown
                  trigger={["click"]}
                  menu={{
                    items: [
                      {
                        key: "delete",
                        label: "Delete scholarship",
                        danger: true,
                      },
                    ],
                    onClick: () =>
                      Modal.confirm({
                        title: "Delete this scholarship?",
                        content: `Remove ${scholarship.scholarshipName || "this scholarship"} and its deadline from your tracker?`,
                        okText: "Delete scholarship",
                        okButtonProps: { danger: true },
                        onOk: async () => {
                          try {
                            await remove(scholarship.id).unwrap();
                            message.success("Scholarship deleted.");
                          } catch {
                            message.error("Could not delete this scholarship.");
                            throw new Error("Delete failed");
                          }
                        },
                      }),
                  }}
                >
                  <Button
                    aria-label={`More actions for ${scholarship.scholarshipName || "scholarship"}`}
                  >
                    More
                  </Button>
                </Dropdown>
              </div>
            </section>
          ))
        )}
      </QueryState>
      <Modal
        title="Edit scholarship"
        open={!!editing}
        footer={null}
        closable={false}
        maskClosable={false}
        keyboard={false}
        destroyOnClose
        width={680}
        rootClassName="applicant-modal"
      >
        {editing && (
          <div className="applicant-page">
            <ScholarshipForm
              key={editing.id}
              editing
              saving={updateState.isLoading}
              onSaved={() => setEditing(undefined)}
              initialValues={{
                ...editing,
                amount:
                  editing.amount == null ? undefined : Number(editing.amount),
                applicationDeadline: editing.applicationDeadline
                  ? dayjs(editing.applicationDeadline)
                  : null,
              }}
              onCancel={() => setEditing(undefined)}
              onSave={async (data) => {
                try {
                  await update({ id: editing.id, data }).unwrap();
                  message.success("Scholarship updated.");
                } catch (error) {
                  message.error(
                    "Could not save this scholarship. Your changes remain here.",
                  );
                  throw error;
                }
              }}
            />
          </div>
        )}
      </Modal>
    </ApplicantPage>
  );
}
