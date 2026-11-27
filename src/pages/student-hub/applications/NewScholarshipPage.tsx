import { Link, useNavigate } from "react-router-dom";
import { message } from "antd";
import { useCreateScholarshipApplicationMutation } from "src/app/services/student-hub/applicationTrackingApi";
import { ApplicantPage, Breadcrumb } from "../applicant/ApplicantPage";
import ScholarshipForm from "../applicant/ScholarshipForm";

export default function NewScholarshipPage() {
  const navigate = useNavigate();
  const [create, { isLoading }] = useCreateScholarshipApplicationMutation();
  return (
    <ApplicantPage
      title="Add scholarship"
      subtitle="Save a funding opportunity and track your preparation. You can add missing details later."
    >
      <Breadcrumb>
        <Link to="/student-hub/applications">Applications</Link>
        <span>/</span>
        <Link to="/student-hub/applications?tab=scholarships">
          Scholarships
        </Link>
        <span>/</span>Add scholarship
      </Breadcrumb>
      <div className="applicant-panel applicant-form-panel">
        <ScholarshipForm
          saving={isLoading}
          onSaved={() => navigate("/student-hub/applications?tab=scholarships")}
          onCancel={() =>
            navigate("/student-hub/applications?tab=scholarships")
          }
          onSave={async (data) => {
            try {
              await create(data).unwrap();
              message.success("Scholarship added.");
            } catch (error) {
              message.error(
                "Could not save this scholarship. Your entries are still here.",
              );
              throw error;
            }
          }}
        />
      </div>
    </ApplicantPage>
  );
}
