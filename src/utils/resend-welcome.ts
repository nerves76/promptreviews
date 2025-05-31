import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (email: string, name: string) => {
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/login`
    : 'https://promptreviews.com/login';
  const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    : 'https://promptreviews.com/dashboard';

  try {
    const result = await resend.emails.send({
      from: 'PromptReviews <noreply@updates.promptreviews.app>',
      to: email,
      subject: 'Welcome to PromptReviews! 🎉',
      html: `<p>Hi ${name},</p>
        <p>Welcome to PromptReviews! We're excited to have you on board.</p>
        <p>You can <a href="${loginUrl}">log in here</a> or go directly to your <a href="${dashboardUrl}">dashboard</a>.</p>
        <p>Thanks for joining us!<br/>- The PromptReviews Team</p>`
    });
    return { success: true, result };
  } catch (error) {
    console.error('Error sending welcome email (Resend):', error);
    return { success: false, error };
  }
};

export const sendReviewNotificationEmail = async (
  email: string,
  reviewer: string,
  platform: string,
  review: string,
  review_type: string = 'review',
  accountFirstName?: string
) => {
  let subject = '';
  const firstName = reviewer.split(' ')[0] || reviewer;
  if (review_type === 'feedback') {
    subject = `You've got feedback: ${firstName} submitted feedback`;
  } else if (review_type === 'testimonial' || review_type === 'photo') {
    subject = `You've got praise! ${firstName} submitted a testimonial & photo`;
  } else {
    subject = `You've got praise! ${firstName} submitted a review on ${platform}`;
  }

  const accountName = accountFirstName || 'there';
  const loginUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    : 'https://promptreviews.com/dashboard';

  const text = `Hi ${accountName},\n\nYou've got a new Prompt Review.\n\nLog in here to check it out:\n${loginUrl}\n\n:)
Chris`;

  try {
    const result = await resend.emails.send({
      from: 'PromptReviews <noreply@updates.promptreviews.app>',
      to: email,
      subject,
      text,
    });
    return { success: true, result };
  } catch (error) {
    console.error('Error sending review notification email (Resend):', error);
    return { success: false, error };
  }
}; 