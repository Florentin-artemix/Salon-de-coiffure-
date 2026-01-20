import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// User roles enum
export const userRoles = ["client", "stylist", "admin"] as const;
export type UserRole = typeof userRoles[number];

// User profiles with roles
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  name: varchar("name"),
  email: varchar("email"),
  role: text("role").notNull().default("client"),
  phone: varchar("phone"),
  address: text("address"),
  specialty: text("specialty"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Services offered by the salon
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  priceMin: integer("price_min").notNull(),
  priceMax: integer("price_max"),
  duration: integer("duration").notNull().default(60),
  category: varchar("category"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
});

// Team members (stylists)
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  name: varchar("name").notNull(),
  specialty: text("specialty"),
  bio: text("bio"),
  profileImage: text("profile_image"),
  phone: varchar("phone"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  clientName: varchar("client_name").notNull(),
  clientPhone: varchar("client_phone").notNull(),
  stylistId: varchar("stylist_id").notNull(),
  serviceId: varchar("service_id").notNull(),
  date: date("date").notNull(),
  time: time("time").notNull(),
  location: varchar("location").notNull().default("salon"),
  address: text("address"),
  status: varchar("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Time slots for availability
export const timeSlots = pgTable("time_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stylistId: varchar("stylist_id").notNull(),
  date: date("date").notNull(),
  time: time("time").notNull(),
  isAvailable: boolean("is_available").default(true),
});

// Events and promotions
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  discountPercent: integer("discount_percent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gallery/Portfolio images
export const galleryImages = pgTable("gallery_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  title: varchar("title"),
  description: text("description"),
  category: varchar("category"),
  stylistId: varchar("stylist_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications for internal messaging
export const notificationTypes = ["new_appointment", "appointment_update", "appointment_cancelled", "appointment_completed", "receipt", "new_user", "system"] as const;
export type NotificationType = typeof notificationTypes[number];

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  relatedId: varchar("related_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  appointments: one(appointments, {
    fields: [userProfiles.userId],
    references: [appointments.clientId],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  stylist: one(teamMembers, {
    fields: [appointments.stylistId],
    references: [teamMembers.id],
  }),
}));

// Insert schemas
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  createdAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export const insertTimeSlotSchema = createInsertSchema(timeSlots).omit({
  id: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export const insertGalleryImageSchema = createInsertSchema(galleryImages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;

export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof services.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertTimeSlot = z.infer<typeof insertTimeSlotSchema>;
export type TimeSlot = typeof timeSlots.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertGalleryImage = z.infer<typeof insertGalleryImageSchema>;
export type GalleryImage = typeof galleryImages.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
