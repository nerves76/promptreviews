interface BusinessProfile {
  business_name: string;
  services_offered: string;
  company_values: string;
  differentiators: string;
  years_in_business: number;
  industries_served: string;
  taglines: string;
  team_founder_info: string;
  keywords: string;
  industry?: string[];
  industry_other?: string;
}

interface PromptPageData {
  first_name: string;
  last_name: string;
  project_type: string;
  outcomes: string;
}

export function generateReviewPrompt(
  businessProfile: BusinessProfile,
  promptPageData: PromptPageData,
  platform: string,
  wordCountLimit: number,
  customInstructions?: string,
  reviewerType?: 'customer' | 'client' | 'customer or client',
): string {
  // Compose industry info
  let industryInfo = '';
  if (businessProfile.industry && businessProfile.industry.length > 0) {
    industryInfo += `- Industry: ${businessProfile.industry.join(', ')}`;
  }
  if (businessProfile.industry_other && businessProfile.industry_other.trim()) {
    industryInfo += `\n- Other Industry: ${businessProfile.industry_other}`;
  }

  return `You are a satisfied ${reviewerType || 'customer or client'} writing a review for ${businessProfile.business_name}.
Please write a genuine, detailed, and positive review based on the following information:

Business Information:
- Business Name: ${businessProfile.business_name}
- Years in Business: ${businessProfile.years_in_business}
- Services: ${businessProfile.services_offered}
- Company Values: ${businessProfile.company_values}
- What Makes Them Different: ${businessProfile.differentiators}
- Industries Served: ${businessProfile.industries_served}
${industryInfo ? industryInfo + '\n' : ''}- Team/Founder Info: ${businessProfile.team_founder_info}
- Keywords to Include: ${businessProfile.keywords}

Customer Experience:
- Customer Name: ${promptPageData.first_name} ${promptPageData.last_name}
- Service Received: ${promptPageData.project_type}
- Outcome/Results: ${promptPageData.outcomes}

Platform: ${platform}
Word Count Limit: ${wordCountLimit} words
${customInstructions ? `\nCustom Instructions: ${customInstructions}` : ''}

Important: The reviewer is a ${reviewerType || 'customer or client'}. If unsure, avoid using either term or use "customer or client".

Please write a review that:
1. Sounds authentic and personal
2. Includes specific details about the service and outcome
3. Mentions the business name and relevant keywords naturally
4. Highlights the company's values and differentiators
5. Is appropriate for the specified platform
6. Maintains a professional but warm tone
7. Stays within the ${wordCountLimit} word limit

The review should be detailed and specific, focusing on the actual experience and results.`;
}

export async function generateAIReview(
  businessProfile: BusinessProfile,
  promptPageData: PromptPageData,
  platform: string,
  wordCountLimit: number,
  customInstructions?: string,
  reviewerType?: 'customer' | 'client' | 'customer or client',
): Promise<string> {
  try {
    const prompt = generateReviewPrompt(
      businessProfile,
      promptPageData,
      platform,
      wordCountLimit,
      customInstructions,
      reviewerType
    );

    const response = await fetch('/api/generate-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, wordCountLimit }),
    });
    const data = await response.json();
    if (!response.ok || !data.text) {
      throw new Error(data.error || 'Failed to generate review');
    }

    // Ensure the review is within the word count limit
    const words = data.text.split(/\s+/);
    if (words.length > wordCountLimit) {
      return words.slice(0, wordCountLimit).join(' ') + '...';
    }

    return data.text;
  } catch (error) {
    console.error('Error generating AI review:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate review. Please try again.');
  }
}