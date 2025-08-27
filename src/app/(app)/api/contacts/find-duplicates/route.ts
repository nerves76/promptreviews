import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

interface DuplicateGroup {
  contacts: any[];
  reason: 'exact_email' | 'similar_name' | 'exact_phone';
  score: number;
}

// Simple fuzzy string matching
function fuzzyMatch(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1.0;
  
  // Calculate Levenshtein distance ratio
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  
  let distance = 0;
  const matrix = Array(s1.length + 1).fill(null).map(() => Array(s2.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }
  
  distance = matrix[s1.length][s2.length];
  return 1 - (distance / maxLen);
}

function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '');
}

function getFullName(contact: any): string {
  if (contact.imported_from_google && contact.first_name === "Google User" && contact.google_reviewer_name) {
    return contact.google_reviewer_name.trim();
  }
  return `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
}

export async function GET(request: NextRequest) {
  try {
    // Create authenticated Supabase client with cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: () => {}, // No-op for API route
          remove: () => {}, // No-op for API route
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get all contacts for the user
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('account_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!contacts || contacts.length < 2) {
      return NextResponse.json({ duplicateGroups: [] });
    }

    const duplicateGroups: DuplicateGroup[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < contacts.length; i++) {
      const contact1 = contacts[i];
      
      if (processed.has(contact1.id)) continue;

      const matches: any[] = [contact1];
      let reason: DuplicateGroup['reason'] = 'similar_name';
      let score = 0;

      for (let j = i + 1; j < contacts.length; j++) {
        const contact2 = contacts[j];
        
        if (processed.has(contact2.id)) continue;

        // Exact email match (highest priority)
        if (contact1.email && contact2.email && 
            contact1.email.toLowerCase().trim() === contact2.email.toLowerCase().trim()) {
          matches.push(contact2);
          reason = 'exact_email';
          score = 1.0;
          processed.add(contact2.id);
          continue;
        }

        // Exact phone match (high priority)
        const phone1 = normalizePhone(contact1.phone);
        const phone2 = normalizePhone(contact2.phone);
        if (phone1 && phone2 && phone1.length >= 10 && phone2.length >= 10 && phone1 === phone2) {
          matches.push(contact2);
          if (reason !== 'exact_email') {
            reason = 'exact_phone';
            score = 0.9;
          }
          processed.add(contact2.id);
          continue;
        }

        // Similar name match (lower priority)
        const name1 = getFullName(contact1);
        const name2 = getFullName(contact2);
        
        if (name1 && name2) {
          const nameScore = fuzzyMatch(name1, name2);
          
          // Require high similarity for name matching
          if (nameScore >= 0.85) {
            matches.push(contact2);
            if (reason === 'similar_name') {
              score = Math.max(score, nameScore);
            }
            processed.add(contact2.id);
          }
        }
      }

      // Only add groups with multiple matches
      if (matches.length > 1) {
        duplicateGroups.push({
          contacts: matches,
          reason,
          score
        });
        processed.add(contact1.id);
      }
    }

    // Sort by score (highest first)
    duplicateGroups.sort((a, b) => b.score - a.score);

    return NextResponse.json({ duplicateGroups });
    
  } catch (error) {
    console.error('Find duplicates error:', error);
    return NextResponse.json(
      { error: 'Failed to find duplicates' },
      { status: 500 }
    );
  }
}