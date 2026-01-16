import { Phone, MapPin, Clock, Crown } from "lucide-react";
import { SALON_INFO } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-6 w-6 text-primary" />
              <span className="font-serif text-xl font-semibold">King & Queen</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Votre salon de beaut&eacute; de confiance &agrave; Bukavu. Service professionnel au salon ou &agrave; domicile.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {SALON_INFO.phones.slice(0, 3).map((phone, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-foreground">
                    {phone}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Adresse</h3>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
              <span>{SALON_INFO.address}</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Horaires</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              <span>
                {SALON_INFO.hours.days}: {SALON_INFO.hours.open} - {SALON_INFO.hours.close}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {SALON_INFO.name}. Tous droits r&eacute;serv&eacute;s.</p>
        </div>
      </div>
    </footer>
  );
}
