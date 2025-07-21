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

### July 21, 2025 - Password Reset System Implementation & Events Visibility Fix
- **Complete Password Reset System**: Implemented secure email-based password reset functionality
  - Added `passwordResetTokens` database table with token validation and expiration
  - Created `/api/auth/forgot-password` endpoint that generates secure reset tokens
  - Created `/api/auth/reset-password` endpoint for password validation and updating
  - Tokens expire after 1 hour and are marked as used after successful reset
  - All error messages in Portuguese for consistent user experience
  - Development logging shows reset links in console for testing
- **Password Reset Backend Implementation**: Extended storage layer with token management
  - Added `createPasswordResetToken`, `getPasswordResetToken`, `markPasswordResetTokenAsUsed` methods
  - Added `getUserByEmail` and `updateUserPassword` methods for user management
  - Proper password hashing using bcrypt for security
- **Events System Verification**: Confirmed institution events properly show to connected users
  - Tested and verified that users connected to institutions see institution events
  - Events filtering works correctly based on university_connections table
  - API correctly returns empty array for unconnected users and full event data for connected users
- **System Architecture**: Enhanced authentication system with password recovery capabilities
  - Password reset tokens stored securely with expiration and usage tracking
  - Integration with existing JWT authentication system
  - Maintains security best practices with token-based password recovery

### July 21, 2025 - UI Improvements and Connection System Enhancement
- **Logout Flow Fix**: Fixed unwanted page refresh during logout process
  - Removed automatic `window.location.reload()` from logout function
  - Added proper query cache clearing using `queryClient.clear()`
  - Logout now smoothly transitions to login page without intermediate refresh
- **Header Navigation Updates**: Enhanced profile navigation with clear labels
  - "Meu Perfil" tab redirects to public profile view
  - "👤 Editar perfil" button goes to profile editing page
  - "🚪" logout icon performs clean logout without refresh
- **Connection System Enhancement**: Expanded user-to-user connection capabilities
  - Cuidadores can now connect to other cuidadores
  - Parents can now connect to other parents
  - Maintained existing parent-cuidador connection functionality
  - Enhanced community building and peer support opportunities
- **Dashboard Cleanup**: Removed redundant "Criar primeira cuidoteca" button
  - Simplified institution dashboard with single "Nova Cuidoteca" action button
  - Added helpful hint text directing users to main action button
  - Cleaner interface with better user experience

### July 21, 2025 - UI Enhancements and Role Display Updates
- **Role Display Standardization**: Updated all role references to use CAPS LOCK format
  - Header user indicator now shows roles in uppercase (PARENT, CUIDADOR, INSTITUTION)
  - Profile pages display roles as RESPONSÁVEL, CUIDADOR(A), COORDENADOR(A), INSTITUIÇÃO
  - Registration form buttons now show RESPONSÁVEL, CUIDADOR, INSTITUIÇÃO
  - Public profile badges updated to PAI/MÃE, CUIDADOR, COORDENADOR, INSTITUIÇÃO
  - Connection buttons updated to SOU ESTUDANTE, SOU CUIDADOR in uppercase
- **Institution Profile Button Enhancement**: Modified profile navigation for institutions
  - Institution users now get "Meu Perfil" button that redirects to public profile view
  - Non-institution users continue to get "Editar perfil" button for profile editing
  - Provides better user experience for institutions viewing their public presence
- **Dashboard Events Interaction**: Made events in dashboard clickable
  - Events in "Próximos Eventos" section now redirect to event detail page when clicked
  - Added hover effects and cursor pointer for better user experience
  - Smooth transition colors when hovering over event items
- **Approved Children Count Display**: Added approved children count to institution profiles
  - Institution public profiles now show total approved children across all cuidotecas
  - Displays as separate badge alongside connected users count
  - Real-time updates when children get approved or rejected

### July 21, 2025 - Enhanced Institution Bulk Messaging with Enrollment-Based Targeting
- **Advanced Bulk Messaging**: Enhanced institution messaging system with enrollment-based targeting
  - Added support for messaging parents with children approved in institution's cuidotecas
  - Added support for messaging cuidadores approved in institution's cuidotecas
  - Added combined targeting for all approved users (both parents and cuidadores)
  - Six total target options: connected users (all/parents/cuidadores) and approved users (all/parents/cuidadores)
- **Backend Storage Functions**: Implemented specialized queries for enrollment-based messaging
  - `getParentsWithApprovedChildren()` - finds parents with confirmed child enrollments
  - `getCuidadoresWithApprovedEnrollments()` - finds cuidadores with confirmed enrollments
  - Enhanced bulk messaging API to support new target groups with detailed error handling
- **Frontend UI Improvements**: Updated bulk messaging interface
  - Added three new target group options for approved users
  - Enhanced dialog description to explain enrollment-based targeting
  - Clear labeling to distinguish between all connected users vs. approved users

### July 21, 2025 - Institution Messaging System Fix
- **Connected Users API Fix**: Fixed `/api/users/me/connected-users` endpoint for institutions
  - Institutions now properly see all their connected users (parents and cuidadores)
  - Regular users continue to see their user-to-user connections
  - Role-based logic ensures appropriate data access for each user type
- **Messaging Functionality Restored**: Institutions can now message connected users through chat interface
  - Fixed conversation list to show institution's connected users
  - Individual messaging works properly for institutions
  - Bulk messaging functionality verified working for all connected users

### July 21, 2025 - Application Startup Fix (Updated)
- **Database Connection Fix**: Resolved DATABASE_URL environment variable issue preventing application startup
- **PostgreSQL Provisioning**: Successfully provisioned new PostgreSQL database with complete environment configuration
- **Application Status**: Application successfully running on port 5000 with full database connectivity
- **Environment Variables**: All PostgreSQL connection variables properly configured:
  - DATABASE_URL: Full Neon PostgreSQL connection string
  - PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT: Individual connection parameters
- **Database Verification**: Database is accessible and application server started without errors

### July 20, 2025 - Institution Messaging System & Bulk Communication
- **Bulk Messaging Feature**: Implemented comprehensive messaging system for institutions
  - Institutions can send messages to individual connected users or groups
  - Added bulk messaging capability for sending to all parents, all cuidadores, or both groups combined
  - Bulk messaging dialog with target group selection (parents/cuidadores/all)
  - Real-time message sending with success notifications showing recipient count
  - Enhanced messages page with institutional messaging capabilities
- **Messaging API Enhancement**: Extended messaging backend for institutional communication
  - Added `/api/messages/bulk` endpoint for group messaging
  - Bulk message validation and target group filtering
  - Enhanced storage methods for bulk message creation and delivery
  - Role-based access control ensuring only institutions can send bulk messages
- **User Interface Improvements**: Enhanced messaging page for institutional users
  - Added "Mensagem em Massa" button visible only to institution users
  - Comprehensive bulk messaging modal with target selection and content input
  - Toast notifications for successful bulk message delivery
  - Maintained individual messaging functionality alongside bulk features

### July 20, 2025 - Community Voting System & Institution Post Management  
- **Upvote/Downvote System**: Replaced simple likes with comprehensive voting functionality
  - Added upvote and downvote buttons with green/red styling for clear visual distinction
  - Implemented vote tracking table to prevent duplicate voting from same user
  - Users can only vote once per post (upvote OR downvote, not both)
  - Clicking same vote type removes the vote (toggle functionality)
  - Updated post schema to track separate upvote and downvote counts
- **Vote Notifications**: Added real-time notifications for post engagement
  - Post authors receive notifications when users upvote or downvote their posts
  - Notifications include voter's name for personalized engagement tracking
  - No notifications sent when users vote on their own posts
- **Institution Community Management**: Enhanced community access for institutions
  - Institutions can now see all posts from users connected to them
  - Regular users continue to see posts from their connected institutions
  - Improved community feed logic for role-based post visibility
- **Database Schema Updates**: Extended post and voting data structures
  - Migrated existing likes column to upvotes for data preservation
  - Added downvotes column and post_votes tracking table
  - Implemented unique constraints to prevent duplicate voting

### July 20, 2025 - Enhanced Notification System with Links
- **Notification Links**: Added clickable links to notifications for better user engagement
  - Cuidoteca creation notifications now include "Ver cuidotecas →" link to institutions page
  - Event creation notifications now include "Ver evento →" link to events page
  - Updated database schema to include cuidotecaId and eventId in notifications table
  - Added specific icons for different notification types (Users icon for cuidotecas, Calendar icon for events)
- **Database Schema Enhancement**: Extended notifications table with new fields
  - Added cuidotecaId field to link notifications to specific cuidotecas
  - Added eventId field to link notifications to specific events
  - Updated notification types to include 'cuidoteca_created' and 'event_created'
- **Backend Updates**: Modified notification creation to include relevant IDs
  - Cuidoteca creation now stores cuidoteca ID in notification
  - Event creation now stores event ID in notification
  - Type-safe notification creation with proper foreign key relationships

### July 20, 2025 - Event System Modernization & Location Feature
- **Event Creation Modernization**: Converted from weekday/period selection to specific date and time format
  - Replaced day-of-week selector with date picker for specific event dates
  - Removed morning/afternoon/evening period selection (redundant with specific times)
  - Updated database schema: removed day_of_week and period columns, added event_date column
  - Enhanced time selection with HTML5 time inputs for precise start/end times
  - Updated event display to show formatted date and time range
- **Event Location Feature**: Added location field to event creation and display system
  - Updated database schema to include location column in events table
  - Enhanced event creation modal with location input field
  - Added location display in events list with map pin icon
  - Location shows in both main events page and dashboard events preview
- **Session Management Issue**: Fixed authentication contamination when switching between user accounts
- **Logout Improvement**: Enhanced logout function to clear localStorage and reload page, preventing cached user sessions
- **User Indicator**: Added current user display in header showing name and role for better session visibility
- **Connection System Debug**: Confirmed multiple users can connect to same institution independently
- **Database Verification**: Tested connection logic works correctly at database level

### July 20, 2025 - Database Connection Fix & Registration Recovery  
- **Database Issue Resolution**: Fixed DATABASE_URL environment variable error by provisioning PostgreSQL database 
- **Database Schema Deployment**: Successfully pushed all schema changes to PostgreSQL using Drizzle Kit (`npm run db:push`)
- **Registration Functionality Restored**: Fixed "relation 'users' does not exist" error by deploying database schema
- **Application Recovery**: Application now running successfully on port 5000 with full functionality
- **Environment Variables**: All required PostgreSQL connection variables (DATABASE_URL, PGHOST, PGUSER, etc.) properly configured
- **Verified API Functionality**: Institution registration tested and working correctly via curl test
- **Connection System Clarification**: Confirmed that institution connections and user-to-user connections are separate systems
  - Each user (parent, cuidador) can connect to institutions independently via `universityConnections` table
  - Direct user connections use separate `userConnections` table for parent-cuidador relationships
  - System correctly allows multiple users to connect to the same institution without conflicts

### July 19, 2025 - Cuidador Role Implementation
- **Added Third User Role**: Implemented "cuidador" role alongside existing parent and institution roles
- **Separate Enrollment System**: Created independent cuidador enrollment process without child dependency
- **Database Schema**: Added cuidadorEnrollments table for caregiver-specific enrollments
- **UI Updates**: Modified registration and dashboard to support cuidador workflows
- **Button Labels**: Updated "Sou estudante" to "Sou cuidador" for cuidador users
- **Role-Based Access**: Implemented proper authentication and authorization for cuidador operations

The application uses a monorepo structure with shared TypeScript types and utilities, enabling type safety across the full stack while maintaining clear separation between frontend and backend concerns. The system now supports three distinct user workflows: parents managing children, institutions managing approvals, and cuidadores self-enrolling in childcare services.