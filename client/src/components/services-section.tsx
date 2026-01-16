import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Scissors, Sparkles, Smile } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Service } from "@shared/schema";

const categoryIcons: Record<string, React.ReactNode> = {
  Coiffure: <Scissors className="h-5 w-5" />,
  Soins: <Sparkles className="h-5 w-5" />,
  Maquillage: <Smile className="h-5 w-5" />,
};

function formatPrice(min: number, max: number | null) {
  if (max && max !== min) {
    return `$${min} - $${max}`;
  }
  return `$${min}`;
}

interface ServiceCardProps {
  service: Service;
}

function ServiceCard({ service }: ServiceCardProps) {
  const icon = categoryIcons[service.category || ""] || <Sparkles className="h-5 w-5" />;
  
  return (
    <Card className="group flex flex-col h-full hover-elevate">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <Badge variant="secondary" className="text-xs">
            {service.category}
          </Badge>
        </div>
        <CardTitle className="mt-4 text-lg">{service.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {service.description}
        </p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-0">
        <span className="font-serif text-xl font-bold text-primary">
          {formatPrice(service.priceMin, service.priceMax)}
        </span>
        <Link href={`/reserver?service=${service.id}`}>
          <Button size="sm" data-testid={`button-book-service-${service.id}`}>
            <Calendar className="mr-2 h-4 w-4" />
            Reserver
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

export function ServicesSection() {
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  return (
    <section id="services" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Nos Services</Badge>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl md:text-5xl">
            Des services de qualite
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Decouvrez notre gamme complete de services de beaute. Paiement direct au coiffeur apres prestation.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Les services seront bientot disponibles</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
