import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTypedSelector } from "src/app/store";
import { displayName } from "src/utils/displayName";
import IeltsWorkspace from "./IeltsWorkspace";
import Header from "src/components/layouts/components/header";
import { ieltsStoragePrefix, toIeltsPath, toTopCoachPath } from "./routes";
import { useGetIeltsListeningQuery, useGetIeltsReadingQuery, useGetIeltsWritingQuery } from 'src/app/services/ieltsListeningApi';
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

  const pagePath = toIeltsPath(location.pathname);
  const listeningMatch = pagePath.match(/^\/ielts\/practice\/(academic|general-training)\/([^/]+)\/([1-8])\/(listening|score)(?:\/|$)/);
  const listening = useGetIeltsListeningQuery({ type: listeningMatch?.[1] || '', book: listeningMatch?.[2] || '', test: Number(listeningMatch?.[3] || 1) }, { skip: !listeningMatch || !profile?.id, refetchOnMountOrArgChange: true });
  const readingMatch = pagePath.match(/^\/ielts\/practice\/(academic|general-training)\/([^/]+)\/([1-8])\/(reading|score)(?:\/|$)/);
  const reading = useGetIeltsReadingQuery({ type: readingMatch?.[1] || '', book: readingMatch?.[2] || '', test: Number(readingMatch?.[3] || 1) }, { skip: !readingMatch || !profile?.id, refetchOnMountOrArgChange: true });
  const writingMatch = pagePath.match(/^\/ielts\/practice\/(academic|general-training)\/([^/]+)\/([1-8])\/writing(?:\/|$)/);
  const writing = useGetIeltsWritingQuery({ type: writingMatch?.[1] || '', book: writingMatch?.[2] || '', test: Number(writingMatch?.[3] || 1) }, { skip: !writingMatch || !profile?.id, refetchOnMountOrArgChange: true });
  const browsing = ["/", "/ielts/practice/home", "/ielts/practice/general-training"].includes(pagePath);

  // Parent StudentHubGate owns authentication, role routing and profile loading.
  // Never create a demo session or reuse another user's local practice namespace.
  if (!profile?.id) return null;

  return (
    <>
      {browsing && <Header workspace />}
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
        writingLibrary={{ data: writing.currentData, loading: writing.isFetching, error: !!writing.error, retry: writing.refetch }}
        readingLibrary={{ data: reading.currentData, loading: reading.isFetching, error: !!reading.error, retry: reading.refetch }}
        listeningLibrary={{ data: listening.currentData, loading: listening.isFetching, error: !!listening.error, retry: listening.refetch }}
        assessmentApi={{ list: key => list(key, false).unwrap(), create: body => create(body).unwrap(),
          upload: (id, question, blob) => upload({ id, question, blob }).unwrap(), assess: id => assess(id).unwrap(), audio: id => audio(id).unwrap() }}
      />
    </>
  );
}
