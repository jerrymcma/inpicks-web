# InPicks AI - Sports Picks Platform

## Project Overview

InPicks AI is a comprehensive sports betting prediction platform that provides AI-powered game predictions with an 82% win rate. The platform includes both web and Android applications, offering users expert predictions for NFL and NBA games with a freemium subscription model.

## Architecture

This is a **hybrid cross-platform project** containing:
- **Web Application** (React/TypeScript frontend)
- **Android Application** (Jetpack Compose native app)
- **Shared Backend** (Supabase with PostgreSQL)

## Features

### Core Features
- 🤖 AI-powered game predictions using Google Gemini AI
- 🏈 Multi-sport coverage: NFL, NBA, MLB, NHL, NCAAF, NCAAB
- 🎁 Freemium model: 3 free picks for new users
- ⭐ Premium subscription for unlimited picks
- 🔐 Secure user authentication via Supabase
- 🔒 Pick locking mechanism with persistent storage
- 📱 Cross-platform availability (Web + Android)
- 📊 User pick tracking and history

### Business Features
- Subscription management with Stripe integration
- Real-time pick validation and scoring
- User profile management
- Pick analytics and performance tracking

## Tech Stack

### Web Application
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: React Context API
- **Authentication**: Supabase Auth

### Android Application
- **UI Framework**: Jetpack Compose
- **Language**: Kotlin
- **Build System**: Gradle with Kotlin DSL
- **Architecture**: MVVM pattern
- **Networking**: Ktor client
- **Serialization**: kotlinx.serialization
- **Payment Processing**: Stripe Android SDK

### Backend & Database
- **Backend as a Service**: Supabase
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Edge Functions**: Supabase Functions

### External APIs
- **Sports Data**: The Odds API
- **AI Predictions**: Google Gemini AI
- **Payment Processing**: Stripe

## Project Structure

```
Inpicks/
├── src/                          # Web app source code
│   ├── components/               # React components
│   │   ├── Auth/                # Authentication components
│   │   ├── Dashboard/           # Main dashboard
│   │   ├── GameCard/            # Game prediction cards
│   │   ├── Header/              # App header
│   │   ├── PaywallModal/        # Subscription paywall
│   │   └── Subscription/        # Subscription management
│   ├── context/                 # React contexts
│   ├── data/                    # Static data and mocks
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   ├── types/                   # TypeScript type definitions
│   └── App.tsx                  # Main app component
├── app/                         # Android app source code
│   ├── src/main/java/           # Kotlin source files
│   ├── src/main/res/            # Android resources
│   └── build.gradle.kts         # Android build configuration
├── gradle/                      # Gradle configuration
├── supabase/                    # Supabase functions
├── supabase_setup.sql           # Database schema
├── package.json                 # Web app dependencies
└── build.gradle.kts             # Root Gradle configuration
```

## Database Schema

### Tables
- **profiles**: User profiles with subscription status and free pick quotas
- **user_picks**: User's selected predictions with tracking and validation
- **auth.users**: Supabase managed authentication table

### Key Features
- Row Level Security (RLS) for data protection
- Automatic profile creation on user signup
- Pick validation and result tracking
- Subscription status management

## Configuration

### Environment Variables

#### Web Application (.env)
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### Android Application (local.properties)
```
ODDS_API_KEY=your-odds-api-key
GEMINI_API_KEY=your-gemini-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
STRIPE_PUBLISHABLE_KEY=your-stripe-key
```

## Getting Started

### Prerequisites
- Node.js 18+
- Android Studio (for Android development)
- Supabase account and project
- API keys for external services

### Web App Setup
1. Install dependencies: `npm install`
2. Configure environment variables in `.env`
3. Run development server: `npm run dev`
4. Build for production: `npm run build`

### Android App Setup
1. Open project in Android Studio
2. Configure API keys in `local.properties`
3. Sync Gradle project
4. Run on device or emulator

### Database Setup
1. Create Supabase project
2. Execute `supabase_setup.sql` to create schema
3. Configure Row Level Security policies
4. Set up authentication providers

## Development Commands

### Web App
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

### Android App
```bash
./gradlew build           # Build the app
./gradlew assembleDebug   # Build debug APK
./gradlew test            # Run unit tests
```

## Key Dependencies

### Web App
- `@supabase/supabase-js`: Supabase client
- `react-router-dom`: Client-side routing
- `tailwindcss`: Utility-first CSS framework

### Android App
- `androidx.compose`: Modern UI toolkit
- `io.github.jan-tennert.supabase`: Supabase Kotlin client
- `com.stripe`: Payment processing
- `com.google.ai.client.generativeai`: Gemini AI integration
- `io.ktor`: HTTP client for API calls

## Business Model
- **Free Tier**: 3 picks per user signup
- **Premium Subscription**: Unlimited picks with recurring payment via Stripe
- **Revenue Streams**: Monthly/yearly subscriptions, potential affiliate partnerships

## Performance Metrics
- **AI Prediction Accuracy**: 82% win rate
- **Supported Sports**: 6 major sports leagues
- **Platform Reach**: Web browsers + Android devices
- **Real-time Updates**: Live game status and pick validation

## Security Features
- Row Level Security (RLS) in PostgreSQL
- Secure API key management
- User authentication via Supabase Auth
- Encrypted payment processing via Stripe
- Environment-based configuration management