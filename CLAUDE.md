This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

  Development Commands

  - Start development server: npm run dev
  - Build for production: npm run build
  - Start production server: npm run start
  - Lint code: npm run lint
  - Prisma database commands:
    - Generate Prisma client: npx prisma generate (runs automatically after install)
    - Run migrations: npm run db:migrate
    - Push schema changes: npm run db:push
    - Seed database: npm run db:seed
    - Open Prisma Studio: npm run db:studio
    - Reset database: npm run db:reset

  Code Architecture

  Overall Structure

  - Next.js App Router: The application uses Next.js 14 with the app directory for routing (src/app)
  - Authentication: Integrates with Supabase Auth (see @supabase/ssr and @supabase/supabase-js dependencies)
  - Database: PostgreSQL via Prisma ORM with Supabase as the provider
  - State Management: Uses Zustand (zustand dependency) for global state
  - API Routes: Located in src/app/api using Next.js route handlers
  - Admin Section: Administrative interfaces are under src/app/admin with separate route groups

  Key Directories

  - src/app: Main application code using Next.js app router
    - (auth): Authentication routes (login, register, forgot password)
    - admin: Admin dashboard and management interfaces
    - api: Backend API endpoints
  - prisma: Database schema and migrations
    - schema.prisma: Defines all data models (User, Class, Post, Submission, etc.)
    - migrations/: Database migration history

  Data Models (from Prisma Schema)

  Core models include:
  - User: Represents application users with roles (STUDENT, FACULTY, ADMIN)
  - Class: Educational classes with faculty ownership and student memberships
  - Post: Content posts within classes (can be submission-enabled)
  - Submission: Student submissions for assignment posts
  - Report: Content/report system for moderation
  - Notification: User notifications
  - ClassMembership: Join table for students and classes
  - PostFile: File attachments for posts

  Styling & UI

  - Tailwind CSS: Primary styling framework with custom configuration
  - Radix UI: Used for accessible UI components (dialogs, dropdowns, etc.)
  - Lucide Icons: Icon library (lucide-react dependency)
  - Custom CSS variables: Defined in Tailwind configuration for theme colors

  Authentication Flow

  1. Uses Supabase Auth for user management
  2. Middleware protects routes (check src/middleware.js if exists)
  3. User data synchronized with Prisma User model via email
  4. Role-based access control implemented in API routes and UI

  API Pattern

  - Route handlers in src/app/api/[route]/route.ts
  - Standard RESTful endpoints for resources
  - Protected routes validate session via Supabase
  - Prisma Client used for database operations in route handlers

  Development Notes

  - TypeScript is used throughout (tsconfig.json present)
  - ESLint configured with Next.js preset (.eslintrc.json)
  - PostCSS for Tailwind processing (postcss.config.js implied)
  - Environment variables required (see .env.local.example)
  - Database connection uses Supabase pooling (DATABASE_URL and DIRECT_URL)

  When working on features:
  1. Modify prisma/schema.prisma for database changes
  2. Run npx prisma generate and npm run db:migrate
  3. Implement API routes in src/app/api
  4. Build UI components in relevant src/app/*/page.tsx files
  5. Use existing patterns for form validation (React Hook Form + Zod)
  6. Follow established styling conventions with Tailwind classes
  7. Handle loading/error states with React Query where applicable


  This CLAUDE.md file provides essential commands and architectural overview without duplicating easily discoverable file
  structures or generic practices. It focuses on project-specific patterns, commands, and conventions that would help a
  developer quickly understand and work in this codebase.