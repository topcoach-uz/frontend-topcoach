import { useEffect, useMemo, useState } from "react";
import { Alert, Button, DatePicker, Form, Input, Select, message } from "antd";
import dayjs from "dayjs";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
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
};

export default function ApplicantApplicationFormPage() {
  const { applicationId } = useParams();
  const editing = !!applicationId;
  const query = useGetCollegeApplicationQuery(applicationId ?? "", {
    skip: !applicationId,
  });
  const [params] = useSearchParams();
  const [universitySearch, setUniversitySearch] = useState("");
  const universities = useGetUniversitiesQuery({
    page: 1,
    limit: 40,
    search: universitySearch || undefined,
  }, { skip: Boolean(params.get("programId")) });
  const [create, createState] = useCreateCollegeApplicationMutation();
  const [update, updateState] = useUpdateCollegeApplicationMutation();
  const [form] = Form.useForm<ApplicationForm>();
  const { profile } = useStudentProfile();
  const targetDegree = profile?.academicProfile?.targetDegree;
  const navigate = useNavigate();
  const selectedUniversity = Form.useWatch("universityId", form);
  const selectedProgramId = Form.useWatch("programId", form);
  const selectedUndergraduateDegreeId = Form.useWatch("undergraduateDegreeId", form);
  const degreeLevel = Form.useWatch("degreeLevel", form);
  const isMastersApplication = degreeLevel === "master" || (!degreeLevel && targetDegree === "master");
  const selectedUniversityQuery = useGetUniversityDetailQuery(
    selectedUniversity ?? "",
    { skip: !selectedUniversity },
  );
  const selectedProgramQuery = useGetGraduateProgramQuery(
    selectedProgramId ?? "",
    { skip: !selectedProgramId },
  );
  const degreesQuery = useGetUndergraduateDegreesQuery(selectedUniversity ?? "", {
    skip: !selectedUniversity || isMastersApplication,
  });
  useEffect(() => {
    if (editing && query.data?.data) {
      const app = query.data.data;
      form.setFieldsValue({
        ...app,
        deadline: app.deadline ? dayjs(app.deadline) : undefined,
      });
    } else if (!editing) {
      form.setFieldsValue({
        universityId: params.get("university") ?? undefined,
        programId: params.get("programId") ?? undefined,
        undergraduateDegreeId: params.get("undergraduateDegreeId") ?? undefined,
        degreeLevel: params.get("degreeLevel") === "bachelor" ? "bachelor" : targetDegree === "master" || targetDegree === "bachelor" ? targetDegree : undefined,
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
    if (!editing && !form.getFieldValue("degreeLevel") &&
      (targetDegree === "master" || targetDegree === "bachelor")) {
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
    const options = withSelected.map((item) => ({
      value: item.id,
      label: getTranslation(item.name),
    }));
    const program = selectedProgramQuery.data;
    if (program && !options.some((item) => item.value === program.universityId)) {
      options.unshift({ value: program.universityId, label: getTranslation(program.university.name) });
    }
    return options;
  }, [universities.data, university, selectedProgramQuery.data]);
  useEffect(() => {
    if (!editing && selectedUndergraduateDegreeId && degreesQuery.data) {
      const degree = degreesQuery.data.find((item) => item.id === selectedUndergraduateDegreeId);
      if (degree) form.setFieldValue("major", degree.name);
    }
  }, [editing, selectedUndergraduateDegreeId, degreesQuery.data, form]);
  const save = async (values: ApplicationForm) => {
    const { deadline, ...applicationValues } = values;
    const payload: CreateCollegeApplicationRequest = {
      ...applicationValues,
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
          ? update({ id: applicationId!, data: payload })
          : create(payload)
      ).unwrap();
      const entity =
        result && typeof result === "object" && "data" in result
          ? result.data
          : (result as unknown as CollegeApplication);
      message.success(
        editing ? "Application details updated." : "Application added.",
      );
      navigate(`/student-hub/applications/${entity?.id || applicationId}`);
    } catch {
      message.error(
        "Could not save these application details. Your entries are still here.",
      );
    }
  };
  return (
    <ApplicantPage
      title={editing ? "Plan your application" : "Save a university"}
      subtitle={editing ? "Add your own planning details. Confirm deadlines and submission routes on the official university site." : "Add a university to your College List. You can plan the application after saving it."}
    >
      <Breadcrumb>
        <Link to="/student-hub/applications">College List</Link>
        <span>/</span>
        {editing ? "Edit application" : "Add application"}
      </Breadcrumb>
      <QueryState
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
              if (changed.universityId || changed.degreeLevel) {
                form.setFieldsValue({ undergraduateDegreeId: undefined, major: undefined });
              }
            }}
          >
            {!editing && <>
              <p className="applicant-save-intro">Choose a university first. A degree and intake can be added now or later.</p>
              <Form.Item name="universityId" label="University" rules={[{ required: true, message: "Choose a university." }]}>
                <Select showSearch filterOption={false} onSearch={setUniversitySearch} loading={universities.isLoading} placeholder="Search universities" options={universityOptions} disabled={Boolean(selectedProgramId)} />
              </Form.Item>
              {university && <UniversityIdentity id={university.id} name={getTranslation(university.name)} subtitle={getTranslation(university.location?.country)} />}
              <Form.Item name="programId" hidden><Input /></Form.Item>
              <Form.Item name="degreeLevel" label="Degree level" rules={[{ required: true, message: "Choose a degree level." }]}>
                <Select options={[{ value: "bachelor", label: "Bachelor’s" }, { value: "master", label: "Master’s" }]} disabled={Boolean(selectedProgramId || selectedUndergraduateDegreeId)} placeholder="Choose degree level" />
              </Form.Item>
              {!isMastersApplication && selectedUniversity && <Form.Item name="undergraduateDegreeId" label="Degree (optional)" extra={degreesQuery.data?.length ? "Only degrees verified in the TopCoach catalogue appear here. You can decide later." : "No verified degrees are listed yet. Save the university and add a degree later."}>
                <Select allowClear loading={degreesQuery.isLoading} placeholder="Choose a verified degree or decide later" options={(degreesQuery.data ?? []).map((degree) => ({ value: degree.id, label: degree.name }))} onChange={(id) => form.setFieldValue("major", degreesQuery.data?.find((degree) => degree.id === id)?.name)} />
              </Form.Item>}
              {isMastersApplication && selectedProgramQuery.data && <Alert type="info" showIcon message={`Selected graduate programme: ${selectedProgramQuery.data.programName}`} />}
              {selectedProgramQuery.isError && <Alert type="warning" message="This graduate programme could not be verified. Return to programme search and choose a current record." />}
              <Form.Item name="major" hidden><Input /></Form.Item>
              <Form.Item name="intake" label="Planned intake (optional)"><Input placeholder="e.g. Autumn 2027" /></Form.Item>
              <p className="applicant-save-note">Saving this choice does not submit an application.</p>
              <div className="applicant-actions applicant-actions--end">
                <Button onClick={() => navigate("/student-hub/applications")}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={createState.isLoading} disabled={selectedProgramQuery.isError || (universities.isError && !selectedProgramQuery.data)}>Add to College List</Button>
              </div>
            </>}
            {editing && <>
            {!editing && (
              <Form.Item
                name="universityId"
                label="University"
                rules={[{ required: true, message: "Choose a university." }]}
              >
                <Select
                  showSearch
                  filterOption={false}
                  onSearch={setUniversitySearch}
                  loading={universities.isLoading}
                  placeholder="Search the university catalogue"
                  options={universityOptions}
                />
              </Form.Item>
            )}
            <Form.Item name="programId" hidden>
              <Input />
            </Form.Item>
            {selectedProgramQuery.isError && (
              <Alert
                type="warning"
                message="This graduate program could not be verified."
                description="Return to program search and choose a verified program before saving it."
              />
            )}
            {!editing && universities.isError && !selectedProgramQuery.data && (
              <p>
                University search is temporarily unavailable. Try again before
                adding an application.
              </p>
            )}
            {university && (
              <UniversityIdentity
                id={university.id}
                name={getTranslation(university.name)}
                subtitle={getTranslation(university.location?.country)}
              />
            )}
            <Form.Item name="major" label={isMastersApplication ? "Graduate programme" : query.data?.data?.undergraduateDegreeId ? "Verified undergraduate degree" : "Intended major / programme"}>
              <Input disabled={Boolean(selectedProgramId || query.data?.data?.undergraduateDegreeId)} placeholder={isMastersApplication ? "e.g. MSc Computer Science" : "e.g. Computer Science"} />
            </Form.Item>
            {selectedProgramQuery.data && (
              <Alert
                type="info"
                showIcon
                message={`Verified program: ${selectedProgramQuery.data.programName}`}
                description={`Requirements, funding and language evidence are available from the program page. ${selectedProgramQuery.data.officialSourceUrl ? "Use the official source to confirm them before applying." : "Official source verification is still needed."}`}
              />
            )}
            <div className="applicant-form-grid">
              <Form.Item
                name="degreeLevel"
                label="Degree level"
                rules={[{ required: true }]}
              >
                <Select
                  disabled={Boolean(query.data?.data?.undergraduateDegreeId || selectedProgramId)}
                  options={[
                    { value: "bachelor", label: "Bachelor’s" },
                    { value: "master", label: "Master’s" },
                  ]}
                />
              </Form.Item>
              <Form.Item name="intake" label="Intake">
                <Input placeholder="e.g. Autumn 2027" />
              </Form.Item>
            </div>
            <div className="applicant-form-grid">
              <Form.Item
                name="applicationType"
                label="Application platform"
              >
                <Select
                  options={[
                    ...(!isMastersApplication ? [
                      { value: "common-app", label: "Common App" },
                      { value: "coalition", label: "Coalition" },
                      { value: "ucas", label: "UCAS" },
                    ] : []),
                    { value: "direct", label: "Direct application" },
                    { value: "other", label: "Other" },
                  ]}
                />
              </Form.Item>
              <Form.Item name="deadline" label="My planning deadline" extra="A date you enter for your own plan. Check the official university page for the actual deadline.">
                <DatePicker />
              </Form.Item>
            </div>
            <div className="applicant-form-grid">
              <Form.Item
                name="category"
                label="List category"
              >
                <Select
                  options={[
                    { value: "reach", label: "Reach" },
                    { value: "target", label: "Target" },
                    { value: "safety", label: "Likely" },
                  ]}
                />
              </Form.Item>
              <Form.Item name="status" label="Preparation status">
                <Select
                  options={[
                    { value: "researching", label: "Saved for later" },
                    { value: "applying", label: "Preparing" },
                    { value: "submitted", label: "Submitted" },
                    { value: "under_review", label: "Under review" },
                    { value: "accepted", label: "Accepted" },
                    { value: "waitlisted", label: "Waitlisted" },
                    { value: "deferred", label: "Deferred" },
                    { value: "rejected", label: "Not accepted" } satisfies {
                      value: CollegeApplication["status"];
                      label: string;
                    },
                  ]}
                />
              </Form.Item>
            </div>
            <Form.Item name="whyThisSchool" label="Why this programme?">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item name="notes" label="Private notes">
              <Input.TextArea rows={3} />
            </Form.Item>
            <div className="applicant-actions applicant-actions--end">
              <Button
                onClick={() =>
                  navigate(
                    editing
                      ? `/student-hub/applications/${applicationId}`
                      : "/student-hub/applications",
                  )
                }
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createState.isLoading || updateState.isLoading}
                disabled={!editing && (selectedProgramQuery.isError || (universities.isError && !selectedProgramQuery.data))}
              >
                Save plan
              </Button>
            </div>
            </>}
          </Form>
        </div>
      </QueryState>
    </ApplicantPage>
  );
}
