import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-gray-200 dark:border-gray-700 footer-bg">
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">SkillSnap<span className="text-primary dark:text-primary-dark">®</span></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-xs">Personalized roadmap & resume analysis to help you land your dream role.</p>
        </div>

        <div className="flex justify-between">
          <div>
            <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">Platform</div>
            <nav className="mt-2 flex flex-col gap-2">
              <Link href="/" className="footer-link text-sm text-gray-600 dark:text-gray-400">Home</Link>
              <Link href="/upload-resume" className="footer-link text-sm text-gray-600 dark:text-gray-400">Analyze Resume</Link>
              <Link href="/dashboard" className="footer-link text-sm text-gray-600 dark:text-gray-400">Dashboard</Link>
            </nav>
          </div>

          <div>
            <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">Company</div>
            <nav className="mt-2 flex flex-col gap-2">
              <a className="footer-link text-sm text-gray-600 dark:text-gray-400">Team</a>
              <a className="footer-link text-sm text-gray-600 dark:text-gray-400">Contact</a>
              <a className="footer-link text-sm text-gray-600 dark:text-gray-400">FAQ</a>
            </nav>
          </div>
        </div>

        <div className="flex flex-col items-start md:items-end">
          <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">Stay in Touch</div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-right">Get tips on improving your resume and learning resources.</p>
          <form className="mt-3 flex w-full md:w-auto items-center gap-2">
            <input aria-label="Email" type="email" placeholder="you@company.com" className="footer-input text-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600" />
            <button className="animated-btn animated-btn--sm">Subscribe</button>
          </form>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-6 text-center">
        <div className="w-full h-px bg-black-300 dark:bg-gray-700 mb-4"></div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          © 2025 SkillSnap • Built for learners
        </div>
      </div>
    </footer>
  )
}