# Astra Dashboard

## Overview

Astra is a full-stack dashboard application themed around a dark space aesthetic (violet/teal/gold accents). It provides a chat console with AI-like interactions, a media wall with video/image browsing, a job queue monitor, and a system node status viewer. The project uses a monorepo structure with a React frontend, Express backend, and PostgreSQL database.

The application is designed with a pluggable backend architecture — particularly for media sources — where mock data can be swapped for real data sources (e.g., "Hermes") by changing only the backend route without modifying the frontend.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Directory Structure
- `client/` — React frontend (Vite-based SPA)
- `server/` — Express backend API
- `shared/` — Shared types, schemas, and route definitions used by both client and server
- `migrations/` — Drizzle-generated database migration files
- `script/` — Build scripts for production bundling
- `attached_assets/` — Design specs and requirement documents

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management with polling support
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, custom "Astra" dark theme
- **Animations**: Framer Motion for transitions and interactive elements
- **Fonts**: Space Grotesk (display), Inter (body), JetBrains Mono (code)
- **Build Tool**: Vite with HMR in development

Key pages:
- `/` — Chat console with message stream and specialized cards (node status, job, media preview)
- `/media` — Media wall with source selector (Mock/Hermes), dense grid, hover autoplay, ambient loop mode, search/filter/sort, favorites (localStorage)
- `/jobs` — Job queue with dense card view, status filters, detail drawer, drag-drop from Media Wall, lifecycle simulation
- `/nodes` — System node cards with health metrics
- `/settings` — Full settings panel with 6 sections: Identity, Nodes & Network, Media Wall, Jobs, Voice (placeholder), About/Diagnostics

The frontend uses custom hooks in `client/src/hooks/use-astra.ts` to abstract all API calls. Path aliases: `@/` maps to `client/src/`, `@shared/` maps to `shared/`.

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript, executed via `tsx`
- **API Pattern**: RESTful JSON API under `/api/*` prefix
- **Route Definitions**: Shared route contracts in `shared/routes.ts` define method, path, and Zod response schemas used by both client and server
- **Storage Layer**: `server/storage.ts` implements `IStorage` interface using `DatabaseStorage` class — provides abstraction for swapping data sources
- **Dev Server**: Vite middleware served through Express in development; static files in production
- **Logging**: Custom request logger for API endpoints with timing

The server auto-seeds initial data (nodes, jobs, media) on startup if the database tables are empty. Mock media includes real sample videos from Google's public bucket and Unsplash images.

### Database
- **Database**: PostgreSQL (required, via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-to-validation integration
- **Schema Location**: `shared/schema.ts`
- **Migration Tool**: `drizzle-kit push` (schema push, not migration files)
- **Session Store**: `connect-pg-simple` available for session management

**Tables:**
- `messages` — Chat messages with role, content, type (text/node_status/job/media_preview), and JSON metadata
- `media` — Media items with title, url, thumb_url, type (video/image), mtime, tags (JSON array), favorite flag
- `jobs` — Background jobs with type, title, status (queued/running/done/failed), node, progress, inputs/outputs (JSON), logs (JSON array)
- `nodes` — Compute nodes with name, type (Kratos/Hades/Hermes), status (online/offline/degraded), metrics (JSON)

**Non-DB Storage:**
- `shared/settings.ts` — Typed settings model persisted in localStorage (key: `astra-settings`)
- `client/src/hooks/use-settings.ts` — useSettings hook for load/save/import/export/reset

**Additional API Endpoints:**
- `GET /api/status` — Node status check (Kratos/Hades/Hermes with mock health data)
- `POST /api/status/check` — Manual health check with randomized results
- `GET /api/jobs/:id` — Single job detail
- `PATCH /api/jobs/:id` — Update job (status, progress, logs, outputs)
- `POST /api/jobs` — Create job (triggers simulated lifecycle: queued→running→done)
- `GET /api/media/hermes?path=<urlencoded path>` — Browse Hermes directory, parse HTML listings, return normalized media items
- `GET /api/media/proxy?url=<encoded url>` — Proxy media files from Hermes to avoid CORS, with caching headers

### Build & Deployment
- **Development**: `npm run dev` — runs tsx with Vite HMR middleware
- **Production Build**: `npm run build` — Vite builds frontend to `dist/public/`, esbuild bundles server to `dist/index.cjs`
- **Production Start**: `npm start` — runs the bundled Node.js server
- **Schema Push**: `npm run db:push` — pushes Drizzle schema to PostgreSQL

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required. Connection via `DATABASE_URL` environment variable. Used for all data persistence.

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** + **drizzle-zod**: Database ORM, migrations, and validation
- **express** (v5): HTTP server framework
- **@tanstack/react-query**: Async state management for the frontend
- **framer-motion**: Animation library
- **wouter**: Client-side routing
- **zod**: Schema validation (shared between client and server)
- **Radix UI** (multiple packages): Accessible UI primitives for shadcn/ui components
- **tailwindcss**: Utility-first CSS framework
- **pg**: PostgreSQL client driver

### External Content Sources (Mock Data)
- Google Common Data Storage (sample videos): `commondatastorage.googleapis.com/gtv-videos-bucket/sample/`
- Unsplash (sample images): `images.unsplash.com`
- Google Fonts: Space Grotesk, Inter, JetBrains Mono, DM Sans, Fira Code, Geist Mono

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal`: Runtime error overlay
- `@replit/vite-plugin-cartographer`: Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner`: Dev banner (dev only)