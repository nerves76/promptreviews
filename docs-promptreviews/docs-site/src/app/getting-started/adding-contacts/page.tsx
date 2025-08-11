import { Metadata } from 'next';
import Link from 'next/link';
import DocsLayout from '../../docs-layout';
import PageHeader from '../../components/PageHeader';
import { Users, Upload, UserPlus, FileSpreadsheet, Tags, Search, ArrowRight, Info, CheckCircle, Download, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Add Your First Contacts | Prompt Reviews',
  description: 'Learn how to import your customer database or manually add contacts to start sending personalized review requests.',
  keywords: 'add contacts, import customers, CSV upload, contact management, prompt reviews',
};

export default function AddingContactsPage() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          breadcrumbs={[
            { label: 'Help', href: '/' },
            { label: 'Getting Started', href: '/getting-started' }
          ]}
          currentPage="Adding Contacts"
          categoryLabel="Step 4"
          categoryIcon={Users}
          categoryColor="indigo"
          title="Add your first contacts"
          description="Import your customer database or manually add contacts to start sending personalized review requests."
        />

        {/* Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Managing Your Contacts</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <p className="text-white/90 mb-4">
              Contacts are the foundation of your review collection strategy. Prompt Reviews offers multiple ways to 
              add and manage your customer contacts, making it easy to start requesting reviews immediately.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <Upload className="w-8 h-8 text-blue-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Bulk Import</h4>
                <p className="text-xs text-white/70 mt-1">Upload CSV files</p>
              </div>
              <div className="text-center">
                <UserPlus className="w-8 h-8 text-purple-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Manual Entry</h4>
                <p className="text-xs text-white/70 mt-1">Add one by one</p>
              </div>
              <div className="text-center">
                <Tags className="w-8 h-8 text-green-300 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-white">Smart Tags</h4>
                <p className="text-xs text-white/70 mt-1">Organize efficiently</p>
              </div>
            </div>
          </div>
        </div>

        {/* Import Methods */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Methods to Add Contacts</h2>
          
          <div className="space-y-6">
            {/* Method 1: CSV Import */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-blue-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Method 1: CSV Import (Recommended)</h3>
              </div>
              
              <p className="text-white/90 mb-4">
                The fastest way to add multiple contacts at once. Perfect for importing your existing customer database.
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-2">Step 1: Prepare Your CSV File</h4>
                  <p className="text-white/80 text-sm mb-3">
                    Your CSV should include these columns (in any order):
                  </p>
                  <div className="bg-black/20 rounded-lg p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-white/60 border-b border-white/20">
                          <th className="text-left pb-2">Column Name</th>
                          <th className="text-left pb-2">Required</th>
                          <th className="text-left pb-2">Example</th>
                        </tr>
                      </thead>
                      <tbody className="text-white/80">
                        <tr className="border-b border-white/10">
                          <td className="py-2">first_name</td>
                          <td className="py-2">Yes</td>
                          <td className="py-2">John</td>
                        </tr>
                        <tr className="border-b border-white/10">
                          <td className="py-2">last_name</td>
                          <td className="py-2">Yes</td>
                          <td className="py-2">Smith</td>
                        </tr>
                        <tr className="border-b border-white/10">
                          <td className="py-2">email</td>
                          <td className="py-2">Yes</td>
                          <td className="py-2">john@example.com</td>
                        </tr>
                        <tr className="border-b border-white/10">
                          <td className="py-2">phone</td>
                          <td className="py-2">Optional</td>
                          <td className="py-2">+1234567890</td>
                        </tr>
                        <tr className="border-b border-white/10">
                          <td className="py-2">company</td>
                          <td className="py-2">Optional</td>
                          <td className="py-2">ABC Corp</td>
                        </tr>
                        <tr>
                          <td className="py-2">tags</td>
                          <td className="py-2">Optional</td>
                          <td className="py-2">vip, repeat-customer</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <button className="mt-3 inline-flex items-center text-blue-300 hover:underline text-sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download CSV Template
                  </button>
                </div>
                
                <div>
                  <h4 className="font-semibold text-white mb-2">Step 2: Upload Your File</h4>
                  <ol className="space-y-2 text-white/80 text-sm">
                    <li>1. Go to <strong>Contacts</strong> in the main navigation</li>
                    <li>2. Click <strong>"Import Contacts"</strong> button</li>
                    <li>3. Select your CSV file (max 5MB, up to 10,000 contacts)</li>
                    <li>4. Map your columns if needed</li>
                    <li>5. Review and confirm the import</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Method 2: Manual Entry */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-purple-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Method 2: Manual Entry</h3>
              </div>
              
              <p className="text-white/90 mb-4">
                Add contacts one at a time. Great for new customers or when you need precise control.
              </p>
              
              <ol className="space-y-2 text-white/80">
                <li className="flex items-start space-x-2">
                  <span className="text-purple-300">1.</span>
                  <span>Navigate to <strong>Contacts</strong> → <strong>"Add Contact"</strong></span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-300">2.</span>
                  <span>Fill in customer information (name, email, phone)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-300">3.</span>
                  <span>Add relevant tags for organization</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-300">4.</span>
                  <span>Optionally add notes about the customer</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-purple-300">5.</span>
                  <span>Click <strong>"Save Contact"</strong></span>
                </li>
              </ol>
              
              <div className="mt-4 bg-purple-500/20 border border-purple-400/30 rounded-lg p-4">
                <p className="text-sm text-white/80">
                  <strong>Pro Tip:</strong> Use keyboard shortcuts (Ctrl/Cmd + N) to quickly add new contacts.
                </p>
              </div>
            </div>

            {/* Method 3: Integration */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-300" />
                </div>
                <h3 className="text-xl font-semibold text-white">Method 3: Integrations (Coming Soon)</h3>
              </div>
              
              <p className="text-white/90 mb-4">
                Automatically sync contacts from your existing tools and platforms.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white/70 mb-2">CRM Integrations</h4>
                  <ul className="space-y-1 text-white/60 text-sm">
                    <li>• Salesforce</li>
                    <li>• HubSpot</li>
                    <li>• Pipedrive</li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold text-white/70 mb-2">E-commerce</h4>
                  <ul className="space-y-1 text-white/60 text-sm">
                    <li>• Shopify</li>
                    <li>• WooCommerce</li>
                    <li>• Square</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organizing Contacts */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Organizing Your Contacts</h2>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Using Tags Effectively</h3>
            
            <p className="text-white/90 mb-4">
              Tags help you segment contacts for targeted review campaigns. Here are some effective tagging strategies:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-2">Recommended Tags</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">•</span>
                    <span><strong>vip:</strong> Your best customers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">•</span>
                    <span><strong>new-customer:</strong> First-time buyers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">•</span>
                    <span><strong>repeat:</strong> Returning customers</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">•</span>
                    <span><strong>2024:</strong> Year-based segmentation</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">•</span>
                    <span><strong>service-name:</strong> Specific service users</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">Tag Benefits</h4>
                <ul className="space-y-2 text-white/80 text-sm">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-300 mt-0.5" />
                    <span>Send targeted review requests</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-300 mt-0.5" />
                    <span>Track campaign performance</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-300 mt-0.5" />
                    <span>Personalize messaging</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-300 mt-0.5" />
                    <span>Filter and search quickly</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-300 mt-0.5" />
                    <span>Create automated workflows</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Data Privacy */}
        <div className="mb-12">
          <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Info className="w-6 h-6 text-blue-300 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Data Privacy & Compliance</h3>
                <ul className="space-y-2 text-white/80">
                  <li>• All contact data is encrypted and stored securely</li>
                  <li>• GDPR and CCPA compliant data handling</li>
                  <li>• Contacts can unsubscribe at any time</li>
                  <li>• We never share your contact data with third parties</li>
                  <li>• You can export or delete all data anytime</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Start Small</h3>
              <p className="text-white/80 text-sm">
                Begin with your most satisfied customers. They're more likely to leave positive reviews.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Keep Data Clean</h3>
              <p className="text-white/80 text-sm">
                Regularly update contact information and remove bounced emails to maintain list quality.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Segment Strategically</h3>
              <p className="text-white/80 text-sm">
                Use tags to create meaningful segments for personalized review campaigns.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">Respect Preferences</h3>
              <p className="text-white/80 text-sm">
                Honor unsubscribe requests and don't over-contact customers.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Contacts Added? Send Your First Review Request!
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            With your contacts imported and organized, you're ready to send your first personalized review request.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/getting-started/first-review-request"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Send First Request
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