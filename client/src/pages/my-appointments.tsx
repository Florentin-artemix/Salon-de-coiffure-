import { useEffect } from "react";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin, User, Scissors, Plus, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { Appointment } from "@shared/schema";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "En attente", variant: "secondary" },
  confirmed: { label: "Confirm\u00e9", variant: "default" },
  completed: { label: "Termin\u00e9", variant: "outline" },
  cancelled: { label: "Annul\u00e9", variant: "destructive" },
};

export default function MyAppointments() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", "my"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold">Mes Rendez-vous</h1>
              <p className="text-muted-foreground mt-1">G\u00e9rez vos r\u00e9servations</p>
            </div>
            <Link href="/reserver">
              <Button data-testid="button-new-appointment">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau RDV
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : !appointments || appointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">Aucun rendez-vous</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Vous n'avez pas encore de rendez-vous. R\u00e9servez votre premi\u00e8re visite!
                </p>
                <Link href="/reserver">
                  <Button data-testid="button-book-first">
                    <Calendar className="mr-2 h-4 w-4" />
                    R\u00e9server maintenant
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appointments.map((apt) => {
                const status = statusLabels[apt.status] || statusLabels.pending;
                return (
                  <Card key={apt.id} className="hover-elevate">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(parseISO(apt.date), "d MMMM yyyy", { locale: fr })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{apt.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{apt.location === "salon" ? "Au Salon" : "À Domicile"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
