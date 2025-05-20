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