import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminAccess } from "@/lib/admin/permissions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * GET /api/admin/populate-navigation
 * Populates the navigation table with a default structure
 */
export async function GET() {
  try {
    await requireAdminAccess();
    const supabase = getSupabaseAdmin();

    // Clear existing navigation
    await supabase
      .from('navigation')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    const navStructure = [
      {
        title: 'Getting Started',
        icon_name: 'Rocket',
        order_index: 1,
        children: [
          { title: 'Account Setup', href: '/docs/getting-started/account-setup', order_index: 1 },
          { title: 'Choosing a Plan', href: '/docs/getting-started/choosing-plan', order_index: 2 },
          { title: 'First Prompt Page', href: '/docs/getting-started/first-prompt-page', order_index: 3 },
          { title: 'Adding Contacts', href: '/docs/getting-started/adding-contacts', order_index: 4 },
          { title: 'First Review Request', href: '/docs/getting-started/first-review-request', order_index: 5 },
          { title: 'Review Widget', href: '/docs/getting-started/review-widget', order_index: 6 },
        ]
      },
      {
        title: 'Prompt Pages',
        icon_name: 'FileText',
        order_index: 2,
        children: [
          { title: 'Overview', href: '/docs/prompt-pages', order_index: 1 },
          { title: 'Settings', href: '/docs/prompt-pages/settings', order_index: 2 },
          { title: 'Universal Prompt Page', href: '/docs/prompt-pages/types/universal', order_index: 3 },
          { title: 'Photo Prompt', href: '/docs/prompt-pages/types/photo', order_index: 4 },
          { title: 'Video Prompt', href: '/docs/prompt-pages/types/video', order_index: 5 },
          { title: 'Product Prompt', href: '/docs/prompt-pages/types/product', order_index: 6 },
          { title: 'Service Prompt', href: '/docs/prompt-pages/types/service', order_index: 7 },
          { title: 'Employee Prompt', href: '/docs/prompt-pages/types/employee', order_index: 8 },
          { title: 'Event Prompt', href: '/docs/prompt-pages/types/event', order_index: 9 },
        ]
      },
      {
        title: 'Reviews',
        icon_name: 'Star',
        href: '/docs/reviews',
        order_index: 3
      },
      {
        title: 'Widgets',
        icon_name: 'Code',
        href: '/docs/widgets',
        order_index: 4
      },
      {
        title: 'Google Business Profile',
        icon_name: 'MapPin',
        order_index: 5,
        children: [
          { title: 'Overview', href: '/docs/google-business', order_index: 1 },
          { title: 'Business Info', href: '/docs/google-business/business-info', order_index: 2 },
          { title: 'Categories & Services', href: '/docs/google-business/categories-services', order_index: 3 },
          { title: 'Review Import', href: '/docs/google-business/review-import', order_index: 4 },
          { title: 'Image Upload', href: '/docs/google-business/image-upload', order_index: 5 },
          { title: 'Scheduling', href: '/docs/google-business/scheduling', order_index: 6 },
          { title: 'Bulk Updates', href: '/docs/google-business/bulk-updates', order_index: 7 },
        ]
      },
      {
        title: 'AI Reviews',
        icon_name: 'Bot',
        href: '/docs/ai-reviews',
        order_index: 6
      },
      {
        title: 'Review Strategies',
        icon_name: 'Lightbulb',
        order_index: 7,
        children: [
          { title: 'Overview', href: '/docs/strategies', order_index: 1 },
          { title: 'Personal Outreach', href: '/docs/strategies/personal-outreach', order_index: 2 },
          { title: 'Reciprocity', href: '/docs/strategies/reciprocity', order_index: 3 },
          { title: 'Reviews on the Fly', href: '/docs/strategies/reviews-on-fly', order_index: 4 },
          { title: 'Double Dip', href: '/docs/strategies/double-dip', order_index: 5 },
          { title: 'Novelty', href: '/docs/strategies/novelty', order_index: 6 },
          { title: 'Non-AI Strategies', href: '/docs/strategies/non-ai-strategies', order_index: 7 },
        ]
      },
      {
        title: 'Contacts',
        icon_name: 'Users',
        href: '/docs/contacts',
        order_index: 8
      },
      {
        title: 'Analytics',
        icon_name: 'BarChart3',
        href: '/docs/analytics',
        order_index: 9
      },
      {
        title: 'Business Profile',
        icon_name: 'Building2',
        href: '/docs/business-profile',
        order_index: 10
      },
      {
        title: 'Style Settings',
        icon_name: 'Palette',
        href: '/docs/style-settings',
        order_index: 11
      },
      {
        title: 'Team Management',
        icon_name: 'UserPlus',
        href: '/docs/team',
        order_index: 12
      },
      {
        title: 'Billing',
        icon_name: 'CreditCard',
        order_index: 13,
        children: [
          { title: 'Overview', href: '/docs/billing', order_index: 1 },
          { title: 'Upgrades & Downgrades', href: '/docs/billing/upgrades-downgrades', order_index: 2 },
        ]
      },
      {
        title: 'Settings',
        icon_name: 'Settings',
        href: '/docs/settings',
        order_index: 14
      },
      {
        title: 'Advanced',
        icon_name: 'Wrench',
        href: '/docs/advanced',
        order_index: 15
      },
      {
        title: 'Troubleshooting',
        icon_name: 'AlertCircle',
        href: '/docs/troubleshooting',
        order_index: 16
      },
      {
        title: 'Help',
        icon_name: 'HelpCircle',
        href: '/docs/help',
        order_index: 17
      },
    ];

    let inserted = 0;
    let failed = 0;
    const details: any[] = [];

    // Insert navigation items
    for (const item of navStructure) {
      try {
        const { data: parent, error: parentError } = await supabase
          .from('navigation')
          .insert({
            title: item.title,
            href: item.href || null,
            icon_name: item.icon_name || null,
            order_index: item.order_index,
            visibility: ['docs', 'help'],
            is_active: true
          })
          .select()
          .single();

        if (parentError) {
          details.push({ item: item.title, status: 'failed', error: parentError.message });
          failed++;
          continue;
        }

        details.push({ item: item.title, status: 'inserted', children: 0 });
        inserted++;

        // Insert children if they exist
        if (item.children && item.children.length > 0) {
          for (const child of item.children) {
            const { error: childError } = await supabase
              .from('navigation')
              .insert({
                parent_id: parent.id,
                title: child.title,
                href: child.href || null,
                icon_name: child.icon_name || null,
                order_index: child.order_index,
                visibility: ['docs', 'help'],
                is_active: true
              });

            if (childError) {
              details[details.length - 1].children = `${details[details.length - 1].children || 0} failed`;
              failed++;
            } else {
              details[details.length - 1].children = (details[details.length - 1].children || 0) + 1;
              inserted++;
            }
          }
        }

        // Rate limit
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error: any) {
        details.push({ item: item.title, status: 'error', error: error.message });
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        inserted,
        failed,
      },
      details,
    });
  } catch (error: any) {
    console.error('Error populating navigation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
