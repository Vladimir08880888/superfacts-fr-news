# SuperFacts.fr 🇫🇷

**Французский новостной агрегатор с переводом на 12 языков**

Modern French news aggregation platform built with Next.js 15, featuring real-time collection from 20+ major French media sources with advanced translation capabilities.

## ✨ Features

- 📰 **Real-time News Collection** from 20+ major French sources
- 🌍 **Multi-language Support** - 12 languages with intelligent caching
- 🎯 **Smart Categorization** - Politics, Economy, Technology, Sports, Culture
- 💨 **Modern UI** with Framer Motion animations
- 🔍 **Advanced Search** and filtering capabilities
- 📱 **Responsive Design** - mobile-first approach
- ⚡ **High Performance** with Vercel KV caching

## 🚀 Quick Start

1. **Clone and install:**
   ```bash
   git clone <repository-url>
   cd superfacts-fr-news
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Fill in your API keys and configuration
   ```

3. **Set up Vercel KV (Required):**
   - Follow the detailed guide: [`docs/KV_SETUP.md`](./docs/KV_SETUP.md)
   - Test connection: `npm run test-kv`

4. **Start development:**
   ```bash
   npm run dev
   ```

5. **Collect news:**
   ```bash
   npm run collect-news-ts
   ```

## 📚 Documentation

- **[KV Setup Guide](./docs/KV_SETUP.md)** - Complete Vercel KV configuration
- **[WARP.md](./WARP.md)** - Development guidelines and architecture

## 🛠️ Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run collect-news-ts  # Collect French news
npm run test-kv      # Test Vercel KV connection
npm run lint         # Run linting
```

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 19
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Database**: Vercel KV (Redis)
- **Deployment**: Vercel
- **News Sources**: 20+ French media outlets

## 📊 News Sources

General: Le Monde, Le Figaro, Libération, France 24, France Info, BFM TV  
Economy: Les Échos, La Tribune, Challenges, Capital  
Technology: 01net, Clubic, Futura Sciences  
Sports: L'Équipe, RMC Sport  
Culture: Télérama, Les Inrockuptibles  

## 🌐 Translation Support

Supported languages: French, English, Spanish, German, Italian, Portuguese, Dutch, Russian, Chinese, Japanese, Arabic, Korean

## 📈 Performance

- ⚡ Sub-second page loads
- 🗄️ Intelligent caching (24h TTL)
- 📱 Mobile-optimized
- 🔍 SEO-friendly

## 🔧 Configuration

Key environment variables:
- `KV_REST_API_URL` - Vercel KV connection
- `KV_REST_API_TOKEN` - KV authentication
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics
- `OPENAI_API_KEY` - AI features (optional)

## 🚢 Deployment

Automatically deployed on Vercel. Push to main branch triggers production deployment.

Ensure all environment variables are set in Vercel Dashboard.
