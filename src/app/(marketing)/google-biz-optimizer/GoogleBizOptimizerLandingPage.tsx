'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';

export default function GoogleBizOptimizerLandingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Icon name="FaStar" size={16} color="white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PromptReviews</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('benefits')} className="text-gray-600 hover:text-indigo-600 transition-colors">
                Benefits
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-indigo-600 transition-colors">
                How it works
              </button>
              <button onClick={() => scrollToSection('sample-report')} className="text-gray-600 hover:text-indigo-600 transition-colors">
                Sample report
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-gray-600 hover:text-indigo-600 transition-colors">
                FAQ
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-sm font-medium mb-8">
              <Icon name="FaRocket" size={16} className="mr-2" />
              Free Google Business Profile Analysis
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Get Your Free
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Google Business Profile</span>
              <br />
              Optimization Report
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover exactly how to improve your local search visibility with our AI-powered analysis.
              Get <strong>10+ specific recommendations</strong> in under 2 minutes – completely free.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/embed/google-business-optimizer" className="group">
                <button className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2">
                  <Icon name="FaChartBar" size={20} color="white" />
                  <span>Get my free report</span>
                  <Icon name="FaArrowRight" size={16} color="white" className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <div className="text-sm text-gray-500 flex items-center space-x-1">
                <Icon name="FaClock" size={14} />
                <span>Takes less than 2 minutes</span>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Icon name="FaShieldAlt" size={16} className="text-green-500" />
                <span>No signup required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="FaGift" size={16} className="text-blue-500" />
                <span>100% Free</span>
              </div>
              <div className="flex items-center space-x-2">
                <Icon name="MdDownload" size={16} className="text-purple-500" />
                <span>Instant PDF download</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Optimize Your Google Business Profile?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your Google Business Profile is often the first impression customers have of your business.
              Here's what proper optimization can do for you:
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefit 1 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="FaSearch" size={24} color="white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Increase local search visibility</h3>
              <p className="text-gray-600">
                Appear higher in "near me" searches and local map results. Studies show optimized profiles get
                <strong> 70% more clicks</strong> than unoptimized ones.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="FaUsers" size={24} color="white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Attract more customers</h3>
              <p className="text-gray-600">
                Complete profiles with photos, hours, and reviews get <strong>42% more requests</strong> for driving directions
                and <strong>35% more clicks</strong> to websites.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="FaTrophy" size={24} color="white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Build customer trust</h3>
              <p className="text-gray-600">
                Businesses with complete profiles and positive reviews are viewed as <strong>2.7x more trustworthy</strong>
                by potential customers.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="FaPhone" size={24} color="white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Drive more phone calls</h3>
              <p className="text-gray-600">
                Optimized profiles generate <strong>3x more phone calls</strong> from customers ready to buy your
                products or services.
              </p>
            </div>

            {/* Benefit 5 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="FaStar" size={24} color="white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Get more reviews</h3>
              <p className="text-gray-600">
                Properly optimized profiles with review prompts get <strong>50% more reviews</strong>,
                building social proof that drives more business.
              </p>
            </div>

            {/* Benefit 6 */}
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon name="FaChartLine" size={24} color="white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Outrank competitors</h3>
              <p className="text-gray-600">
                Stay ahead of competitors who neglect their profiles. <strong>64% of businesses</strong>
                have incomplete or outdated Google Business Profiles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get your comprehensive optimization report in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center group hover:shadow-xl transition-all duration-300">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    1
                  </div>
                </div>
                <div className="mt-8 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Icon name="FaLink" size={24} className="text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Enter your Google Maps URL</h3>
                <p className="text-gray-600">
                  Simply paste your Google Business Profile URL or search for your business.
                  We'll find your listing in seconds.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center group hover:shadow-xl transition-all duration-300">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    2
                  </div>
                </div>
                <div className="mt-8 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Icon name="FaChartBar" size={24} className="text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Analysis</h3>
                <p className="text-gray-600">
                  Our AI analyzes your profile completeness, photos, reviews, hours, categories,
                  and more to identify optimization opportunities.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center group hover:shadow-xl transition-all duration-300">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    3
                  </div>
                </div>
                <div className="mt-8 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Icon name="MdDownload" size={24} className="text-indigo-600" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Get your report</h3>
                <p className="text-gray-600">
                  Receive a professional PDF report with specific, actionable recommendations
                  to improve your local search ranking.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/embed/google-business-optimizer">
              <button className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2 mx-auto">
                <Icon name="FaRocket" size={20} color="white" />
                <span>Start your free analysis</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Sample Report Preview */}
      <section id="sample-report" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What's In Your Report?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Get a comprehensive analysis with specific, actionable recommendations
              tailored to your business profile
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Report Preview Image */}
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 shadow-xl">
                <div className="bg-white rounded-lg p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Google Business Profile Report</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                  </div>

                  {/* Sample content */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-sm text-red-800 font-medium">Profile Completeness</span>
                      <span className="text-sm text-red-600 font-bold">67%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-sm text-yellow-800 font-medium">Photo Quality Score</span>
                      <span className="text-sm text-yellow-600 font-bold">72%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-sm text-green-800 font-medium">Review Response Rate</span>
                      <span className="text-sm text-green-600 font-bold">89%</span>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">Top Recommendations</h4>
                      <ul className="space-y-2 text-xs text-blue-800">
                        <li className="flex items-center space-x-2">
                          <Icon name="FaCheck" size={12} className="text-blue-600" />
                          <span>Add business hours for all days</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Icon name="FaCheck" size={12} className="text-blue-600" />
                          <span>Upload 5 more high-quality photos</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Icon name="FaCheck" size={12} className="text-blue-600" />
                          <span>Add specialized services list</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Features */}
            <div className="order-1 lg:order-2">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="FaCheckCircle" size={16} color="white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Completeness Score</h3>
                    <p className="text-gray-600">Get a detailed breakdown of what information is missing and how to complete your profile for maximum visibility.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="FaImage" size={16} color="white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Photo Optimization Analysis</h3>
                    <p className="text-gray-600">Learn which types of photos to add, how many you need, and best practices for photo quality and composition.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="FaStar" size={16} color="white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Strategy Recommendations</h3>
                    <p className="text-gray-600">Discover how to get more reviews, respond effectively, and manage your online reputation.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="FaSearch" size={16} color="white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">SEO Optimization Tips</h3>
                    <p className="text-gray-600">Get specific recommendations for keywords, categories, and business descriptions to improve local search ranking.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="FaChartLine" size={16} color="white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Benchmarks</h3>
                    <p className="text-gray-600">See how your profile compares to industry standards and competitors in your area.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Business Owners Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of businesses that have improved their local presence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} name="FaStar" size={16} className="text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "The report showed me exactly what I was missing. After following the recommendations,
                my calls increased by 40% in just 2 weeks!"
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  S
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Sarah Johnson</p>
                  <p className="text-sm text-gray-500">Salon Owner, Seattle</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} name="FaStar" size={16} className="text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "I had no idea my profile was so incomplete. The actionable tips helped me climb
                from page 2 to the top 3 results for my main keywords."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  M
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Mike Rodriguez</p>
                  <p className="text-sm text-gray-500">Restaurant Owner, Austin</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Icon key={i} name="FaStar" size={16} className="text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">
                "The photo recommendations alone made a huge difference. Now I get more engagement
                and customers comment on how professional my business looks online."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  L
                </div>
                <div className="ml-3">
                  <p className="font-semibold text-gray-900">Lisa Chen</p>
                  <p className="text-sm text-gray-500">Fitness Studio, San Francisco</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-indigo-600 mb-2">15,000+</div>
              <div className="text-gray-600">Reports Generated</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">87%</div>
              <div className="text-gray-600">See Improved Rankings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">4.9/5</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-600 mb-2">45%</div>
              <div className="text-gray-600">Average Traffic Increase</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our Google Business Profile optimizer
            </p>
          </div>

          <div className="space-y-6">
            <FAQItem
              question="Is this really completely free?"
              answer="Yes! Our Google Business Profile optimizer is 100% free with no hidden costs, no credit card required, and no signup needed. We want to help businesses improve their local presence."
            />
            <FAQItem
              question="How accurate is the analysis?"
              answer="Our AI-powered analysis uses the same criteria that Google uses to evaluate business profiles. We analyze over 50 different factors including completeness, photo quality, review management, and SEO optimization."
            />
            <FAQItem
              question="What format is the report in?"
              answer="You'll receive a professional PDF report that you can save, print, or share with your team. The report is branded and includes specific, actionable recommendations tailored to your business."
            />
            <FAQItem
              question="How long does it take to see results?"
              answer="Many businesses see improvements within 1-2 weeks of implementing our recommendations. However, full SEO benefits typically take 4-8 weeks as Google needs time to re-index and rank your updated profile."
            />
            <FAQItem
              question="Do I need technical skills to implement the recommendations?"
              answer="Not at all! Our recommendations are written in plain English with step-by-step instructions. Most improvements can be made directly in your Google Business Profile dashboard in just a few minutes."
            />
            <FAQItem
              question="Will this work for any type of business?"
              answer="Yes! Our optimizer works for all types of local businesses including restaurants, retail stores, service providers, healthcare practices, fitness studios, and more. The recommendations are customized based on your business category."
            />
            <FAQItem
              question="Can I run the analysis multiple times?"
              answer="Absolutely! We recommend running a new analysis every 2-3 months to track your progress and get updated recommendations as your profile evolves and Google's algorithms change."
            />
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Boost Your Local Search Rankings?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Join thousands of successful businesses who've improved their Google Business Profile.
            Get your free optimization report in under 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/embed/google-business-optimizer" className="group">
              <button className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2">
                <Icon name="FaChartBar" size={20} />
                <span>Get my free report now</span>
                <Icon name="FaArrowRight" size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-indigo-200">
            <div className="flex items-center space-x-2">
              <Icon name="FaShieldAlt" size={16} className="text-green-300" />
              <span>No signup required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="FaClock" size={16} className="text-blue-300" />
              <span>Takes less than 2 minutes</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="MdDownload" size={16} className="text-purple-300" />
              <span>Instant PDF download</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Icon name="FaStar" size={16} color="white" />
              </div>
              <span className="text-xl font-bold text-white">PromptReviews</span>
            </div>
            <div className="flex items-center space-x-6 text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="mailto:support@promptreviews.app" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2024 PromptReviews. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <h3 className="text-lg font-semibold text-gray-900">{question}</h3>
        <Icon
          name={isOpen ? "FaChevronUp" : "FaChevronDown"}
          size={16}
          className={`text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-white">
          <p className="text-gray-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}