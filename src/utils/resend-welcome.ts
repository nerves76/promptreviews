import { Resend } from "resend";
import { sendWelcomeEmail as sendTemplatedWelcomeEmail } from "./emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    // Use the new template system
    const result = await sendTemplatedWelcomeEmail(email, name);
    return result;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error };
  }
};

export const sendReviewNotificationEmail = async (
  email: string,
  reviewer: string,
  platform: string,
  review: string,
  review_type: string = "review",
  accountFirstName?: string,
) => {
  let subject = "";
  const firstName = reviewer.split(" ")[0] || reviewer;
  if (review_type === "feedback") {
    subject = `You've got feedback: ${firstName} submitted feedback`;
  } else if (review_type === "testimonial" || review_type === "photo") {
    subject = `You've got praise! ${firstName} submitted a testimonial & photo`;
  } else {
    subject = `You've got praise! ${firstName} submitted a review on ${platform}`;
  }

  const accountName = accountFirstName || "there";
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    : "https://promptreviews.app/dashboard";

  const text = `Hi ${accountName},\n\nYou've got a new Prompt Review.\n\nLog in here to check it out:\n${loginUrl}\n\n:)
Chris`;

  try {
    const result = await resend.emails.send({
      from: "PromptReviews <noreply@updates.promptreviews.app>",
      to: email,
      subject,
      text,
    });
    return { success: true, result };
  } catch (error) {
    console.error("Error sending review notification email (Resend):", error);
    return { success: false, error };
  }
};
