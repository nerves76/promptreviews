import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabaseClient";

const supabase = createClient();
import OpenAI from "openai";

export async function POST(request: Request) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
  try {
    const { pageId, platforms } = await request.json();

    // Fetch the prompt page data
    const { data: page, error: pageError } = await supabase
      .from("prompt_pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (pageError) {
      throw new Error("Failed to fetch prompt page");
    }

    // Generate reviews for each platform
    const reviews = await Promise.all(
      platforms.map(async (platform: string) => {
        const prompt = `You are writing a positive customer review from the perspective of a satisfied client. This review will be posted on ${platform}, so keep the tone and length appropriate for that platform.\n\nUse this tone of voice: ${page.tone_of_voice}\n\nBelow is information about the business being reviewed:\n- Client Name: ${page.client_name}\n- Location: ${page.location}\n- Project Type: ${page.project_type}\n- Services Offered: ${(page.features_or_benefits || "").split("\n").join(", ")}\n- Product Description: ${page.product_description}\n- Date Completed: ${page.date_completed}\n- Team Member: ${page.team_member || "Not specified"}\n\nWrite the review as if the customer/client is speaking. Make it sound authentic and natural. Do not mention that it was generated. Do not include the business name in every sentence. Focus on how the client felt and what they appreciated most. Keep it concise.`;

        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4",
          temperature: 0.7,
          max_tokens: 250,
        });

        return {
          platform,
          text: completion.choices[0].message.content || "",
        };
      }),
    );

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error in POST /api/generate-reviews:", error);
    return NextResponse.json(
      { error: "Failed to generate reviews" },
      { status: 500 },
    );
  }
}
