import { db } from "./db";
import { services, teamMembers, events } from "@shared/schema";

const SERVICES_SEED = [
  { name: "Soins de visage", description: "Traitement complet du visage pour une peau rayonnante", priceMin: 10, priceMax: null, duration: 45, category: "Soins", isActive: true },
  { name: "Coiffure homme", description: "Coupe et style pour hommes", priceMin: 3, priceMax: null, duration: 30, category: "Coiffure", isActive: true },
  { name: "Draid Locks", description: "Tresses et locks de qualite professionnelle", priceMin: 20, priceMax: 60, duration: 120, category: "Coiffure", isActive: true },
  { name: "Coiffure dame ceremonie", description: "Coiffure elegante pour occasions speciales", priceMin: 10, priceMax: null, duration: 90, category: "Coiffure", isActive: true },
  { name: "Manucure", description: "Soin des ongles et des mains", priceMin: 5, priceMax: 10, duration: 45, category: "Soins", isActive: true },
  { name: "Tresse", description: "Tresses variees selon modele choisi", priceMin: 2, priceMax: 40, duration: 120, category: "Coiffure", isActive: true },
  { name: "Maquillage", description: "Maquillage professionnel pour toutes occasions", priceMin: 5, priceMax: 8, duration: 45, category: "Maquillage", isActive: true },
  { name: "Pedicure", description: "Soin complet des pieds et ongles", priceMin: 5, priceMax: 10, duration: 60, category: "Soins", isActive: true },
  { name: "Coiffure dame simple", description: "Coiffure quotidienne pour dames", priceMin: 5, priceMax: null, duration: 30, category: "Coiffure", isActive: true },
  { name: "Locks", description: "Entretien et creation de locks", priceMin: 5, priceMax: null, duration: 60, category: "Coiffure", isActive: true },
  { name: "Lave tete", description: "Shampooing et soin des cheveux", priceMin: 3, priceMax: null, duration: 20, category: "Soins", isActive: true },
  { name: "Twist", description: "Coiffure twist tendance", priceMin: 10, priceMax: null, duration: 60, category: "Coiffure", isActive: true },
];

const TEAM_SEED = [
  { name: "Marie Kalumba", specialty: "Coiffure dame, Tresses", bio: "Specialiste des tresses africaines et coiffures de ceremonie", phone: "+243 976527237", isActive: true },
  { name: "Jean-Pierre Mwamba", specialty: "Coiffure homme, Locks", bio: "Expert en coupes modernes et entretien de locks", phone: "+243 994155412", isActive: true },
  { name: "Grace Amani", specialty: "Maquillage, Soins visage", bio: "Maquilleuse professionnelle et estheticienne", phone: "+243 854123658", isActive: true },
  { name: "Patrick Bukasa", specialty: "Draid Locks, Twist", bio: "Artiste capillaire specialise en styles tendance", phone: "+243 890357766", isActive: true },
];

const EVENTS_SEED = [
  { title: "Promotion Week-end", description: "-20% sur toutes les tresses ce week-end", discountPercent: 20, startDate: "2026-01-18", endDate: "2026-01-19", isActive: true },
  { title: "Special Fetes", description: "Offre speciale maquillage + coiffure pour vos ceremonies", discountPercent: 15, startDate: "2026-01-20", endDate: "2026-01-31", isActive: true },
  { title: "Nouveaux clients", description: "Votre premiere visite a -10%", discountPercent: 10, startDate: "2026-01-01", endDate: "2026-12-31", isActive: true },
];

export async function seed() {
  console.log("Seeding database...");

  // Check if services already exist
  const existingServices = await db.select().from(services);
  if (existingServices.length === 0) {
    console.log("Inserting services...");
    await db.insert(services).values(SERVICES_SEED);
  } else {
    console.log("Services already exist, skipping...");
  }

  // Check if team members already exist
  const existingTeam = await db.select().from(teamMembers);
  if (existingTeam.length === 0) {
    console.log("Inserting team members...");
    await db.insert(teamMembers).values(TEAM_SEED);
  } else {
    console.log("Team members already exist, skipping...");
  }

  // Check if events already exist
  const existingEvents = await db.select().from(events);
  if (existingEvents.length === 0) {
    console.log("Inserting events...");
    await db.insert(events).values(EVENTS_SEED);
  } else {
    console.log("Events already exist, skipping...");
  }

  console.log("Seeding complete!");
}
