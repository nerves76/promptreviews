import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MarkdownRenderer from '../../../components/MarkdownRenderer'
import { getArticleBySlug } from '@/lib/docs/articles'
import { PLAN_DISPLAY, PLAN_LIMITS, calculateAnnualSavings } from '@/lib/billingConfig'
import {

  ArrowUp,
  ArrowDown,
  RefreshCw,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  CreditCard,
  Calendar,
  Shield,
  Info
} from 'lucide-react'
const fallbackDescription = 'Learn how to upgrade or downgrade your Prompt Reviews plan, understand prorated billing, and manage plan transitions smoothly.'

export async function generateMetadata(): Promise<Metadata> {
  try {
    const article = await getArticleBySlug('billing/upgrades-downgrades')
    if (!article) {
      return {
        title: 'Plan Upgrades & Downgrades - Switch Plans Anytime | Prompt Reviews Help',
        description: fallbackDescription,
        keywords: [
          'upgrade plan',
          'downgrade plan',
          'change subscription',
          'prorated billing',
          'plan transition',
          'switch plans'
        ],
        alternates: {
          canonical: 'https://docs.promptreviews.app/billing/upgrades-downgrades',
        },
      }
    }

    const seoTitle = article.metadata?.seo_title || article.title
    const seoDescription = article.metadata?.seo_description || article.metadata?.description || fallbackDescription

    return {
      title: `${seoTitle} | Prompt Reviews`,
      description: seoDescription,
      keywords: article.metadata?.keywords ?? [
        'upgrade plan',
        'downgrade plan',
        'change subscription',
        'prorated billing',
        'plan transition',
        'switch plans'
      ],
      alternates: {
        canonical: article.metadata?.canonical_url ?? 'https://docs.promptreviews.app/billing/upgrades-downgrades',
      },
    }
  } catch (error) {
    console.error('generateMetadata billing/upgrades-downgrades error:', error)
    return {
      title: 'Plan Upgrades & Downgrades - Switch Plans Anytime | Prompt Reviews Help',
      description: fallbackDescription,
      alternates: {
        canonical: 'https://docs.promptreviews.app/billing/upgrades-downgrades',
      },
    }
  }
}

export default async function UpgradesDowngradesPage() {
  let article = null

  try {
    article = await getArticleBySlug('billing/upgrades-downgrades')
  } catch (error) {
    console.error('Error fetching billing/upgrades-downgrades article:', error)
  }

  if (!article) {
    notFound()
  }

  // Calculate values dynamically
  const growerMonthly = PLAN_DISPLAY.grower.monthlyPrice;
  const builderMonthly = PLAN_DISPLAY.builder.monthlyPrice;
  const mavenMonthly = PLAN_DISPLAY.maven.monthlyPrice;
  const growerAnnual = PLAN_DISPLAY.grower.annualPrice;
  const builderAnnual = PLAN_DISPLAY.builder.annualPrice;
  const mavenAnnual = PLAN_DISPLAY.maven.annualPrice;

  // Calculate savings
  const growerSavings = calculateAnnualSavings('grower');
  const builderSavings = calculateAnnualSavings('builder');
  const mavenSavings = calculateAnnualSavings('maven');

  // Proration examples (15 days = 0.5 month)
  const upgradeCredit = (growerMonthly / 2).toFixed(2);
  const upgradeCharge = (builderMonthly / 2).toFixed(2);
  const upgradeTotal = (builderMonthly / 2 - growerMonthly / 2).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-white/60 mb-6">
        <Link href="/" className="hover:text-white">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/billing" className="hover:text-white">Billing</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-white">Upgrades & Downgrades</span>
      </div>

      {/* Article Content */}
      <div className="mb-12">
        <MarkdownRenderer content={article.content} />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <RefreshCw className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Plan upgrades & downgrades</h1>
        </div>
        <p className="text-xl text-white/80">
          Switch between plans anytime with flexible, prorated billing that ensures you only pay for what you use.
        </p>
      </div>

      {/* Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <ArrowUp className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-green-300 mb-2">Upgrades</h3>
              <p className="text-sm text-white/80 mb-2">
                Get <strong>immediate access</strong> to new features with automatic prorated billing
              </p>
              <p className="text-xs text-white/60">
                Credit for unused time applied instantly
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <ArrowDown className="w-6 h-6 text-orange-300 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-orange-300 mb-2">Downgrades</h3>
              <p className="text-sm text-white/80 mb-2">
                Changes take effect <strong>at end of billing period</strong> to maximize your investment
              </p>
              <p className="text-xs text-white/60">
                Keep current features until renewal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Upgrade */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <ArrowUp className="w-7 h-7 text-green-300" />
          <h2 className="text-3xl font-bold text-white">How to upgrade your plan</h2>
        </div>

        <ol className="space-y-4 mb-6">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Navigate to Billing</h4>
              <p className="text-white/70 text-sm">Go to Dashboard → Settings → Plan & Billing</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Choose Your New Plan</h4>
              <p className="text-white/70 text-sm">Select from Builder or Maven to access more features</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Review & Confirm</h4>
              <p className="text-white/70 text-sm">See exactly what you'll gain and the prorated cost before confirming</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Instant Access</h4>
              <p className="text-white/70 text-sm">All new features are available immediately after upgrade</p>
            </div>
          </li>
        </ol>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-yellow-300 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-200 mb-2">
                <strong>What happens when you upgrade:</strong>
              </p>
              <ul className="space-y-1 text-sm text-yellow-200/80">
                <li>• Immediate access to all features in your new plan</li>
                <li>• Automatic credit for unused time on your current plan</li>
                <li>• Prorated charge for the remainder of your billing period</li>
                <li>• Your billing date stays the same</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How to Downgrade */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <ArrowDown className="w-7 h-7 text-orange-300" />
          <h2 className="text-3xl font-bold text-white">How to downgrade your plan</h2>
        </div>

        <ol className="space-y-4 mb-6">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Navigate to Billing</h4>
              <p className="text-white/70 text-sm">Go to Dashboard → Settings → Plan & Billing</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Select Lower Tier Plan</h4>
              <p className="text-white/70 text-sm">Choose Grower or Builder depending on your current plan</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Review Features You'll Lose</h4>
              <p className="text-white/70 text-sm">See exactly what features and limits will change</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">Confirm Downgrade</h4>
              <p className="text-white/70 text-sm">Change will be scheduled for your next billing date</p>
            </div>
          </li>
        </ol>

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <div className="flex gap-3">
            <Clock className="w-5 h-5 text-orange-300 flex-shrink-0" />
            <div>
              <p className="text-sm text-orange-200 mb-2">
                <strong>What happens when you downgrade:</strong>
              </p>
              <ul className="space-y-1 text-sm text-orange-200/80">
                <li>• Keep all current features until the end of your billing period</li>
                <li>• Downgrade takes effect on your next renewal date</li>
                <li>• New plan limits apply after the transition</li>
                <li>• You'll receive a confirmation email before the change</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Prorated Billing Explained */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-7 h-7 text-green-300" />
          <h2 className="text-3xl font-bold text-white">Understanding prorated billing</h2>
        </div>

        <p className="text-white/80 mb-6">
          Prorated billing ensures you only pay for what you actually use. We calculate the exact number of days
          remaining in your billing period and adjust charges accordingly.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="font-semibold text-white mb-2">Upgrade Example</h3>
            <p className="text-sm text-white/70 mb-3">
              You're on Grower (${growerMonthly}/mo) with 15 days left in your billing period. You upgrade to Builder (${builderMonthly}/mo).
            </p>
            <div className="text-xs text-green-300 space-y-1">
              <p>• Credit: ${upgradeCredit} (15 days of Grower)</p>
              <p>• Charge: ${upgradeCharge} (15 days of Builder)</p>
              <p>• <strong>You pay: ${upgradeTotal} today</strong></p>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h3 className="font-semibold text-white mb-2">Downgrade Example</h3>
            <p className="text-sm text-white/70 mb-3">
              You're on Maven (${mavenMonthly}/mo). You downgrade to Builder (${builderMonthly}/mo) with 20 days left.
            </p>
            <div className="text-xs text-orange-300 space-y-1">
              <p>• No immediate charge</p>
              <p>• Keep Maven features for 20 days</p>
              <p>• <strong>Pay ${builderMonthly} at next renewal</strong></p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex gap-2">
            <Info className="w-5 h-5 text-yellow-300 flex-shrink-0" />
            <p className="text-sm text-yellow-200">
              <strong>Important:</strong> Stripe (our payment processor) automatically calculates all prorations. You'll see the exact amount before confirming any plan change.
            </p>
          </div>
        </div>
      </div>

      {/* Switching Billing Periods */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-7 h-7 text-purple-300" />
          <h2 className="text-3xl font-bold text-white">Switching billing periods</h2>
        </div>

        <p className="text-white/80 mb-6">
          You can switch between monthly and annual billing at any time. Annual billing saves you 15% (almost 2 months free!).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-green-300 mb-2">Monthly → Annual</h3>
            <p className="text-sm text-white/70 mb-2">Save 15% instantly</p>
            <ul className="text-xs text-white/60 space-y-1">
              <li>• Grower: ${growerMonthly * 12}/year → ${growerAnnual}/year (save ${growerSavings})</li>
              <li>• Builder: ${builderMonthly * 12}/year → ${builderAnnual}/year (save ${builderSavings})</li>
              <li>• Maven: ${mavenMonthly * 12}/year → ${mavenAnnual}/year (save ${mavenSavings})</li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-300 mb-2">Annual → Monthly</h3>
            <p className="text-sm text-white/70 mb-2">More flexibility</p>
            <ul className="text-xs text-white/60 space-y-1">
              <li>• Change takes effect at renewal</li>
              <li>• Keep annual pricing until then</li>
              <li>• Cancel anytime with monthly</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Plan comparison</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-2 text-white font-semibold">Feature</th>
                <th className="text-center py-3 px-2 text-green-300 font-semibold">Grower</th>
                <th className="text-center py-3 px-2 text-purple-300 font-semibold">Builder</th>
                <th className="text-center py-3 px-2 text-yellow-300 font-semibold">Maven</th>
              </tr>
            </thead>
            <tbody className="text-white/80">
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Monthly Price</td>
                <td className="text-center py-3 px-2">${growerMonthly}</td>
                <td className="text-center py-3 px-2">${builderMonthly}</td>
                <td className="text-center py-3 px-2">${mavenMonthly}</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Annual Price</td>
                <td className="text-center py-3 px-2">${growerAnnual}/yr</td>
                <td className="text-center py-3 px-2">${builderAnnual}/yr</td>
                <td className="text-center py-3 px-2">${mavenAnnual}/yr</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Team Members</td>
                <td className="text-center py-3 px-2">{PLAN_LIMITS.grower.maxUsers}</td>
                <td className="text-center py-3 px-2">{PLAN_LIMITS.builder.maxUsers}</td>
                <td className="text-center py-3 px-2">{PLAN_LIMITS.maven.maxUsers}</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Prompt Pages</td>
                <td className="text-center py-3 px-2">{PLAN_LIMITS.grower.promptPages}</td>
                <td className="text-center py-3 px-2">{PLAN_LIMITS.builder.promptPages}</td>
                <td className="text-center py-3 px-2">{PLAN_LIMITS.maven.promptPages}</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Contacts</td>
                <td className="text-center py-3 px-2 text-red-300">None</td>
                <td className="text-center py-3 px-2">{PLAN_LIMITS.builder.contacts.toLocaleString()}</td>
                <td className="text-center py-3 px-2">{PLAN_LIMITS.maven.contacts.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Business Locations</td>
                <td className="text-center py-3 px-2">{PLAN_LIMITS.grower.maxLocations}</td>
                <td className="text-center py-3 px-2">{PLAN_LIMITS.builder.maxLocations}</td>
                <td className="text-center py-3 px-2">{PLAN_LIMITS.maven.maxLocations}</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Google Business</td>
                <td className="text-center py-3 px-2">✓</td>
                <td className="text-center py-3 px-2">✓</td>
                <td className="text-center py-3 px-2">✓</td>
              </tr>
              <tr className="border-b border-white/10">
                <td className="py-3 px-2">Workflow Management</td>
                <td className="text-center py-3 px-2 text-red-300">✗</td>
                <td className="text-center py-3 px-2 text-green-300">✓</td>
                <td className="text-center py-3 px-2 text-green-300">✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Common Questions */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Common questions</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-white mb-2">Can I upgrade/downgrade multiple times?</h3>
            <p className="text-sm text-white/70">
              Yes! You can change your plan as often as needed. However, we recommend choosing a plan that fits your needs to avoid frequent changes.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">What happens if I exceed my plan limits?</h3>
            <p className="text-sm text-white/70">
              You'll receive a notification when approaching limits. Some features may be restricted until you upgrade or reduce usage.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Can I cancel instead of downgrading?</h3>
            <p className="text-sm text-white/70">
              Yes. You can cancel your subscription through the Stripe billing portal. Access it from Dashboard → Settings → Plan & Billing → Manage Billing.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-2">Will I lose data when downgrading?</h3>
            <p className="text-sm text-white/70">
              No, your data is never deleted. However, you may lose access to certain features or need to reduce items (like team members or prompt pages) to fit within new limits.
            </p>
          </div>
        </div>
      </div>

      {/* Related Articles */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Related articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/billing"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <CreditCard className="w-5 h-5 text-green-300" />
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">Billing Overview</div>
              <div className="text-xs text-white/60">Manage your subscription</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>

          <Link
            href="/getting-started/choosing-plan"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <Shield className="w-5 h-5 text-yellow-300" />
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">Choosing the Right Plan</div>
              <div className="text-xs text-white/60">Compare all plans</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>
        </div>
      </div>
    </div>
  );
}
