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
        major: params.get("program") ?? undefined,
        degreeLevel: targetDegree === "master" || targetDegree === "bachelor" ? targetDegree : undefined,
        applicationType: "direct",
        category: "target",
        priority: 2,
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
        deadline: program.deadline ? dayjs(program.deadline) : undefined,
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
  const save = async (values: ApplicationForm) => {
    const {
      universityName: _universityName,
      deadline,
      ...applicationValues
    } = values;
    const payload: CreateCollegeApplicationRequest = {
      ...applicationValues,
      deadline: deadline?.format("YYYY-MM-DD"),
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
      title={editing ? "Edit application details" : "Add an application"}
      subtitle="Track your preparation here. You will still submit through the university’s official platform."
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
              if (changed.degreeLevel === "master" &&
                !["direct", "other"].includes(form.getFieldValue("applicationType"))) {
                form.setFieldValue("applicationType", "direct");
              }
            }}
          >
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
            <Form.Item name="major" label={isMastersApplication ? "Graduate programme" : "Intended major / programme"}>
              <Input disabled={Boolean(selectedProgramId)} placeholder={isMastersApplication ? "e.g. MSc Computer Science" : "e.g. Computer Science"} />
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
                rules={[{ required: true }]}
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
              <Form.Item name="deadline" label="Application deadline">
                <DatePicker />
              </Form.Item>
            </div>
            <div className="applicant-form-grid">
              <Form.Item
                name="category"
                label="List category"
                rules={[{ required: true }]}
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
                Save application
              </Button>
            </div>
          </Form>
        </div>
      </QueryState>
    </ApplicantPage>
  );
}
