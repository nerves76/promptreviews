/**
 * Google Business Profile Service Type Mappings
 * Maps Google's structured service type IDs to human-readable names
 */

// Common service type mappings
export const SERVICE_TYPE_LOOKUP: Record<string, string> = {
  // Health & Wellness Services
  'job_type_id:nutrition_consulting': 'Nutrition Consulting',
  'job_type_id:personal_training': 'Personal Training',
  'job_type_id:fitness_training': 'Fitness Training',
  'job_type_id:wellness_coaching': 'Wellness Coaching',
  'job_type_id:health_coaching': 'Health Coaching',
  'job_type_id:yoga_instruction': 'Yoga Instruction',
  'job_type_id:massage_therapy': 'Massage Therapy',
  'job_type_id:physical_therapy': 'Physical Therapy',
  'job_type_id:mental_health_counseling': 'Mental Health Counseling',
  'job_type_id:life_coaching': 'Life Coaching',
  
  // Professional Services
  'job_type_id:business_consulting': 'Business Consulting',
  'job_type_id:marketing_consulting': 'Marketing Consulting',
  'job_type_id:financial_planning': 'Financial Planning',
  'job_type_id:accounting': 'Accounting',
  'job_type_id:tax_preparation': 'Tax Preparation',
  'job_type_id:legal_services': 'Legal Services',
  'job_type_id:real_estate_services': 'Real Estate Services',
  'job_type_id:insurance_services': 'Insurance Services',
  
  // Home Services
  'job_type_id:plumbing': 'Plumbing',
  'job_type_id:electrical': 'Electrical',
  'job_type_id:hvac': 'HVAC',
  'job_type_id:landscaping': 'Landscaping',
  'job_type_id:house_cleaning': 'House Cleaning',
  'job_type_id:home_repair': 'Home Repair',
  'job_type_id:painting': 'Painting',
  'job_type_id:roofing': 'Roofing',
  'job_type_id:flooring': 'Flooring',
  'job_type_id:carpentry': 'Carpentry',
  
  // Beauty & Personal Care
  'job_type_id:hair_styling': 'Hair Styling',
  'job_type_id:makeup_services': 'Makeup Services',
  'job_type_id:nail_services': 'Nail Services',
  'job_type_id:spa_services': 'Spa Services',
  'job_type_id:skincare': 'Skincare',
  'job_type_id:barbering': 'Barbering',
  
  // Education & Training
  'job_type_id:tutoring': 'Tutoring',
  'job_type_id:music_lessons': 'Music Lessons',
  'job_type_id:language_lessons': 'Language Lessons',
  'job_type_id:driving_lessons': 'Driving Lessons',
  'job_type_id:test_preparation': 'Test Preparation',
  'job_type_id:career_coaching': 'Career Coaching',
  
  // Technology Services
  'job_type_id:web_design': 'Web Design',
  'job_type_id:web_development': 'Web Development',
  'job_type_id:it_support': 'IT Support',
  'job_type_id:computer_repair': 'Computer Repair',
  'job_type_id:software_development': 'Software Development',
  'job_type_id:digital_marketing': 'Digital Marketing',
  'job_type_id:seo_services': 'SEO Services',
  
  // Event Services
  'job_type_id:event_planning': 'Event Planning',
  'job_type_id:wedding_planning': 'Wedding Planning',
  'job_type_id:catering': 'Catering',
  'job_type_id:photography': 'Photography',
  'job_type_id:videography': 'Videography',
  'job_type_id:dj_services': 'DJ Services',
  
  // Pet Services
  'job_type_id:pet_grooming': 'Pet Grooming',
  'job_type_id:pet_training': 'Pet Training',
  'job_type_id:pet_sitting': 'Pet Sitting',
  'job_type_id:dog_walking': 'Dog Walking',
  'job_type_id:veterinary_services': 'Veterinary Services',
  
  // Automotive Services
  'job_type_id:auto_repair': 'Auto Repair',
  'job_type_id:auto_detailing': 'Auto Detailing',
  'job_type_id:oil_change': 'Oil Change',
  'job_type_id:tire_services': 'Tire Services',
  'job_type_id:auto_body_repair': 'Auto Body Repair'
};

/**
 * Convert a Google service type ID to a human-readable name
 */
export function getServiceDisplayName(serviceTypeId: string): string {
  // First check if we have a direct mapping
  if (SERVICE_TYPE_LOOKUP[serviceTypeId]) {
    return SERVICE_TYPE_LOOKUP[serviceTypeId];
  }
  
  // If not found, try to parse and clean up the ID
  // Remove the prefix and convert to title case
  const cleanedId = serviceTypeId
    .replace(/^job_type_id:/, '')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return cleanedId;
}

/**
 * Determine if a service is structured (from Google) or custom
 */
export function isStructuredService(serviceName: string): boolean {
  // Check if it matches the Google format or is in our lookup
  return serviceName.includes('job_type_id:') || serviceName in SERVICE_TYPE_LOOKUP;
}

/**
 * Search Google's predefined services by name
 */
export function searchGoogleServices(query: string, limit: number = 10): Array<{ id: string; name: string }> {
  if (!query || query.trim().length === 0) {
    return [];
  }
  
  const searchTerm = query.toLowerCase().trim();
  const results: Array<{ id: string; name: string; score: number }> = [];
  
  for (const [id, name] of Object.entries(SERVICE_TYPE_LOOKUP)) {
    const nameLower = name.toLowerCase();
    let score = 0;
    
    // Exact match gets highest score
    if (nameLower === searchTerm) {
      score = 100;
    }
    // Starts with query gets high score
    else if (nameLower.startsWith(searchTerm)) {
      score = 90;
    }
    // Word starts with query gets medium-high score
    else if (nameLower.split(' ').some(word => word.startsWith(searchTerm))) {
      score = 70;
    }
    // Contains query gets medium score
    else if (nameLower.includes(searchTerm)) {
      score = 50;
    }
    // Individual words match
    else {
      const queryWords = searchTerm.split(' ');
      const nameWords = nameLower.split(' ');
      const matchCount = queryWords.filter(qWord => 
        nameWords.some(nWord => nWord.includes(qWord))
      ).length;
      if (matchCount > 0) {
        score = 30 * (matchCount / queryWords.length);
      }
    }
    
    if (score > 0) {
      results.push({ id, name, score });
    }
  }
  
  // Sort by score (highest first) and then alphabetically
  results.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    return a.name.localeCompare(b.name);
  });
  
  // Return top results without score
  return results.slice(0, limit).map(({ id, name }) => ({ id, name }));
}

/**
 * Process service items from Google API response
 */
export function processGoogleServiceItem(item: any): { 
  name: string; 
  description: string;
  isStructured: boolean;
  originalId?: string;
} {
  let name = '';
  let description = '';
  let isStructured = false;
  let originalId: string | undefined;
  
  if (item?.structuredServiceItem) {
    // Structured service item format (predefined Google services)
    const serviceTypeId = item.structuredServiceItem.serviceTypeId || '';
    originalId = serviceTypeId;
    name = getServiceDisplayName(serviceTypeId);
    description = item.structuredServiceItem.description || '';
    isStructured = true;
  } else if (item?.freeFormServiceItem?.label) {
    // Free-form service item format (user-defined services)
    name = item.freeFormServiceItem.label.displayName || '';
    description = item.freeFormServiceItem.label.description || '';
    isStructured = false;
  } else if (item?.displayName) {
    // Simple structure (direct displayName/description)
    name = item.displayName || '';
    description = item.description || '';
    isStructured = false;
  } else {
    // Fallback to any available name/description properties
    name = item?.name || '';
    description = item?.description || '';
    isStructured = false;
  }
  
  return {
    name: name.trim(),
    description: description.trim(),
    isStructured,
    originalId
  };
}