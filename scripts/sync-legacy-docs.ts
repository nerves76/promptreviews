import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const envFiles = ['.env.local', '.env'];
for (const file of envFiles) {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath });
  }
}

type LegacyMeta = {
  description?: string;
  keywords?: string[];
  canonical_url?: string;
  category?: string;
  category_label?: string;
  category_icon?: string;
  category_color?: string;
  available_plans?: string[];
  key_features?: Array<Record<string, unknown>>;
  how_it_works?: Array<Record<string, unknown>>;
  best_practices?: Array<Record<string, unknown>>;
  _original?: {
    layoutProps?: Record<string, any>;
    metadata?: Record<string, any>;
  };
};

function buildMetadata(meta: LegacyMeta) {
  const layout = meta._original?.layoutProps ?? {};
  const baseMetadata: Record<string, unknown> = {
    description: meta.description || layout.page_description || undefined,
    keywords: meta.keywords && meta.keywords.length ? meta.keywords : undefined,
    canonical_url: meta.canonical_url,
    category: meta.category || layout.category || undefined,
    category_label: meta.category_label || layout.category_label || undefined,
    category_icon: meta.category_icon || layout.category_icon || undefined,
    category_color: meta.category_color || layout.category_color || undefined,
    available_plans: meta.available_plans?.length ? meta.available_plans : layout.available_plans,
    key_features: meta.key_features?.length ? meta.key_features : layout.key_features,
    how_it_works: meta.how_it_works?.length ? meta.how_it_works : layout.how_it_works,
    best_practices: meta.best_practices?.length ? meta.best_practices : layout.best_practices,
  };

  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(baseMetadata)) {
    if (value == null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    cleaned[key] = value;
  }

  return cleaned;
}

function inferTitle(slug: string, meta: LegacyMeta) {
  return (
    meta._original?.layoutProps?.page_title ||
    meta._original?.metadata?.title ||
    slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

async function main() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_PROJECT_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)');
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const extractedDir = path.resolve(
    process.cwd(),
    'docs-promptreviews/docs-site/extracted'
  );

  const entries = fs
    .readdirSync(extractedDir)
    .filter((file) => file.endsWith('.meta.json'))
    .sort();

  const results: Array<{ slug: string; action: 'inserted' | 'updated' | 'skipped'; reason?: string }> = [];

  for (const entry of entries) {
    const slug = entry.replace(/\.meta\.json$/, '');
    const metaPath = path.join(extractedDir, entry);
    const markdownPath = path.join(extractedDir, `${slug}.md`);

    if (!fs.existsSync(markdownPath)) {
      results.push({ slug, action: 'skipped', reason: 'missing markdown' });
      continue;
    }

    const meta: LegacyMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const metadata = buildMetadata(meta);
    const title = inferTitle(slug, meta);
    const content = fs.readFileSync(markdownPath, 'utf8').trim();

    const { data: existing, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (fetchError) {
      results.push({ slug, action: 'skipped', reason: `fetch error: ${fetchError.message}` });
      continue;
    }

    if (existing) {
      const mergedMetadata = {
        ...(existing.metadata ?? {}),
        ...metadata,
      };

      const { error: updateError } = await supabase
        .from('articles')
        .update({
          title,
          content,
          metadata: mergedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        results.push({ slug, action: 'skipped', reason: `update error: ${updateError.message}` });
      } else {
        results.push({ slug, action: 'updated' });
      }
    } else {
      const { error: insertError } = await supabase
        .from('articles')
        .insert({
          slug,
          title,
          content,
          metadata,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        results.push({ slug, action: 'skipped', reason: `insert error: ${insertError.message}` });
      } else {
        results.push({ slug, action: 'inserted' });
      }
    }
  }

  console.table(results);
  const counts = results.reduce(
    (acc, { action }) => ({ ...acc, [action]: (acc[action] ?? 0) + 1 }),
    { inserted: 0, updated: 0, skipped: 0 } as Record<string, number>
  );
  console.log('Summary:', counts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
