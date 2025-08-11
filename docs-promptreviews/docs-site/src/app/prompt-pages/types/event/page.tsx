import { Metadata } from 'next';
import { Calendar, PartyPopper, Clock, MapPin, Users, Sparkles } from 'lucide-react';
import DocsLayout from '../../../docs-layout';

export const metadata: Metadata = {
  title: 'Event Prompt Pages - Event Reviews Guide | Prompt Reviews',
  description: 'Learn how to create Event prompt pages for collecting reviews from workshops, conferences, weddings, and special occasions.',
  keywords: 'event prompt pages, event reviews, workshop feedback, conference reviews, wedding reviews',
  openGraph: {
    title: 'Event Prompt Pages - Collect Event Feedback',
    description: 'Create Event prompt pages to collect feedback from attendees and showcase successful events.',
  },
};

export default function EventPromptPages() {
  return (
    <DocsLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-300" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Event Prompt Pages
            </h1>
          </div>
          <p className="text-xl text-white/80">
            Capture feedback from events, workshops, conferences, and special occasions. Perfect for event planners, 
            venues, educators, and anyone hosting memorable experiences.
          </p>
        </div>

        {/* Why Choose Event Pages */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Why Choose Event Prompt Pages?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Time-Specific</h3>
              <p className="text-white/70 text-sm">Capture feedback while memories are fresh</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-green-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Attendee Insights</h3>
              <p className="text-white/70 text-sm">Understand what resonated with your audience</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="font-semibold text-white mb-2">Social Proof</h3>
              <p className="text-white/70 text-sm">Build credibility for future events</p>
            </div>
          </div>
        </div>

        {/* Event Types */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Perfect For These Events</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <PartyPopper className="w-5 h-5 text-yellow-300" />
                <h3 className="text-lg font-bold text-white">Corporate Events</h3>
              </div>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Conferences & summits</li>
                <li>• Team building events</li>
                <li>• Product launches</li>
                <li>• Company celebrations</li>
              </ul>
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-blue-300">Focus:</strong> Professional value and networking
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="w-5 h-5 text-pink-300" />
                <h3 className="text-lg font-bold text-white">Social Events</h3>
              </div>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Weddings & receptions</li>
                <li>• Birthday parties</li>
                <li>• Anniversary celebrations</li>
                <li>• Reunions & gatherings</li>
              </ul>
              <div className="bg-pink-500/20 border border-pink-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-pink-300">Focus:</strong> Experience and atmosphere
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="w-5 h-5 text-green-300" />
                <h3 className="text-lg font-bold text-white">Educational Events</h3>
              </div>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Workshops & masterclasses</li>
                <li>• Seminars & webinars</li>
                <li>• Training sessions</li>
                <li>• Certification courses</li>
              </ul>
              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-green-300">Focus:</strong> Learning outcomes and value
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-300" />
                <h3 className="text-lg font-bold text-white">Entertainment Events</h3>
              </div>
              <ul className="space-y-2 text-white/80 text-sm mb-4">
                <li>• Concerts & performances</li>
                <li>• Festivals & fairs</li>
                <li>• Sports events</li>
                <li>• Art exhibitions</li>
              </ul>
              <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3">
                <p className="text-white/80 text-sm">
                  <strong className="text-purple-300">Focus:</strong> Entertainment value and experience
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Event-Specific Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Event-Specific Features</h2>
          <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Event Details</h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Event name and date</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Venue information</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Ticket type tracking</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-300">✓</span>
                    <span>Session/speaker feedback</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Feedback Options</h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Overall event rating</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Specific aspect ratings</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Photo sharing from event</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-blue-300">✓</span>
                    <span>Improvement suggestions</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Questions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Sample Event Review Questions</h2>
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-3">Conference/Workshop</h3>
              <ul className="space-y-1 text-white/80 text-sm">
                <li>• How valuable was the content presented?</li>
                <li>• Which session was most beneficial?</li>
                <li>• How was the venue and facilities?</li>
                <li>• Would you attend our next event?</li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-3">Wedding/Social Event</h3>
              <ul className="space-y-1 text-white/80 text-sm">
                <li>• How was the venue and atmosphere?</li>
                <li>• How was the food and service?</li>
                <li>• What was your favorite moment?</li>
                <li>• Would you recommend our venue?</li>
              </ul>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-3">Entertainment Event</h3>
              <ul className="space-y-1 text-white/80 text-sm">
                <li>• How was the overall experience?</li>
                <li>• Was the event worth the price?</li>
                <li>• How was the organization and flow?</li>
                <li>• Would you attend similar events?</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Send Quickly</h3>
              <p className="text-white/80 text-sm">
                Request feedback within 24-48 hours while the experience is fresh.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Be Specific</h3>
              <p className="text-white/80 text-sm">
                Reference specific aspects of the event in your questions.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Keep It Short</h3>
              <p className="text-white/80 text-sm">
                Limit to 5-7 questions for higher completion rates.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-sm border border-white/20 p-6">
              <h3 className="font-semibold text-white mb-2">Offer Incentives</h3>
              <p className="text-white/80 text-sm">
                Consider early-bird discounts for next event to reviewers.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to Collect Event Feedback?
          </h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Start collecting valuable feedback from your events to improve future experiences and build social proof.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://app.promptreviews.com/dashboard"
              className="inline-flex items-center px-6 py-3 bg-white/20 text-white backdrop-blur-sm font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              Create Event Page
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