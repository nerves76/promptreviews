import { Metadata } from 'next';
import Link from 'next/link';
import { Smartphone, ChevronRight, Tablet, Monitor, Zap, Eye, Hand, Wifi } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mobile Optimization - Perfect Review Experience on Any Device | Prompt Reviews',
  description: 'Prompt pages are fully optimized for mobile devices with responsive design, touch-friendly interfaces, and fast loading for the best mobile experience.',
  keywords: ['mobile optimization', 'responsive design', 'mobile-friendly', 'touch interface', 'mobile reviews'],
};

export default function MobilePage() {
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
        <span className="text-white">Mobile Optimization</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
            <Smartphone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Mobile optimization</h1>
        </div>
        <p className="text-xl text-white/80">
          Prompt pages deliver a perfect experience on all devices with responsive design, touch-friendly interfaces, and optimized loading speeds for mobile networks.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Why mobile optimization matters</h2>
        <p className="text-white/80 mb-4">
          Over 80% of customers access review pages from their mobile devices. If your prompt pages don't work perfectly on smartphones and tablets, you're losing reviews. Mobile optimization ensures every customer has a smooth, frustration-free experience.
        </p>
        <p className="text-white/80">
          Our prompt pages are built mobile-first, meaning they're designed for small screens and touch interfaces from the ground up - not just adapted from desktop designs.
        </p>
      </div>

      {/* Mobile Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Mobile optimization features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-blue-300" />
              <h3 className="font-semibold text-white">Responsive Design</h3>
            </div>
            <p className="text-sm text-white/70">
              Automatically adapts to any screen size - phone, tablet, or desktop
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hand className="w-5 h-5 text-green-300" />
              <h3 className="font-semibold text-white">Touch-Friendly Interface</h3>
            </div>
            <p className="text-sm text-white/70">
              Large buttons, easy tapping, and swipe gestures designed for fingers
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-300" />
              <h3 className="font-semibold text-white">Fast Loading Speeds</h3>
            </div>
            <p className="text-sm text-white/70">
              Optimized for mobile networks with compressed assets and efficient code
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-5 h-5 text-purple-300" />
              <h3 className="font-semibold text-white">Offline Capability</h3>
            </div>
            <p className="text-sm text-white/70">
              Works reliably even on slow or unstable mobile connections
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-pink-300" />
              <h3 className="font-semibold text-white">Mobile-Specific Features</h3>
            </div>
            <p className="text-sm text-white/70">
              Camera integration for photos, location services, and mobile keyboards
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Monitor className="w-5 h-5 text-orange-300" />
              <h3 className="font-semibold text-white">Cross-Device Consistency</h3>
            </div>
            <p className="text-sm text-white/70">
              Same great experience whether on phone, tablet, or computer
            </p>
          </div>
        </div>
      </div>

      {/* Device Support */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Supported devices & browsers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Smartphone className="w-8 h-8 text-blue-300 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Smartphones</h3>
            <p className="text-xs text-white/70">iPhone, Android, all modern devices</p>
          </div>

          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Tablet className="w-8 h-8 text-green-300 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Tablets</h3>
            <p className="text-xs text-white/70">iPad, Android tablets, all sizes</p>
          </div>

          <div className="bg-white/5 rounded-lg p-4 text-center">
            <Monitor className="w-8 h-8 text-purple-300 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Desktops</h3>
            <p className="text-xs text-white/70">Mac, Windows, Linux, all browsers</p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">How mobile optimization works</h2>
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Automatic device detection</h4>
              <p className="text-white/70 text-sm">System detects screen size, device type, and capabilities</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Layout adaptation</h4>
              <p className="text-white/70 text-sm">Page layout and components adjust to fit screen perfectly</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Touch interface activation</h4>
              <p className="text-white/70 text-sm">Touch-optimized controls and gestures enable for mobile devices</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Performance optimization</h4>
              <p className="text-white/70 text-sm">Images, scripts, and assets load efficiently for fast mobile experience</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Benefits */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Key benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Higher completion rates</h4>
              <p className="text-sm text-white/70">Mobile-optimized pages get more completed reviews</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Better user experience</h4>
              <p className="text-sm text-white/70">Customers enjoy smooth, frustration-free interactions</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Reduced bounce rates</h4>
              <p className="text-sm text-white/70">Fewer customers abandon the review process</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Works anywhere</h4>
              <p className="text-sm text-white/70">Customers can leave reviews from any device, anywhere</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Future-proof</h4>
              <p className="text-sm text-white/70">Automatically adapts to new devices and screen sizes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Professional appearance</h4>
              <p className="text-sm text-white/70">Looks polished and modern on every device</p>
            </div>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Mobile best practices</h2>
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Test on real devices</h4>
            <p className="text-sm text-white/70">
              Preview your prompt pages on actual phones and tablets before launching
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Keep it simple</h4>
            <p className="text-sm text-white/70">
              Mobile screens are small - avoid cluttered designs and long forms
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Use mobile-friendly images</h4>
            <p className="text-sm text-white/70">
              Optimize images for mobile to ensure fast loading on cellular networks
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">Prioritize speed</h4>
            <p className="text-sm text-white/70">
              Every second of loading time reduces review completion rates
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
            <span className="text-white/80"><strong className="text-white">All businesses</strong> - most customers use mobile devices to leave reviews</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">On-the-go services</strong> where customers review immediately after service</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Younger demographics</strong> who primarily use smartphones</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">QR code campaigns</strong> where customers scan from physical locations</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Any business</strong> wanting maximum accessibility and completion rates</span>
          </li>
        </ul>
      </div>

      {/* Related Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Related features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/prompt-pages/features/qr-codes"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">QR Code Generation</div>
              <div className="text-xs text-white/60">Perfect for mobile scanning</div>
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
