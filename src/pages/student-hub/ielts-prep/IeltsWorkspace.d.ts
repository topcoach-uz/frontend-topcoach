import type { ReactElement } from 'react';
import type { CreateIeltsSubmission, IeltsSubmission } from 'src/app/services/ieltsPracticeApi';
export interface IeltsWorkspaceProps {
  path: string;
  navigate: (path: string) => void;
  href: (path: string) => string;
  profile: { name: string; email: string };
  storagePrefix: string;
  onStorageError?: () => void;
  writingLibrary?: { data?: any; loading: boolean; error: boolean; retry: () => unknown };
  readingLibrary?: { data?: any; loading: boolean; error: boolean; retry: () => unknown };
  listeningLibrary?: { data?: any; loading: boolean; error: boolean; retry: () => unknown };
  assessmentApi?: { list: (key: string) => Promise<IeltsSubmission[]>; create: (body: CreateIeltsSubmission) => Promise<IeltsSubmission>;
    upload: (id: string, question: number, blob: Blob) => Promise<{ id: string }>; assess: (id: string) => Promise<IeltsSubmission>; audio: (id: string) => Promise<Blob> };
}
/** Preserved JSX fixture renderer, mounted by the typed TopCoach adapter. */
export default function IeltsWorkspace(props: IeltsWorkspaceProps): ReactElement;
