import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Calendar, Phone, Clock, MapPin, Sparkles } from "lucide-react";
import { SALON_INFO } from "@/lib/constants";
import logoUrl from "@assets/WhatsApp_Image_2025-08-22_at_13.10.40_1768572587833.jpeg";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Service au salon ou &agrave; domicile</span>
            </div>

            <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="text-primary">King</span> and{" "}
              <span className="text-primary">Queen</span>
              <br />
              <span className="text-muted-foreground">Salon</span>
            </h1>

            <p className="max-w-lg text-lg text-muted-foreground md:text-xl">
              Votre salon de beaut&eacute; de confiance &agrave; Bukavu. Coiffure, soins du visage, manucure, maquillage et bien plus encore par des professionnels passionn&eacute;s.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/reserver">
                <Button size="lg" className="w-full sm:w-auto" data-testid="button-hero-book">
                  <Calendar className="mr-2 h-5 w-5" />
                  R&eacute;server maintenant
                </Button>
              </Link>
              <a href={`tel:${SALON_INFO.phones[0].replace(/\s/g, "")}`}>
                <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="button-hero-call">
                  <Phone className="mr-2 h-5 w-5" />
                  Appeler
                </Button>
              </a>
            </div>

            <div className="grid gap-4 pt-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Ouvert tous les jours</p>
                  <p>7H - 21H</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Bukavu, RDC</p>
                  <p>Avenue du Gouverneur</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-4 rounded-full bg-gradient-to-tr from-primary/20 via-transparent to-accent/30 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border bg-card p-2">
              <img
                src={logoUrl}
                alt="King and Queen Salon"
                className="w-full rounded-2xl object-cover aspect-square"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
