import type { ReactElement } from 'react';
export interface IeltsWorkspaceProps {
  path: string;
  navigate: (path: string) => void;
  href: (path: string) => string;
  profile: { name: string; email: string };
  storagePrefix: string;
  onStorageError?: () => void;
}
/** Preserved JSX fixture renderer, mounted by the typed TopCoach adapter. */
export default function IeltsWorkspace(props: IeltsWorkspaceProps): ReactElement;
