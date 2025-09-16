import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../../docs-layout';
import PageHeader from '../../components/PageHeader';
import { Send, Mail, MessageSquare, QrCode, Link2, Clock, Target, ArrowRight, Info, CheckCircle, Smartphone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Send Your First Review Request | Prompt Reviews',
  description: 'Learn how to send personalized review requests via email, SMS, QR codes, and direct links using Prompt Reviews.',
  keywords: 'send review request, email reviews, SMS reviews, QR code reviews, prompt reviews',
};

export default function FirstReviewRequestPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Getting Started', href: '/getting-started' }
          ]}
          currentPage="First Review Request"
          categoryLabel="Step 5"
          categoryIcon={Send}
          categoryColor="pink"
          title="Send your first review request"
          description="Learn how to send personalized review requests to your customers through multiple channels."
        />

        {/* Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Review Request Methods</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <p className="text-white/90 mb-6">
              Prompt Reviews offers multiple ways to reach your customers where they're most comfortable. 
              Choose the method that works best for your business and customer preferences.
            </p>
            
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center bg-white/5 rounded-lg p-4">
                <Mail className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Email</h4>
                <p className="text-xs text-white/70 mt-1">Most popular</p>
              </div>
              <div className="text-center bg-white/5 rounded-lg p-4">
                <MessageSquare className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">SMS</h4>
                <p className="text-xs text-white/70 mt-1">Highest open rate</p>
              </div>
              <div className="text-center bg-white/5 rounded-lg p-4">
                <QrCode className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">QR Code</h4>
                <p className="text-xs text-white/70 mt-1">In-person</p>
              </div>
              <div className="text-center bg-white/5 rounded-lg p-4">
                <Link2 className="w-8 h-8 text-yellow-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Direct Link</h4>
                <p className="text-xs text-white/70 mt-1">Most flexible</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sending Methods */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">How to Send Review Requests</h2>
          
          <div className="space-y-6">
            {/* Email Method */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Method 1: Email Campaigns</h3>
              </div>
              
              <p className="text-white/90 mb-4">
                Send personalized email invitations with your branding and custom messaging.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Steps to Send Email Requests:</h4>
                  <ol className="space-y-2 text-white/80">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-300">1.</span>
                      <span>Go to <strong>Contacts</strong> and select recipients</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-300">2.</span>
                      <span>Click <strong>"Send Review Request"</strong></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-300">3.</span>
                      <span>Choose <strong>"Email"</strong> as the delivery method</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-300">4.</span>
                      <span>Select your prompt page</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-300">5.</span>
                      <span>Customize the email template (or use AI-generated)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-300">6.</span>
                      <span>Preview and send immediately or schedule</span>
                    </li>
                  </ol>
                </div>
                
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Email Best Practices:</h4>
                  <ul className="space-y-1 text-white/80 text-sm">
                    <li>• Personalize subject lines with customer names</li>
                    <li>• Send 3-7 days after service completion</li>
                    <li>• Keep emails short and action-focused</li>
                    <li>• Include a clear call-to-action button</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* SMS Method */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-green-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Method 2: SMS Text Messages</h3>
              </div>
              
              <p className="text-white/90 mb-4">
                Quick and direct with 98% open rates. Perfect for mobile-first customers.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Steps to Send SMS Requests:</h4>
                  <ol className="space-y-2 text-white/80">
                    <li className="flex items-start space-x-2">
                      <span className="text-green-300">1.</span>
                      <span>Select contacts with phone numbers</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-300">2.</span>
                      <span>Choose <strong>"SMS"</strong> delivery method</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-300">3.</span>
                      <span>Craft a concise message (160 characters)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-300">4.</span>
                      <span>Include shortened link to prompt page</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-green-300">5.</span>
                      <span>Send or schedule delivery</span>
                    </li>
                  </ol>
                </div>
                
                <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">SMS Template Example:</h4>
                  <p className="text-white/80 text-sm italic">
                    {`"Hi {first_name}! Thanks for choosing {business}. We'd love your feedback! 
                    Leave a review: {link} Reply STOP to opt out."`}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code Method */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Method 3: QR Codes</h3>
              </div>
              
              <p className="text-white/90 mb-4">
                Perfect for in-person interactions. Customers scan and review instantly.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Using QR Codes:</h4>
                  <ol className="space-y-2 text-white/80">
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-300">1.</span>
                      <span>Go to your prompt page settings</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-300">2.</span>
                      <span>Click <strong>"Generate QR Code"</strong></span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-300">3.</span>
                      <span>Download in your preferred format (PNG/SVG)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-purple-300">4.</span>
                      <span>Print on receipts, cards, or displays</span>
                    </li>
                  </ol>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <h5 className="font-semibold text-white/90 mb-1">Where to Display:</h5>
                    <ul className="space-y-1 text-white/70 text-sm">
                      <li>• Reception desk</li>
                      <li>• Table tents</li>
                      <li>• Business cards</li>
                      <li>• Receipts</li>
                    </ul>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <h5 className="font-semibold text-white/90 mb-1">Benefits:</h5>
                    <ul className="space-y-1 text-white/70 text-sm">
                      <li>• No typing required</li>
                      <li>• Instant access</li>
                      <li>• Works offline</li>
                      <li>• High engagement</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Link Method */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-yellow-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Method 4: Direct Links</h3>
              </div>
              
              <p className="text-white/90 mb-4">
                Share your prompt page URL anywhere - social media, chat, or your website.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Getting Your Link:</h4>
                  <ol className="space-y-2 text-white/80">
                    <li className="flex items-start space-x-2">
                      <span className="text-yellow-300">1.</span>
                      <span>Navigate to your prompt page</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-yellow-300">2.</span>
                      <span>Click <strong>"Share"</strong> button</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-yellow-300">3.</span>
                      <span>Copy the unique URL or shortened link</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-yellow-300">4.</span>
                      <span>Share via any platform</span>
                    </li>
                  </ol>
                </div>
                
                <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Where to Share:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-white/80 text-sm">• WhatsApp/Messenger</span>
                    <span className="text-white/80 text-sm">• Social media posts</span>
                    <span className="text-white/80 text-sm">• Email signatures</span>
                    <span className="text-white/80 text-sm">• Website buttons</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timing & Strategy */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Timing Your Requests</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <div className="flex items-start space-x-3 mb-4">
              <Clock className="w-6 h-6 text-blue-300 flex-shrink-0" />
              <div className="w-full">
                <h3 className="text-lg font-semibold text-white mb-3">When to Send Review Requests</h3>
                
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Service Businesses</h4>
                    <p className="text-white/80 text-sm mb-2">Send within 24-48 hours after service completion</p>
                    <div className="bg-blue-500/20 rounded p-2">
                      <p className="text-white/70 text-xs">
                        The experience is fresh in their mind, leading to more detailed reviews.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Product Sales</h4>
                    <p className="text-white/80 text-sm mb-2">Wait 5-7 days after delivery</p>
                    <div className="bg-purple-500/20 rounded p-2">
                      <p className="text-white/70 text-xs">
                        Gives customers time to use the product before reviewing.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-lg p-4">
                    <h4 className="font-semibold text-white mb-2">Events/Workshops</h4>
                    <p className="text-white/80 text-sm mb-2">Send within 24 hours</p>
                    <div className="bg-green-500/20 rounded p-2">
                      <p className="text-white/70 text-xs">
                        Capture feedback while the event experience is still vivid.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personalization Tips */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Personalization Tips</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <Target className="w-8 h-8 text-green-300 mb-3" />
              <h3 className="font-semibold text-white mb-2">Use Customer Data</h3>
              <ul className="space-y-1 text-white/80 text-sm">
                <li>• Include their first name</li>
                <li>• Reference specific service/product</li>
                <li>• Mention purchase date</li>
                <li>• Add personal touch</li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <Smartphone className="w-8 h-8 text-blue-300 mb-3" />
              <h3 className="font-semibold text-white mb-2">Optimize for Mobile</h3>
              <ul className="space-y-1 text-white/80 text-sm">
                <li>• Short subject lines</li>
                <li>• Large tap targets</li>
                <li>• Minimal scrolling</li>
                <li>• Quick load times</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tracking Success */}
        <div className="mb-12">
          <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Track Your Success</h3>
                <p className="text-white/80 mb-3">
                  Monitor your review request performance in the Analytics dashboard:
                </p>
                <ul className="space-y-2 text-white/80">
                  <li>• <strong>Open rates:</strong> How many customers viewed your request</li>
                  <li>• <strong>Click rates:</strong> How many clicked through to your prompt page</li>
                  <li>• <strong>Completion rates:</strong> How many left a review</li>
                  <li>• <strong>Platform distribution:</strong> Where reviews were posted</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Display Your Reviews?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Now that you're collecting reviews, let's set up widgets to showcase them on your website.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/getting-started/review-widget"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Set Up Widget
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