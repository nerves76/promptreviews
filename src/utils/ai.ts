interface BusinessProfile {
  business_name: string;
  features_or_benefits: string[];
  company_values: string;
  differentiators: string;
  years_in_business: number;
  industries_served: string;
  taglines: string;
  team_founder_info: string;
  keywords: string;
  industry?: string[];
  industry_other?: string;
  ai_dos?: string;
  ai_donts?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
}

interface PromptPageData {
  first_name: string;
  last_name?: string;
  role?: string;
  project_type: string;
  product_description: string;
}

export function generateReviewPrompt(
  businessProfile: BusinessProfile,
  promptPageData: PromptPageData,
  platform: string,
  wordCountLimit: number,
  customInstructions?: string,
  reviewerType?: "customer" | "client" | "customer or client",
  additional_ai_dos?: string,
  additional_ai_donts?: string,
): string {
  // Compose industry info
  let industryInfo = "";
  if (businessProfile.industry && businessProfile.industry.length > 0) {
    industryInfo += `- Industry: ${businessProfile.industry.join(", ")}`;
  }
  if (businessProfile.industry_other && businessProfile.industry_other.trim()) {
    industryInfo += `\n- Other Industry: ${businessProfile.industry_other}`;
  }

  // Defensive: ensure all fields are strings and never undefined/null
  // Use meaningful defaults when business profile is incomplete
  const businessName = businessProfile.business_name || "";
  const yearsInBusiness = businessProfile.years_in_business || "";
  const services = businessProfile.features_or_benefits || "professional services";
  const companyValues = businessProfile.company_values || "excellence and customer care";
  const differentiators = businessProfile.differentiators || "personalized approach and attention to detail";
  const industriesServed = businessProfile.industries_served || "";
  const teamFounderInfo = businessProfile.team_founder_info || "";
  const keywords = businessProfile.keywords || "";
  const projectType = promptPageData.project_type || "service";
  const productDescription = promptPageData.product_description || "excellent results";
  const safePlatform = platform || "";
  const safeCustomInstructions = customInstructions || "";
  const safeReviewerType = reviewerType || "customer or client";
  const aiDos = businessProfile.ai_dos || "";
  const aiDonts = businessProfile.ai_donts || "";
  const additionalDos = additional_ai_dos || "";
  const additionalDonts = additional_ai_donts || "";
  const city = businessProfile.address_city || "";
  const state = businessProfile.address_state || "";
  const zip = businessProfile.address_zip || "";

  let reviewerName = "";
  if (promptPageData.first_name && promptPageData.last_name) {
    reviewerName = `- Your Name (the reviewer): ${promptPageData.first_name} ${promptPageData.last_name}\n`;
  } else if (promptPageData.first_name) {
    reviewerName = `- Your Name (the reviewer): ${promptPageData.first_name}\n`;
  } else if (promptPageData.last_name) {
    reviewerName = `- Your Name (the reviewer): ${promptPageData.last_name}\n`;
  }

  let reviewerRole = "";
  if (promptPageData.role) {
    reviewerRole = `- Reviewer Role/Position: ${promptPageData.role}\n`;
  }

  return `You are a satisfied ${safeReviewerType} writing a review for ${businessName}.
Write a genuine review based on the following information:

Business Information:
- Business Name: ${businessName}
${city ? `- City: ${city}\n` : ""}${state ? `- State: ${state}\n` : ""}${zip ? `- ZIP: ${zip}\n` : ""}- Years in Business: ${yearsInBusiness}
- Services: ${services}
- Company Values: ${companyValues}
- What Makes Them Different: ${differentiators}
- Industries Served: ${industriesServed}
${industryInfo ? industryInfo + "\n" : ""}- Team/Founder Info: ${teamFounderInfo}
- Keywords: ${keywords}

Your Experience (you are the reviewer):
${reviewerName}${reviewerRole}- Service Received: ${projectType}
- Outcome/Results: ${productDescription}

Platform: ${safePlatform}
Word Limit: ${wordCountLimit} words
${safeCustomInstructions ? `\nCustom Instructions: ${safeCustomInstructions}` : ""}
${aiDos ? `\nDos: ${aiDos}` : ""}
${additionalDos ? `\nAdditional Dos: ${additionalDos}` : ""}
${aiDonts ? `\nDon'ts: ${aiDonts}` : ""}
${additionalDonts ? `\nAdditional Don'ts: ${additionalDonts}` : ""}

WRITING STYLE - Make it sound human:
- Use active voice. Say "They fixed my issue" not "My issue was fixed by them"
- Be direct and concise. Cut the fluff.
- Vary sentence length. Mix short punchy sentences with longer ones.
- Start mid-thought, not with "I". Instead of "I recently visited..." try "Called them when my pipe burst..." or "Third time using them and..."
- Sound conversational, not polished. Real reviews aren't perfect prose.
- Include at least one keyword naturally. Add more (up to 3) only if they fit without forcing.

THINGS TO AVOID - These make reviews sound fake:
- NO marketing language ("exceptional", "unparalleled", "top-notch", "exceeded expectations")
- NO superlative stacking (don't use "amazing", "incredible", "outstanding" all in one review)
- NO AI filler phrases ("I had the pleasure of", "I cannot recommend them enough", "From start to finish")
- NO clichés ("went above and beyond", "exceeded my expectations", "top-notch service")
- NO summary endings ("Highly recommend!", "Will definitely be back!", "5 stars!")
- NO semicolons, em-dashes, or overly complex punctuation
- NO hashtags or emojis
- NO brackets, placeholders, or variables like [service], [product], [name] - NEVER use square brackets in the output
- NO meta text like "Here is your review"
- If specific details are missing, use vague but natural language instead of placeholders

WHAT MAKES IT FEEL REAL:
- If team/founder info is provided above, you may reference them by name
- Use only concrete details that were explicitly provided - never invent names, dates, or specifics
- It's okay to mention a minor friction point if it makes sense ("parking was tough but worth it", "took a couple days but they got it right")
- End naturally. Real reviews often just stop. No wrap-up needed.

The review must be complete and ready to post. Use only the information provided. If details are missing, write generally but naturally without indicating anything is missing.

Write the review now:`;
}

export async function generateAIReview(
  businessProfile: BusinessProfile,
  promptPageData: PromptPageData,
  platform: string,
  wordCountLimit: number,
  customInstructions?: string,
  reviewerType?: "customer" | "client" | "customer or client",
  additional_ai_dos?: string,
  additional_ai_donts?: string,
): Promise<string> {
  try {
    const prompt = generateReviewPrompt(
      businessProfile,
      promptPageData,
      platform,
      wordCountLimit,
      customInstructions,
      reviewerType,
      additional_ai_dos,
      additional_ai_donts,
    );

    const response = await fetch("/api/generate-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, wordCountLimit }),
    });
    const data = await response.json();
    if (!response.ok || !data.text) {
      throw new Error(data.error || "Failed to generate review");
    }

    // Ensure the review is within the word count limit
    const words = data.text.split(/\s+/);
    if (words.length > wordCountLimit) {
      return words.slice(0, wordCountLimit).join(" ") + "...";
    }

    return data.text;
  } catch (error) {
    console.error("Error generating AI review:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to generate review. Please try again.",
    );
  }
}
