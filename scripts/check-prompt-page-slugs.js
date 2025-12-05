/**
 * Check and fix missing slugs in prompt_pages table
 * This script identifies prompt pages without slugs and generates them
 */

const { createClient } = require('@supabase/supabase-js');

// Simple slugify function
function slugify(text, uniquePart) {
  if (!text) return uniquePart || 'page';
  
  const slug = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
  
  return slug + (uniquePart ? '-' + uniquePart : '');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixSlugs() {
  try {
    console.log('🔍 Checking for prompt pages without slugs...');
    
    // Get all prompt pages
    const { data: promptPages, error } = await supabase
      .from('prompt_pages')
      .select('id, slug, first_name, last_name, client_name, is_universal, created_at');
    
    if (error) {
      console.error('❌ Error fetching prompt pages:', error);
      return;
    }
    
    console.log(`📊 Found ${promptPages.length} total prompt pages`);
    
    // Find pages without slugs
    const pagesWithoutSlugs = promptPages.filter(page => !page.slug);
    console.log(`⚠️  Found ${pagesWithoutSlugs.length} pages without slugs`);
    
    if (pagesWithoutSlugs.length === 0) {
      console.log('✅ All prompt pages have slugs!');
      return;
    }
    
    // Generate slugs for pages that don't have them
    for (const page of pagesWithoutSlugs) {
      let slug;
      
      if (page.is_universal) {
        // For universal pages, use "universal" + timestamp
        slug = slugify("universal", Date.now().toString(36));
      } else {
        // For regular pages, use name + timestamp
        const name = page.client_name || `${page.first_name || ''} ${page.last_name || ''}`.trim() || 'customer';
        slug = slugify(name, Date.now().toString(36));
      }
      
      console.log(`🔄 Generating slug "${slug}" for page ${page.id} (${page.is_universal ? 'universal' : 'regular'})`);
      
      // Update the page with the new slug
      const { error: updateError } = await supabase
        .from('prompt_pages')
        .update({ slug })
        .eq('id', page.id);
      
      if (updateError) {
        console.error(`❌ Failed to update page ${page.id}:`, updateError);
      } else {
        console.log(`✅ Updated page ${page.id} with slug "${slug}"`);
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎉 Finished checking and fixing slugs!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
checkAndFixSlugs(); 