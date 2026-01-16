# King and Queen Salon - Booking System

## Overview
A comprehensive salon booking system for "King and Queen Salon" located in Bukavu, RDC (Democratic Republic of Congo). The application enables customers to book appointments for various beauty services (coiffure, soins, maquillage, etc.) either at the salon or at home.

## Key Features
- Multi-step booking flow (service -> location -> stylist -> datetime -> confirm)
- Team member profiles with specialties and phone numbers
- Appointment scheduling with stylist availability (7H-21H daily)
- Events/promotions management
- Photo gallery section
- User roles (client, stylist, admin)
- Payment is made directly to the stylist after service completion (not centralized)
- Support both salon and home service locations (home requires address + phone)

## Tech Stack
- **Frontend**: React 18 with TypeScript, Wouter for routing, TanStack Query for data fetching
- **UI**: shadcn/ui components, Tailwind CSS, Lucide icons
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Authentication (email/password)

## Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities and constants
├── server/
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Database storage layer
│   ├── seed.ts             # Initial database seeding
│   └── db.ts               # Database connection
├── shared/
│   └── schema.ts           # Drizzle schema & types
```

## Key Files
- `shared/schema.ts` - Database schema definitions
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database CRUD operations
- `server/seed.ts` - Initial data seeding
- `server/firebase-admin.ts` - Firebase Admin SDK initialization
- `server/firebase-auth.ts` - Firebase authentication middleware
- `client/src/lib/firebase.ts` - Firebase client configuration
- `client/src/hooks/use-auth.ts` - Firebase authentication hook
- `client/src/pages/auth.tsx` - Login/registration page
- `client/src/pages/booking.tsx` - Multi-step booking flow
- `client/src/pages/admin/index.tsx` - Admin dashboard
- `client/src/pages/home.tsx` - Landing page

## Database Tables
- `userProfiles` - User profiles with roles (synced from Firebase)
- `services` - Available salon services with pricing
- `team_members` - Stylists and beauticians
- `appointments` - Booked appointments
- `time_slots` - Available booking slots
- `events` - Promotions and special offers
- `gallery_images` - Photo gallery

## API Endpoints
- `GET /api/services` - List all active services
- `GET /api/team` - List all team members
- `GET /api/events/active` - Get active promotions
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments` - List appointments (admin)
- `PATCH /api/appointments/:id` - Update appointment status
- `POST /api/auth/firebase-sync` - Sync Firebase user to database (requires Bearer token)
- `GET /api/users` - List all users (admin only)
- `PATCH /api/users/:userId/role` - Update user role (admin only, cannot change own role)

## Design Decisions
- French language interface for target market in Bukavu, DRC
- Warm, elegant color palette with Playfair Display serif font
- Mobile-first responsive design
- Direct payment to stylist model (no centralized payment system)

## Running the Project
The project runs with `npm run dev` which starts both the Express backend and Vite frontend on port 5000.

## Database Commands
- `npm run db:push` - Push schema changes to database
- `npm run db:push --force` - Force sync schema (use carefully)

## Authentication
Firebase Authentication is used for user login/registration:
- Email/password authentication enabled
- First registered user automatically becomes admin
- User roles: admin, stylist, client (stored in `userProfiles` table)
- Token-based auth: Firebase ID token sent as Bearer token in Authorization header
- Server verifies tokens using Firebase Admin SDK
- Admin can manage user roles via dashboard (cannot change own role)

## Environment Variables (Secrets)
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase Admin SDK service account JSON
- `SESSION_SECRET` - Express session secret
- `DATABASE_URL` - PostgreSQL connection string (auto-provided)

Frontend environment variables (in `.env`):
- `VITE_FIREBASE_*` - Firebase client configuration

## Recent Updates
- January 2026: Migrated from Replit Auth to Firebase Authentication with email/password
- January 2026: Added admin user management with role assignment
- January 2026: Initial implementation with full booking flow, admin dashboard, and seeded data
