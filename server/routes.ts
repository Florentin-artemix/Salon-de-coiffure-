import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { firebaseAuth, optionalFirebaseAuth, requireAdmin, requireStylistOrAdmin } from "./firebase-auth";
import { verifyIdToken } from "./firebase-admin";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { 
  insertServiceSchema, insertTeamMemberSchema, insertAppointmentSchema,
  insertEventSchema, insertGalleryImageSchema, insertNotificationSchema
} from "@shared/schema";
import { z } from "zod";

// Helper function to notify stylists and admins about appointments
async function notifyAboutAppointment(
  type: "new_appointment" | "appointment_update" | "appointment_cancelled",
  appointment: { id: string; stylistId: string; clientName: string; date: string; time: string },
  message: string
) {
  try {
    // Get the stylist's user ID from team_members
    const teamMember = await storage.getTeamMember(appointment.stylistId);
    if (teamMember?.userId) {
      await storage.createNotification({
        userId: teamMember.userId,
        type,
        title: type === "new_appointment" ? "Nouveau rendez-vous" : 
               type === "appointment_update" ? "Rendez-vous modifie" : "Rendez-vous annule",
        message,
        relatedId: appointment.id,
        isRead: false,
      });
    }

    // Also notify all admins
    const allUsers = await storage.getAllUserProfiles();
    const admins = allUsers.filter(u => u.role === "admin");
    for (const admin of admins) {
      await storage.createNotification({
        userId: admin.userId,
        type,
        title: type === "new_appointment" ? "Nouveau rendez-vous" : 
               type === "appointment_update" ? "Rendez-vous modifie" : "Rendez-vous annule",
        message,
        relatedId: appointment.id,
        isRead: false,
      });
    }
  } catch (error) {
    console.error("Error creating notifications:", error);
  }
}

// Default time slots (7H-21H)
const DEFAULT_TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register object storage routes for file uploads
  registerObjectStorageRoutes(app);

  // Firebase Auth Sync - creates/updates user profile on login
  app.post("/api/auth/firebase-sync", async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const idToken = authHeader.split("Bearer ")[1];
    
    try {
      const decodedToken = await verifyIdToken(idToken);
      
      if (!decodedToken) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const { uid, email, name } = decodedToken;
      const { requestedRole } = req.body;
      
      // Check if user profile exists
      let profile = await storage.getUserProfile(uid);
      
      if (!profile) {
        // Create new profile - first user becomes admin
        const hasAdmin = await storage.hasAdminUser();
        let role = "client";
        
        if (!hasAdmin) {
          // First user is always admin
          role = "admin";
        } else if (requestedRole === "stylist" || requestedRole === "client") {
          // Allow user to choose between client or stylist
          role = requestedRole;
        } else if (requestedRole === "admin" && process.env.NODE_ENV === "development") {
          // Admin self-registration only allowed in development mode (for testing)
          role = "admin";
          console.warn(`DEVELOPMENT ONLY: User ${email} self-registered as admin`);
        }
        
        profile = await storage.createUserProfile({
          userId: uid,
          name: name || email?.split("@")[0] || null,
          email: email || null,
          role,
          phone: null,
          address: null,
          specialty: null,
          bio: null,
          profileImage: null,
          isActive: true,
        });
        
        console.log(`Created new user profile for ${email} with role: ${role}`);
        
        // Create team_member entry for stylists and admins
        if (role === "stylist" || role === "admin") {
          const displayName = name || email?.split("@")[0] || "Nouveau membre";
          await storage.createTeamMember({
            userId: uid,
            name: displayName,
            specialty: role === "admin" ? "Administration" : null,
            bio: null,
            profileImage: null,
            phone: null,
            isActive: true,
          });
          console.log(`Created team member for ${email}`)
        }
      } else if (requestedRole && profile.role === "client" && profile.createdAt) {
        // Allow role update for newly created profiles (within 60 seconds) when requestedRole is provided
        // This handles the race condition between onAuthStateChanged and register() calls
        const createdAtTime = new Date(profile.createdAt).getTime();
        const now = Date.now();
        const ageSeconds = (now - createdAtTime) / 1000;
        
        if (ageSeconds < 60) {
          let newRole: string | null = null;
          if (requestedRole === "stylist") {
            newRole = requestedRole;
            profile = await storage.updateUserProfile(uid, { role: requestedRole }) || profile;
            console.log(`Updated user profile role for ${email} from client to: ${requestedRole}`);
          } else if (requestedRole === "admin" && process.env.NODE_ENV === "development") {
            // Admin self-registration only allowed in development mode
            newRole = requestedRole;
            profile = await storage.updateUserProfile(uid, { role: requestedRole }) || profile;
            console.warn(`DEVELOPMENT ONLY: Updated user profile role for ${email} to admin`);
          }
          
          // Create team_member if role changed to stylist or admin
          if (newRole === "stylist" || newRole === "admin") {
            const existingTeamMember = await storage.getTeamMemberByUserId(uid);
            if (!existingTeamMember) {
              const displayName = name || email?.split("@")[0] || "Nouveau membre";
              await storage.createTeamMember({
                userId: uid,
                name: displayName,
                specialty: newRole === "admin" ? "Administration" : null,
                bio: null,
                profileImage: null,
                phone: null,
                isActive: true,
              });
              console.log(`Created team member for ${email} after role update`);
            }
          }
        }
      }
      
      // Parse name
      const nameParts = (name || "").split(" ");
      const firstName = nameParts[0] || email?.split("@")[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      res.json({
        userId: uid,
        email,
        firstName,
        lastName,
        role: profile.role,
        phone: profile.phone,
        address: profile.address
      });
    } catch (error) {
      console.error("Firebase sync error:", error);
      res.status(500).json({ message: "Failed to sync user" });
    }
  });

  // Get current user info (with token)
  app.get("/api/auth/user", async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const idToken = authHeader.split("Bearer ")[1];
    
    try {
      const decodedToken = await verifyIdToken(idToken);
      
      if (!decodedToken) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      const profile = await storage.getUserProfile(decodedToken.uid);
      
      if (!profile) {
        return res.status(404).json({ message: "User profile not found" });
      }
      
      const nameParts = (decodedToken.name || "").split(" ");
      
      res.json({
        id: decodedToken.uid,
        email: decodedToken.email,
        firstName: nameParts[0] || decodedToken.email?.split("@")[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        role: profile.role,
        phone: profile.phone,
        address: profile.address,
        profileImageUrl: decodedToken.picture || null
      });
    } catch (error) {
      console.error("Error getting user:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUserProfiles();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Update user role (admin only)
  app.patch("/api/users/:userId/role", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      // Prevent admin from changing their own role
      if (req.userProfile && req.userProfile.userId === userId) {
        return res.status(403).json({ message: "You cannot change your own role" });
      }
      
      if (!["client", "stylist", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const profile = await storage.updateUserProfile(userId, { role });
      
      if (!profile) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Profile API - Get current user's profile with team member info
  app.get("/api/profile", firebaseAuth, async (req, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Get team member info if stylist or admin
      let teamMember = null;
      if (profile.role === "stylist" || profile.role === "admin") {
        teamMember = await storage.getTeamMemberByUserId(userId);
      }
      
      res.json({
        ...profile,
        teamMember
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Profile API - Update current user's profile
  app.put("/api/profile", firebaseAuth, async (req, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { name, phone, specialty, bio, profileImage, address } = req.body;
      
      // Update user profile
      const updatedProfile = await storage.updateUserProfile(userId, {
        phone,
        address,
        specialty,
        bio,
        profileImage,
      });
      
      if (!updatedProfile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      // Update team member if exists
      let teamMember = await storage.getTeamMemberByUserId(userId);
      if (teamMember) {
        teamMember = await storage.updateTeamMember(teamMember.id, {
          name: name || teamMember.name,
          phone,
          specialty,
          bio,
          profileImage,
        });
      } else if (updatedProfile.role === "stylist" || updatedProfile.role === "admin") {
        // Create team member if doesn't exist but user is stylist/admin
        teamMember = await storage.createTeamMember({
          userId,
          name: name || "Nouveau membre",
          phone,
          specialty,
          bio,
          profileImage,
          isActive: true,
        });
      }
      
      res.json({
        ...updatedProfile,
        teamMember
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Services API
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  app.post("/api/services", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertServiceSchema.parse(req.body);
      const service = await storage.createService(data);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.patch("/api/services/:id", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      const service = await storage.updateService(req.params.id, req.body);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Team API
  app.get("/api/team", async (req, res) => {
    try {
      const team = await storage.getTeamMembers();
      res.json(team);
    } catch (error) {
      console.error("Error fetching team:", error);
      res.status(500).json({ message: "Failed to fetch team" });
    }
  });

  app.get("/api/team/:id", async (req, res) => {
    try {
      const member = await storage.getTeamMember(req.params.id);
      if (!member) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error fetching team member:", error);
      res.status(500).json({ message: "Failed to fetch team member" });
    }
  });

  app.post("/api/team", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertTeamMemberSchema.parse(req.body);
      const member = await storage.createTeamMember(data);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating team member:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create team member" });
    }
  });

  app.patch("/api/team/:id", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      const member = await storage.updateTeamMember(req.params.id, req.body);
      if (!member) {
        return res.status(404).json({ message: "Team member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ message: "Failed to update team member" });
    }
  });

  app.delete("/api/team/:id", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteTeamMember(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ message: "Failed to delete team member" });
    }
  });

  // Appointments API
  app.get("/api/appointments", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/my", firebaseAuth, async (req, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const appointments = await storage.getAppointmentsByClient(userId);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching user appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/stylist", firebaseAuth, requireStylistOrAdmin, async (req, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // Find team member linked to this user
      const teamMember = await storage.getTeamMemberByUserId(userId);
      if (!teamMember) {
        return res.status(404).json({ message: "Stylist profile not found" });
      }
      const appointments = await storage.getAppointmentsByStylist(teamMember.id);
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching stylist appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.post("/api/appointments", optionalFirebaseAuth, async (req, res) => {
    try {
      const data = insertAppointmentSchema.parse(req.body);
      
      // If user is authenticated, use their ID
      if (req.firebaseUser) {
        data.clientId = req.firebaseUser.uid;
      }
      
      const appointment = await storage.createAppointment(data);
      
      // Send notifications to stylist and admins
      await notifyAboutAppointment(
        "new_appointment",
        appointment,
        `Nouveau rendez-vous de ${appointment.clientName} le ${appointment.date} a ${appointment.time}`
      );
      
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Allow both admins and stylists to update appointments
  // Stylists can only update appointments assigned to them
  app.patch("/api/appointments/:id", firebaseAuth, async (req, res) => {
    try {
      const userProfile = req.userProfile;
      if (!userProfile || (userProfile.role !== "admin" && userProfile.role !== "stylist")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Stylists can only update their own appointments
      if (userProfile.role === "stylist") {
        const teamMember = await storage.getTeamMemberByUserId(userProfile.userId);
        if (!teamMember || appointment.stylistId !== teamMember.id) {
          return res.status(403).json({ message: "You can only manage your own appointments" });
        }
      }

      const updatedAppointment = await storage.updateAppointment(req.params.id, req.body);
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Allow both admins and stylists to delete appointments
  app.delete("/api/appointments/:id", firebaseAuth, async (req, res) => {
    try {
      const userProfile = req.userProfile;
      if (!userProfile || (userProfile.role !== "admin" && userProfile.role !== "stylist")) {
        return res.status(403).json({ message: "Access denied" });
      }

      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Stylists can only delete their own appointments
      if (userProfile.role === "stylist") {
        const teamMember = await storage.getTeamMemberByUserId(userProfile.userId);
        if (!teamMember || appointment.stylistId !== teamMember.id) {
          return res.status(403).json({ message: "You can only delete your own appointments" });
        }
      }

      await storage.deleteAppointment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Availability API - returns available time slots for a stylist on a given date
  app.get("/api/availability/:stylistId/:date", async (req, res) => {
    try {
      const { stylistId, date } = req.params;
      
      // Get existing appointments for this stylist on this date
      const bookedAppointments = await storage.getAppointmentsByStylistAndDate(stylistId, date);
      const bookedTimes = new Set(bookedAppointments.map(apt => apt.time));
      
      // Filter out booked slots from default time slots
      const availableSlots = DEFAULT_TIME_SLOTS.filter(slot => !bookedTimes.has(slot));
      
      res.json({ 
        date,
        stylistId,
        availableSlots,
        bookedSlots: Array.from(bookedTimes)
      });
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  // Events API
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/active", async (req, res) => {
    try {
      const events = await storage.getActiveEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching active events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/events", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(data);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      const event = await storage.updateEvent(req.params.id, req.body);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteEvent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Gallery API
  app.get("/api/gallery", async (req, res) => {
    try {
      const images = await storage.getGalleryImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      res.status(500).json({ message: "Failed to fetch gallery" });
    }
  });

  app.post("/api/gallery", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      const data = insertGalleryImageSchema.parse(req.body);
      const image = await storage.createGalleryImage(data);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error creating gallery image:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create gallery image" });
    }
  });

  app.delete("/api/gallery/:id", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteGalleryImage(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });

  // Notifications API
  app.get("/api/notifications", firebaseAuth, async (req, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", firebaseAuth, async (req, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", firebaseAuth, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", firebaseAuth, async (req, res) => {
    try {
      const userId = req.firebaseUser?.uid;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });

  app.delete("/api/notifications/:id", firebaseAuth, async (req, res) => {
    try {
      await storage.deleteNotification(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Dashboard stats for admin
  app.get("/api/admin/stats", firebaseAuth, requireAdmin, async (req, res) => {
    try {
      const [users, appointments, services, team, events] = await Promise.all([
        storage.getAllUserProfiles(),
        storage.getAppointments(),
        storage.getServices(),
        storage.getTeamMembers(),
        storage.getEvents()
      ]);
      
      const today = new Date().toISOString().split("T")[0];
      const todayAppointments = appointments.filter(a => a.date === today);
      const pendingAppointments = appointments.filter(a => a.status === "pending");
      
      res.json({
        totalUsers: users.length,
        totalAppointments: appointments.length,
        todayAppointments: todayAppointments.length,
        pendingAppointments: pendingAppointments.length,
        totalServices: services.length,
        totalTeamMembers: team.length,
        activeEvents: events.filter(e => e.isActive).length,
        usersByRole: {
          clients: users.filter(u => u.role === "client").length,
          stylists: users.filter(u => u.role === "stylist").length,
          admins: users.filter(u => u.role === "admin").length,
        }
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  return httpServer;
}
