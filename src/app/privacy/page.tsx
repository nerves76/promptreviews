import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-slate-blue">Privacy Policy</h1>
      <p className="mb-4 text-gray-700">Your privacy is important to Prompt Reviews. This Privacy Policy explains how we collect, use, and protect your information when you use our platform.</p>
      <h2 className="text-xl font-semibold mt-8 mb-2">1. Information We Collect</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>Account information (name, email, business details) you provide when signing up.</li>
        <li>Content you submit, such as reviews, testimonials, and business information.</li>
        <li>Usage data, such as page views, device information, and IP address.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">2. How We Use Your Information</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>To provide, maintain, and improve our services.</li>
        <li>To communicate with you about your account or updates to the platform.</li>
        <li>To personalize your experience and show relevant content.</li>
        <li>To analyze usage and improve security.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">3. Sharing of Information</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>We do not sell your personal information to third parties.</li>
        <li>We may share information with service providers who help us operate the platform (e.g., hosting, analytics, payment processing).</li>
        <li>We may disclose information if required by law or to protect our rights and users.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">4. Cookies & Tracking</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>We use cookies and similar technologies to enhance your experience and analyze usage.</li>
        <li>You can control cookies through your browser settings.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">5. Data Security</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>We implement reasonable security measures to protect your data.</li>
        <li>No system is 100% secure; please use strong passwords and protect your account.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">6. Your Rights</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>You may access, update, or delete your account information at any time.</li>
        <li>Contact us at <a href="mailto:support@promptreviews.com" className="underline text-indigo-700 hover:text-indigo-900">support@promptreviews.com</a> for privacy-related requests.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">7. Changes to This Policy</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>We may update this Privacy Policy from time to time. We will notify you of significant changes, but please review this page periodically.</li>
      </ul>
      <p className="mt-8 text-gray-500">Effective date: June 2024</p>
    </div>
  );
} 