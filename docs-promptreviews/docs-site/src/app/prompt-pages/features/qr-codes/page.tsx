import { Metadata } from 'next';
import Link from 'next/link';
import { Download, ChevronRight, QrCode, Smartphone, Printer, CreditCard, CheckCircle, Users } from 'lucide-react';
import { getArticleBySlug } from '@/lib/articles';
import { getIconComponent } from '@/lib/iconMapper';

export async function generateMetadata(): Promise<Metadata> {
  const article = await getArticleBySlug('prompt-pages/features/qr-codes');

  if (!article) {
    return {
      title: 'QR Code Generation | Prompt Reviews',
    };
  }

  const seoTitle = article.metadata?.seo_title || article.title;
  const seoDescription = article.metadata?.seo_description || article.metadata?.description || '';

  return {
    title: `${seoTitle} | Prompt Reviews`,
    description: seoDescription,
    keywords: article.metadata?.keywords || [],
  };
}

export default async function QRCodesPage() {
  const article = await getArticleBySlug('prompt-pages/features/qr-codes');

  const keyFeatures = article?.metadata?.key_features || [];
  const howItWorks = article?.metadata?.how_it_works || [];
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-white/60 mb-6">
        <Link href="/" className="hover:text-white">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/prompt-pages" className="hover:text-white">Prompt Pages</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/prompt-pages/features" className="hover:text-white">Features</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-white">QR Code Generation</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl">
            <Download className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">QR code generation</h1>
        </div>
        <p className="text-xl text-white/80">
          Generate scannable QR codes that customers can use to quickly access your prompt pages from their mobile devices, making review collection more convenient than ever.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">What is QR code generation?</h2>
        <p className="text-white/80 mb-4">
          QR Code Generation allows you to create scannable codes that link directly to your prompt pages. Customers simply scan the code with their smartphone camera, and they're instantly taken to your review collection page.
        </p>
        <p className="text-white/80">
          No typing long URLs, no searching for links - just point, scan, and review. It's the perfect solution for physical locations, printed materials, and any situation where convenience matters.
        </p>
      </div>

      {/* How It Works */}
      {howItWorks.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">How it works</h2>
          <ol className="space-y-4">
            {howItWorks.map((step) => (
              <li key={step.number} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">{step.number}</span>
                <div>
                  <h4 className="font-semibold text-white mb-1">{step.title}</h4>
                  <p className="text-white/70 text-sm">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Use Cases */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Perfect placements for QR codes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-blue-300" />
              <h3 className="font-semibold text-white">Business Cards</h3>
            </div>
            <p className="text-sm text-white/70">
              Add QR codes to business cards for easy review access at networking events
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Printer className="w-5 h-5 text-green-300" />
              <h3 className="font-semibold text-white">Receipts & Invoices</h3>
            </div>
            <p className="text-sm text-white/70">
              Include QR codes on receipts to capture feedback right after purchase
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-5 h-5 text-purple-300" />
              <h3 className="font-semibold text-white">Table Tents & Displays</h3>
            </div>
            <p className="text-sm text-white/70">
              Place QR codes on tables, counters, and waiting areas for easy access
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Printer className="w-5 h-5 text-orange-300" />
              <h3 className="font-semibold text-white">Marketing Materials</h3>
            </div>
            <p className="text-sm text-white/70">
              Add to flyers, brochures, posters, and any printed marketing materials
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-pink-300" />
              <h3 className="font-semibold text-white">Employee Badges</h3>
            </div>
            <p className="text-sm text-white/70">
              Team members can share their employee-specific prompt page QR codes
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-yellow-300" />
              <h3 className="font-semibold text-white">Digital Displays</h3>
            </div>
            <p className="text-sm text-white/70">
              Show QR codes on digital screens, presentations, or video displays
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Key benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Extremely convenient</h4>
              <p className="text-sm text-white/70">No typing required - just scan and go</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Works offline</h4>
              <p className="text-sm text-white/70">QR codes work without internet connection</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Universal compatibility</h4>
              <p className="text-sm text-white/70">Works with any smartphone camera app</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Professional appearance</h4>
              <p className="text-sm text-white/70">Modern, tech-savvy impression on customers</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Increases completion rates</h4>
              <p className="text-sm text-white/70">Reduces friction in the review process</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Cost-effective</h4>
              <p className="text-sm text-white/70">Print once, use forever - no ongoing costs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">QR code best practices</h2>
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Size matters</h4>
            <p className="text-sm text-white/70">
              Make QR codes at least 1 inch x 1 inch (2.5cm x 2.5cm) for easy scanning
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Add clear instructions</h4>
            <p className="text-sm text-white/70">
              Include text like "Scan to leave a review" or "Scan for quick feedback"
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Strategic placement</h4>
            <p className="text-sm text-white/70">
              Place QR codes where customers naturally look - near exits, on receipts, at checkout
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">High contrast</h4>
            <p className="text-sm text-white/70">
              Ensure good contrast between QR code and background for reliable scanning
            </p>
          </div>
        </div>
      </div>

      {/* Perfect For */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Perfect for</h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Restaurants</strong> placing QR codes on tables, receipts, and menus</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Retail stores</strong> adding codes to packaging and shopping bags</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Service professionals</strong> including codes on business cards and invoices</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Healthcare providers</strong> placing codes in waiting rooms and exam rooms</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Any business</strong> wanting to make review collection as easy as possible</span>
          </li>
        </ul>
      </div>

      {/* Related Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Related features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/prompt-pages/features/mobile"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">Mobile Optimization</div>
              <div className="text-xs text-white/60">Perfect mobile experience</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>

          <Link
            href="/prompt-pages/features"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">All Features</div>
              <div className="text-xs text-white/60">View all prompt page features</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export const revalidate = 300; // Revalidate every 5 minutes
