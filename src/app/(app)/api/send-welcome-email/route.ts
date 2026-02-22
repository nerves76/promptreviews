import { NextResponse } from "next/server";
import { sendWelcomeEmail } from "@/utils/resend-welcome";

// Simple email format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Characters that enable header injection
const HEADER_INJECTION_REGEX = /[\r\n]|%0[aAdD]/;

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email and name are required" },
        { status: 400 },
      );
    }

    // --- Email header injection & format validation ---

    // Validate "email" parameter
    if (typeof email !== 'string' || HEADER_INJECTION_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Invalid email: contains disallowed characters" },
        { status: 400 },
      );
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Invalid email: not a valid email format" },
        { status: 400 },
      );
    }

    // Validate "name" parameter (used in email subject/body)
    if (typeof name !== 'string' || HEADER_INJECTION_REGEX.test(name)) {
      return NextResponse.json(
        { error: "Invalid name: contains disallowed characters" },
        { status: 400 },
      );
    }
    if (name.trim().length === 0 || name.length > 200) {
      return NextResponse.json(
        { error: "Invalid name: must be between 1 and 200 characters" },
        { status: 400 },
      );
    }

    const result = await sendWelcomeEmail(email, name);

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send welcome email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in send-welcome-email route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
