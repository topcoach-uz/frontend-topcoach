import { useEffect, useState } from "react";
import { Alert, Button, Select, Space, message } from "antd";
import {
  useGetApplicationMentorsQuery,
  useUpdateCollegeApplicationMutation,
} from "src/app/services/student-hub/applicationTrackingApi";
import type { CollegeApplication } from "src/app/services/student-hub/types";

export default function ApplicationMentor({
  application,
}: {
  application: CollegeApplication;
}) {
  const mentors = useGetApplicationMentorsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [update, { isLoading: saving }] = useUpdateCollegeApplicationMutation();
  const [selected, setSelected] = useState<string | null>(
    application.mentorId || null,
  );
  useEffect(() => {
    setSelected(application.mentorId || null);
  }, [application.id, application.mentorId]);
  const options = mentors.data?.data || [];
  const unavailable =
    application.mentorId && !options.some((m) => m.id === application.mentorId);
  return (
    <section className="applicant-panel" aria-label="Application mentor">
      <h3>Application mentor</h3>
      <p>
        Choose a current support mentor to help track this application and
        update its checklist.
      </p>
      {mentors.isError && (
        <Alert
          type="error"
          message="Support mentors could not be loaded."
          action={<Button onClick={() => void mentors.refetch()}>Retry</Button>}
        />
      )}
      {unavailable && !mentors.isFetching && (
        <Alert
          type="warning"
          message="The previously selected mentor is no longer available. Choose a current mentor or clear the assignment."
        />
      )}
      {!mentors.isFetching && !mentors.isError && !options.length && (
        <p>No current application support mentor is available.</p>
      )}
      <Space direction="vertical" style={{ width: "100%" }}>
        <Select
          aria-label="Select application mentor"
          style={{ width: "100%" }}
          allowClear
          placeholder="No mentor selected"
          loading={mentors.isFetching}
          disabled={saving || mentors.isError}
          value={selected}
          onChange={(id) => setSelected(id || null)}
          options={[
            ...options.map((m) => ({ value: m.id, label: m.name })),
            ...(unavailable
              ? [
                  {
                    value: application.mentorId!,
                    label: "Previously selected mentor",
                    disabled: true,
                  },
                ]
              : []),
          ]}
        />
        {selected && (
          <Button disabled={saving} onClick={() => setSelected(null)}>
            Clear mentor selection
          </Button>
        )}
        <Button
          loading={saving}
          disabled={
            selected === (application.mentorId || null) ||
            mentors.isError ||
            mentors.isFetching
          }
          onClick={async () => {
            try {
              await update({
                id: application.id,
                data: { mentorId: selected },
              }).unwrap();
              message.success(
                selected
                  ? "Application mentor assigned."
                  : "Application mentor removed.",
              );
            } catch (error: any) {
              message.error(
                error?.data?.message ||
                  "Could not update the application mentor.",
              );
            }
          }}
        >
          Save mentor
        </Button>
      </Space>
      <p>
        Send essays and share documents from their review screens when you want
        feedback.
      </p>
    </section>
  );
}
