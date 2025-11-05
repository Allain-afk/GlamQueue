# GlamQueue

Live Demo: https://glamqueue.vercel.app

A modern, responsive landing page and salon management platform built with React, TypeScript, and Vite.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Supabase credentials

# Start development server
npm run dev
```

Navigate to `http://localhost:3000`

## 📦 Deployment

**Quick Deploy to Vercel:**

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy!

For detailed instructions, see `DEPLOYMENT.md`.

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Authentication + Database)
- **UI Components**: Radix UI + Lucide Icons
- **Deployment**: Vercel
- **PWA**: Fully configured with offline support

## 🔑 Environment Variables

Required environment variables:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_GEMINI_API_KEY` - Your GEMINI API key

See `.env.example` for reference.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 Features

- ✅ Responsive landing page
- ✅ User authentication (Sign up/Login)
- ✅ Appointment booking system
- ✅ Admin dashboard with analytics
- ✅ Client dashboard
- ✅ PWA support (installable, offline-capable)
- ✅ AI-powered business insights chatbot
- ✅ Dynamic calendar
- ✅ Mobile-responsive design

## 📄 License

Private - All rights reserved

---

Built with ❤️ for salon owners everywhere

# GlamQueue
