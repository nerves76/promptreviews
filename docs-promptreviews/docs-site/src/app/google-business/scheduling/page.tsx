import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../../docs-layout';
import { Calendar, ChevronRight, Clock, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Scheduling - Google Business Profile | Prompt Reviews Help',
  description: 'Learn how to manage scheduling, appointments, and reservations through your Google Business Profile.',
  alternates: {
    canonical: 'https://docs.promptreviews.app/google-business/scheduling',
  },
}

export default function SchedulingPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center text-sm text-white/60 mb-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/google-business" className="hover:text-white">Google Business Profile</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-white">Scheduling</span>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Scheduling</h1>
          </div>
          <p className="text-xl text-white/80">
            Enable online booking and appointment scheduling directly from your Google Business Profile.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
          <p className="text-white/80">
            Google Business Profile allows you to integrate third-party scheduling systems, making it easy for customers to book appointments directly from Google Search and Maps. This feature is available for service-based businesses like salons, restaurants, medical practices, and more.
          </p>
        </div>

        {/* How It Works */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">How scheduling works</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Booking button integration</h3>
                  <p className="text-white/80 mb-3">
                    Connect your existing scheduling platform (like Square, Booksy, or StyleSeat) to display a "Book Online" button on your Google Business Profile. When customers click it, they're taken to your scheduling system.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-200">
                      <strong>Supported platforms:</strong> Varies by business category. Common platforms include Square Appointments, Booksy, StyleSeat, OpenTable, Resy, and more.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-yellow-300 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Reserve with Google</h3>
                  <p className="text-white/80 mb-3">
                    For eligible businesses, Reserve with Google allows customers to book appointments without leaving Google Search or Maps. This seamless integration can increase bookings significantly.
                  </p>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-200">
                      <strong>Availability:</strong> Currently available for select categories including restaurants, beauty services, fitness, and home services.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Process */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Setting up scheduling</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="text-yellow-300 font-bold">1.</span>
              <span className="text-white/80">Choose a compatible scheduling platform that integrates with Google Business Profile</span>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-300 font-bold">2.</span>
              <span className="text-white/80">Set up your appointment availability, services, and pricing in the scheduling platform</span>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-300 font-bold">3.</span>
              <span className="text-white/80">Connect your scheduling platform to your Google Business Profile through the platform's settings</span>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-300 font-bold">4.</span>
              <span className="text-white/80">Verify the "Book Online" button appears on your Google Business Profile</span>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Best practices</h2>
          <ul className="space-y-3 text-white/80">
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Keep availability updated:</strong> Sync your scheduling system in real-time to avoid double bookings</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Show accurate hours:</strong> Make sure your business hours match your booking availability</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Request reviews after appointments:</strong> Use Prompt Reviews to automatically request feedback from customers who booked through Google</span>
            </li>
            <li className="flex gap-3">
              <span className="text-green-400">✓</span>
              <span><strong className="text-white">Monitor booking analytics:</strong> Track how many customers book through Google to measure ROI</span>
            </li>
          </ul>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Related articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/google-business/business-info" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group">
              <Building2 className="w-5 h-5 text-yellow-300" />
              <div className="flex-1">
                <div className="font-semibold text-white group-hover:underline">Business Info</div>
                <div className="text-xs text-white/60">Manage core business details</div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
            </Link>
            <Link href="/google-business" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group">
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
