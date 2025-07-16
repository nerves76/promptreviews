import { NextResponse } from "next/server";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { to, subject, html, from } = await req.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "To, subject, and html are required" },
        { status: 400 },
      );
    }

    const result = await resend.emails.send({
      from: from || 'Prompt Reviews <alerts@promptreviews.app>',
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
  } catch (error) {
    console.error("Error in send-email route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 