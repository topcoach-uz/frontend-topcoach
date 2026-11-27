import type { ReactNode } from "react";
import { Alert, Button } from "antd";

import { ErrorState, SkeletonBlock } from "src/components/student-hub/ui";

export function QueryState({
  loading,
  error,
  retry,
  children,
  hasData = false,
  empty,
  emptyState,
}: {
  hasData?: boolean;
  empty?: boolean;
  emptyState?: ReactNode;
  loading?: boolean;
  error?: boolean;
  retry: () => unknown;
  children: ReactNode;
}) {
  if (loading && !hasData)
    return (
      <div className="applicant-panel">
        <SkeletonBlock variant="panel" lines={5} />
      </div>
    );
  if (error && !hasData) return <ErrorState onRetry={retry} />;
  if (empty && emptyState && !error) return <>{emptyState}</>;
  return (
    <>
      {error && hasData && (
        <Alert
          type="warning"
          showIcon
          message="Could not refresh this page"
          description="Showing the last loaded information. Your unsaved changes are still here."
          action={<Button onClick={retry}>Retry refresh</Button>}
        />
      )}
      {children}
    </>
  );
}
