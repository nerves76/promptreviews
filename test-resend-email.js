require("dotenv").config();
console.log("Loaded API key:", process.env.RESEND_API_KEY); // <--- Add this line
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestEmail() {
  try {
    const result = await resend.emails.send({
      from: "noreply@updates.promptreviews.app", // Must match your verified sender
      to: "nerves76@gmail.com", // <-- Replace with your email to receive the test
      subject: "Test Email from Resend",
      text: "This is a test email sent directly from a Node.js script using Resend.",
    });
    console.log("Email sent:", result);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

sendTestEmail();
