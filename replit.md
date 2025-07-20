# Cuidoteca - Childcare Management System

## Overview

Cuidoteca is a full-stack web application for managing childcare services, built with React (frontend) and Express.js (backend). The system facilitates childcare scheduling, community interaction, and administrative tasks for parents, caregivers, and coordinators.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state, React Context for authentication
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **API Structure**: RESTful endpoints with role-based access control

### Database Architecture
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management

## Key Components

### User Management
- **User Roles**: Three distinct roles (parent, institution, cuidador)
- **Authentication**: JWT-based authentication with role verification
- **Profile Management**: Complete user profile with university details
- **Cuidador System**: Separate enrollment system for caregivers to self-register

### Child Management
- **Child Registration**: Parents can register children with special needs information
- **Age Tracking**: Age-based categorization for appropriate care
- **Parent Association**: Children linked to parent accounts

### Scheduling System
- **Weekly Scheduling**: Monday to Friday scheduling with morning/afternoon/full-day periods
- **Status Management**: Three status types (pending, confirmed, cancelled)
- **Observations**: Text fields for special instructions or notes

### Community Features
- **Post System**: Users can create and share posts
- **Like System**: Community engagement through post likes
- **Social Feed**: Timeline view of community posts

### Notification System
- **Real-time Notifications**: System-generated notifications for users
- **Read Status**: Tracking of notification read/unread status
- **Categorized Alerts**: Different notification types for various events

## Data Flow

### Authentication Flow
1. User registers with email/password and profile information (parent, institution, or cuidador)
2. System hashes password and creates JWT token
3. Token stored in localStorage for subsequent requests
4. Protected routes verify token and user role

### Cuidador Enrollment Flow
1. Cuidador registers and connects to institution
2. Cuidador browses available cuidotecas at institution
3. Cuidador self-enrolls without child selection
4. Institution reviews and approves/rejects cuidador enrollment
5. System updates enrollment status and notifies cuidador

### Scheduling Flow
1. Parent creates child profile
2. Parent submits schedule request with day/period preferences
3. Coordinator reviews and approves/rejects requests
4. System updates schedule status and notifies involved parties

### Community Interaction
1. Users create posts with text content
2. Posts displayed in chronological order
3. Other users can like posts
4. Like counts updated in real-time

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Form Handling**: React Hook Form with Zod validation
- **HTTP Client**: Native fetch API with TanStack Query
- **Icons**: Lucide React icon library

### Backend Dependencies
- **Database**: Neon PostgreSQL serverless
- **Authentication**: bcrypt for password hashing, jsonwebtoken for tokens
- **Session Storage**: connect-pg-simple for PostgreSQL sessions
- **WebSockets**: ws library for Neon WebSocket connections

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx for TypeScript execution with nodemon-like behavior
- **Database**: Neon serverless PostgreSQL instance

### Production Build
- **Frontend**: Vite build to static assets
- **Backend**: esbuild bundling for Node.js deployment
- **Database**: Same Neon instance with production configuration

### Environment Configuration
- **Database URL**: Required environment variable for Neon connection
- **JWT Secret**: Configurable secret key for token signing
- **Development Tools**: Replit-specific plugins for development environment

## Recent Changes

### July 20, 2025 - Application Debug and Fix
- **Database Configuration**: Fixed PostgreSQL database connection by properly provisioning database environment variables
- **Schema Error**: Corrected undefined 'Schedule' type reference in schema.ts by replacing with EventParticipationWithChild
- **Database Schema Push**: Successfully pushed all schema changes to PostgreSQL database using Drizzle Kit
- **Application Status**: Application now running successfully on port 5000 with no LSP errors
- **UI Updates**: Changed "Agendamento" to "Evento" throughout institution dashboard for proper Portuguese terminology
- **Quick Actions**: Added "Novo Evento" button for institution users alongside existing "Nova Cuidoteca" button

### July 19, 2025 - Cuidador Role Implementation
- **Added Third User Role**: Implemented "cuidador" role alongside existing parent and institution roles
- **Separate Enrollment System**: Created independent cuidador enrollment process without child dependency
- **Database Schema**: Added cuidadorEnrollments table for caregiver-specific enrollments
- **UI Updates**: Modified registration and dashboard to support cuidador workflows
- **Button Labels**: Updated "Sou estudante" to "Sou cuidador" for cuidador users
- **Role-Based Access**: Implemented proper authentication and authorization for cuidador operations

The application uses a monorepo structure with shared TypeScript types and utilities, enabling type safety across the full stack while maintaining clear separation between frontend and backend concerns. The system now supports three distinct user workflows: parents managing children, institutions managing approvals, and cuidadores self-enrolling in childcare services.