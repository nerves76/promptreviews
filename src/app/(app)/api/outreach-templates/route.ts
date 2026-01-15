import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";

type TemplateCategory = "initial_ask" | "follow_up" | "on_behalf_of" | "thank_you";

interface Template {
  id: string;
  account_id: string;
  name: string;
  communication_type: "email" | "sms";
  template_type: TemplateCategory;
  subject_template?: string;
  message_template: string;
  is_default: boolean;
  is_active: boolean;
}

const VALID_CATEGORIES: TemplateCategory[] = ["initial_ask", "follow_up", "on_behalf_of", "thank_you"];

// GET: List templates for account (with optional filter by communication_type)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: "No valid account found" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const communicationType = searchParams.get("communication_type");

    // Build query
    let query = supabase
      .from("communication_templates")
      .select("*")
      .eq("account_id", accountId)
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true });

    if (communicationType && (communicationType === "email" || communicationType === "sms")) {
      query = query.eq("communication_type", communicationType);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }

    // If no templates exist, create defaults
    if (!templates || templates.length === 0) {
      const defaultTemplates = await createDefaultTemplatesForAccount(accountId, supabase);

      // Filter by communication type if specified
      const filtered = communicationType
        ? defaultTemplates.filter((t: Template) => t.communication_type === communicationType)
        : defaultTemplates;

      return NextResponse.json({ templates: filtered });
    }

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("Error in GET /outreach-templates:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST: Create a new template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: "No valid account found" }, { status: 403 });
    }

    const body = await request.json();
    const { name, communication_type, template_type, subject_template, message_template } = body;

    // Validate required fields
    if (!name || !communication_type || !message_template) {
      return NextResponse.json(
        { error: "Missing required fields: name, communication_type, message_template" },
        { status: 400 }
      );
    }

    if (!["email", "sms"].includes(communication_type)) {
      return NextResponse.json(
        { error: "Invalid communication_type. Must be 'email' or 'sms'" },
        { status: 400 }
      );
    }

    // Validate template_type if provided
    const category = template_type || "initial_ask";
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid template_type. Must be one of: ${VALID_CATEGORIES.join(", ")}` },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabase
      .from("communication_templates")
      .insert({
        account_id: accountId,
        name,
        communication_type,
        template_type: category,
        subject_template: communication_type === "email" ? subject_template : null,
        message_template,
        is_default: false,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /outreach-templates:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// Helper function to create default templates for an account
async function createDefaultTemplatesForAccount(accountId: string, supabase: any) {
  const defaultTemplates = getDefaultTemplateContent();

  const { data: createdTemplates, error } = await supabase
    .from("communication_templates")
    .insert(
      defaultTemplates.map(template => ({
        ...template,
        account_id: accountId,
      }))
    )
    .select();

  if (error) {
    console.error("Error creating default templates:", error);
    return [];
  }

  return createdTemplates || [];
}

// Default template content organized by category
function getDefaultTemplateContent() {
  return [
    // ===== INITIAL ASK - Email =====
    {
      name: "Initial review request",
      communication_type: "email",
      template_type: "initial_ask",
      subject_template: "{{business_name}} would love your feedback!",
      message_template: `Hi {{customer_name}},

Thank you for choosing {{business_name}}! We hope you had a great experience.

We'd love to hear your feedback. Would you take a moment to leave us a review?

{{review_url}}

Your review helps us improve and helps others find us!

Best regards,
{{business_name}} Team`,
      is_default: true,
      is_active: true,
    },
    {
      name: "Service completion",
      communication_type: "email",
      template_type: "initial_ask",
      subject_template: "How did we do? - {{business_name}}",
      message_template: `Hi {{customer_name}},

We hope everything went well with your recent visit to {{business_name}}.

We'd love your honest feedback: {{review_url}}

Thanks for choosing us!
{{business_name}} Team`,
      is_default: false,
      is_active: true,
    },
    // ===== INITIAL ASK - SMS =====
    {
      name: "Quick review request",
      communication_type: "sms",
      template_type: "initial_ask",
      subject_template: "{{business_name}} would love your feedback!",
      message_template: "Hi {{customer_name}}! Thanks for choosing {{business_name}}. We'd love your feedback! {{review_url}}",
      is_default: true,
      is_active: true,
    },
    // ===== FOLLOW UP - Email =====
    {
      name: "Friendly follow-up",
      communication_type: "email",
      template_type: "follow_up",
      subject_template: "Quick reminder from {{business_name}}",
      message_template: `Hi {{customer_name}},

Just a friendly reminder - we'd still love to hear about your experience with {{business_name}}.

Your feedback means a lot to us: {{review_url}}

Thank you!
{{business_name}} Team`,
      is_default: false,
      is_active: true,
    },
    // ===== FOLLOW UP - SMS =====
    {
      name: "Friendly follow-up",
      communication_type: "sms",
      template_type: "follow_up",
      subject_template: "Quick reminder from {{business_name}}",
      message_template: "Hi {{customer_name}}! Friendly reminder from {{business_name}} - we'd still appreciate your review: {{review_url}} Thank you!",
      is_default: false,
      is_active: true,
    },
    // ===== ON BEHALF OF - Email =====
    {
      name: "On behalf of client",
      communication_type: "email",
      template_type: "on_behalf_of",
      subject_template: "Feedback request for {{business_name}}",
      message_template: `Hi {{customer_name}},

I'm reaching out on behalf of {{business_name}} to thank you for your recent visit.

They would greatly appreciate hearing about your experience. Would you mind sharing your feedback?

{{review_url}}

Your review helps {{business_name}} continue to provide excellent service.

Thank you for your time!`,
      is_default: false,
      is_active: true,
    },
    // ===== ON BEHALF OF - SMS =====
    {
      name: "On behalf of client",
      communication_type: "sms",
      template_type: "on_behalf_of",
      subject_template: "Feedback request for {{business_name}}",
      message_template: "Hi {{customer_name}}! Reaching out on behalf of {{business_name}} - they'd love to hear your feedback: {{review_url}} Thank you!",
      is_default: false,
      is_active: true,
    },
    // ===== THANK YOU - Email =====
    {
      name: "Thank you message",
      communication_type: "email",
      template_type: "thank_you",
      subject_template: "Thank you from {{business_name}}!",
      message_template: `Hi {{customer_name}},

Thank you so much for being a valued customer of {{business_name}}! We truly appreciate your business.

If you have a moment, we'd be grateful if you could share your experience: {{review_url}}

Your feedback helps us serve you and others better.

With gratitude,
{{business_name}}`,
      is_default: false,
      is_active: true,
    },
    // ===== THANK YOU - SMS =====
    {
      name: "Thank you message",
      communication_type: "sms",
      template_type: "thank_you",
      subject_template: "Thank you from {{business_name}}!",
      message_template: "Thank you for choosing {{business_name}}, {{customer_name}}! We'd be grateful for your feedback: {{review_url}}",
      is_default: false,
      is_active: true,
    },
  ];
}
