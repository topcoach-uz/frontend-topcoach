import type { ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ErrorStateProps {
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => unknown;
  retryLabel?: ReactNode;
}

/** A failed load: what happened, that nothing was lost, and a way to try again. */
export function ErrorState({ title, description, onRetry, retryLabel }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <div className="applicant-empty" role="alert">
      <AlertCircle size={24} aria-hidden />
      <h3>{title ?? t('studentUi.error.title', 'We couldn’t finish that request.')}</h3>
      <p>{description ?? t('studentUi.error.body', 'Your saved information is unchanged. Please try again.')}</p>
      {onRetry && (
        <div className="applicant-actions">
          <button type="button" className="tc-btn tc-btn--secondary" onClick={() => void onRetry()}>
            <RotateCcw size={16} aria-hidden />
            {retryLabel ?? t('studentUi.error.retry', 'Try again')}
          </button>
        </div>
      )}
    </div>
  );
}
