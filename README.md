# Astra UI

Astra UI is a full-stack dashboard for managing AI-oriented compute nodes, jobs, media, and system status through a single interface.

## Overview

The project combines a React/TypeScript frontend with an Express backend and PostgreSQL persistence. It is designed around modular services so backend data sources and infrastructure components can evolve without requiring major frontend changes.

## Features

- AI-style chat console
- Compute-node health and status views
- Background job queue with progress and lifecycle tracking
- Media browsing and management
- Configurable system settings
- Shared frontend/backend API contracts
- PostgreSQL-backed persistence
- REST API architecture
- Responsive React interface
- Production build and deployment scripts

## Technology stack

### Frontend
- React 18
- TypeScript
- Vite
- TanStack React Query
- Tailwind CSS
- Radix UI / shadcn-style components
- Framer Motion
- Wouter

### Backend
- Node.js
- Express 5
- TypeScript
- REST APIs
- Zod validation
- WebSocket support

### Data
- PostgreSQL
- Drizzle ORM
- drizzle-zod

## Project structure

```text
client/   React frontend
server/   Express backend and API
shared/   Shared types, schemas, and route contracts
script/   Build tooling
docs/     Project documentation
```

## Development

Install dependencies:

```bash
npm install
```

Set a PostgreSQL connection string:

```bash
export DATABASE_URL="postgresql://..."
```

Push the database schema:

```bash
npm run db:push
```

Run in development:

```bash
npm run dev
```

Type-check the project:

```bash
npm run check
```

Build for production:

```bash
npm run build
npm start
```

## Engineering focus

Astra is an ongoing systems-integration project focused on:

- Distributed compute monitoring
- AI infrastructure
- API design
- Linux-hosted services
- Full-stack application development
- Data and service abstraction
- System diagnostics
- Modular architecture

The broader goal is to provide a unified interface for local AI, automation, media, and compute resources while keeping individual services independently maintainable.

## Status

Active development project. Some data sources and node-health functions currently use mock or development data while integrations are being expanded.
