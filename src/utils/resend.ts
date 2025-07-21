import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
// To enable hard-coding, the toggle script can swap the above line with:
// const resend = new Resend("your-hardcoded-resend-key-here");

export async function sendResendEmail({
  to,
  subject,
  text,
  from = "onboarding@resend.dev", // Use Resend's verified domain
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
    return data;
  } catch (error) {
    console.error("Error sending email with Resend:", error);
    throw error;
  }
}
