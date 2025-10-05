import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Main */}
          <div>
            <h3 className="text-white font-semibold mb-4">Main</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://promptreviews.app/about/" className="text-white/70 hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="https://promptreviews.app/pricing/" className="text-white/70 hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="https://promptreviews.app/contact/" className="text-white/70 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link href="/" className="text-white/70 hover:text-white transition-colors">
                  Help docs
                </Link>
              </li>
              <li>
                <a href="https://app.promptreviews.app/auth/sign-in" className="text-white/70 hover:text-white transition-colors">
                  Sign in
                </a>
              </li>
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h3 className="text-white font-semibold mb-4">Industries</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://promptreviews.app/agencies-get-reviews/" className="text-white/70 hover:text-white transition-colors">
                  Agencies
                </a>
              </li>
            </ul>
          </div>

          {/* More */}
          <div>
            <h3 className="text-white font-semibold mb-4">More</h3>
            <ul className="space-y-2">
              <li>
                <a href="https://promptreviews.app/get-found-online-the-game/" className="text-white/70 hover:text-white transition-colors">
                  Get Found Online: The Game
                </a>
              </li>
              <li>
                <a href="https://diviner.agency" className="text-white/70 hover:text-white transition-colors">
                  Diviner Marketing Consultancy
                </a>
              </li>
              <li>
                <a href="https://promptreviews.app/privacy-policy-2/" className="text-white/70 hover:text-white transition-colors">
                  Privacy policy
                </a>
              </li>
              <li>
                <a href="https://promptreviews.app/terms-of-service/" className="text-white/70 hover:text-white transition-colors">
                  Terms of service
                </a>
              </li>
            </ul>
          </div>

          {/* Robot Image */}
          <div className="flex items-center justify-center md:justify-end -mr-4 md:-mr-8">
            <img
              src="https://promptreviews.app/wp-content/uploads/2025/08/prompty-thinking-about-getting-reviews.png"
              alt="Prompty robot mascot"
              className="w-48 md:w-56 h-auto"
              loading="lazy"
            />
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/60 text-sm">
          Copyright © 2025 Prompt Reviews | Website by <a href="https://diviner.agency" className="hover:text-white transition-colors">Diviner</a>
        </div>
      </div>
    </footer>
  )
}
