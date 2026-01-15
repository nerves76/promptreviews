import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/auth/providers/supabase";
import { getRequestAccountId } from "@/app/(app)/api/utils/getRequestAccountId";

// PATCH: Update a template
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const { name, communication_type, template_type, subject_template, message_template } = body;

    // Verify template belongs to this account
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("communication_templates")
      .select("*")
      .eq("id", id)
      .eq("account_id", accountId)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Build update object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (communication_type !== undefined) {
      if (!["email", "sms"].includes(communication_type)) {
        return NextResponse.json(
          { error: "Invalid communication_type. Must be 'email' or 'sms'" },
          { status: 400 }
        );
      }
      updateData.communication_type = communication_type;
    }
    if (template_type !== undefined) updateData.template_type = template_type;
    if (subject_template !== undefined) updateData.subject_template = subject_template;
    if (message_template !== undefined) updateData.message_template = message_template;

    const { data: template, error } = await supabase
      .from("communication_templates")
      .update(updateData)
      .eq("id", id)
      .eq("account_id", accountId)
      .select()
      .single();

    if (error) {
      console.error("Error updating template:", error);
      return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error: any) {
    console.error("Error in PATCH /outreach-templates/[id]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete a template (soft delete by setting is_active to false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Verify template belongs to this account
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("communication_templates")
      .select("*")
      .eq("id", id)
      .eq("account_id", accountId)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("communication_templates")
      .update({ is_active: false })
      .eq("id", id)
      .eq("account_id", accountId);

    if (error) {
      console.error("Error deleting template:", error);
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in DELETE /outreach-templates/[id]:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
