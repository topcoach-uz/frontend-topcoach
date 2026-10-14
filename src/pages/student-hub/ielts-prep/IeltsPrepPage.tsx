import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTypedSelector } from "src/app/store";
import { displayName } from "src/utils/displayName";
import IeltsWorkspace from "./IeltsWorkspace";
import { ieltsStoragePrefix, toIeltsPath, toTopCoachPath } from "./routes";
import { useLazyGetIeltsSubmissionsQuery, useCreateIeltsSubmissionMutation, useUploadIeltsRecordingMutation, useAssessIeltsSubmissionMutation, useDownloadIeltsRecordingMutation } from 'src/app/services/ieltsPracticeApi';

export default function IeltsPrepPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useTypedSelector((state) => state.auth.profile);
  const [storageError, setStorageError] = useState(false);
  const onStorageError = useCallback(() => setStorageError(true), []);
  const [list] = useLazyGetIeltsSubmissionsQuery();
  const [create] = useCreateIeltsSubmissionMutation();
  const [upload] = useUploadIeltsRecordingMutation();
  const [assess] = useAssessIeltsSubmissionMutation();
  const [audio] = useDownloadIeltsRecordingMutation();

  // Parent StudentHubGate owns authentication, role routing and profile loading.
  // Never create a demo session or reuse another user's local practice namespace.
  if (!profile?.id) return null;

  return (
    <>
      {storageError && (
        <div
          role="alert"
          style={{ padding: "8px 16px", background: "#fff1b8", color: "#333" }}
        >
          Your browser could not save this practice. Keep this page open to
          retain your current work.
        </div>
      )}
      <IeltsWorkspace
        path={toIeltsPath(location.pathname) + location.search}
        navigate={(path) => navigate(toTopCoachPath(path))}
        href={toTopCoachPath}
        profile={{
          name: displayName(profile.profile?.name, profile.email, "Student"),
          email: profile.email || "",
        }}
        storagePrefix={ieltsStoragePrefix(String(profile.id))}
        onStorageError={onStorageError}
        assessmentApi={{ list: key => list(key, false).unwrap(), create: body => create(body).unwrap(),
          upload: (id, question, blob) => upload({ id, question, blob }).unwrap(), assess: id => assess(id).unwrap(), audio: id => audio(id).unwrap() }}
      />
    </>
  );
}
