import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envFiles = ['.env.local', '.env'];
envFiles.forEach((file) => {
  const full = path.resolve(process.cwd(), file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full });
  }
});

async function main() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_PROJECT_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('articles')
    .select('id, slug, status')
    .in('slug', [
      'faq-comprehensive',
      'getting-started-account-setup',
      'getting-started-adding-contacts',
      'getting-started-choosing-plan',
      'getting-started-first-prompt-page',
      'getting-started-first-review-request',
      'getting-started-review-widget',
      'prompt-pages-features',
      'prompt-pages-types',
      'prompt-pages-types-employee',
      'prompt-pages-types-event',
      'prompt-pages-types-photo',
      'prompt-pages-types-product',
      'prompt-pages-types-service',
      'prompt-pages-types-universal',
      'prompt-pages-types-video',
      'strategies-double-dip',
      'strategies-non-ai-strategies',
      'strategies-novelty',
      'strategies-personal-outreach',
      'strategies-reciprocity',
      'strategies-reviews-on-fly',
    ]);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    console.log('No imported docs found to publish.');
    return;
  }

  const drafts = data.filter((row) => row.status !== 'published');

  if (drafts.length === 0) {
    console.log('All imported docs are already published.');
    return;
  }

  const now = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('articles')
    .update({ status: 'published', published_at: now, updated_at: now })
    .in('id', drafts.map((row) => row.id));

  if (updateError) {
    throw updateError;
  }

  console.log(`Published ${drafts.length} imported docs.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
