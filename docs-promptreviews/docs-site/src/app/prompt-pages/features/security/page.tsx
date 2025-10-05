import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, ChevronRight, Lock, Key, Eye, FileCheck, Globe, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security & Privacy - Enterprise-Grade Protection | Prompt Reviews',
  description: 'Learn how we protect customer data with enterprise-grade security, end-to-end encryption, GDPR compliance, and comprehensive privacy controls.',
  keywords: ['security', 'privacy', 'encryption', 'GDPR', 'CCPA', 'data protection'],
};

export default function SecurityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-white/60 mb-6">
        <Link href="/" className="hover:text-white">Home</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/prompt-pages" className="hover:text-white">Prompt Pages</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <Link href="/prompt-pages/features" className="hover:text-white">Features</Link>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-white">Security & Privacy</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Security & privacy</h1>
        </div>
        <p className="text-xl text-white/80">
          Enterprise-grade security measures protect all customer data and review information, ensuring compliance with privacy regulations and maintaining customer trust.
        </p>
      </div>

      {/* Overview */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Why security matters</h2>
        <p className="text-white/80 mb-4">
          When customers share their experiences through reviews, they're trusting you with their information. Security isn't just about compliance - it's about maintaining that trust and protecting your business reputation.
        </p>
        <p className="text-white/80">
          We implement multiple layers of security to ensure customer data remains private, secure, and compliant with international privacy regulations including GDPR and CCPA.
        </p>
      </div>

      {/* Security Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Security features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-5 h-5 text-green-300" />
              <h3 className="font-semibold text-white">End-to-End Encryption</h3>
            </div>
            <p className="text-sm text-white/70">
              All data transmission is encrypted with industry-standard SSL/TLS protocols
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-5 h-5 text-blue-300" />
              <h3 className="font-semibold text-white">Secure Authentication</h3>
            </div>
            <p className="text-sm text-white/70">
              Multi-factor authentication and secure session management
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-purple-300" />
              <h3 className="font-semibold text-white">Privacy Controls</h3>
            </div>
            <p className="text-sm text-white/70">
              Granular control over what customer information is collected and stored
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-5 h-5 text-orange-300" />
              <h3 className="font-semibold text-white">GDPR & CCPA Compliance</h3>
            </div>
            <p className="text-sm text-white/70">
              Built-in compliance features for international privacy regulations
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-yellow-300" />
              <h3 className="font-semibold text-white">Secure Hosting</h3>
            </div>
            <p className="text-sm text-white/70">
              Infrastructure hosted on enterprise-grade secure servers
            </p>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-300" />
              <h3 className="font-semibold text-white">Regular Security Audits</h3>
            </div>
            <p className="text-sm text-white/70">
              Continuous monitoring and regular third-party security assessments
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">How we protect your data</h2>
        <ol className="space-y-4">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Encrypted transmission</h4>
              <p className="text-white/70 text-sm">All data sent between customers and servers is encrypted with 256-bit SSL</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Secure storage</h4>
              <p className="text-white/70 text-sm">Data stored in encrypted databases with strict access controls</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Access management</h4>
              <p className="text-white/70 text-sm">Role-based permissions ensure only authorized users access data</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
            <div>
              <h4 className="font-semibold text-white mb-1">Continuous monitoring</h4>
              <p className="text-white/70 text-sm">24/7 security monitoring and automatic threat detection</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Privacy Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Privacy protections</h2>
        <div className="space-y-3">
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Minimal data collection</h4>
              <p className="text-sm text-white/70">We only collect information necessary for review functionality</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Customer consent</h4>
              <p className="text-sm text-white/70">Clear consent mechanisms for data collection and usage</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Data deletion rights</h4>
              <p className="text-sm text-white/70">Customers can request deletion of their information anytime</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Transparent policies</h4>
              <p className="text-sm text-white/70">Clear, easy-to-understand privacy policies and terms</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">No data selling</h4>
              <p className="text-sm text-white/70">We never sell customer data to third parties</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <div className="text-green-400 text-xl mt-0.5">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Secure backups</h4>
              <p className="text-sm text-white/70">Encrypted backups ensure data recovery without compromising security</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">Regulatory compliance</h2>
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">GDPR (General Data Protection Regulation)</h4>
            <p className="text-sm text-white/70">
              Full compliance with EU data protection requirements including right to access, deletion, and portability
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">CCPA (California Consumer Privacy Act)</h4>
            <p className="text-sm text-white/70">
              California privacy law compliance with consumer rights and data disclosure requirements
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">SOC 2 Type II Standards</h4>
            <p className="text-sm text-white/70">
              Infrastructure meets industry security and availability standards
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2">PCI DSS</h4>
            <p className="text-sm text-white/70">
              Payment card industry security standards for handling payment information
            </p>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Key benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Customer trust</h4>
              <p className="text-sm text-white/70">Build confidence with enterprise-grade security</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Legal compliance</h4>
              <p className="text-sm text-white/70">Meet regulatory requirements automatically</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Risk reduction</h4>
              <p className="text-sm text-white/70">Minimize security risks and potential liability</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Professional reputation</h4>
              <p className="text-sm text-white/70">Demonstrate commitment to data protection</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Peace of mind</h4>
              <p className="text-sm text-white/70">Focus on business while we handle security</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-green-400 text-xl">✓</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Competitive advantage</h4>
              <p className="text-sm text-white/70">Security as a differentiator from competitors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Perfect For */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">Essential for</h2>
        <ul className="space-y-3">
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Healthcare providers</strong> handling sensitive patient information</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Financial services</strong> requiring strict data protection</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">Legal and professional services</strong> with confidentiality requirements</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">EU and California businesses</strong> requiring GDPR/CCPA compliance</span>
          </li>
          <li className="flex gap-3">
            <span className="text-purple-400">•</span>
            <span className="text-white/80"><strong className="text-white">All businesses</strong> prioritizing customer data protection and privacy</span>
          </li>
        </ul>
      </div>

      {/* Related Features */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Related features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/team"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">Team & Account Settings</div>
              <div className="text-xs text-white/60">Manage access and permissions</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>

          <Link
            href="/prompt-pages/features"
            className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors group"
          >
            <div className="flex-1">
              <div className="font-semibold text-white group-hover:underline">All Features</div>
              <div className="text-xs text-white/60">View all prompt page features</div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white/60" />
          </Link>
        </div>
      </div>
    </div>
  );
}
