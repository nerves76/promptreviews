import { NextResponse } from "next/server";
import { Resend } from 'resend';

// Lazy initialization to avoid build-time env var access
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Simple email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Characters that enable header injection
const HEADER_INJECTION_REGEX = /[\r\n]|%0[aAdD]/;

/**
 * Extract the email address from a value that may be either
 * a plain email ("user@example.com") or a display-name format
 * ("Display Name <user@example.com>").
 */
function extractEmailAddress(value: string): string | null {
  const angleMatch = value.match(/<([^>]+)>/);
  if (angleMatch) {
    return angleMatch[1].trim();
  }
  return value.trim();
}

export async function POST(req: Request) {
  const resend = getResendClient();
  try {
    const { to, subject, html, from } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "To, subject, and html are required" },
        { status: 400 },
      );
    }

    // --- Email header injection & format validation ---

    // Validate "to" parameter
    if (HEADER_INJECTION_REGEX.test(to)) {
      return NextResponse.json(
        { error: "Invalid 'to' address: contains disallowed characters" },
        { status: 400 },
      );
    }
    if (!EMAIL_REGEX.test(to.trim())) {
      return NextResponse.json(
        { error: "Invalid 'to' address: not a valid email format" },
        { status: 400 },
      );
    }

    // Validate "subject" parameter
    if (HEADER_INJECTION_REGEX.test(subject)) {
      return NextResponse.json(
        { error: "Invalid 'subject': contains disallowed characters" },
        { status: 400 },
      );
    }
    if (subject.length > 500) {
      return NextResponse.json(
        { error: "Invalid 'subject': must be 500 characters or fewer" },
        { status: 400 },
      );
    }

    // Validate "from" parameter (optional — has a safe default)
    if (from !== undefined && from !== null) {
      if (typeof from !== 'string' || from.trim() === '') {
        return NextResponse.json(
          { error: "Invalid 'from': must be a non-empty string" },
          { status: 400 },
        );
      }
      if (HEADER_INJECTION_REGEX.test(from)) {
        return NextResponse.json(
          { error: "Invalid 'from' address: contains disallowed characters" },
          { status: 400 },
        );
      }
      const fromEmail = extractEmailAddress(from);
      if (!fromEmail || !EMAIL_REGEX.test(fromEmail)) {
        return NextResponse.json(
          { error: "Invalid 'from' address: not a valid email format" },
          { status: 400 },
        );
      }
      if (!fromEmail.endsWith('@promptreviews.app')) {
        return NextResponse.json(
          { error: "Invalid 'from' address: must use the @promptreviews.app domain" },
          { status: 400 },
        );
      }
    }

    const result = await resend.emails.send({
      from: from || 'Prompt Reviews <noreply@updates.promptreviews.app>',
      to: [to],
      subject,
      html,
    });

    if (result.error) {
      console.error("Failed to send email:", result.error);
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.data?.id 
    });
  } catch (error: unknown) {
    console.error("Error in send-email route:", error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
} 