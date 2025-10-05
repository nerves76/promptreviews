#!/usr/bin/env ts-node
/**
 * Import Navigation Structure to Database
 *
 * Migrates hardcoded navigation from Sidebar.tsx to the navigation table
 * Run: npx ts-node docs-promptreviews/docs-site/scripts/import-navigation.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface NavItem {
  title: string;
  href: string;
  icon?: string;
  children?: NavItem[];
}

// Navigation structure from Sidebar.tsx
const navigation: NavItem[] = [
  {
    title: 'Getting Started',
    href: '/getting-started',
    icon: 'BookOpen',
    children: [
      { title: 'Quick Start Guide', href: '/getting-started#quick-start' },
      { title: 'Account Setup', href: '/getting-started#account-setup' },
      { title: 'Business Profile Setup', href: '/business-profile' },
      { title: 'First Prompt Page', href: '/getting-started#first-prompt-page' },
    ]
  },
  {
    title: 'Prompt Pages',
    href: '/prompt-pages',
    icon: 'PromptPagesIcon',
    children: [
      { title: 'Overview', href: '/prompt-pages' },
      { title: 'Page Types', href: '/prompt-pages/types' },
      { title: 'Service Pages', href: '/prompt-pages/types/service' },
      { title: 'Features', href: '/prompt-pages/features' },
    ]
  },
  {
    title: 'Reviews & Analytics',
    href: '/reviews',
    icon: 'Star',
    children: [
      { title: 'Managing Reviews', href: '/reviews' },
      { title: 'Analytics Dashboard', href: '/analytics' },
    ]
  },
  {
    title: 'Widgets',
    href: '/widgets',
    icon: 'Code',
    children: [
      { title: 'Widget Overview', href: '/widgets' },
      { title: 'Style Settings', href: '/style-settings' },
    ]
  },
  {
    title: 'Integrations',
    href: '/integrations',
    icon: 'Zap',
    children: [
      { title: 'Google Business Profile', href: '/google-business' },
      { title: 'AI Features', href: '/ai-reviews' },
    ]
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: 'Settings',
    children: [
      { title: 'Business Profile', href: '/business-profile' },
      { title: 'Team Management', href: '/team' },
      { title: 'Billing & Plans', href: '/billing' },
    ]
  },
  {
    title: 'Strategies',
    href: '/strategies',
    icon: 'Target',
    children: [
      { title: 'Review Strategies', href: '/strategies' },
      { title: 'Double Dip Strategy', href: '/strategies/double-dip' },
      { title: 'Reciprocity', href: '/strategies/reciprocity' },
      { title: 'Novelty Approach', href: '/strategies/novelty' },
    ]
  },
  {
    title: 'Advanced',
    href: '/advanced',
    icon: 'BarChart3',
  },
  {
    title: 'Troubleshooting',
    href: '/troubleshooting',
    icon: 'HelpCircle',
  },
];

async function importNavigation() {
  console.log('🚀 Starting navigation import...\n');

  let importCount = 0;
  let errorCount = 0;

  async function insertNavItem(item: NavItem, parentId: string | null = null, orderIndex: number = 0) {
    try {
      // Insert the item
      const { data: navItem, error: insertError } = await supabase
        .from('navigation')
        .insert({
          parent_id: parentId,
          title: item.title,
          href: item.href,
          icon_name: item.icon || null,
          order_index: orderIndex,
          visibility: ['docs', 'help'],
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error(`❌ Error inserting ${item.title}:`, insertError.message);
        errorCount++;
        return;
      }

      console.log(`✅ Imported: ${item.title} (${item.href})`);
      importCount++;

      // Import children recursively
      if (item.children && item.children.length > 0) {
        for (let i = 0; i < item.children.length; i++) {
          await insertNavItem(item.children[i], navItem.id, i);
        }
      }
    } catch (error) {
      console.error(`❌ Error with ${item.title}:`, error);
      errorCount++;
    }
  }

  // Import all top-level items
  for (let i = 0; i < navigation.length; i++) {
    await insertNavItem(navigation[i], null, i);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Items imported: ${importCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');

  if (errorCount === 0) {
    console.log('🎉 Navigation successfully imported to database!');
  } else {
    console.log('⚠️  Some items failed to import. Check logs above.');
  }
}

importNavigation()
  .then(() => {
    console.log('\n✨ Script completed!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:');
    console.error(error);
    process.exit(1);
  });
