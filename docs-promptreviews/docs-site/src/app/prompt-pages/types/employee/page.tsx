import { Metadata } from 'next';
import { User, Users, Award, Heart, Target, TrendingUp } from 'lucide-react';
import DocsLayout from '../../../docs-layout';

export const metadata: Metadata = {
  title: 'Employee Prompt Pages - Team Member Reviews | Prompt Reviews',
  description: 'Learn how to create Employee prompt pages to spotlight individual team members and collect reviews about specific employees.',
  keywords: 'employee prompt pages, team member reviews, staff reviews, employee recognition, individual reviews',
  openGraph: {
    title: 'Employee Prompt Pages - Spotlight Your Team',
    description: 'Create Employee prompt pages to recognize team members and collect customer feedback about specific employees.',
  },
};

export default function EmployeePromptPages() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-300" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Employee Prompt Pages
            </h1>
          </div>
          <p className="text-xl text-white/80">
            Spotlight individual team members with dedicated review pages. Perfect for recognizing exceptional 
            service, building employee morale, and helping customers connect with specific team members.
          </p>
        </div>

        {/* Why Choose Employee Pages */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose Employee Prompt Pages?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Recognition</h3>
              <p className="text-white/70 text-sm">Recognize and reward exceptional team members</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-green-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Morale Boost</h3>
              <p className="text-white/70 text-sm">Build team morale with positive customer feedback</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Personal Connection</h3>
              <p className="text-white/70 text-sm">Help customers connect with specific team members</p>
            </div>
          </div>
        </div>

        {/* Perfect For */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Perfect For These Businesses</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Service Businesses</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Hair salons & barbershops</li>
                <li>• Spa & wellness centers</li>
                <li>• Restaurants & cafes</li>
                <li>• Hotels & hospitality</li>
              </ul>
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-blue-300">Why:</strong> Customers often prefer specific service providers
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Sales Teams</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Real estate agents</li>
                <li>• Car dealerships</li>
                <li>• Insurance agents</li>
                <li>• Financial advisors</li>
              </ul>
              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-green-300">Why:</strong> Build trust through individual agent reviews
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Healthcare</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Doctors & specialists</li>
                <li>• Dentists & hygienists</li>
                <li>• Therapists & counselors</li>
                <li>• Veterinarians</li>
              </ul>
              <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-purple-300">Why:</strong> Patients choose providers based on reviews
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="text-lg font-bold text-white mb-3">Professional Services</h3>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Consultants</li>
                <li>• Lawyers</li>
                <li>• Accountants</li>
                <li>• Personal trainers</li>
              </ul>
              <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-orange-300">Why:</strong> Expertise validation through client feedback
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Page Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Employee Page Features</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Profile Elements</h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Employee photo and bio</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Role and specializations</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Years of experience</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Certifications and awards</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Review Options</h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Service quality rating</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Communication skills</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Expertise assessment</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Would recommend rating</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Benefits for Your Business</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="w-5 h-5 text-yellow-300" />
                <h3 className="font-semibold text-white">Performance Insights</h3>
              </div>
              <p className="text-white/80 text-sm">
                Get direct customer feedback about individual employee performance to identify stars and areas for improvement.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-300" />
                <h3 className="font-semibold text-white">Competitive Advantage</h3>
              </div>
              <p className="text-white/80 text-sm">
                Stand out by showcasing your team's expertise and excellent service through individual reviews.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Heart className="w-5 h-5 text-pink-300" />
                <h3 className="font-semibold text-white">Employee Retention</h3>
              </div>
              <p className="text-white/80 text-sm">
                Boost employee satisfaction and retention by recognizing their contributions publicly.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="w-5 h-5 text-blue-300" />
                <h3 className="font-semibold text-white">Customer Loyalty</h3>
              </div>
              <p className="text-white/80 text-sm">
                Build stronger customer relationships by connecting them with their favorite team members.
              </p>
            </div>
          </div>
        </div>

        {/* Implementation Tips */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Implementation Tips</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Start with Top Performers</h3>
              <p className="text-white/80 text-sm">
                Begin by creating pages for your best employees to generate positive reviews quickly.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Include in Email Signatures</h3>
              <p className="text-white/80 text-sm">
                Add employee review links to email signatures for easy customer access.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Display on Name Tags</h3>
              <p className="text-white/80 text-sm">
                Add QR codes to employee name tags or business cards for in-person interactions.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Celebrate Successes</h3>
              <p className="text-white/80 text-sm">
                Share positive reviews in team meetings and on social media to boost morale.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Spotlight Your Team?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Start recognizing your employees and collecting valuable feedback about individual team members.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://app.promptreviews.com/dashboard"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Create Employee Page
            </a>
            <a
              href="/prompt-pages/types"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
            >
              View All Types
            </a>
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}