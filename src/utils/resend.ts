import { Resend } from "resend";

// Lazy initialization to avoid build-time env var access
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY!);
}

// Export getter function instead of client instance
export const resend = {
  get client() {
    return getResendClient();
  }
};

export async function sendResendEmail({
  to,
  subject,
  text,
  html,
  from = "noreply@updates.promptreviews.app", // Use your verified domain
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}) {
  try {
    const resendClient = getResendClient();
    const data = await resendClient.emails.send({
      from,
      to,
      subject,
      ...(html ? { html } : { text: text || '' }),
    });
    return data;
  } catch (error) {
    console.error("Error sending email with Resend:", error);
    throw error;
  }
}
