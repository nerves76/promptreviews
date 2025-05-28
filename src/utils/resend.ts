import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResendEmail({
  to,
  subject,
  text,
  from = 'noreply@updates.promptreviews.app', // Use your verified Resend domain
}: {
  to: string;
  subject: string;
  text: string;
  from?: string;
}) {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      text,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Error sending email with Resend:', error);
    return { success: false, error };
  }
} 