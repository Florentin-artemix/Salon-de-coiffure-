import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section";
import { ServicesSection } from "@/components/services-section";
import { TeamSection } from "@/components/team-section";
import { GallerySection } from "@/components/gallery-section";
import { EventsSection } from "@/components/events-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <ServicesSection />
        <TeamSection />
        <GallerySection />
        <EventsSection />
      </main>
      <Footer />
    </div>
  );
}
