import '../styles/globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DottedBackground from '../components/DottedBackground'
import { ThemeProvider } from '../contexts/ThemeContext'

export const metadata = {
  title: 'SkillSnap — Discover Your Skill Gaps',
  description: 'Upload your resume and get a personalized roadmap to your dream job.',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme detection script - runs BEFORE any CSS is applied */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const theme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  
                  // Store theme in localStorage if not already set
                  if (!savedTheme) {
                    localStorage.setItem('theme', theme);
                  }
                } catch (e) {
                  // Fallback to light theme if error
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          {/* Background placed behind all content */}
          <DottedBackground spacing={36} dotSize={2} strength={16} />
          <Navbar />
          <main className="min-h-screen relative z-10">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}