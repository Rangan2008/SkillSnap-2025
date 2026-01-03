# IMPETUS - SkillSnap

<div align="center">

**🚀 AI-Powered Resume Analysis & Career Development Platform**

Transform your career journey with intelligent resume analysis, skill gap identification, and personalized learning roadmaps.

[![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green?style=for-the-badge&logo=mongodb)](https://mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.7.0-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.8-38B2AC?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-blue?style=for-the-badge&logo=google)](https://ai.google.dev/)

</div>

---

## 📋 Quick Navigation

- [✨ Features](#-features)
- [🎯 How It Works](#-how-it-works)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [⚙️ Environment Configuration](#️-environment-configuration)
- [🔌 API Endpoints](#-api-endpoints)
- [🌍 Deployment](#-deployment)
- [📝 Contributing](#-contributing)

---

## 🎯 What is IMPETUS?

**IMPETUS (Intelligent Platform for Empowering Technical and Upskilling Support)**, branded as **SkillSnap**, is a comprehensive AI-powered career development platform that bridges the gap between your current skills and your dream job requirements using Google's Gemini AI.

### 🌟 The Problem It Solves
Job seekers struggle with:
- Understanding skill gaps for target roles
- Creating effective learning strategies
- Tracking progress towards career goals
- Getting personalized career guidance

### ✅ The Solution
IMPETUS provides:
- **AI-Powered Resume Analysis** using Google Gemini
- **Smart Skill Gap Identification** with detailed metrics
- **Personalized Learning Roadmaps** with course recommendations
- **Progress Tracking Dashboard** to monitor growth
- **Community-Driven Courses** tailored to your goals

---

## ✨ Core Features

### 🔐 **Authentication & Security**
- ✅ Email/Password authentication with JWT tokens
- ✅ Google OAuth sign-in (1-click login)
- ✅ Secure password hashing and validation
- ✅ Session management with refresh tokens
- ✅ CORS protection and security headers
- ✅ Profile management with picture upload

### 📄 **Resume Processing**
- ✅ Multi-format support: PDF, DOCX, DOC
- ✅ Advanced text extraction with pdf.js worker
- ✅ Intelligent parsing and formatting
- ✅ Automatic skill extraction
- ✅ Real-time processing feedback

### 🎓 **AI-Powered Analysis**
- ✅ **Match Score**: 0-100% alignment with target role
- ✅ **Skill Assessment**: Skills found ✓ | Missing ⚠️ | Nice-to-have 📚
- ✅ **ATS Score**: Applicant Tracking System compatibility
- ✅ **Experience Level**: Intern to Senior+ analysis
- ✅ **Job Description Analysis**: Compare against specific JD
- ✅ **AI Recommendations**: Actionable improvement suggestions

### 🗺️ **Learning Roadmaps**
- ✅ Personalized skill development paths
- ✅ Phase-based learning structure
- ✅ Curated course recommendations
- ✅ Estimated timeline for skill mastery
- ✅ Milestone tracking and checkpoint progress
- ✅ Bulk progress updates

### 📊 **User Dashboard**
- ✅ Resume upload history (paginated, 10 per page)
- ✅ Analysis overview with key metrics
- ✅ Learning roadmap progress visualization
- ✅ Trending skills and in-demand technologies
- ✅ Quick actions for common tasks
- ✅ Dark/Light theme switching

### 🎨 **User Experience**
- ✅ Modern, responsive design (mobile, tablet, desktop)
- ✅ Light & Dark mode with instant theme switching
- ✅ Smooth animations and transitions
- ✅ Intuitive navigation and UX
- ✅ Loading states and error handling
- ✅ Toast notifications for user feedback

---

## 🎯 How It Works

### **5-Step Process**

1. **📝 Upload Resume**
   - Drag and drop or click to upload
   - Supports PDF, DOCX, DOC formats
   - File size up to 5MB

2. **🎯 Select Target Role**
   - Choose desired job position
   - Select experience level (Intern, Junior, Mid, Senior)
   - Optional: Paste job description for better matching

3. **🤖 AI Analysis**
   - Gemini AI analyzes your resume
   - Compares against target role requirements
   - Generates detailed insights

4. **📊 Get Results**
   - View match percentage and score
   - See skills breakdown
   - Read AI-powered recommendations

5. **🗺️ Follow Roadmap**
   - Get personalized learning path
   - Track progress with checkpoints
   - Complete courses and upskill

---

## 🛠️ Tech Stack

### **Frontend**
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.0.10 | Server-side rendering, API routes |
| React | 18.2.0 | Component-based UI |
| Tailwind CSS | 3.4.8 | Utility-first styling |
| Framer Motion | Latest | Animations & transitions |
| Lucide React | Latest | Beautiful SVG icons |

### **Backend**
| Service | Version | Purpose |
|---------|---------|---------|
| Next.js API Routes | 16.0.10 | RESTful backend |
| Google Gemini AI | v1 | Resume analysis & generation |
| Firebase Auth | 12.7.0 | User authentication |
| Firebase Admin SDK | 12.7.0 | Server-side operations |

### **Database & Storage**
| Service | Type | Purpose |
|---------|------|---------|
| MongoDB Atlas | NoSQL | User data, analyses, roadmaps |
| Cloudinary | CDN | Profile picture hosting |

### **Deployment**
| Platform | Purpose |
|----------|---------|
| Vercel | Hosting & deployment |
| Firebase | Authentication |
| MongoDB Atlas | Database hosting |

---

## 📁 Project Structure

```
impetus-complete/
├── app/                          # Next.js app router
│   ├── api/                      # REST API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── resume/               # Resume operations
│   │   ├── roadmap/              # Roadmap endpoints
│   │   └── progress/             # Progress tracking
│   ├── dashboard/                # User dashboard (paginated)
│   ├── upload-resume/            # Resume upload interface
│   ├── analysis/                 # Analysis results
│   ├── profile/                  # User profile
│   ├── login/ & signup/          # Auth pages
│   └── layout.jsx                # Root layout
│
├── components/                   # Reusable components
│   ├── Navbar.jsx, Footer.jsx
│   ├── Hero.jsx, HowItWorks.jsx
│   └── DreamJobCTA.jsx
│
├── contexts/                     # React contexts
│   └── ThemeContext.jsx          # Dark/light mode
│
├── lib/                          # Utilities & configs
│   ├── api.js, authClient.js
│   ├── db.js, firebase.js
│   ├── gemini.js
│   └── models/                   # Database schemas
│
├── styles/                       # Global styles
│   └── globals.css               # CSS variables
│
├── public/                       # Static assets
│   ├── pdfjs/                    # PDF.js worker
│   └── lottie/                   # Animations
│
└── config files
    ├── next.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0+
- MongoDB instance (Atlas or local)
- Firebase project
- Google Gemini API key
- Cloudinary account

### Installation

#### 1. Clone & Install
```bash
git clone https://github.com/yourusername/impetus.git
cd impetus
npm install
```

#### 2. Environment Variables
Create `.env.local`:
```env
# MongoDB
MONGODB_URI=Connection Link

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project

# Gemini AI
GEMINI_API_KEY=your_gemini_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key

# App
JWT_SECRET=your_secret_key
NODE_ENV=development
```

#### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

#### 4. Build for Production
```bash
npm run build
npm run start
```

---

## ⚙️ Environment Configuration

### MongoDB Setup
1. Create cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user with read/write permissions
3. Whitelist your IP
4. Copy connection string to `.env.local`

### Firebase Setup
1. Create project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Email/Password and Google authentication
3. Download Admin SDK key
4. Add credentials to `.env.local`

### Google Gemini API
1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Enable Generative Language API
3. Add to `.env.local`

### Cloudinary Integration
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Get API credentials from dashboard
3. Add to `.env.local`

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # Email/password login
POST   /api/auth/google            # Google OAuth
GET    /api/auth/me                # Get current user
POST   /api/auth/profile           # Update profile
POST   /api/auth/profile-picture   # Upload picture
```

### Resume Analysis
```
POST   /api/resume/analyze         # Analyze resume
GET    /api/resume-analysis/:id    # Get results
DELETE /api/resume-analysis/:id    # Delete analysis
```

### Roadmaps
```
GET    /api/roadmap/:analysisId    # Get roadmap
GET    /api/roadmap/progress/:id   # Get progress
POST   /api/roadmap/progress/:id/bulk  # Bulk update
```

### Progress
```
POST   /api/progress/track         # Track progress
GET    /api/progress/latest        # Get latest
```

---

## 🌍 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Select GitHub repository
   - Vercel auto-detects Next.js

3. **Add Environment Variables**
   - Settings → Environment Variables
   - Add all from `.env.local`
   - Redeploy

4. **Custom Domain** (Optional)
   - Settings → Domains
   - Add your domain
   - Configure DNS

---

## 🎨 Customization

### Dark/Light Mode
- Toggle in Navbar
- Auto-detect system preference
- Persist user choice via localStorage
- Smooth transitions

### Styling
- Tailwind CSS utilities
- Custom CSS in `globals.css`
- CSS variables for theming
- Framer Motion animations

### Colors
Edit in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#3b82f6',
      secondary: '#1e40af',
    }
  }
}
```

---

## 🐛 Troubleshooting

**Resume upload issues?**
- Check file format (PDF, DOCX, DOC)
- Ensure file < 5MB
- Try different browser
- Clear cache

**Login problems?**
- Verify Firebase config
- Check internet connection
- Try incognito mode

**AI analysis failing?**
- Verify Gemini API key
- Check API quota and billing
- Review browser console for errors

---

## 📊 Performance

- **Page Load**: < 2 seconds (LCP)
- **Interaction**: < 100ms (FID)
- **Visual Stability**: 0.1 (CLS)
- **Lighthouse Score**: 90+

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/Amazing`)
3. Commit changes (`git commit -m 'Add Amazing'`)
4. Push (`git push origin feature/Amazing`)
5. Open Pull Request

---

## 📞 Support

- **Issues**: GitHub Issues
- **Email**: support@impetus.ai
- **Website**: https://impetus.ai

---

## 🚀 Future Features

- [ ] Advanced analytics dashboard
- [ ] Team/organization features
- [ ] LinkedIn integration
- [ ] Mobile apps (iOS/Android)
- [ ] Real-time collaboration
- [ ] Job board integration
- [ ] Salary insights
- [ ] Network visualization

---

<div align="center">

**Made with ❤️ to help you reach your dream job**

[⬆ Back to Top](#impetus---skillsnap)

</div>

