import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Percent, ArrowRight, Megaphone } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { Event } from "@shared/schema";

function formatDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), "d MMM", { locale: fr });
  } catch {
    return dateStr;
  }
}

export function EventsSection() {
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events/active"],
  });

  if (isLoading) {
    return (
      <section id="promotions" className="py-16 md:py-24 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Promotions</Badge>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl md:text-5xl">
              Offres speciales
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  return (
    <section id="promotions" className="py-16 md:py-24 bg-primary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Promotions</Badge>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl md:text-5xl">
            Offres speciales
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Profitez de nos promotions exclusives et evenements speciaux
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="group hover-elevate border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  {event.discountPercent && (
                    <Badge className="bg-primary text-primary-foreground">
                      <Percent className="mr-1 h-3 w-3" />
                      -{event.discountPercent}%
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDate(event.startDate)}
                      {event.endDate && ` - ${formatDate(event.endDate)}`}
                    </span>
                  </div>
                </div>
                <CardTitle className="mt-3 text-lg font-serif">{event.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {event.description}
                </p>
                <Link href="/reserver">
                  <Button variant="outline" size="sm" className="w-full group" data-testid={`button-promo-${event.id}`}>
                    En profiter
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
