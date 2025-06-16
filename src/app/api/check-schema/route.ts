import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            cookieStore.set({ name, value, ...options });
          },
          remove: (name, options) => {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      },
    );

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
