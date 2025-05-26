interface BusinessProfile {
  business_name: string;
  services_offered: string[];
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

  // Defensive: ensure all fields are strings and never undefined/null
  const businessName = businessProfile.business_name || '';
  const yearsInBusiness = businessProfile.years_in_business || '';
  const services = businessProfile.services_offered || '';
  const companyValues = businessProfile.company_values || '';
  const differentiators = businessProfile.differentiators || '';
  const industriesServed = businessProfile.industries_served || '';
  const teamFounderInfo = businessProfile.team_founder_info || '';
  const keywords = businessProfile.keywords || '';
  const projectType = promptPageData.project_type || '';
  const outcomes = promptPageData.outcomes || '';
  const safePlatform = platform || '';
  const safeCustomInstructions = customInstructions || '';
  const safeReviewerType = reviewerType || 'customer or client';

  let customerName = '';
  if (promptPageData.first_name && promptPageData.last_name) {
    customerName = `- Customer Name: ${promptPageData.first_name} ${promptPageData.last_name}\n`;
  } else if (promptPageData.first_name) {
    customerName = `- Customer Name: ${promptPageData.first_name}\n`;
  } else if (promptPageData.last_name) {
    customerName = `- Customer Name: ${promptPageData.last_name}\n`;
  }

  return `You are a satisfied ${safeReviewerType} writing a review for ${businessName}.
Please write a genuine, detailed, and positive review based on the following information:

Business Information:
- Business Name: ${businessName}
- Years in Business: ${yearsInBusiness}
- Services: ${services}
- Company Values: ${companyValues}
- What Makes Them Different: ${differentiators}
- Industries Served: ${industriesServed}
${industryInfo ? industryInfo + '\n' : ''}- Team/Founder Info: ${teamFounderInfo}
- Keywords to Include: ${keywords}

Customer Experience:
${customerName}- Service Received: ${projectType}
- Outcome/Results: ${outcomes}

Platform: ${safePlatform}
Word Count Limit: ${wordCountLimit} words
${safeCustomInstructions ? `\nCustom Instructions: ${safeCustomInstructions}` : ''}

Important: The reviewer is a ${safeReviewerType}. If unsure, avoid using either term or use "customer or client".

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