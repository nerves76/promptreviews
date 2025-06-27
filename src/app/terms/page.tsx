import React from "react";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-slate-blue">
        Terms & Conditions
      </h1>
      <p className="mb-4 text-gray-700">
        Welcome to Prompt Reviews! Please read these Terms & Conditions
        ("Terms") carefully before using our platform. By accessing or using
        Prompt Reviews, you agree to be bound by these Terms.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">1. Use of Service</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>
          Prompt Reviews is a platform for businesses to collect, manage, and
          showcase customer reviews and testimonials.
        </li>
        <li>
          You must be at least 18 years old or have the consent of a parent or
          guardian to use this service.
        </li>
        <li>
          You agree to use Prompt Reviews in compliance with all applicable laws
          and regulations.
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">2. User Content</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>
          You are responsible for any content (including reviews, testimonials,
          and business information) you submit to the platform.
        </li>
        <li>
          You grant Prompt Reviews a non-exclusive, royalty-free license to use,
          display, and share your submitted content for the purpose of providing
          and promoting the service.
        </li>
        <li>
          You agree not to submit content that is false, misleading, defamatory,
          or infringes on the rights of others.
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">3. Privacy</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>
          Your privacy is important to us. Please review our{" "}
          <a
            href="/privacy"
            className="underline text-indigo-700 hover:text-indigo-900"
          >
            Privacy Policy
          </a>{" "}
          to understand how we collect, use, and protect your information.
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">4. Account Security</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>
          You are responsible for maintaining the confidentiality of your
          account credentials.
        </li>
        <li>Notify us immediately of any unauthorized use of your account.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">
        5. Prohibited Activities
      </h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>No spamming, abuse, or harassment of other users.</li>
        <li>No uploading of viruses, malware, or other harmful code.</li>
        <li>No attempts to reverse engineer or disrupt the platform.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">6. Termination</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>
          We reserve the right to suspend or terminate your account for
          violations of these Terms or for any reason at our discretion.
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">7. Changes to Terms</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>
          We may update these Terms from time to time. We will notify you of
          significant changes, but it is your responsibility to review the Terms
          periodically.
        </li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">8. Contact</h2>
      <ul className="list-disc ml-6 mb-4 text-gray-700">
        <li>
          If you have any questions about these Terms, please contact us at{" "}
          <a
            href="mailto:support@promptreviews.app"
            className="underline text-indigo-700 hover:text-indigo-900"
          >
            support@promptreviews.app
          </a>
          .
        </li>
      </ul>
      <p className="mt-8 text-gray-500">Effective date: June 2024</p>
    </div>
  );
}
