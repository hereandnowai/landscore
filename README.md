# 🗺️ LANDSCORE

A high-performance GIS Real Estate & Analytics Platform inspired by Regrid & AcreValue.

## 🎯 Overview

LANDSCORE is a production-grade GIS web platform that visualizes land parcels, calculates valuations, and provides an AI Chatbot assistant for geospatial queries.

**Location**: Austin, Texas, USA (Demo Data)

## 🏗️ Tech Stack

### Frontend (Client)
- **Framework**: Next.js 14+ (App Router) & TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Map Engine**: MapLibre GL JS
- **Data Fetching**: TanStack Query (React Query)

### Backend (Server)
- **Runtime**: Node.js + Express.js
- **Database**: PostgreSQL with PostGIS
- **ORM**: Prisma
- **Geospatial Processing**: Turf.js + PostGIS
- **Auth**: JWT (bcrypt + jsonwebtoken)

### AI Chatbot
- **Model**: Google Gemini 2.5 Flash Lite
- **Architecture**: RAG with Function Calling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Google Gemini API Key (for AI features)

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### 2. Start the Database

```bash
# Start PostgreSQL + PostGIS in Docker
npm run docker:up

# Wait for the database to be healthy
docker ps
```

### 3. Setup Database Schema

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Run PostGIS migration (manual step)
cd server
npx prisma db execute --file prisma/migrations/00_postgis_setup/migration.sql

# Seed the database with 75 mock parcels
npm run db:seed
```

### 4. Configure Environment

```bash
# Server environment (update GEMINI_API_KEY for AI features)
cp server/.env.example server/.env

# Client environment
cp client/.env.example client/.env.local
```

### 5. Start Development Servers

```bash
# Start both client and server
npm run dev

# Or run separately:
npm run dev:server  # API at http://localhost:3001
npm run dev:client  # App at http://localhost:3000
```

## 📁 Project Structure

```
landscore/
├── client/                    # Next.js Frontend
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # React components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── map/         # Map components
│   │   │   └── chat/        # AI Chat components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   └── store/           # Zustand stores
│   └── public/              # Static assets
│
├── server/                   # Express.js Backend
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── lib/             # Database & utilities
│   │   └── seed/            # Seed scripts
│   └── prisma/
│       ├── schema.prisma    # Database schema
│       └── migrations/      # PostGIS migrations
│
└── docker-compose.yml        # PostgreSQL + PostGIS
```

## 📊 Database Schema

### Core Tables
- **parcels**: Geometry, area, location (with PostGIS spatial index)
- **owners**: Property owners
- **land_data**: Soil type, zoning, cropland class, water access
- **valuations**: Estimated price, tax value, sale history
- **users**: Authentication & roles (Admin, Analyst, Viewer)
- **saved_shapes**: User-drawn polygons`
- **chat_sessions**: AI conversation history

## 🗺️ API Endpoints

### Parcels
- `GET /api/parcels/bbox` - Get parcels within map bounds
- `GET /api/parcels/:id` - Get parcel details
- `POST /api/parcels/search` - Advanced filtering

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT token
- `GET /api/auth/me` - Current user

### AI Chatbot
- `POST /api/chatbot` - Send query, get AI response
- Streaming support for real-time responses

## 🤖 AI Chatbot Examples

The AI assistant understands natural language queries:

- "Find large agricultural plots over 10 acres"
- "Show me expensive plots near water sources"
- "What properties have prime cropland classification?"
- "Find plots with black soil suitable for cotton"

## 📅 Development Phases

- [x] **Phase 1**: Project Scaffolding & Database Schema
- [x] **Phase 2**: Backend API & Geospatial Queries
- [ ] **Phase 3**: Frontend & Map Visualization
- [ ] **Phase 4**: AI Agent Integration
- [ ] **Phase 5**: Analytics & Drawing Tools

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start all services
npm run dev:client       # Start Next.js only
npm run dev:server       # Start Express only

# Database
npm run docker:up        # Start PostgreSQL
npm run docker:down      # Stop PostgreSQL
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:seed          # Populate with mock data
npm run db:studio        # Open Prisma Studio

# Build
npm run build            # Build all
npm run build:client     # Build Next.js
npm run build:server     # Build Express
```

## 📝 Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@landscore.com | demo123 | Admin |
| analyst@landscore.com | demo123 | Analyst |
| viewer@landscore.com | demo123 | Viewer |

## 🌍 Mock Data

The seed script generates 75 realistic parcels in the Austin, Texas region:
- Coordinates: ~30.27°N, 97.74°W
- Area: 0.5 - 25 acres
- Soil types: Clay, Loam, Sandy, Red Soil, Black Soil, Alluvial
- Zoning: Agricultural, Residential, Commercial, Industrial, Mixed
- Prices: Based on area, zoning, soil quality, and amenities

## 📄 License

MIT

---

Built with ❤️ using Next.js, PostGIS, and Gemini AI
