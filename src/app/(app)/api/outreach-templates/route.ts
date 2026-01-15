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
// Focus: How reviews help small businesses grow
function getDefaultTemplateContent() {
  return [
    // ===== INITIAL ASK - Email =====
    {
      name: "Personal impact",
      communication_type: "email",
      template_type: "initial_ask",
      subject_template: "Your experience could help us grow",
      message_template: `Hi {{customer_name}},

As a small business, we don't have huge advertising budgets or big marketing campaigns. What we have are real customers like you sharing real experiences.

A quick review from you would directly help us grow and continue doing what we love.

If you're willing, it only takes about 60 seconds:
{{review_url}}

Thank you for being part of our story.

Sincerely,
{{business_name}}`,
      is_default: true,
      is_active: true,
    },
    {
      name: "Mission-driven",
      communication_type: "email",
      template_type: "initial_ask",
      subject_template: "Help a small team make a big impact",
      message_template: `Hi {{customer_name}},

We started {{business_name}} with a simple goal: to take great care of people and do work we're proud of.

Reviews from customers like you are what allow that mission to continue.

When you share your experience, you're not just leaving a rating—you're helping a small, hardworking team grow and serve more people.

If you have a moment, we'd be honored to hear your thoughts:
{{review_url}}

Thank you for choosing small business!

Gratefully,
{{business_name}}`,
      is_default: false,
      is_active: true,
    },
    {
      name: "Direct from owner",
      communication_type: "email",
      template_type: "initial_ask",
      subject_template: "A personal request",
      message_template: `Hi {{customer_name}},

I wanted to personally thank you for choosing {{business_name}}.

As a small business, we grow almost entirely through word of mouth and honest reviews from thoughtful customers like you.

If you're willing to take a minute to share your experience, it would mean a great deal to me and to everyone here.

You can leave a review here:
{{review_url}}

Thank you again for trusting us.

Sincerely,
{{business_name}}`,
      is_default: false,
      is_active: true,
    },
    // ===== INITIAL ASK - SMS =====
    {
      name: "Small business ask",
      communication_type: "sms",
      template_type: "initial_ask",
      subject_template: "Would you share your experience?",
      message_template: "Hi {{customer_name}}! As a small business, reviews from customers like you help us grow. Would you share your experience? {{review_url}} Thank you!",
      is_default: true,
      is_active: true,
    },
    {
      name: "Personal request",
      communication_type: "sms",
      template_type: "initial_ask",
      subject_template: "A quick review would mean so much",
      message_template: "Hi {{customer_name}}, thank you for choosing {{business_name}}! A quick review would mean so much to our small team: {{review_url}}",
      is_default: false,
      is_active: true,
    },
    // ===== FOLLOW UP - Email =====
    {
      name: "Gentle follow-up",
      communication_type: "email",
      template_type: "follow_up",
      subject_template: "Still hoping to hear from you",
      message_template: `Hi {{customer_name}},

I wanted to follow up on my earlier message. As a small business, every review makes a real difference in helping new customers find us.

If you have just a minute, we'd truly appreciate hearing about your experience:
{{review_url}}

Thank you for supporting small business!

Warmly,
{{business_name}}`,
      is_default: false,
      is_active: true,
    },
    // ===== FOLLOW UP - SMS =====
    {
      name: "Gentle follow-up",
      communication_type: "sms",
      template_type: "follow_up",
      subject_template: "Just a gentle reminder",
      message_template: "Hi {{customer_name}}! Just a gentle reminder - your review would help our small business grow: {{review_url}} Thank you!",
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

As a small business, they rely on reviews from customers like you to grow and reach new people.

Would you mind sharing your experience? It only takes about 60 seconds:
{{review_url}}

Your review helps {{business_name}} continue doing what they love.

Thank you for your time!`,
      is_default: false,
      is_active: true,
    },
    // ===== ON BEHALF OF - SMS =====
    {
      name: "On behalf of client",
      communication_type: "sms",
      template_type: "on_behalf_of",
      subject_template: "Your feedback would mean so much",
      message_template: "Hi {{customer_name}}! Reaching out on behalf of {{business_name}} - as a small business, your review would mean so much: {{review_url}} Thank you!",
      is_default: false,
      is_active: true,
    },
    // ===== THANK YOU - Email =====
    {
      name: "Warm gratitude",
      communication_type: "email",
      template_type: "thank_you",
      subject_template: "A small favor that makes a big difference",
      message_template: `Hi {{customer_name}},

Running a small business means every customer truly matters.

That's why I'm reaching out personally.

If you have a minute, would you consider sharing a quick review about your experience with us? Reviews help other customers find us online and learn about our services.

Your honest feedback would mean more than you might realize.

We use a tool that makes writing and posting reviews super quick & easy. Here's a simple link:
{{review_url}}

Thank you for supporting a small business and for being the kind of customer we're grateful to have.

Warmly,
{{business_name}}`,
      is_default: false,
      is_active: true,
    },
    // ===== THANK YOU - SMS =====
    {
      name: "Warm gratitude",
      communication_type: "sms",
      template_type: "thank_you",
      subject_template: "Thank you for supporting small business",
      message_template: "Hi {{customer_name}}! Thank you for supporting {{business_name}}. A quick review would mean so much to our small business: {{review_url}}",
      is_default: false,
      is_active: true,
    },
  ];
}
