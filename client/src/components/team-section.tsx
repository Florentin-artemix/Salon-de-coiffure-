import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Phone, Users } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { TeamMember } from "@shared/schema";

interface TeamMemberCardProps {
  member: TeamMember;
}

function TeamMemberCard({ member }: TeamMemberCardProps) {
  const initials = member.name.split(" ").map(n => n[0]).join("");
  
  return (
    <Card className="group hover-elevate">
      <CardContent className="p-6 text-center">
        <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20">
          <AvatarImage src={member.profileImage || ""} alt={member.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-serif">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <h3 className="font-semibold text-lg">{member.name}</h3>
        
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {member.specialty?.split(", ").map((spec, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {spec}
            </Badge>
          ))}
        </div>
        
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {member.bio}
        </p>
        
        <div className="flex gap-2 mt-4">
          <Link href={`/reserver?stylist=${member.id}`} className="flex-1">
            <Button size="sm" className="w-full" data-testid={`button-book-stylist-${member.id}`}>
              <Calendar className="mr-2 h-4 w-4" />
              Reserver
            </Button>
          </Link>
          {member.phone && (
            <a href={`tel:${member.phone.replace(/\s/g, "")}`}>
              <Button size="icon" variant="outline" data-testid={`button-call-${member.id}`}>
                <Phone className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TeamSection() {
  const { data: teamMembers = [], isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  return (
    <section id="equipe" className="py-16 md:py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Notre Equipe</Badge>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl md:text-5xl">
            Des professionnels passionnes
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Rencontrez notre equipe de coiffeurs et estheticiens experimentes, dedies a votre beaute.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>L'equipe sera bientot presentee</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
