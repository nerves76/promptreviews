import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../../docs-layout';
import PageHeader from '../../components/PageHeader';
import { UserPlus, Building, Mail, Shield, ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Account Setup & Business Profile | Prompt Reviews',
  description: 'Create your Prompt Reviews account and set up your business profile to start collecting customer reviews.',
  keywords: 'account setup, business profile, prompt reviews registration, sign up',
};

export default function AccountSetupPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Getting Started', href: '/getting-started' }
          ]}
          currentPage="Account Setup"
          categoryLabel="Step 1"
          categoryIcon={UserPlus}
          categoryColor="blue"
          title="Account Setup & Business Profile"
          description="Create your Prompt Reviews account and complete your business information to get started."
        />

        {/* Sign Up Process */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Creating Your Account</h2>
          
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">1</div>
                <h3 className="text-xl font-semibold text-white">Visit the Sign-Up Page</h3>
              </div>
              <p className="text-white/90 mb-4">
                Go to <a href="https://app.promptreviews.com/signup" className="text-blue-300 hover:text-blue-200">app.promptreviews.com/signup</a> to create your account.
              </p>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Enter your email address</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Create a secure password</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-300 mt-0.5" />
                  <span>Verify your email address</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-semibold">2</div>
                <h3 className="text-xl font-semibold text-white">Complete Your Profile</h3>
              </div>
              <p className="text-white/90 mb-4">
                After signing up, you'll be prompted to complete your profile information:
              </p>
              <ul className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-300">•</span>
                  <span>Your name and role</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-300">•</span>
                  <span>Company/business name</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-300">•</span>
                  <span>Phone number (optional)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Business Profile Setup */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Setting Up Your Business Profile</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
            <p className="text-white/90 mb-6">
              Your business profile is crucial for creating effective prompt pages and collecting reviews. 
              Here's what you'll need to provide:
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-300" />
                  Business Information
                </h3>
                <ul className="space-y-2 text-white/80">
                  <li>• Business name</li>
                  <li>• Business type/industry</li>
                  <li>• Physical address</li>
                  <li>• Phone number</li>
                  <li>• Website URL</li>
                  <li>• Business hours</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-green-300" />
                  Review Platforms
                </h3>
                <ul className="space-y-2 text-white/80">
                  <li>• Google Business Profile link</li>
                  <li>• Facebook page URL</li>
                  <li>• Yelp business page</li>
                  <li>• Industry-specific platforms</li>
                  <li>• Custom review platforms</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Privacy */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Security & Privacy</h2>
          
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Your Data is Secure</h3>
                <ul className="space-y-2 text-white/80">
                  <li>• All data is encrypted using industry-standard SSL</li>
                  <li>• We never share your customer information</li>
                  <li>• GDPR and CCPA compliant</li>
                  <li>• Regular security audits and updates</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Pro Tips</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Complete Profile = Better Results</h3>
              <p className="text-white/80 text-sm">
                A complete business profile helps our AI generate more personalized and effective review requests.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Verify Your Email</h3>
              <p className="text-white/80 text-sm">
                Check your inbox for the verification email. You'll need to verify before accessing all features.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Add Team Members</h3>
              <p className="text-white/80 text-sm">
                You can invite team members later to help manage reviews and prompt pages.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Connect Google Business</h3>
              <p className="text-white/80 text-sm">
                Connecting your Google Business Profile enables automatic review syncing and management.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Account Created? Let's Choose Your Plan
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            With your account set up, the next step is choosing the right plan for your business needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/getting-started/choosing-plan"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Choose Your Plan
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link
              href="/getting-started"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}