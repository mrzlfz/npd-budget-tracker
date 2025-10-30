# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **NPD Tracker** - a multi-tenant web application for Indonesian government agencies (OPD/SKPD) to manage Nota Pencairan Dana (NPD) and track budget realization against RKA (Rencana Kerja dan Anggaran). The application is built as a monorepo using Turbo.

## Architecture

- **Framework**: Next.js 14 App Router with TypeScript
- **Database**: Convex for real-time data synchronization
- **Authentication**: Clerk with multi-tenant organizations support
- **UI**: Tailwind CSS with custom components
- **State Management**: TanStack Query + tRPC for server state
- **Form Handling**: React Hook Form + Zod validation
- **Monorepo**: Turbo for build orchestration

### Project Structure

```
apps/web/                 # Next.js frontend application
├── src/
│   ├── app/              # App Router pages and layouts
│   ├── components/       # Reusable React components
│   ├── convex/          # Convex client integration
│   ├── lib/             # Utility functions and configurations
│   └── types/           # TypeScript type definitions
packages/convex/         # Convex backend
├── schema.ts           # Database schema definitions
└── functions/          # Database queries, mutations, and actions
```

## Development Commands

### Root Level Commands
```bash
# Development (starts all apps)
pnpm dev

# Build all packages and apps
pnpm build

# Run linting across all packages
pnpm lint

# Type checking across all packages
pnpm type-check

# Clean build artifacts
pnpm clean

# Format code with Prettier
pnpm format

# Run tests (when implemented)
pnpm test
```

### App-specific Commands
```bash
# Navigate to web app
cd apps/web
pnpm dev        # Start Next.js development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
pnpm type-check # Run TypeScript type checking

# Navigate to Convex backend
cd packages/convex
pnpm dev        # Start Convex development server
pnpm build      # Deploy to Convex
pnpm type-check # Run TypeScript type checking
```

## Key Technologies & Patterns

### Convex Integration
- Real-time database with defined schema in `packages/convex/schema.ts`
- Functions organized in `packages/convex/functions/`
- Client integration in `apps/web/src/convex/`

### Authentication & Authorization
- Clerk handles authentication and organization management
- Multi-tenant data isolation using `organizationId` fields
- Role-based access control (admin, manager, staff)

### Data Models (Core Entities)
- **Organizations**: Multi-tenant container for government agencies
- **Users**: User profiles with organization membership and roles
- **RKA Documents**: Budget planning documents with fiscal year tracking
- **NPD Documents**: Fund withdrawal notes with approval workflows
- Real-time synchronization between frontend and backend

## Development Guidelines

### Package Manager
- Uses `pnpm@8.15.1` as specified in root package.json
- Node.js version requirement: `>=18.0.0`

### Code Quality
- ESLint configuration with Next.js and TypeScript rules
- Prettier for code formatting
- Husky for Git hooks with lint-staged
- TypeScript strict mode enabled

### Environment Variables
- Example file: `apps/web/.env.local.example`
- Environment variables managed through T3 Env pattern (planned)

### Workflow Management
- All Convex operations go through defined queries/mutations
- Form validation using Zod schemas on both client and server
- Real-time UI updates through Convex subscriptions

## Business Domain

This application serves Indonesian government agencies with:
- **NPD (Nota Pencairan Dana)**: Fund withdrawal documents
- **RKA (Rencana Kerja dan Anggaran)**: Annual work and budget plan
- **SP2D Integration**: Payment warrant tracking
- **Performance Tracking**: Budget realization vs planning
- **Multi-tenant Architecture**: Data isolation per organization

## Notes

- The project follows Indonesian government financial workflows
- All monetary values should be handled in IDR
- Date/time should use Asia/Jakarta timezone
- Documents follow specific Indonesian government formats
- The comprehensive PRD.md contains detailed business requirements and implementation plans