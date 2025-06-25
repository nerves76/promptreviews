import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (email: string, name: string) => {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/signin`
    : "https://app.promptreviews.app/signin";
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    : "https://app.promptreviews.app/dashboard";

  try {
    const result = await resend.emails.send({
      from: "PromptReviews <noreply@updates.promptreviews.app>",
      to: email,
      subject: "Welcome to PromptReviews! 🎉",
      html: `
        <p>Hi ${name},</p>
        
        <p>I'm really glad you're here. Even if it's just for a short ride.</p>
        
        <p>Prompt Reviews isn't just an app—it's a tool to help small businesses like yours earn the 5-star feedback you deserve, without nagging or chasing your customers.</p>
        
        <p>In a world where big companies are rushing to replace humans with AI, you offer something they can't: real connection. People want to support small businesses. They want to give back. Sometimes they just need a little nudge—and an easy way to do it.</p>
        
        <p>That's where Prompt Reviews comes in.<br>
        It helps your customers say what they already feel—it helps them help you.</p>
        
        <p><strong>Did you know:</strong></p>
        <ul>
          <li>Every 10 Google reviews = 2.7% more conversions</li>
          <li>25% of people check 3+ sites before making a decision</li>
        </ul>
        
        <p>Reviews matter. Let's make them easier to collect—and more meaningful.</p>
        
        <p>👉 <a href="${dashboardUrl}">Try creating your first Prompt Page</a> and send it to a few customers or clients.<br>
        Let me know how it goes.</p>
        
        <p>If you ever want help or ideas, I'd love to hear from you.</p>
        
        <p>– Chris<br>
        Founder, Prompt Reviews<br>
        (Oh, Prompty says, Hi!)</p>
        
        <p><small>You can also <a href="${loginUrl}">log in here</a> anytime.</small></p>
      `,
    });
    return { success: true, result };
  } catch (error) {
    console.error("Error sending welcome email (Resend):", error);
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
    : "https://promptreviews.com/dashboard";

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
