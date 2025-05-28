import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
});

const DOMAIN = process.env.MAILGUN_DOMAIN || '';

export const sendWelcomeEmail = async (email: string, name: string) => {
  const data = {
    from: `PromptReviews <noreply@${DOMAIN}>`,
    to: email,
    subject: 'Welcome to PromptReviews! 🎉',
    template: 'welcome-email',
    'h:X-Mailgun-Variables': JSON.stringify({
      name: name,
      login_url: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }),
  };

  try {
    await mg.messages.create(DOMAIN, data);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
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

  const data = {
    from: `PromptReviews <noreply@${DOMAIN}>`,
    to: email,
    subject,
    text: `Hi ${accountName},\n\nYou've got a new Prompt Review.\n\nLog in here to check it out:\n${loginUrl}\n\n:)\n\nChris`,
  };

  try {
    await mg.messages.create(DOMAIN, data);
    return { success: true };
  } catch (error) {
    console.error('Error sending review notification email:', error);
    return { success: false, error };
  }
}; 