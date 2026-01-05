/**
 * Fun Facts API Route
 *
 * Handles CRUD operations for fun facts at the account level.
 * Fun facts are stored in businesses.fun_facts as JSONB.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/auth/providers/supabase";
import { verifyAccountAuth } from "../middleware/auth";
import { FunFact, CreateFunFactRequest, DeleteFunFactRequest } from "@/types/funFacts";
import { v4 as uuidv4 } from "uuid";

/**
 * GET - Fetch all fun facts for the authenticated account
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAccountAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.errorCode || 401 }
      );
    }

    const { accountId } = authResult;
    if (!accountId) {
      return NextResponse.json(
        { error: "Account access required" },
        { status: 403 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: business, error } = await supabase
      .from("businesses")
      .select("fun_facts")
      .eq("account_id", accountId)
      .single();

    if (error) {
      console.error("[FUN_FACTS] Error fetching fun facts:", error);
      return NextResponse.json(
        { error: "Failed to fetch fun facts", details: error.message },
        { status: 500 }
      );
    }

    const facts: FunFact[] = Array.isArray(business?.fun_facts)
      ? business.fun_facts
      : [];

    return NextResponse.json({ facts });
  } catch (error) {
    console.error("[FUN_FACTS] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Add a new fun fact to the account library
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAccountAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.errorCode || 401 }
      );
    }

    const { accountId } = authResult;
    if (!accountId) {
      return NextResponse.json(
        { error: "Account access required" },
        { status: 403 }
      );
    }

    const body: CreateFunFactRequest = await request.json();

    if (!body.label?.trim() || !body.value?.trim()) {
      return NextResponse.json(
        { error: "Label and value are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get current fun facts
    const { data: business, error: fetchError } = await supabase
      .from("businesses")
      .select("fun_facts")
      .eq("account_id", accountId)
      .single();

    if (fetchError) {
      console.error("[FUN_FACTS] Error fetching business:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch business", details: fetchError.message },
        { status: 500 }
      );
    }

    const existingFacts: FunFact[] = Array.isArray(business?.fun_facts)
      ? business.fun_facts
      : [];

    // Create new fact
    const newFact: FunFact = {
      id: uuidv4(),
      label: body.label.trim(),
      value: body.value.trim(),
      created_at: new Date().toISOString(),
    };

    // Add to array
    const updatedFacts = [...existingFacts, newFact];

    // Update business
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ fun_facts: updatedFacts })
      .eq("account_id", accountId);

    if (updateError) {
      console.error("[FUN_FACTS] Error updating fun facts:", updateError);
      return NextResponse.json(
        { error: "Failed to add fun fact", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ fact: newFact, facts: updatedFacts });
  } catch (error) {
    console.error("[FUN_FACTS] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a fun fact from the account library
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAccountAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.errorCode || 401 }
      );
    }

    const { accountId } = authResult;
    if (!accountId) {
      return NextResponse.json(
        { error: "Account access required" },
        { status: 403 }
      );
    }

    const body: DeleteFunFactRequest = await request.json();

    if (!body.factId) {
      return NextResponse.json(
        { error: "Fact ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get current fun facts
    const { data: business, error: fetchError } = await supabase
      .from("businesses")
      .select("fun_facts")
      .eq("account_id", accountId)
      .single();

    if (fetchError) {
      console.error("[FUN_FACTS] Error fetching business:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch business", details: fetchError.message },
        { status: 500 }
      );
    }

    const existingFacts: FunFact[] = Array.isArray(business?.fun_facts)
      ? business.fun_facts
      : [];

    // Remove the fact
    const updatedFacts = existingFacts.filter((f) => f.id !== body.factId);

    if (updatedFacts.length === existingFacts.length) {
      return NextResponse.json({ error: "Fun fact not found" }, { status: 404 });
    }

    // Update business
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ fun_facts: updatedFacts })
      .eq("account_id", accountId);

    if (updateError) {
      console.error("[FUN_FACTS] Error updating fun facts:", updateError);
      return NextResponse.json(
        { error: "Failed to delete fun fact", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, facts: updatedFacts });
  } catch (error) {
    console.error("[FUN_FACTS] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update an existing fun fact
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAccountAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.errorCode || 401 }
      );
    }

    const { accountId } = authResult;
    if (!accountId) {
      return NextResponse.json(
        { error: "Account access required" },
        { status: 403 }
      );
    }

    const body: { factId: string; label?: string; value?: string } = await request.json();

    if (!body.factId) {
      return NextResponse.json(
        { error: "Fact ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get current fun facts
    const { data: business, error: fetchError } = await supabase
      .from("businesses")
      .select("fun_facts")
      .eq("account_id", accountId)
      .single();

    if (fetchError) {
      console.error("[FUN_FACTS] Error fetching business:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch business", details: fetchError.message },
        { status: 500 }
      );
    }

    const existingFacts: FunFact[] = Array.isArray(business?.fun_facts)
      ? business.fun_facts
      : [];

    // Find and update the fact
    const factIndex = existingFacts.findIndex((f) => f.id === body.factId);
    if (factIndex === -1) {
      return NextResponse.json({ error: "Fun fact not found" }, { status: 404 });
    }

    const updatedFact = {
      ...existingFacts[factIndex],
      label: body.label?.trim() || existingFacts[factIndex].label,
      value: body.value?.trim() || existingFacts[factIndex].value,
    };

    const updatedFacts = [...existingFacts];
    updatedFacts[factIndex] = updatedFact;

    // Update business
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ fun_facts: updatedFacts })
      .eq("account_id", accountId);

    if (updateError) {
      console.error("[FUN_FACTS] Error updating fun facts:", updateError);
      return NextResponse.json(
        { error: "Failed to update fun fact", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ fact: updatedFact, facts: updatedFacts });
  } catch (error) {
    console.error("[FUN_FACTS] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
