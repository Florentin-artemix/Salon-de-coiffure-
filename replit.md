# King and Queen Salon - Booking System

## Overview
A comprehensive salon booking system for "King and Queen Salon" located in Bukavu, RDC (Democratic Republic of Congo). The application enables customers to book appointments for various beauty services (coiffure, soins, maquillage, etc.) either at the salon or at home.

## Key Features
- Multi-step booking flow (service -> location -> stylist -> datetime -> confirm)
- Team member profiles with specialties and phone numbers
- Appointment scheduling with stylist availability (7H-21H daily)
- Events/promotions management
- Photo gallery section
- User roles (client, stylist, admin) with role-specific dashboards
- Payment is made directly to the stylist after service completion (not centralized)
- Support both salon and home service locations (home requires address + phone)
- Stylist dashboard (/coiffeur) with appointments, statistics, and notifications
- Admin dashboard (/admin) with full system management
- Internal notification system for appointments

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
- `shared/schema.ts` - Database schema definitions (including notifications table)
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - Database CRUD operations
- `server/seed.ts` - Initial data seeding
- `server/firebase-admin.ts` - Firebase Admin SDK initialization
- `server/firebase-auth.ts` - Firebase authentication middleware
- `client/src/lib/firebase.ts` - Firebase client configuration
- `client/src/hooks/use-auth.ts` - Firebase authentication hook with role management
- `client/src/pages/auth.tsx` - Login/registration page with role selection
- `client/src/pages/booking.tsx` - Multi-step booking flow
- `client/src/pages/admin/index.tsx` - Admin dashboard with full system management
- `client/src/pages/stylist/index.tsx` - Stylist dashboard with appointments and notifications
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

## File Storage (Profile Photos)

The application uses Replit App Storage (Google Cloud Storage backend) for storing profile photos:
- **Upload Flow**: Client requests signed URL → Direct upload to cloud → Object path saved in database
- **Files Location**: Stored in bucket `repl-default-bucket-$REPL_ID`
- **Object Path Format**: `/objects/uploads/<uuid>` stored in `profileImage` field of `team_members` table
- **Components**: `ProfilePhotoUpload.tsx` handles upload UI, `use-upload.ts` hook manages signed URL flow
- **Server Routes**: 
  - `POST /api/uploads/request-url` - Generate signed upload URL
  - `GET /objects/*` - Serve stored files

### Migration to Cloudflare R2 (Alternative)

If migrating the project away from Replit, you can use Cloudflare R2 for image storage:

1. **Create R2 bucket** in Cloudflare dashboard
2. **Set environment variables**:
   - `R2_ACCOUNT_ID` - Cloudflare account ID
   - `R2_ACCESS_KEY_ID` - R2 access key
   - `R2_SECRET_ACCESS_KEY` - R2 secret key
   - `R2_BUCKET_NAME` - Bucket name
   - `R2_PUBLIC_URL` - Public bucket URL (if using custom domain)

3. **Install S3-compatible SDK**: `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

4. **Update upload route** to use Cloudflare R2:
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Generate signed upload URL
const command = new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: objectKey });
const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
```

5. **Store the public URL** in database instead of object path:
   - Use `${R2_PUBLIC_URL}/${objectKey}` for direct access
   - Or use signed URLs for private files

## Recent Updates
- January 2026: Added profile photo upload with Replit App Storage (cloud-based)
- January 2026: Stylists can now confirm, complete, or cancel their own appointments
- January 2026: Admin user management now shows name and email columns
- January 2026: Fixed Unicode encoding issues in French text throughout the application
- January 2026: Added stylist dashboard (/coiffeur) with appointments, statistics, and notifications
- January 2026: Added role selection during registration (client, stylist, admin for dev testing)
- January 2026: Fixed race condition in registration role assignment using useRef flag pattern
- January 2026: Added admin self-registration protection (only allowed in development mode)
- January 2026: Added internal notification system for appointments
- January 2026: Added navigation links based on user roles in header
- January 2026: Migrated from Replit Auth to Firebase Authentication with email/password
- January 2026: Added admin user management with role assignment
- January 2026: Initial implementation with full booking flow, admin dashboard, and seeded data
