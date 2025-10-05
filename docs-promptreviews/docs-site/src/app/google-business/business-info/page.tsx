import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../../docs-layout';
import { Building2, ChevronRight, Info, MapPin, Phone, Globe, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Business Info - Google Business Profile | Prompt Reviews Help',
  description: 'Learn how to manage your business information in Google Business Profile including name, address, phone, hours, and more.',
  keywords: [
    'Google Business Profile',
    'business information',
    'NAP',
    'business hours',
    'business address'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.app/google-business/business-info',
  },
}

export default function BusinessInfoPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-white/60 mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/google-business" className="hover:text-white">Google Business Profile</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-white">Business Info</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Business information</h1>
          </div>
          <p className="text-xl text-white/80">
            Manage your core business information to ensure customers can find and contact you accurately.
          </p>
        </div>

        {/* Overview */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <p className="text-white/80 mb-4">
            Your business information is the foundation of your Google Business Profile. Accurate, complete information helps customers find you and improves your local search ranking.
          </p>
        </div>

        {/* Key Information Fields */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Key information fields</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Business name</h3>
                  <p className="text-white/80">
                    Your official business name as registered. Should match your signage and legal documents. Avoid keyword stuffing or adding extra information.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Address</h3>
                  <p className="text-white/80">
                    Your physical business location. Must be accurate for Google Maps. For service-area businesses, you can set a service area instead of showing your address.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Phone className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Phone number</h3>
                  <p className="text-white/80">
                    Primary phone number for customer contact. Use a local number when possible. Consider using a tracking number to measure calls from Google.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Globe className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Website</h3>
                  <p className="text-white/80">
                    Your business website URL. Should link to your homepage or a landing page specific to this location.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Business hours</h3>
                  <p className="text-white/80">
                    Regular operating hours for each day of the week. Keep these updated, especially during holidays or special events. You can set special hours for holidays.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Best practices</h2>
          <ul className="space-y-3 text-white/80">
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Keep information consistent:</strong> Match your NAP (Name, Address, Phone) across all online directories</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Update hours promptly:</strong> Set special hours for holidays at least 2 weeks in advance</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Use local phone numbers:</strong> Local numbers build trust and may improve local search ranking</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Add service areas:</strong> For service-area businesses, specify all areas you serve</span>
            </li>
          </ul>
        </div>

        {/* Related Articles */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Related articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/google-business/categories-services"
              className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
            >
              <Info className="w-5 h-5 text-yellow-300" />
              <div className="flex-1">
                <div className="font-semibold text-white group-hover:underline">Categories & Services</div>
                <div className="text-xs text-white/60">Define your business categories</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
            </Link>

            <Link
              href="/google-business/image-upload"
              className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
            >
              <Building2 className="w-5 h-5 text-red-300" />
              <div className="flex-1">
                <div className="font-semibold text-white group-hover:underline">Image Upload</div>
                <div className="text-xs text-white/60">Add photos to your profile</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
            </Link>

            <Link
              href="/google-business"
              className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
            >
              <Building2 className="w-5 h-5 text-orange-300" />
              <div className="flex-1">
                <div className="font-semibold text-white group-hover:underline">Google Business Overview</div>
                <div className="text-xs text-white/60">Back to main guide</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
