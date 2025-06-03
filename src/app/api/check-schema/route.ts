import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check contacts table schema
    const { data: contactsSchema, error: contactsSchemaError } =
      await supabase.rpc("get_table_schema", { table_name: "contacts" });

    // Check prompt_pages table schema
    const { data: promptPagesSchema, error: promptPagesSchemaError } =
      await supabase.rpc("get_table_schema", { table_name: "prompt_pages" });

    return NextResponse.json({
      contacts: {
        exists: !contactsSchemaError,
        error: contactsSchemaError?.message,
        schema: contactsSchema,
      },
      prompt_pages: {
        exists: !promptPagesSchemaError,
        error: promptPagesSchemaError?.message,
        schema: promptPagesSchema,
      },
    });
  } catch (error) {
    console.error("Error checking schema:", error);
    return NextResponse.json(
      {
        error: "Failed to check schema",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
