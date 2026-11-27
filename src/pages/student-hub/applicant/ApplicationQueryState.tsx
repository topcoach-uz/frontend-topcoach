import type { ReactNode } from "react";
import { Alert, Button, Skeleton } from "antd";

export function QueryState({
  loading,
  error,
  retry,
  children,
  hasData = false,
}: {
  hasData?: boolean;
  loading?: boolean;
  error?: boolean;
  retry: () => unknown;
  children: ReactNode;
}) {
  if (loading && !hasData)
    return (
      <div className="applicant-panel">
        <Skeleton active paragraph={{ rows: 5 }} />
      </div>
    );
  if (error && !hasData)
    return (
      <Alert
        type="error"
        showIcon
        message="We couldn’t finish that request."
        description="Your saved information is unchanged. Please try again."
        action={<Button onClick={retry}>Try again</Button>}
      />
    );
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
