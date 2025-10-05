import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../../docs-layout';
import { Image, ChevronRight, Upload, Camera, Star, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Image Upload - Google Business Profile | Prompt Reviews Help',
  description: 'Learn how to upload and manage photos for your Google Business Profile including logo, cover photo, and business photos.',
  keywords: [
    'Google Business Profile',
    'business photos',
    'image upload',
    'profile picture',
    'cover photo'
  ],
  alternates: {
    canonical: 'https://docs.promptreviews.app/google-business/image-upload',
  },
}

export default function ImageUploadPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-white/60 mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/google-business" className="hover:text-white">Google Business Profile</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-white">Image Upload</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
              <Image className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Image upload</h1>
          </div>
          <p className="text-xl text-white/80">
            Add professional photos to your Google Business Profile to attract more customers and build trust.
          </p>
        </div>

        {/* Overview */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <p className="text-white/80 mb-4">
            Businesses with photos receive 42% more requests for directions and 35% more click-throughs to their websites. Quality images are essential for attracting customers.
          </p>
        </div>

        {/* Photo Types */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Photo types</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Star className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Logo</h3>
                  <p className="text-white/80 mb-3">
                    Your business logo appears in search results and on Maps. Should be a square image, minimum 250x250 pixels.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-200">
                      <strong>Recommended:</strong> 1024x1024 pixels, PNG or JPG format, with transparent background
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Image className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Cover photo</h3>
                  <p className="text-white/80 mb-3">
                    The main banner image that appears at the top of your profile. Showcases your business atmosphere.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-200">
                      <strong>Recommended:</strong> 1024x576 pixels (16:9 aspect ratio), horizontal orientation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Camera className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Additional photos</h3>
                  <p className="text-white/80 mb-3">
                    Showcase your products, services, team, and location. Categories include: Interior, Exterior, At Work, Team, Products, Services.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-200">
                      <strong>Recommended:</strong> Minimum 720x720 pixels, JPG or PNG, well-lit and high quality
                    </p>
                  </div>
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
              <span><strong className="text-white">Use professional quality:</strong> High-resolution, well-lit photos perform better</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Show variety:</strong> Upload photos of your location, products, team, and customers (with permission)</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Update regularly:</strong> Add new photos at least monthly to keep your profile fresh</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Follow guidelines:</strong> Avoid text overlays, logos, or promotional content in regular photos</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Optimize file size:</strong> Keep files under 5MB for faster loading</span>
            </li>
          </ul>
        </div>

        {/* Related Articles */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Related articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/google-business/business-info"
              className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
            >
              <CheckCircle className="w-5 h-5 text-green-300" />
              <div className="flex-1">
                <div className="font-semibold text-white group-hover:underline">Business Info</div>
                <div className="text-xs text-white/60">Manage core business details</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
            </Link>

            <Link
              href="/google-business"
              className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
            >
              <Upload className="w-5 h-5 text-orange-300" />
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
