# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **NPD Tracker** - a comprehensive multi-tenant web application for Indonesian government agencies (OPD/SKPD) to manage Nota Pencairan Dana (NPD) and track budget realization against RKA (Rencana Kerja dan Anggaran). The application is built as a monorepo using Turbo with strict Indonesian government financial workflow compliance.

## Architecture

- **Framework**: Next.js 14 App Router with TypeScript
- **Database**: Convex for real-time data synchronization with comprehensive schema
- **Authentication**: Clerk with multi-tenant organizations support
- **UI**: Mantine UI v8.3.6 with custom components and styling
- **State Management**: Redux Toolkit + TanStack Query v5 for server state
- **Form Handling**: React Hook Form + Zod validation
- **Monorepo**: Turbo for build orchestration with pnpm workspaces
- **Testing**: Vitest for backend, Jest + Playwright for frontend
- **PDF Generation**: jsPDF + html2canvas for document export

### Project Structure

```
apps/web/                 # Next.js frontend application
├── src/
│   ├── app/              # App Router pages and layouts
│   │   ├── admin/        # Admin management pages
│   │   ├── api/          # API routes and webhooks
│   │   ├── dashboard/    # Main dashboard
│   │   ├── npd/          # NPD management pages
│   │   ├── rka/          # RKA management pages
│   │   ├── performance/  # Performance tracking
│   │   └── sp2d/         # SP2D management
│   ├── components/       # Reusable React components
│   │   ├── admin/        # Admin-specific components
│   │   ├── charts/       # Dashboard charts (Recharts)
│   │   ├── layout/       # Navigation and layout
│   │   ├── npd/          # NPD-specific components
│   │   ├── rka-explorer/ # RKA browsing components
│   │   └── verification/ # Workflow components
│   ├── convex/          # Convex client integration
│   ├── lib/             # Utility functions and configurations
│   └── types/           # TypeScript type definitions
packages/convex/         # Convex backend
├── schema.ts           # Comprehensive database schema
├── functions/          # Database queries, mutations, and actions
└── test/              # Backend test suite
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

# Run tests (Vitest)
pnpm test
pnpm test:ui         # Run tests with UI
pnpm test:coverage   # Run tests with coverage

# Clean build artifacts
pnpm clean

# Format code with Prettier
pnpm format
```

### App-specific Commands
```bash
# Web App (apps/web)
pnpm dev             # Start Next.js development server
pnpm build           # Build for production
pnpm start           # Start production server
pnpm lint            # Run ESLint
pnpm type-check      # Run TypeScript type checking
pnpm test            # Run Jest tests
pnpm test:e2e        # Run Playwright E2E tests
pnpm test:e2e:ui     # Run Playwright tests with UI

# Convex Backend (packages/convex)
pnpm dev             # Start Convex development server
pnpm build           # Deploy to Convex (requires CONVEX_DEPLOYMENT)
pnpm type-check      # Run TypeScript type checking
```

## Key Technologies & Patterns

### Convex Integration
- Real-time database with comprehensive schema in `packages/convex/schema.ts`
- Functions organized in `packages/convex/functions/`
- Client integration in `apps/web/src/convex/`
- Strict multi-tenant data isolation with `organizationId` fields

### Authentication & Authorization
- Clerk handles authentication and organization management
- Multi-tenant data isolation using `organizationId` fields
- Role-based access control (admin, pptk, bendahara, verifikator, viewer)
- Middleware protection for routes and API endpoints

### Data Models (Core Entities)
- **Organizations**: Multi-tenant container with PDF template configuration
- **Users**: Multi-tenant users with roles and organization membership
- **RKA Hierarchy**: Programs → Kegiatans → Subkegiatans → Accounts (5.xx expense accounts)
- **NPD Documents**: Fund withdrawal notes with approval workflows (UP, GU, TU, LS)
- **SP2D References**: Payment warrant tracking with automatic realization distribution
- **Performance Logs**: Budget realization vs planning tracking with evidence uploads
- **Audit Logs**: Comprehensive audit trail for all operations
- **Attachments**: File management with checksums and metadata

### UI Framework
- Mantine UI v8.3.6 with custom theming
- Recharts for data visualization
- React Hook Form + Zod for form validation
- File upload with react-dropzone
- PDF generation with jsPDF and html2canvas

## Development Guidelines

### Package Manager
- Uses `pnpm@8.15.1` as specified in root package.json
- Node.js version requirement: `>=18.0.0`

### Code Quality
- ESLint configuration with Next.js, TypeScript, and React rules
- Prettier for code formatting with consistent style
- Husky for Git hooks with lint-staged configuration
- TypeScript strict mode enabled

### Testing Strategy
- **Backend**: Vitest for Convex functions
- **Frontend**: Jest for unit tests, Playwright for E2E tests
- Coverage reporting available via `pnpm test:coverage`

### Environment Variables
- Template file: `apps/web/.env.local.example`
- Required: Clerk keys, Convex deployment URL
- Managed through T3 Env pattern for type safety

### Workflow Management
- All Convex operations go through defined queries/mutations
- Form validation using Zod schemas on both client and server
- Real-time UI updates through Convex subscriptions
- Redux Toolkit for UI state management
- TanStack Query v5 for server state caching and synchronization

## Business Domain Specifics

This application serves Indonesian government agencies with:
- **NPD Types**: UP (Uang Persediaan), GU (Ganti Uang), TU (Tambahan Uang), LS (Langsung)
- **RKA Structure**: Hierarchical budget planning with fiscal year tracking
- **Approval Workflows**: Draft → Diajukan → Diverifikasi → Final
- **SP2D Integration**: Automatic distribution of payment amounts to account realizations
- **Performance Tracking**: Output/hasil indicators with evidence documentation
- **Audit Requirements**: Complete audit trail for all financial operations

## Important Implementation Notes

- All monetary values should be handled in IDR (Indonesian Rupiah)
- Date/time should use Asia/Jakarta timezone
- Documents follow specific Indonesian government financial formats
- Comprehensive PRD.md contains detailed business requirements and implementation plans
- Multi-tenant architecture ensures strict data isolation per organization
- Real-time data synchronization across all connected clients
- Document locking and audit trails for compliance requirements