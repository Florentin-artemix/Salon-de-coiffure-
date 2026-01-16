# Design Guidelines: King and Queen Salon Booking System

## Design Approach
**Reference-Based**: Drawing inspiration from modern booking platforms (Fresha, Calendly) combined with beauty-focused aesthetics (Glossier, Sephora). Balancing elegant salon presentation with efficient booking functionality.

## Core Design Principles
1. **Elegant Simplicity**: Clean, sophisticated aesthetic reflecting salon quality
2. **Booking-First UX**: Streamlined appointment flow as primary user journey
3. **Trust & Credibility**: Prominent team showcase and service photography
4. **Dual-Mode Clarity**: Clear distinction between salon and home service options

## Typography
- **Primary Font**: Inter or Outfit (Google Fonts) - modern, professional
- **Accent Font**: Playfair Display or Cormorant - elegant, luxury touch
- **Hierarchy**: 
  - Hero: text-5xl to text-6xl (accent font)
  - Section Headers: text-3xl to text-4xl (accent font)
  - Service Titles: text-xl font-semibold
  - Body: text-base
  - Prices: text-lg font-bold (accent color)

## Layout System
**Spacing Units**: Tailwind 4, 6, 8, 12, 16, 24 for consistent rhythm
- Container: max-w-7xl mx-auto
- Section padding: py-16 md:py-24
- Component spacing: gap-6 to gap-8
- Form fields: space-y-4

## Page Structure

### Public Site
1. **Hero Section** (100vh): Full-screen hero with salon ambiance image, "Réservez votre rendez-vous" CTA, hours display (7H-21H tous les jours)
2. **Services Grid** (multi-column): 3-column grid (lg:), 2-column (md:), cards with service name, price range, "Réserver" button
3. **Team Showcase**: Horizontal scrolling cards or 4-column grid, each stylist with photo, name, specialties, availability indicator
4. **Portfolio Gallery**: Masonry grid of before/after photos, filterable by service type
5. **Events & Promotions**: Carousel or cards showing current offers
6. **Footer**: Contact, location, social links, quick booking link

### Booking Flow (Multi-step)
**Step 1 - Service Selection**: Grid of service cards with prices
**Step 2 - Location Choice**: Two prominent options (Au Salon / À Domicile), home service requires address + phone fields
**Step 3 - Stylist Selection**: Filter by specialty, show availability, profile photos
**Step 4 - Date/Time**: Calendar view with time slots (7h-21h), unavailable times grayed out
**Step 5 - Confirmation**: Summary with edit options, reminder that payment is direct to stylist

### Admin Dashboard
- **Sidebar Navigation**: Dashboard, Rendez-vous, Équipe, Événements, Promotions
- **Event Manager**: Calendar view with add/edit modal
- **Staff Management**: Add team members, set specialties, manage schedules
- **Appointment Overview**: Table with filters (date, stylist, service type)

## Component Library

### Cards
- Service cards: Image top, title, price range, description, CTA button
- Stylist cards: Circular profile photo, name, specialty badges, "Voir disponibilités" link
- Appointment cards: Service icon, datetime, client info, status badge

### Forms
- Floating labels for all inputs
- Address autocomplete for home service
- Phone number with country code dropdown
- Time slot picker: Grid of available times, selected state highlighted

### Navigation
- **Public**: Fixed header, logo left, menu center (Services, Équipe, Galerie), "Réserver" CTA right
- **Dashboard**: Persistent sidebar with icons + labels

### Buttons
- Primary: Rounded-lg, px-6 py-3, prominent for CTAs
- Secondary: Outlined variant for secondary actions
- On images: Backdrop-blur-md bg-white/90

### Badges
- Specialty tags: Rounded-full, small text, varied styles
- Status indicators: Color-coded (confirmed, pending, completed)

## Images
**Hero**: Professional salon interior or stylist at work - full-width, high-quality
**Team Photos**: Headshots with consistent styling, circular crop
**Portfolio**: Before/after service results, 3:4 aspect ratio
**Service Icons**: Use Heroicons for service categories

## Animations
**Minimal approach**:
- Smooth page transitions (opacity + slight transform)
- Hover states on cards (subtle scale 1.02)
- Calendar time slot selection: Quick highlight animation
- No distracting motion - professional feel

## Accessibility
- Clear focus states on all interactive elements
- High contrast for prices and CTAs
- ARIA labels for booking steps
- Keyboard navigation throughout

## Mobile Optimization
- Stack all grids to single column
- Bottom navigation for booking flow steps
- Touch-friendly time slot picker (min 44px touch targets)
- Collapsible sections for service details