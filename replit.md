# Rotiva - Kariyer Gelişim Platformu

## Overview

Rotiva is a single-page career development platform that helps users bridge the gap between their current skills and their dream jobs. Users upload their CV, paste a job posting, and receive a personalized visual learning roadmap.

**Core Features:**
- Single-page workflow: CV upload → Job posting input → Visual roadmap
- AI-powered skill gap analysis using OpenAI
- Interactive visual roadmap using React Flow
- PDF export of the learning roadmap
- Turkish language UI

**Target Users:** Job seekers looking to understand skill gaps and create a learning plan for their dream job.

## Recent Changes (December 2024)
- Migrated to single-page architecture (workspace.tsx)
- Added React Flow for visual roadmap visualization
- Implemented PDF export with html2canvas + jsPDF
- Simplified navigation - removed multi-page structure

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tools:**
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast HMR (Hot Module Replacement)
- **Wouter** for lightweight client-side routing instead of React Router
- **TanStack Query (React Query)** for server state management, caching, and data fetching

**UI Component System:**
- **Shadcn/ui** components built on Radix UI primitives for accessible, customizable components
- **Tailwind CSS v4** for utility-first styling with custom theming
- Custom component variants using `class-variance-authority` for consistent styling patterns
- Design tokens defined in CSS custom properties for theming (light/dark mode support)

**State Management Strategy:**
- Server state managed through TanStack Query with aggressive caching (`staleTime: Infinity`)
- Authentication state managed via custom `useAuth` hook with session-based auth
- Form state managed with React Hook Form and Zod validation
- No global client state management library needed due to server state approach

**Rationale:** This architecture prioritizes developer experience with fast builds, type safety, and minimal boilerplate while keeping bundle sizes small through tree-shaking and code splitting.

### Backend Architecture

**Server Framework:**
- **Express.js** running on Node.js with TypeScript
- HTTP server created with Node's native `http.createServer` for WebSocket upgrade potential
- Middleware stack: JSON body parsing with raw body capture (for webhook verification), URL-encoded form data support

**API Design Pattern:**
- RESTful API endpoints under `/api/*` namespace
- Session-based authentication using `express-session`
- Manual route registration pattern in `server/routes.ts`
- Centralized error handling and request logging middleware

**Authentication & Authorization:**
- Password hashing using Node's native `scrypt` with salting
- Session management with server-side session storage
- `requireAuth` middleware for protecting authenticated routes
- Session data stored in PostgreSQL via `connect-pg-simple`

**Development vs Production:**
- Development: Vite middleware mode for integrated dev server with HMR
- Production: Pre-built static assets served via Express static middleware
- Conditional Replit-specific plugins (cartographer, dev banner) only in development

**Rationale:** Express provides flexibility and simplicity for API development. Session-based auth was chosen over JWT for simplicity and built-in security features. The monolithic approach (single server serving both API and static files) simplifies deployment on Replit.

### Data Layer

**Database:**
- **PostgreSQL** as the primary relational database
- **Drizzle ORM** for type-safe database queries and migrations
- Connection pooling via `pg` library's Pool implementation
- Database schema defined in `shared/schema.ts` for sharing between client and server

**Schema Design:**
```
users (id, email, password, firstName, lastName, createdAt)
  ↓ one-to-one
profiles (userId, jobTitle, bio, skills[], experience[], education[])
  ↓ one-to-many
job_analyses (userId, jobTitle, matchScore, skillsMatch[], skillsGap[])
learning_quests (userId, title, targetSkill, status, progress, xp)
user_progress (userId, currentLevel, totalXp, streakDays, achievements[])
assessment_results (userId, scenario, selectedOption, score, analysis)
```

**Key Design Decisions:**
- Cascade deletion (`onDelete: "cascade"`) ensures referential integrity
- JSONB columns for flexible nested data (experience, education arrays)
- PostgreSQL arrays for string lists (skills, achievements)
- UUID primary keys using `gen_random_uuid()` for distributed-friendly IDs
- Drizzle Zod integration for automatic validation schema generation

**Data Access Pattern:**
- Storage abstraction layer (`server/storage.ts`) defining interface for all data operations
- Direct Drizzle queries using the typed schema
- No repository pattern complexity—straightforward CRUD operations
- Query optimization through Drizzle's SQL generation

**Rationale:** Drizzle provides excellent TypeScript integration without the complexity of heavier ORMs like TypeORM. PostgreSQL's JSONB and array types reduce the need for excessive table joins while maintaining query capabilities.

### Build & Deployment

**Build Process (`script/build.ts`):**
1. Clean `dist` directory
2. Build client assets using Vite → `dist/public`
3. Bundle server code using esbuild → `dist/index.cjs`
4. Server bundling strategy: Bundle allowlisted dependencies to reduce syscalls, external all others

**Dependency Bundling Strategy:**
- Heavy or frequently-used dependencies are bundled into server code (Drizzle, Express, etc.)
- Rarely-used dependencies remain external to reduce bundle size
- Improves cold start performance on serverless/container environments

**Static Asset Handling:**
- Development: Vite serves assets with HMR
- Production: Express serves pre-built assets from `dist/public`
- Fallback to `index.html` for client-side routing
- OpenGraph image meta tag injection via custom Vite plugin for Replit deployments

**Rationale:** Single-file server bundle simplifies deployment and reduces filesystem overhead. Vite's optimized production builds provide excellent performance with automatic code splitting.

## External Dependencies

### Third-Party Services & APIs

**Replit Platform Integration:**
- Replit-specific Vite plugins for development experience (cartographer, dev banner, runtime error modal)
- Environment detection via `REPL_ID` and `REPLIT_DEPLOYMENT` variables
- Custom domain detection for OpenGraph image URL generation
- Database provisioned through Replit's managed PostgreSQL offering

**UI & Component Libraries:**
- **Radix UI** primitives for 20+ accessible component patterns (dialogs, dropdowns, tabs, etc.)
- **Lucide React** for consistent icon library
- **Recharts** for data visualization (charts in dashboard)
- **embla-carousel-react** for carousel/slider components
- **vaul** for mobile-friendly drawer components

**Form & Validation:**
- **React Hook Form** for performant form state management
- **Zod** for schema validation with TypeScript inference
- **@hookform/resolvers** for Zod integration with React Hook Form
- **drizzle-zod** for automatic Zod schema generation from database schema

**Utility Libraries:**
- **date-fns** for date manipulation and formatting
- **nanoid** for generating short unique IDs
- **clsx** + **tailwind-merge** (via `cn` utility) for conditional className composition

**Authentication:**
- Custom implementation using Node's `crypto` module (no external auth provider)
- Session storage in PostgreSQL via `connect-pg-simple`

**Potential Future Integrations:**
- AI/LLM service for intelligent skill gap analysis and learning recommendations (currently using basic pattern matching)
- Job board APIs for real-time job posting data
- OAuth providers (LinkedIn, GitHub) for profile import
- Email service for notifications

**Rationale:** The application uses minimal external services to maintain simplicity and reduce vendor lock-in. Most functionality is built in-house. Replit-specific integrations enhance the development experience but are conditionally loaded to avoid production overhead.

### Database

**PostgreSQL Configuration:**
- Connection string provided via `DATABASE_URL` environment variable
- Connection pooling for efficient resource usage
- Drizzle Kit for schema migrations (`npm run db:push`)
- Schema location: `shared/schema.ts` for client/server sharing

**Migration Strategy:**
- Push-based migrations using Drizzle Kit (suitable for development)
- Migration files generated in `./migrations` directory
- No automated migration runner—manual execution required

**Rationale:** PostgreSQL provides robust relational data guarantees with powerful JSON support for flexible data modeling. Drizzle's TypeScript-first approach reduces runtime errors and improves developer productivity.