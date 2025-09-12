import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Result } from 'antd';
import { sendErrorToTelegram } from '../../utils/telegramLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Send error to backend for logging
    sendErrorToTelegram(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Result
          status="error"
          title="Oops! Something went wrong."
          subTitle="We are sorry for the inconvenience. Please try again later. If the issue persists, please contact the devs through telegram at TopCoach Dev support."
          extra={[
            <Button type="primary" key="retry" onClick={this.handleRetry}>
              Try Again
            </Button>,
            <Button key="home" onClick={() => window.location.href = '/'}>
              Go Home
            </Button>,
          ]}
        />
      );
    }

    return this.props.children;
  }
}