import { submissionDateFields } from "./applicationPlanning";
import { applicationListReturnTo } from "./applicationNavigation";
import { useUnsavedApplicationChanges } from "./useUnsavedApplicationChanges";
import { requirementsFromDegreePlan } from "./degreePlanning";
import { buildUniversityChoices } from "./universityChoices";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, DatePicker, Form, Input, Select, message } from "antd";
import dayjs from "dayjs";
import {
  Link,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  useGetCollegeApplicationsQuery,
  useGetArchivedCollegeApplicationsQuery,
  useCreateCollegeApplicationMutation,
  useGetCollegeApplicationQuery,
  useUpdateCollegeApplicationMutation,
} from "src/app/services/student-hub/applicationTrackingApi";
import type {
  CollegeApplication,
  CreateCollegeApplicationRequest,
} from "src/app/services/student-hub/types";
import {
  useGetUniversitiesQuery,
  useGetUniversityDetailQuery,
} from "src/app/services/universities";
import { useGetGraduateProgramQuery } from "src/app/services/graduateProgramsApi";
import { useGetUndergraduateDegreesQuery } from "src/app/services/undergraduateDegreesApi";
import { getTranslation } from "src/lib/i18n/translationUtils";
import { useStudentProfile } from "src/hooks/useStudentHub";
import {
  ApplicantPage,
  Breadcrumb,
  QueryState,
  UniversityIdentity,
} from "./ApplicantPage";

type ApplicationForm = Omit<CreateCollegeApplicationRequest, "deadline"> & {
  deadline?: dayjs.Dayjs;
  submittedAt?: dayjs.Dayjs;
};

export function upcomingIntakeOptions(today = new Date()) {
  const options: { value: string; label: string }[] = [];
  let year = today.getFullYear();
  // Before September the current year's Autumn intake is still ahead.
  let season: "Spring" | "Autumn" = today.getMonth() < 8 ? "Autumn" : "Spring";
  if (season === "Spring") year += 1;
  while (options.length < 6) {
    options.push({ value: `${season} ${year}`, label: `${season} ${year}` });
    if (season === "Spring") season = "Autumn";
    else {
      season = "Spring";
      year += 1;
    }
  }
  return options;
}

export default function ApplicantApplicationFormPage() {
  const location = useLocation();
  const returnTo = applicationListReturnTo(location.state);
  const returnState = { applicationListReturnTo: returnTo };
  const { applicationId } = useParams();
  const editing = !!applicationId;
  const [editVersion, setEditVersion] = useState<string>();
  const query = useGetCollegeApplicationQuery(applicationId ?? "", {
    skip: !applicationId,
  });
  useEffect(() => {
    if (query.isLoading || (editing && !query.data?.data)) return;
    const fieldId = location.hash.slice(1);
    if (!["major", "intake", "deadline", "application-shared-notes"].includes(fieldId)) return;
    const frame = requestAnimationFrame(() => {
      const field = document.getElementById(fieldId);
      field?.scrollIntoView({ block: "center", behavior: "auto" });
      field?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.hash, query.isLoading, query.data?.data?.id, editing]);
  const [params] = useSearchParams();
  const [universitySearch, setUniversitySearch] = useState("");
  const universities = useGetUniversitiesQuery(
    {
      page: 1,
      limit: 40,
      search: universitySearch || undefined,
    },
    { skip: Boolean(params.get("programId")) },
  );
  const [create, createState] = useCreateCollegeApplicationMutation();
  const activeApplications = useGetCollegeApplicationsQuery(
    { page: 1, limit: 100 },
    { skip: editing },
  );
  const archivedApplications = useGetArchivedCollegeApplicationsQuery(
    undefined,
    { skip: editing },
  );
  const savedUniversities = useMemo(() => {
    const saved = new Map<string, { id: string; archived: boolean }>();
    for (const app of archivedApplications.data?.data ?? [])
      if (app.universityId)
        saved.set(app.universityId, { id: app.id, archived: true });
    for (const app of activeApplications.data?.data ?? [])
      if (app.universityId)
        saved.set(app.universityId, { id: app.id, archived: false });
    return saved;
  }, [activeApplications.data, archivedApplications.data]);

  const [update, updateState] = useUpdateCollegeApplicationMutation();
  const [form] = Form.useForm<ApplicationForm>();
  const [dirty, setDirty] = useState(false);
  const { canLeave, markSaved } = useUnsavedApplicationChanges(dirty);
  const { profile } = useStudentProfile();
  const targetDegree = profile?.academicProfile?.targetDegree;
  const navigate = useNavigate();
  const selectedUniversity = Form.useWatch("universityId", form);
  const selectedProgramId = Form.useWatch("programId", form);
  const selectedUndergraduateDegreeId = Form.useWatch(
    "undergraduateDegreeId",
    form,
  );
  const selectedStatus = Form.useWatch("status", form);
  const degreeLevel = Form.useWatch("degreeLevel", form);
  const selectedMajor = Form.useWatch("major", form);
  const previewPlan = !editing
    ? requirementsFromDegreePlan(params, {
        universityId: selectedUniversity,
        undergraduateDegreeId: selectedUndergraduateDegreeId,
        major: selectedMajor,
      })
    : undefined;
  const isMastersApplication =
    degreeLevel === "master" || (!degreeLevel && targetDegree === "master");
  const selectedUniversityQuery = useGetUniversityDetailQuery(
    selectedUniversity ?? "",
    { skip: !selectedUniversity },
  );
  const selectedProgramQuery = useGetGraduateProgramQuery(
    selectedProgramId ?? "",
    { skip: !selectedProgramId },
  );
  const degreesQuery = useGetUndergraduateDegreesQuery(
    selectedUniversity ?? "",
    {
      skip: !selectedUniversity || isMastersApplication,
    },
  );
  useEffect(() => {
    if (editing && query.data?.data) {
      const app = query.data.data;
      setEditVersion(app.updatedAt);
      form.setFieldsValue({
        ...app,
        deadline: app.deadline ? dayjs(app.deadline) : undefined,
        submittedAt: app.submittedAt ? dayjs(app.submittedAt) : undefined,
      });
    } else if (!editing) {
      form.setFieldsValue({
        universityId: params.get("university") ?? undefined,
        programId: params.get("programId") ?? undefined,
        undergraduateDegreeId: params.get("undergraduateDegreeId") ?? undefined,
        degreeLevel:
          params.get("degreeLevel") === "bachelor"
            ? "bachelor"
            : targetDegree === "master" || targetDegree === "bachelor"
              ? targetDegree
              : undefined,
        major: params.get("major")?.slice(0, 255) ?? undefined,
        status: "researching",
      });
    }
  }, [editing, query.data?.data?.id, params]);
  useEffect(() => {
    const program = selectedProgramQuery.data;
    if (!editing && program) {
      form.setFieldsValue({
        universityId: program.universityId,
        major: program.programName,
        degreeLevel: "master",
        intake: program.intake ?? undefined,
      });
    }
  }, [editing, form, selectedProgramQuery.data?.id]);
  useEffect(() => {
    if (
      !editing &&
      !form.getFieldValue("degreeLevel") &&
      (targetDegree === "master" || targetDegree === "bachelor")
    ) {
      form.setFieldValue("degreeLevel", targetDegree);
    }
  }, [editing, form, targetDegree]);
  const university =
    selectedUniversityQuery.data ??
    (universities.data?.data ?? []).find(
      (item) => item.id === selectedUniversity,
    );
  const universityOptions = useMemo(() => {
    const rows = universities.data?.data ?? [];
    const withSelected =
      university && !rows.some((item) => item.id === university.id)
        ? [university, ...rows]
        : rows;
    const options = buildUniversityChoices(withSelected).map((option) => {
      const saved = savedUniversities.get(String(option.value));
      return saved
        ? {
            ...option,
            disabled: true,
            label: `${option.label} · ${saved.archived ? "Archived" : "In your list"}`,
          }
        : option;
    });
    const program = selectedProgramQuery.data;
    if (
      program &&
      !options.some((item) => item.value === program.universityId)
    ) {
      options.unshift({
        value: program.universityId,
        label: getTranslation(program.university.name),
      });
    }
    return options;
  }, [
    universities.data,
    university,
    selectedProgramQuery.data,
    savedUniversities,
  ]);
  const duplicate =
    !editing && selectedUniversity
      ? savedUniversities.get(selectedUniversity)
      : undefined;
  const intakeOptions = useMemo(() => {
    const options = upcomingIntakeOptions();
    const current =
      selectedProgramQuery.data?.intake || query.data?.data?.intake;
    return current && !options.some((item) => item.value === current)
      ? [{ value: current, label: current }, ...options]
      : options;
  }, [selectedProgramQuery.data?.intake, query.data?.data?.intake]);
  useEffect(() => {
    if (!editing && selectedUndergraduateDegreeId && degreesQuery.data) {
      const degree = degreesQuery.data.find(
        (item) => item.id === selectedUndergraduateDegreeId,
      );
      if (degree) form.setFieldValue("major", degree.name);
    }
  }, [editing, selectedUndergraduateDegreeId, degreesQuery.data, form]);
  const save = async (values: ApplicationForm) => {
    if (duplicate) {
      message.error(
        "This university is already in your list. Open its existing workspace or restore the archived application.",
      );
      return;
    }
    const { deadline, submittedAt, ...applicationValues } = values;
    const payload: CreateCollegeApplicationRequest = {
      ...applicationValues,
      ...(editing
        ? {
            applicationType: applicationValues.applicationType ?? null,
            category: applicationValues.category ?? null,
          }
        : {}),
      ...(!editing && !applicationValues.requirements
        ? {
            requirements: requirementsFromDegreePlan(params, applicationValues),
          }
        : {}),
      // A catalogue university is identified by ID. The database reserves
      // universityName for custom universities without an ID.
      universityName: applicationValues.universityId
        ? undefined
        : applicationValues.universityName,
      deadline: deadline?.format("YYYY-MM-DD") ?? null,
    };
    try {
      const result = await (
        editing
          ? update({
              id: applicationId!,
              data: {
                ...payload,
                expectedUpdatedAt: editVersion,
                ...submissionDateFields(
                  payload.status,
                  submittedAt?.format("YYYY-MM-DD"),
                  query.data?.data?.submittedAt,
                ),
              },
            })
          : create(payload)
      ).unwrap();
      const entity =
        result && typeof result === "object" && "data" in result
          ? result.data
          : (result as unknown as CollegeApplication);
      message.success(
        editing ? "Application details updated." : "Application added.",
      );
      markSaved();
      setDirty(false);
      navigate(`/student-hub/applications/${entity?.id || applicationId}`, {
        state: returnState,
      });
    } catch {
      message.error(
        "Could not save these application details. Your entries are still here.",
      );
    }
  };
  return (
    <ApplicantPage
      title={editing ? "Edit application plan" : "Create application workspace"}
      subtitle={
        editing
          ? "Keep your program, planning dates and notes up to date. Confirm official deadlines with the university."
          : "Choose a university and program. You can add planning details later; creating a workspace does not submit an application."
      }
    >
      <Breadcrumb>
        <Link to={returnTo}>Applications</Link>
        <span>/</span>
        {editing ? (
          <>
            <Link to={`/student-hub/applications/${applicationId}`} state={returnState}>
              Workspace
            </Link>
            <span>/</span>Edit plan
          </>
        ) : (
          "Create workspace"
        )}
      </Breadcrumb>
      {previewPlan && (
        <Alert
          type="info"
          showIcon
          message="Your degree planning checklist"
          description={
            <ul>
              {previewPlan.custom.items.map((item) => (
                <li key={item.id}>
                  {item.completed ? "Complete" : "To do"}: {item.title}
                </li>
              ))}
            </ul>
          }
        />
      )}
      <QueryState
        hasData={editing && !!query.data?.data}
        loading={editing && query.isLoading}
        error={
          editing && (query.isError || (!query.isLoading && !query.data?.data))
        }
        retry={query.refetch}
      >
        <div className="applicant-panel applicant-form-panel">
          {editing && query.data?.data && (
            <UniversityIdentity
              id={query.data.data.universityId}
              name={query.data.data.universityName}
            />
          )}
          <Form
            form={form}
            layout="vertical"
            onFinish={save}
            onValuesChange={(changed) => {
              setDirty(true);
              if (changed.universityId)
                form.setFieldsValue({
                  undergraduateDegreeId: undefined,
                  major: undefined,
                });
            }}
          >
            <h2 className="application-form-section">University & program</h2>
            {!editing && (
              <>
                {universities.isError && !selectedProgramQuery.data && (
                  <Alert
                    type="warning"
                    showIcon
                    message="University search is unavailable"
                    description="Your entries are still here. Retry to choose a university."
                    action={
                      <Button onClick={() => universities.refetch()}>
                        Retry
                      </Button>
                    }
                  />
                )}
                {duplicate && (
                  <Alert
                    type="info"
                    showIcon
                    message="This university is already in your applications"
                    description={
                      <>
                        <p>
                          {duplicate.archived
                            ? "Restore its archived workspace to continue planning."
                            : "Continue in the workspace you already saved."}
                        </p>
                        <Link
                          to={
                            duplicate.archived
                              ? "/student-hub/applications?view=archived"
                              : `/student-hub/applications/${encodeURIComponent(duplicate.id)}`
                          }
                          state={returnState}
                        >
                          {duplicate.archived
                            ? "View archived applications"
                            : "Open existing application"}{" "}
                          →
                        </Link>
                      </>
                    }
                  />
                )}
                <Form.Item
                  name="universityId"
                  label="University"
                  rules={[{ required: true, message: "Choose a university." }]}
                >
                  <Select
                    showSearch
                    filterOption={false}
                    onSearch={setUniversitySearch}
                    loading={universities.isFetching}
                    placeholder="Search universities"
                    options={universityOptions}
                    disabled={Boolean(selectedProgramId)}
                    notFoundContent={
                      universities.isFetching
                        ? "Searching…"
                        : "No universities found. Try another name."
                    }
                  />
                </Form.Item>
                {university && (
                  <UniversityIdentity
                    id={university.id}
                    name={getTranslation(university.name)}
                    subtitle={getTranslation(university.location?.country)}
                  />
                )}
              </>
            )}
            <Form.Item name="programId" hidden>
              <Input />
            </Form.Item>
            <Form.Item
              name="degreeLevel"
              label="Degree level"
              rules={[{ required: true, message: "Choose a degree level." }]}
            >
              <Select
                options={[
                  { value: "bachelor", label: "Bachelor’s" },
                  { value: "master", label: "Master’s" },
                ]}
                disabled={Boolean(
                  selectedProgramId ||
                    selectedUndergraduateDegreeId ||
                    (editing && query.data?.data?.undergraduateDegreeId),
                )}
                placeholder="Choose degree level"
              />
            </Form.Item>
            {!editing && !isMastersApplication && selectedUniversity && (
              <>
                {degreesQuery.isError && (
                  <Alert
                    type="warning"
                    message="Verified degrees could not be loaded. You can save the university and choose a degree later."
                    action={
                      <Button onClick={() => degreesQuery.refetch()}>
                        Retry
                      </Button>
                    }
                  />
                )}
                <Form.Item
                  name="undergraduateDegreeId"
                  label="Verified degree (optional)"
                  extra="Choose a verified degree or add your intended major below. You can decide later."
                >
                  <Select
                    allowClear
                    loading={degreesQuery.isFetching}
                    placeholder="Choose a degree or decide later"
                    options={(degreesQuery.data ?? []).map((degree) => ({
                      value: degree.id,
                      label: degree.name,
                    }))}
                    onChange={(id) =>
                      form.setFieldValue(
                        "major",
                        degreesQuery.data?.find((degree) => degree.id === id)
                          ?.name,
                      )
                    }
                  />
                </Form.Item>
              </>
            )}
            <Form.Item
              name="major"
              label={
                isMastersApplication
                  ? "Graduate program (optional)"
                  : "Intended major / program (optional)"
              }
              extra={
                selectedProgramId ||
                selectedUndergraduateDegreeId ||
                (editing && query.data?.data?.undergraduateDegreeId)
                  ? "Linked to a verified catalogue record."
                  : "Enter a program name now, or choose one later."
              }
            >
              <Input
                maxLength={255}
                disabled={Boolean(
                  selectedProgramId ||
                    selectedUndergraduateDegreeId ||
                    (editing && query.data?.data?.undergraduateDegreeId),
                )}
                placeholder={
                  isMastersApplication
                    ? "e.g. MSc Computer Science"
                    : "e.g. Computer Science"
                }
              />
            </Form.Item>
            {selectedProgramQuery.data && (
              <Alert
                type="info"
                showIcon
                message={`Verified program: ${selectedProgramQuery.data.programName}`}
                description="Confirm the current entry requirements and deadlines on the official program page."
              />
            )}
            {selectedProgramQuery.isError && (
              <Alert
                type="warning"
                message="This graduate program could not be verified."
                description="Retry or return to program search and choose a current record."
                action={
                  <Button onClick={() => selectedProgramQuery.refetch()}>
                    Retry
                  </Button>
                }
              />
            )}
            <h2 className="application-form-section">Planning</h2>
            <Form.Item name="intake" label="Planned intake (optional)">
              <Select
                allowClear
                placeholder="Choose intake"
                options={intakeOptions}
              />
            </Form.Item>
            {editing && (
              <>
                <div className="applicant-form-grid">
                  <Form.Item
                    name="applicationType"
                    label="Application platform"
                  >
                    <Select
                      allowClear
                      placeholder="Choose a platform"
                      options={[
                        ...(!isMastersApplication
                          ? [
                              { value: "common-app", label: "Common App" },
                              { value: "coalition", label: "Coalition" },
                              { value: "ucas", label: "UCAS" },
                            ]
                          : []),
                        { value: "direct", label: "Direct application" },
                        { value: "other", label: "Other" },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item
                    name="deadline"
                    label="My planning deadline"
                    extra="Your reminder date. Confirm the official application deadline with the university."
                  >
                    <DatePicker />
                  </Form.Item>
                </div>
                <div className="applicant-form-grid">
                  <Form.Item name="category" label="List category (optional)">
                    <Select
                      allowClear
                      options={[
                        { value: "reach", label: "Reach" },
                        { value: "target", label: "Target" },
                        { value: "safety", label: "Likely" },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item name="status" label="Application status">
                    <Select
                      options={[
                        { value: "researching", label: "Saved for later" },
                        { value: "applying", label: "Preparing" },
                        { value: "submitted", label: "Submitted" },
                        { value: "under_review", label: "Under review" },
                        { value: "accepted", label: "Accepted" },
                        { value: "waitlisted", label: "Waitlisted" },
                        { value: "deferred", label: "Deferred" },
                        { value: "rejected", label: "Not accepted" },
                      ]}
                    />
                  </Form.Item>
                </div>
                {(selectedStatus === "submitted" ||
                  selectedStatus === "under_review") && (
                  <Form.Item
                    name="submittedAt"
                    label="Submission date (optional)"
                    extra="Leave blank if the date is unknown."
                  >
                    <DatePicker
                      disabledDate={(date) => date.isAfter(dayjs(), "day")}
                    />
                  </Form.Item>
                )}
                <h2 className="application-form-section">Notes</h2>
                <Form.Item
                  name="sharedNotes"
                  label="Shared notes"
                  extra="Visible to you and your application support mentors."
                >
                  <Input.TextArea
                    id="application-shared-notes"
                    rows={3}
                    maxLength={20000}
                  />
                </Form.Item>
                <Form.Item name="whyThisSchool" label="Why this program?">
                  <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item name="notes" label="Private notes">
                  <Input.TextArea rows={3} />
                </Form.Item>
              </>
            )}
            <p className="applicant-save-note">
              Prepare here. Submit through the university’s official platform.
            </p>
            <div className="applicant-actions applicant-actions--end">
              <Button
                disabled={createState.isLoading || updateState.isLoading}
                onClick={() => {
                  if (canLeave())
                    navigate(
                      editing
                        ? `/student-hub/applications/${applicationId}`
                        : returnTo,
                      { state: returnState },
                    );
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createState.isLoading || updateState.isLoading}
                disabled={
                  !editing &&
                  (Boolean(duplicate) ||
                    activeApplications.isLoading ||
                    archivedApplications.isLoading ||
                    selectedProgramQuery.isError ||
                    (universities.isError && !selectedProgramQuery.data))
                }
              >
                {editing ? "Save plan" : "Create workspace"}
              </Button>
            </div>
          </Form>
        </div>
      </QueryState>
    </ApplicantPage>
  );
}
