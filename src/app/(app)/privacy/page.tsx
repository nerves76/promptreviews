import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border border-white/50">
        <h1 className="text-3xl font-bold text-slate-blue">
          Privacy Policy
        </h1>
      </div>
      
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 font-medium">
          <strong>Last Updated:</strong> January 2025
        </p>
        <p className="text-blue-700 mt-2">
          This Privacy Policy explains how PromptReviews collects, uses, and protects your information when you use our review management platform and AI-powered services.
        </p>
      </div>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">1. Information We Collect</h2>
        
        <h3 className="text-xl font-medium mb-3">Account Information</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Personal Details:</strong> Name, email address, phone number, business information</li>
          <li><strong>Authentication Data:</strong> Password (encrypted), login credentials, session information</li>
          <li><strong>Business Information:</strong> Company name, industry, website, address, business description</li>
          <li><strong>Payment Information:</strong> Billing address, payment methods (processed securely through Stripe)</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">User-Generated Content</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Reviews and Testimonials:</strong> Customer feedback, ratings, comments, and responses</li>
          <li><strong>AI Content:</strong> Content generated using our "Prompty AI" features (review templates, emails)</li>
          <li><strong>Uploaded Media:</strong> Photos, images, and other files associated with reviews</li>
          <li><strong>Contact Lists:</strong> Customer contact information uploaded for review campaigns</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">Technical Information</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
          <li><strong>Device Information:</strong> Browser type, operating system, IP address, device identifiers</li>
          <li><strong>Analytics Data:</strong> Performance metrics, error logs, user interactions</li>
          <li><strong>Cookies:</strong> Preferences, session data, authentication tokens</li>
        </ul>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">2. AI Data Processing</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-amber-800 font-medium mb-2">
            <strong>AI-Powered Features:</strong> "Prompty AI" Content Generation
          </p>
          <p className="text-amber-700">
            Our service uses OpenAI's ChatGPT API to generate review templates, email content, and other text-based materials.
          </p>
        </div>
        
        <h3 className="text-xl font-medium mb-3">How AI Processes Your Data</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Input Data:</strong> Business information, customer details, and context you provide for content generation</li>
          <li><strong>Processing:</strong> Data is sent to OpenAI's API for content generation and returned to our platform</li>
          <li><strong>Storage:</strong> Generated content is stored in your account; input data is not permanently stored by OpenAI</li>
          <li><strong>Third-Party Processing:</strong> OpenAI processes data according to their privacy policy and data usage policies</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">AI Data Controls</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>You can choose whether to use AI features</li>
          <li>You control what information is included in AI prompts</li>
          <li>You can edit or delete any AI-generated content</li>
          <li>You remain responsible for reviewing and approving all AI-generated content</li>
        </ul>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">3. How We Use Your Information</h2>
        
        <h3 className="text-xl font-medium mb-3">Service Provision</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Provide and maintain our review management platform</li>
          <li>Process payments and manage subscriptions</li>
          <li>Generate widgets and display reviews</li>
          <li>Send review request emails and SMS messages</li>
          <li>Provide customer support and technical assistance</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">Communication</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Send account notifications and service updates</li>
          <li>Respond to your inquiries and support requests</li>
          <li>Send marketing communications (with your consent)</li>
          <li>Notify you of important changes to our service</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">Analytics and Improvement</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Analyze usage patterns to improve our service</li>
          <li>Monitor performance and troubleshoot issues</li>
          <li>Conduct research and development</li>
          <li>Ensure security and prevent fraud</li>
        </ul>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">4. Information Sharing and Disclosure</h2>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-medium">
            <strong>We do not sell your personal information to third parties.</strong>
          </p>
        </div>

        <h3 className="text-xl font-medium mb-3">Service Providers</h3>
        <p className="mb-3">We share information with trusted third-party service providers who help us operate our platform:</p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Hosting & Infrastructure:</strong> Supabase (database), Vercel (hosting)</li>
          <li><strong>Payment Processing:</strong> Stripe (payments and billing)</li>
          <li><strong>Email Services:</strong> Resend (transactional emails)</li>
          <li><strong>Analytics:</strong> Google Analytics (usage analytics)</li>
          <li><strong>AI Services:</strong> OpenAI (content generation)</li>
          <li><strong>Error Tracking:</strong> Sentry (error monitoring)</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">Legal Requirements</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Comply with legal obligations and court orders</li>
          <li>Protect our rights and prevent fraud</li>
          <li>Respond to government requests</li>
          <li>Enforce our Terms of Service</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">Business Transfers</h3>
        <p className="mb-4">
          In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction.
        </p>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">5. Third-Party Platform Integration</h2>
        <p className="mb-4">
          Our service integrates with third-party review platforms (Google, Yelp, Facebook, etc.). Important considerations:
        </p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Platform Policies:</strong> You must comply with each platform's terms of service and privacy policies</li>
          <li><strong>Data Sharing:</strong> When you post reviews to third-party platforms, that data is governed by their privacy policies</li>
          <li><strong>Account Requirements:</strong> You and your customers may need accounts on these platforms to leave reviews</li>
          <li><strong>No Control:</strong> We have no control over third-party platform data practices or policy changes</li>
        </ul>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">6. Data Security</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Encryption:</strong> Data is encrypted in transit (HTTPS) and at rest</li>
          <li><strong>Access Controls:</strong> Strict access controls and authentication requirements</li>
          <li><strong>Regular Audits:</strong> Security assessments and vulnerability testing</li>
          <li><strong>Monitoring:</strong> Continuous monitoring for security threats</li>
          <li><strong>Employee Training:</strong> Regular security training for our team</li>
          <li><strong>Incident Response:</strong> Procedures for handling security incidents</li>
        </ul>
        <p className="mt-4 text-gray-600">
          <strong>Note:</strong> No system is 100% secure. Please use strong passwords and keep your account credentials confidential.
        </p>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">7. Cookies and Tracking Technologies</h2>
        
        <h3 className="text-xl font-medium mb-3">Types of Cookies We Use</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Essential Cookies:</strong> Required for authentication and core functionality</li>
          <li><strong>Analytics Cookies:</strong> Google Analytics for usage statistics (anonymized)</li>
          <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
          <li><strong>Security Cookies:</strong> Protect against fraud and unauthorized access</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">Managing Cookies</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>You can control cookies through your browser settings</li>
          <li>Disabling essential cookies may affect functionality</li>
          <li>You can opt out of Google Analytics tracking</li>
        </ul>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">8. Data Retention</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Account Data:</strong> Retained while your account is active and for 90 days after deletion</li>
          <li><strong>Review Data:</strong> Retained as long as needed for business purposes or legal requirements</li>
          <li><strong>Analytics Data:</strong> Anonymized data may be retained for statistical purposes</li>
          <li><strong>Payment Data:</strong> Retained according to financial and tax requirements (typically 7 years)</li>
          <li><strong>Support Data:</strong> Customer service records retained for 3 years</li>
        </ul>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">9. Your Privacy Rights</h2>
        
        <h3 className="text-xl font-medium mb-3">General Rights</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Access:</strong> Request copies of your personal information</li>
          <li><strong>Correction:</strong> Update or correct inaccurate information</li>
          <li><strong>Deletion:</strong> Request deletion of your personal information</li>
          <li><strong>Portability:</strong> Receive your data in a portable format</li>
          <li><strong>Objection:</strong> Object to certain types of processing</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">GDPR Rights (EU Residents)</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Right to be informed about data processing</li>
          <li>Right to restrict processing</li>
          <li>Right to withdraw consent</li>
          <li>Right to lodge complaints with supervisory authorities</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">CCPA Rights (California Residents)</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Right to know what personal information is collected</li>
          <li>Right to delete personal information</li>
          <li>Right to opt out of sale (we don't sell personal information)</li>
          <li>Right to non-discrimination</li>
        </ul>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">10. International Data Transfers</h2>
        <p className="mb-4">
          Your information may be processed and stored in countries other than your own. We ensure appropriate safeguards are in place:
        </p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Standard Contractual Clauses for EU data transfers</li>
          <li>Adequacy decisions where applicable</li>
          <li>Privacy Shield frameworks (where still valid)</li>
          <li>Other lawful transfer mechanisms</li>
        </ul>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">11. Children's Privacy</h2>
        <p className="mb-4">
          Our service is not intended for children under 18. We do not knowingly collect personal information from children under 18. If you believe we have collected information from a child under 18, please contact us immediately.
        </p>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">12. Marketing Communications</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Consent:</strong> We only send marketing emails with your consent</li>
          <li><strong>Opt-out:</strong> You can unsubscribe from marketing emails at any time</li>
          <li><strong>Transactional Emails:</strong> Service-related emails cannot be opted out of</li>
          <li><strong>Preferences:</strong> You can manage your communication preferences in your account settings</li>
        </ul>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">13. Business Customer vs. End User Data</h2>
        <p className="mb-4">
          <strong>Two Types of Data Users:</strong>
        </p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Business Customers:</strong> You (our direct customers who use our platform)</li>
          <li><strong>End Users:</strong> Your customers who submit reviews through our widgets</li>
        </ul>
        
        <p className="mb-4">
          <strong>Your Responsibilities as a Business Customer:</strong>
        </p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Obtain necessary consents from your customers</li>
          <li>Provide appropriate privacy notices to your customers</li>
          <li>Comply with applicable privacy laws</li>
          <li>Handle customer data requests appropriately</li>
        </ul>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">14. Changes to This Privacy Policy</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>We may update this Privacy Policy periodically</li>
          <li>Significant changes will be communicated via email or platform notification</li>
          <li>Continued use of our service constitutes acceptance of changes</li>
          <li>You should review this policy periodically</li>
        </ul>
      </section>

      <section className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">15. Contact Information</h2>
        <p className="mb-4">
          For privacy-related questions, concerns, or requests, please contact us:
        </p>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="mb-2">
            <strong>Email:</strong>{" "}
            <a
              href="mailto:privacy@promptreviews.app"
              className="text-slate-blue underline hover:text-slate-700"
            >
              privacy@promptreviews.app
            </a>
          </p>
          <p className="mb-2">
            <strong>Support:</strong>{" "}
            <a
              href="mailto:support@promptreviews.app"
              className="text-slate-blue underline hover:text-slate-700"
            >
              support@promptreviews.app
            </a>
          </p>
          <p className="text-sm text-gray-600 mt-4">
            We will respond to your privacy-related requests within 30 days.
          </p>
        </div>
      </section>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <p className="text-center text-gray-500 font-medium">
          <strong>Effective Date:</strong> January 2025
        </p>
        <p className="text-center text-gray-500 mt-2">
          By using PromptReviews, you acknowledge that you have read, understood, and agree to this Privacy Policy.
        </p>
      </div>
    </div>
  );
}
