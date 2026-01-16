import { Link } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Calendar, Home, Phone } from "lucide-react";
import { SALON_INFO } from "@/lib/constants";

export default function Confirmation() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-lg text-center">
            <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            
            <h1 className="font-serif text-3xl font-bold md:text-4xl">
              Rendez-vous confirm\u00e9!
            </h1>
            
            <p className="mt-4 text-muted-foreground">
              Merci pour votre r\u00e9servation. Votre rendez-vous a \u00e9t\u00e9 enregistr\u00e9 avec succ\u00e8s.
            </p>

            <Card className="mt-8">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{SALON_INFO.phones[0]}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Rappel:</strong> Le paiement se fait directement au coiffeur apr\u00e8s la prestation.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/mes-rendez-vous">
                <Button data-testid="button-view-appointments">
                  <Calendar className="mr-2 h-4 w-4" />
                  Voir mes rendez-vous
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" data-testid="button-go-home">
                  <Home className="mr-2 h-4 w-4" />
                  Retour \u00e0 l'accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
