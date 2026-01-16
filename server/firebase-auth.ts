import type { RequestHandler } from "express";
import { verifyIdToken } from "./firebase-admin";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: {
        uid: string;
        email: string | null;
        name?: string;
      };
      userProfile?: {
        userId: string;
        role: string;
        phone: string | null;
        address: string | null;
      };
    }
  }
}

// Middleware to verify Firebase token and attach user info
export const firebaseAuth: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }
  
  const idToken = authHeader.split("Bearer ")[1];
  
  try {
    const decodedToken = await verifyIdToken(idToken);
    
    if (!decodedToken) {
      return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name
    };
    
    // Get user profile from database
    const profile = await storage.getUserProfile(decodedToken.uid);
    if (profile) {
      req.userProfile = {
        userId: profile.userId,
        role: profile.role,
        phone: profile.phone,
        address: profile.address
      };
    }
    
    next();
  } catch (error) {
    console.error("Firebase auth error:", error);
    return res.status(401).json({ message: "Unauthorized - Token verification failed" });
  }
};

// Optional auth - doesn't fail if no token, but attaches user if present
export const optionalFirebaseAuth: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  
  const idToken = authHeader.split("Bearer ")[1];
  
  try {
    const decodedToken = await verifyIdToken(idToken);
    
    if (decodedToken) {
      req.firebaseUser = {
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        name: decodedToken.name
      };
      
      const profile = await storage.getUserProfile(decodedToken.uid);
      if (profile) {
        req.userProfile = {
          userId: profile.userId,
          role: profile.role,
          phone: profile.phone,
          address: profile.address
        };
      }
    }
  } catch (error) {
    // Silent fail for optional auth
  }
  
  next();
};

// Middleware to check if user is admin
export const requireAdmin: RequestHandler = async (req, res, next) => {
  if (!req.firebaseUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (!req.userProfile || req.userProfile.role !== "admin") {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  next();
};

// Middleware to check if user is stylist or admin
export const requireStylistOrAdmin: RequestHandler = async (req, res, next) => {
  if (!req.firebaseUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (!req.userProfile || !["admin", "stylist"].includes(req.userProfile.role)) {
    return res.status(403).json({ message: "Forbidden - Stylist or Admin access required" });
  }
  
  next();
};
