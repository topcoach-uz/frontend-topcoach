/**
 * Sends an error report to a specified Telegram chat via a bot.
 * Uses hardcoded bot token and chat ID.
 * @param error - The error object to report.
 */
export const sendErrorToTelegram = async (error: Error): Promise<void> => {
  // Hardcoded credentials as requested
  const botToken = '7546520160:AAGZjk375owYFfIkUEyKXQwThyb45_TgMnw';
  const chatId = '743713648';

  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
  };

  const messageText = `
🚨 *Error Report* 🚨

*Name:* \`${error.name}\`

*Message:* \`${error.message}\`

*Location:* \`${window.location.href}\`

*Device Info:*
\`\`\`json
${JSON.stringify(deviceInfo, null, 2)}
\`\`\`

*Error Object*
\`\`\`json
${JSON.stringify(error)}
\`\`\`

*Stack Trace:*
\`\`\`
${error.stack}
\`\`\`
  `;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'Markdown', // Optional: Use Markdown for formatting
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error(
        'Failed to send error message to Telegram:',
        response.status,
        errorData
      );
    }
  } catch (fetchError) {
    console.error('Error sending message to Telegram:', fetchError);
  }
};
