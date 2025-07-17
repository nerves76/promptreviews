/**
 * @fileoverview
 * AI-Powered Post Generator for Google Business Profile
 * Generates context-aware, engaging posts using business information and industry best practices
 */

import type { 
  PostType, 
  CallToActionType, 
  CreateLocalPostRequest, 
  BusinessLocation,
  PostTemplate 
} from './googleBusinessProfile';

interface BusinessContext {
  name: string;
  category: string;
  industry?: string;
  location?: {
    city: string;
    state: string;
  };
  website?: string;
  phone?: string;
  description?: string;
  specialties?: string[];
  targetAudience?: string;
}

interface PostGenerationOptions {
  postType: PostType;
  tone: 'professional' | 'friendly' | 'casual' | 'promotional' | 'informative';
  length: 'short' | 'medium' | 'long';
  includeCallToAction: boolean;
  includeEmojis: boolean;
  seasonalContext?: string;
  specificTopic?: string;
  targetKeywords?: string[];
}

interface GeneratedPost {
  content: string;
  callToAction?: {
    actionType: CallToActionType;
    url?: string;
  };
  suggestedHashtags?: string[];
  mediaRecommendations?: {
    type: 'image' | 'video';
    description: string;
  }[];
}

export class AIPostGenerator {
  private industryTemplates: Map<string, PostTemplate[]> = new Map();
  private seasonalPrompts: Map<string, string[]> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeSeasonalPrompts();
  }

  /**
   * Initialize industry-specific post templates
   */
  private initializeTemplates(): void {
    // Restaurant templates
    this.industryTemplates.set('restaurant', [
      {
        id: 'rest-special',
        name: 'Daily Special',
        content: "🍽️ Today's Special: {special}! Made with fresh, local ingredients. {description} Available until {time} or while supplies last!",
        postType: 'WHATS_NEW',
        callToAction: { actionType: 'ORDER_ONLINE' },
        industry: 'restaurant',
        variables: ['special', 'description', 'time']
      },
      {
        id: 'rest-event',
        name: 'Restaurant Event',
        content: "🎉 Join us for {eventName} on {date}! {description} Reserve your table now - space is limited!",
        postType: 'EVENT',
        callToAction: { actionType: 'BOOK' },
        industry: 'restaurant',
        variables: ['eventName', 'date', 'description']
      }
    ]);

    // Retail templates
    this.industryTemplates.set('retail', [
      {
        id: 'retail-sale',
        name: 'Sale Announcement',
        content: "🛍️ SALE ALERT! Get {discount}% off {products}! Limited time offer - shop now before it's gone! 💨",
        postType: 'OFFER',
        callToAction: { actionType: 'BUY' },
        industry: 'retail',
        variables: ['discount', 'products']
      },
      {
        id: 'retail-new-arrival',
        name: 'New Arrivals',
        content: "✨ NEW ARRIVALS! Just in: {products}. Perfect for {season/occasion}. Come see what's new! 👀",
        postType: 'PRODUCT',
        callToAction: { actionType: 'LEARN_MORE' },
        industry: 'retail',
        variables: ['products', 'season/occasion']
      }
    ]);

    // Service business templates
    this.industryTemplates.set('service', [
      {
        id: 'service-tip',
        name: 'Expert Tip',
        content: "💡 Pro Tip: {tip} This simple trick can {benefit}. Need professional help? We're here for you!",
        postType: 'WHATS_NEW',
        callToAction: { actionType: 'CALL' },
        industry: 'service',
        variables: ['tip', 'benefit']
      },
      {
        id: 'service-offer',
        name: 'Service Promotion',
        content: "🔧 Special Offer: {discount}% off {service}! Perfect time to {benefit}. Book your appointment today!",
        postType: 'OFFER',
        callToAction: { actionType: 'BOOK' },
        industry: 'service',
        variables: ['discount', 'service', 'benefit']
      }
    ]);
  }

  /**
   * Initialize seasonal content prompts
   */
  private initializeSeasonalPrompts(): void {
    this.seasonalPrompts.set('spring', [
      'spring cleaning', 'fresh starts', 'renewal', 'growth', 'outdoor activities',
      'warmer weather', 'blooming', 'Easter', 'Mother\'s Day'
    ]);
    
    this.seasonalPrompts.set('summer', [
      'vacation', 'outdoor dining', 'beach trips', 'BBQ season', 'longer days',
      'ice cream', 'swimming', 'Father\'s Day', 'graduation', 'wedding season'
    ]);
    
    this.seasonalPrompts.set('fall', [
      'back to school', 'harvest season', 'pumpkins', 'Halloween', 'cozy weather',
      'autumn leaves', 'apple picking', 'Thanksgiving', 'comfort food'
    ]);
    
    this.seasonalPrompts.set('winter', [
      'holiday shopping', 'warm drinks', 'Christmas', 'New Year', 'cozy indoors',
      'gift giving', 'family gatherings', 'winter activities', 'comfort'
    ]);
  }

  /**
   * Generate a post based on business context and options
   */
  async generatePost(
    business: BusinessContext,
    options: PostGenerationOptions
  ): Promise<GeneratedPost> {
    const template = this.selectTemplate(business.industry || business.category, options.postType);
    const content = await this.generateContent(business, options, template);
    const callToAction = options.includeCallToAction ? this.generateCallToAction(business, options.postType) : undefined;
    const hashtags = this.generateHashtags(business, options);
    const mediaRecommendations = this.generateMediaRecommendations(business, options.postType);

    return {
      content,
      callToAction,
      suggestedHashtags: hashtags,
      mediaRecommendations
    };
  }

  /**
   * Select appropriate template based on industry and post type
   */
  private selectTemplate(industry: string, postType: PostType): PostTemplate | null {
    const industryKey = this.mapIndustryToKey(industry);
    const templates = this.industryTemplates.get(industryKey);
    
    if (!templates) return null;
    
    return templates.find(t => t.postType === postType) || templates[0];
  }

  /**
   * Map business category to industry key
   */
  private mapIndustryToKey(category: string): string {
    const lowerCategory = category.toLowerCase();
    
    if (lowerCategory.includes('restaurant') || lowerCategory.includes('food') || 
        lowerCategory.includes('cafe') || lowerCategory.includes('bar')) {
      return 'restaurant';
    }
    
    if (lowerCategory.includes('retail') || lowerCategory.includes('store') || 
        lowerCategory.includes('shop') || lowerCategory.includes('boutique')) {
      return 'retail';
    }
    
    return 'service'; // Default to service business
  }

  /**
   * Generate post content using AI-like logic
   */
  private async generateContent(
    business: BusinessContext,
    options: PostGenerationOptions,
    template: PostTemplate | null
  ): Promise<string> {
    const currentSeason = this.getCurrentSeason();
    const seasonalContext = options.seasonalContext || currentSeason;
    
    if (template && options.length !== 'long') {
      return this.fillTemplate(template, business, options);
    }

    // Generate custom content based on post type and context
    return this.generateCustomContent(business, options, seasonalContext);
  }

  /**
   * Fill template with business-specific information
   */
  private fillTemplate(template: PostTemplate, business: BusinessContext, options: PostGenerationOptions): string {
    let content = template.content;
    
    // Replace common variables
    content = content.replace(/{businessName}/g, business.name);
    content = content.replace(/{location}/g, business.location ? `${business.location.city}, ${business.location.state}` : '');
    
    // Add seasonal context if requested
    if (options.seasonalContext) {
      const seasonalKeywords = this.seasonalPrompts.get(options.seasonalContext) || [];
      const randomKeyword = seasonalKeywords[Math.floor(Math.random() * seasonalKeywords.length)];
      content = content.replace(/{season\/occasion}/g, randomKeyword);
    }
    
    // Adjust tone
    content = this.adjustToneAndEmojis(content, options);
    
    return content;
  }

  /**
   * Generate custom content from scratch
   */
  private generateCustomContent(
    business: BusinessContext,
    options: PostGenerationOptions,
    seasonalContext: string
  ): string {
    const openers = this.getOpeners(options.postType, options.tone);
    const businessContext = this.getBusinessContext(business);
    const callToActionText = this.getCallToActionText(options.postType);
    const seasonalElements = this.seasonalPrompts.get(seasonalContext) || [];
    
    const opener = openers[Math.floor(Math.random() * openers.length)];
    const seasonal = seasonalElements[Math.floor(Math.random() * seasonalElements.length)];
    
    let content = `${opener} `;
    
    // Add business-specific content
    if (options.postType === 'WHATS_NEW') {
      content += `${businessContext}! Perfect for ${seasonal}. `;
    } else if (options.postType === 'OFFER') {
      content += `Special offer on ${businessContext}! Don't miss out on this ${seasonal} deal. `;
    } else if (options.postType === 'EVENT') {
      content += `Join us for our ${seasonal} event! ${businessContext}. `;
    } else if (options.postType === 'PRODUCT') {
      content += `Check out our ${businessContext}! Great for ${seasonal}. `;
    }
    
    content += callToActionText;
    
    return this.adjustToneAndEmojis(content, options);
  }

  /**
   * Get opening phrases based on post type and tone
   */
  private getOpeners(postType: PostType, tone: string): string[] {
    const openerMap: Record<string, Record<PostType, string[]>> = {
      professional: {
        'WHATS_NEW': ['We\'re excited to announce', 'Introducing', 'We\'re pleased to share'],
        'OFFER': ['Limited time offer', 'Special promotion', 'Exclusive deal'],
        'EVENT': ['Join us for', 'We invite you to', 'Don\'t miss'],
        'PRODUCT': ['Discover our', 'Explore our latest', 'New arrival']
      },
      friendly: {
        'WHATS_NEW': ['Hey everyone!', 'Guess what?', 'We\'ve got news!'],
        'OFFER': ['Amazing deal alert!', 'You don\'t want to miss this!', 'Special just for you!'],
        'EVENT': ['Come hang out with us!', 'Party time!', 'Join the fun!'],
        'PRODUCT': ['Check this out!', 'You\'re going to love this!', 'Something special!']
      },
      casual: {
        'WHATS_NEW': ['What\'s up?', 'Hey there!', 'Quick update!'],
        'OFFER': ['Deal time!', 'Save some cash!', 'Why not treat yourself?'],
        'EVENT': ['Let\'s party!', 'Come through!', 'See you there!'],
        'PRODUCT': ['New stuff!', 'Fresh arrival!', 'Just dropped!']
      },
      promotional: {
        'WHATS_NEW': ['BIG NEWS!', 'ANNOUNCEMENT!', 'BREAKING:'],
        'OFFER': ['SALE ALERT!', 'HUGE SAVINGS!', 'DON\'T MISS OUT!'],
        'EVENT': ['EXCLUSIVE EVENT!', 'LIMITED SPOTS!', 'REGISTER NOW!'],
        'PRODUCT': ['NEW ARRIVAL!', 'JUST IN!', 'FRESH STOCK!']
      },
      informative: {
        'WHATS_NEW': ['Important update:', 'Here\'s what\'s new:', 'Latest news:'],
        'OFFER': ['Current promotion:', 'Available now:', 'This week only:'],
        'EVENT': ['Upcoming event:', 'Mark your calendar:', 'Event details:'],
        'PRODUCT': ['Product spotlight:', 'Featured item:', 'Now available:']
      }
    };
    
    return openerMap[tone]?.[postType] || openerMap.professional[postType];
  }

  /**
   * Generate business context description
   */
  private getBusinessContext(business: BusinessContext): string {
    if (business.specialties && business.specialties.length > 0) {
      return business.specialties[0];
    }
    
    if (business.description) {
      return business.description.substring(0, 50) + '...';
    }
    
    return `our ${business.category.toLowerCase()} services`;
  }

  /**
   * Get call-to-action text based on post type
   */
  private getCallToActionText(postType: PostType): string {
    const ctaMap: Record<PostType, string[]> = {
      'WHATS_NEW': ['Learn more!', 'Get details!', 'Find out more!'],
      'OFFER': ['Shop now!', 'Claim your discount!', 'Don\'t wait!'],
      'EVENT': ['Reserve your spot!', 'RSVP today!', 'See you there!'],
      'PRODUCT': ['Shop now!', 'Check it out!', 'Get yours today!']
    };
    
    const options = ctaMap[postType];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Adjust tone and add/remove emojis
   */
  private adjustToneAndEmojis(content: string, options: PostGenerationOptions): string {
    let adjusted = content;
    
    if (!options.includeEmojis) {
      // Remove emojis
      adjusted = adjusted.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
    }
    
    // Adjust length
    if (options.length === 'short' && adjusted.length > 280) {
      adjusted = adjusted.substring(0, 277) + '...';
    } else if (options.length === 'long' && adjusted.length < 500) {
      adjusted += this.addLengthContent(options.postType);
    }
    
    return adjusted;
  }

  /**
   * Add content to make posts longer
   */
  private addLengthContent(postType: PostType): string {
    const additions: Record<PostType, string[]> = {
      'WHATS_NEW': [
        ' We\'re committed to providing the best experience for our customers.',
        ' Thank you for your continued support of our business.',
        ' We can\'t wait to share this with our amazing community!'
      ],
      'OFFER': [
        ' This offer won\'t last long, so act fast!',
        ' Perfect opportunity to try something new.',
        ' Share this with friends and family!'
      ],
      'EVENT': [
        ' All are welcome - bring your friends and family!',
        ' Light refreshments will be provided.',
        ' We look forward to seeing you there!'
      ],
      'PRODUCT': [
        ' Quality you can trust, service you can count on.',
        ' Available while supplies last.',
        ' Ask our staff about additional options!'
      ]
    };
    
    const options = additions[postType];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Generate appropriate call-to-action based on business and post type
   */
  private generateCallToAction(business: BusinessContext, postType: PostType): { actionType: CallToActionType; url?: string } {
    const ctaMap: Record<PostType, CallToActionType[]> = {
      'WHATS_NEW': ['LEARN_MORE', 'CALL'],
      'OFFER': ['BUY', 'ORDER_ONLINE', 'GET_OFFER'],
      'EVENT': ['BOOK', 'RESERVE', 'SIGN_UP'],
      'PRODUCT': ['BUY', 'VIEW_MENU', 'LEARN_MORE']
    };
    
    const options = ctaMap[postType];
    const actionType = options[Math.floor(Math.random() * options.length)];
    
    return {
      actionType,
      url: business.website
    };
  }

  /**
   * Generate relevant hashtags
   */
  private generateHashtags(business: BusinessContext, options: PostGenerationOptions): string[] {
    const hashtags: string[] = [];
    
    // Business-specific hashtags
    hashtags.push(`#${business.name.replace(/\s+/g, '')}`);
    hashtags.push(`#${business.category.replace(/\s+/g, '')}`);
    
    // Location hashtags
    if (business.location) {
      hashtags.push(`#${business.location.city.replace(/\s+/g, '')}`);
      hashtags.push(`#${business.location.state.replace(/\s+/g, '')}`);
    }
    
    // Post type hashtags
    const postTypeHashtags: Record<PostType, string[]> = {
      'WHATS_NEW': ['#News', '#Update', '#Announcement'],
      'OFFER': ['#Sale', '#Deal', '#Discount', '#SpecialOffer'],
      'EVENT': ['#Event', '#JoinUs', '#Community'],
      'PRODUCT': ['#NewProduct', '#Shopping', '#Quality']
    };
    
    hashtags.push(...postTypeHashtags[options.postType].slice(0, 2));
    
    // Seasonal hashtags
    if (options.seasonalContext) {
      hashtags.push(`#${options.seasonalContext.charAt(0).toUpperCase() + options.seasonalContext.slice(1)}`);
    }
    
    return hashtags.slice(0, 8); // Limit to 8 hashtags
  }

  /**
   * Generate media recommendations
   */
  private generateMediaRecommendations(business: BusinessContext, postType: PostType): Array<{ type: 'image' | 'video'; description: string }> {
    const recommendations: Record<PostType, Array<{ type: 'image' | 'video'; description: string }>> = {
      'WHATS_NEW': [
        { type: 'image', description: 'High-quality photo showcasing your business or team' },
        { type: 'image', description: 'Behind-the-scenes shot of your process or workspace' }
      ],
      'OFFER': [
        { type: 'image', description: 'Eye-catching promotional graphic with offer details' },
        { type: 'image', description: 'Product photos showing what\'s on sale' }
      ],
      'EVENT': [
        { type: 'image', description: 'Event promotional graphic with date and details' },
        { type: 'video', description: 'Short teaser video building excitement for the event' }
      ],
      'PRODUCT': [
        { type: 'image', description: 'Professional product photography showing key features' },
        { type: 'video', description: 'Product demonstration or unboxing video' }
      ]
    };
    
    return recommendations[postType];
  }

  /**
   * Get current season
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1; // 1-12
    
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  /**
   * Generate multiple post variations
   */
  async generatePostVariations(
    business: BusinessContext,
    options: PostGenerationOptions,
    count: number = 3
  ): Promise<GeneratedPost[]> {
    const posts: GeneratedPost[] = [];
    
    for (let i = 0; i < count; i++) {
      const post = await this.generatePost(business, {
        ...options,
        tone: ['professional', 'friendly', 'casual'][i % 3] as any
      });
      posts.push(post);
    }
    
    return posts;
  }

  /**
   * Convert generated post to API request format
   */
  convertToApiRequest(
    generatedPost: GeneratedPost,
    postType: PostType,
    languageCode: string = 'en'
  ): CreateLocalPostRequest {
    return {
      languageCode,
      summary: generatedPost.content,
      topicType: postType,
      callToAction: generatedPost.callToAction
    };
  }
}

export default AIPostGenerator; 