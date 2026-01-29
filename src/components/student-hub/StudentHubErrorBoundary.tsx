import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Card } from 'antd';
import FontAwesomeIcon from '../common/icons/FontAwesomeIcon';
import { STATUS_ICONS } from '../../constants/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class StudentHubErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Student Hub Error Boundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="student-hub-error-boundary">
          <Card className="error-card">
            <div className="error-content">
              <div className="error-icon">
                <FontAwesomeIcon icon={STATUS_ICONS.ERROR} size="2xl" />
              </div>
              <h2 className="error-title">Something went wrong</h2>
              <p className="error-description">
                We encountered an unexpected error in the Student Hub. This might be a temporary issue.
              </p>
              <div className="error-actions">
                <Button
                  type="primary"
                  icon={<FontAwesomeIcon icon={"fas fa-redo" as any} />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
                <Button
                  type="default"
                  icon={<FontAwesomeIcon icon={"fas fa-refresh" as any} />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="error-details">
                  <summary>Error Details (Development)</summary>
                  <pre className="error-stack">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo && (
                    <pre className="error-info">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </details>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default StudentHubErrorBoundary;