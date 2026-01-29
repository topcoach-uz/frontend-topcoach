/**
 * Sends an error report to the backend for logging.
 * The backend will handle sending to Telegram with proper authentication.
 * @param error - The error object to report.
 */
export const sendErrorToTelegram = async (error: Error): Promise<void> => {
  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
  };

  const errorData = {
    name: error.name,
    message: error.message,
    location: window.location.href,
    deviceInfo,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };

  try {
    // Send error to backend instead of directly to Telegram
    const response = await fetch('/api/errors/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    });

    if (!response.ok) {
      console.error('Failed to send error report to backend:', response.status);
    }
  } catch (fetchError) {
    console.error('Error sending error report to backend:', fetchError);
  }
};
