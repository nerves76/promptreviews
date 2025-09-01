import React from "react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-slate-blue">
        Terms of Service
      </h1>
      
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800 font-medium">
          <strong>Last Updated:</strong> July 2025
        </p>
        <p className="text-blue-700 mt-2">
          Please read these Terms of Service carefully before using PromptReviews. By accessing or using our service, you agree to be bound by these terms.
        </p>
      </div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing or using PromptReviews ("Service", "Platform", "we", "us", "our"), operated by PromptReviews ("Company"), you ("User", "you", "your") agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use our Service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">2. Description of Service</h2>
        <p className="mb-4">
          PromptReviews is a software platform that helps businesses collect, manage, and display customer reviews and testimonials. Our Service includes tools for creating prompt pages, managing widgets, organizing review content, and AI-powered content generation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">3. AI-Generated Content Disclosure</h2>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
          <p className="text-amber-800 font-medium mb-2">
            <strong>AI-Powered Features: "Prompty AI" and AI Content Generation</strong>
          </p>
          <p className="text-amber-700">
            Our service uses artificial intelligence technology (specifically the ChatGPT API provided by OpenAI) to generate review templates, email content, and other text-based materials. This AI functionality may be referred to as "Prompty AI" in our marketing materials and user interface.
          </p>
        </div>

        <h3 className="text-xl font-medium mb-3">Important AI Content Disclaimers:</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Review Before Use:</strong> All AI-generated content should be reviewed and approved by you before use. You are solely responsible for ensuring the accuracy and appropriateness of all AI-generated content.</li>
          <li><strong>No Guarantee of Accuracy:</strong> AI-generated content may contain errors, inaccuracies, or inappropriate suggestions. We do not guarantee the accuracy, completeness, or suitability of AI-generated content for your specific needs.</li>
          <li><strong>Third-Party AI Service:</strong> Our AI features rely on third-party AI services (including OpenAI's ChatGPT API). We are not responsible for the availability, performance, or decisions made by these third-party AI systems.</li>
          <li><strong>User Responsibility:</strong> You are solely responsible for any AI-generated content you choose to use, modify, or distribute. This includes ensuring compliance with applicable laws, platform policies, and ethical standards.</li>
          <li><strong>No Liability for AI Content:</strong> We disclaim all liability for any consequences arising from the use of AI-generated content, including but not limited to reputational damage, policy violations, legal issues, or customer complaints.</li>
          <li><strong>Content Ownership:</strong> AI-generated content suggestions are provided as-is. Once you modify or use AI-generated content, you assume full responsibility for that content.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">4. No Guarantees or Warranties</h2>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-bold mb-2">IMPORTANT DISCLAIMER:</p>
          <ul className="list-disc ml-6 space-y-2 text-red-700">
            <li><strong>No Outcome Guarantees:</strong> We do not guarantee any specific outcomes, results, or improvements to your business, reputation, or review performance.</li>
            <li><strong>No Review Permanence:</strong> We are not responsible for lost, deleted, or modified reviews on any platform.</li>
            <li><strong>Third-Party Platform Risks:</strong> We are not responsible for bans, suspensions, or restrictions imposed by third-party review platforms (Google, Yelp, etc.).</li>
            <li><strong>Reputational Impact:</strong> We are not responsible for any reputational damage, whether positive or negative, resulting from the use of our Service.</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">5. Payment Terms</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>All payments are non-refundable. We do not provide refunds for any reason, including but not limited to dissatisfaction with results, changes in business needs, or technical issues.</li>
          <li>Subscription fees are billed in advance and are non-refundable.</li>
          <li>You are responsible for all charges incurred under your account.</li>
          <li>We reserve the right to change pricing with 30 days' notice.</li>
          <li>Failure to pay may result in immediate suspension or termination of your account.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">6. User Responsibilities</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>You must be at least 18 years old or have parental consent to use this Service.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You must comply with all applicable laws and regulations in your use of the Service.</li>
          <li>You are solely responsible for all content you submit, including its accuracy and legality.</li>
          <li>You must not submit false, misleading, defamatory, or fraudulent content.</li>
          <li>You agree to use the Service only for legitimate business purposes.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">7. Prohibited Uses</h2>
        <p className="mb-4">You agree not to use the Service for any of the following prohibited activities:</p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Creating fake, fraudulent, or misleading reviews</li>
          <li>Violating the terms of service of third-party platforms</li>
          <li>Engaging in review manipulation or gaming</li>
          <li>Harassing, abusing, or threatening other users</li>
          <li>Uploading malicious code, viruses, or harmful content</li>
          <li>Attempting to reverse engineer or disrupt the platform</li>
          <li>Using the Service for any illegal or unauthorized purposes</li>
          <li>Incentivizing or paying for reviews in violation of platform policies</li>
          <li>Soliciting reviews from individuals who have not used your products or services</li>
          <li>Removing or filtering legitimate negative reviews</li>
        </ul>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800 font-medium mb-2">
            <strong>Review Authenticity Notice:</strong>
          </p>
          <p className="text-yellow-700">
            You are solely responsible for ensuring that all reviews collected through our Service are authentic and comply with applicable laws and third-party platform policies. We do not verify the authenticity of reviews and are not responsible for any fraudulent or misleading content.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">8. Limitation of Liability</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 font-bold mb-2">CRITICAL LIMITATION:</p>
          <p className="text-red-700 uppercase">
            IN NO EVENT SHALL PROMPTREVIEWS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
          </p>
          <p className="text-red-700 uppercase mt-2">
            OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU TO US IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE LIABILITY.
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">9. Third-Party Platforms</h2>
        <p className="mb-4">
          Our Service may integrate with or reference third-party platforms (Google, Yelp, Facebook, etc.). We are not affiliated with these platforms and are not responsible for:
        </p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Changes to third-party platform policies or terms</li>
          <li>Account suspensions or bans on third-party platforms</li>
          <li>Loss of access to third-party platform features</li>
          <li>Changes in third-party platform functionality</li>
          <li>Third-party platform downtime or technical issues</li>
        </ul>

        <h3 className="text-xl font-medium mb-3">Important Third-Party Requirements:</h3>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li><strong>Platform Compliance:</strong> You must comply with the terms of service of all third-party platforms you use, including Google, Facebook, Yelp, and others.</li>
          <li><strong>Account Requirements:</strong> To leave reviews on third-party platforms, you and your customers may need active, registered accounts on those platforms.</li>
          <li><strong>No Control:</strong> We have no control over third-party platform terms, privacy policies, operations, intellectual property rights, performance, or content.</li>
          <li><strong>Platform Links:</strong> By using our Service, you agree to comply with: Google Terms, Facebook Terms, Yelp Terms, and other applicable platform terms.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">10. Data and Privacy</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Your privacy is important to us. Please review our Privacy Policy.</li>
          <li>You grant us a non-exclusive, royalty-free license to use your submitted content for providing and improving our Service.</li>
          <li>We may back up your data, but we are not responsible for data loss or corruption.</li>
          <li>You are responsible for maintaining your own backups of important data.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">11. Service Availability</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>We strive to maintain high service availability but do not guarantee uninterrupted service.</li>
          <li>We may perform maintenance that temporarily affects service availability.</li>
          <li>We are not liable for any damages resulting from service downtime or interruptions.</li>
          <li>We reserve the right to modify or discontinue the Service at any time.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">12. Account Termination</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>We reserve the right to suspend or terminate your account for violations of these Terms.</li>
          <li>You may terminate your account at any time, but payments are non-refundable.</li>
          <li>Upon termination, we may delete your account data after a reasonable period.</li>
          <li>Termination does not relieve you of any outstanding payment obligations.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">13. Intellectual Property</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>The Service and its original content are protected by copyright, trademark, and other intellectual property laws.</li>
          <li>You may not copy, modify, distribute, or create derivative works of our Service.</li>
          <li>You retain ownership of content you submit but grant us necessary licenses to provide the Service.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">14. Indemnification</h2>
        <p className="mb-4">
          You agree to indemnify and hold harmless PromptReviews from any claims, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of any rights of another party.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">15. Governing Law</h2>
        <p className="mb-4">
          These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where PromptReviews is incorporated, without regard to its conflict of law principles.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">16. Changes to Terms</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>We reserve the right to modify these Terms at any time.</li>
          <li>We will notify users of significant changes via email or platform notification.</li>
          <li>Continued use of the Service after changes constitutes acceptance of the new Terms.</li>
          <li>It is your responsibility to review these Terms periodically.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">17. Data Usage Restrictions</h2>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Data generated by our Service (including analytics, reports, and aggregated information) is provided for your internal business use only.</li>
          <li>You may display review data on your website but may not modify, redistribute, or use it for other purposes without our prior written consent.</li>
          <li>You may not use our Service to scrape, harvest, or collect data from third-party platforms in violation of their terms.</li>
          <li>All data remains subject to the privacy policies and terms of the originating platforms.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">18. Force Majeure</h2>
        <p className="mb-4">
          We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including but not limited to:
        </p>
        <ul className="list-disc ml-6 mb-4 space-y-2">
          <li>Acts of God, natural disasters, or severe weather</li>
          <li>War, terrorism, civil unrest, or government restrictions</li>
          <li>Internet service provider failures or network outages</li>
          <li>Third-party platform failures or policy changes</li>
          <li>Strikes, labor disputes, or supplier failures</li>
          <li>Cyber attacks, malware, or other security incidents</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">19. Severability</h2>
        <p className="mb-4">
          If any provision of these Terms is found to be unenforceable, the remaining provisions will continue to be valid and enforceable.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-blue">20. Contact Information</h2>
        <p className="mb-4">
          If you have any questions about these Terms of Service, please contact us at:
        </p>
        <p className="font-medium">
          Email: <a href="mailto:support@promptreviews.app" className="text-blue-600 hover:underline">support@promptreviews.app</a>
        </p>
      </section>

      <div className="mt-12 p-4 bg-gray-100 border border-gray-300 rounded-lg">
        <p className="text-gray-700 font-medium">
          <strong>Effective Date:</strong> July 2025
        </p>
        <p className="text-gray-700 mt-2">
          By using PromptReviews, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
        </p>
      </div>
    </div>
  );
}