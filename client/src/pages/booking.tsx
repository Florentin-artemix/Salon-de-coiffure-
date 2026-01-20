import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, ArrowRight, Check, Calendar as CalendarIcon, 
  MapPin, Home, Scissors, Clock, Phone, User, CheckCircle2, Loader2, Tag
} from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import type { Service, TeamMember, Event } from "@shared/schema";

interface AvailabilityResponse {
  date: string;
  stylistId: string;
  availableSlots: string[];
  bookedSlots: string[];
}

type BookingStep = "service" | "location" | "stylist" | "datetime" | "confirm";

interface BookingData {
  serviceId: string;
  location: "salon" | "domicile";
  address: string;
  phone: string;
  stylistId: string;
  date: Date | undefined;
  time: string;
  notes: string;
  clientName: string;
}

const steps: { id: BookingStep; label: string }[] = [
  { id: "service", label: "Service" },
  { id: "location", label: "Lieu" },
  { id: "stylist", label: "Coiffeur" },
  { id: "datetime", label: "Date & Heure" },
  { id: "confirm", label: "Confirmation" },
];

export default function Booking() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const preselectedService = searchParams.get("service");
  const preselectedStylist = searchParams.get("stylist");
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: activeEvents = [] } = useQuery<Event[]>({
    queryKey: ["/api/events/active"],
  });

  // Calculate the best discount from active events
  const bestDiscount = activeEvents.reduce((max, event) => {
    return event.discountPercent && event.discountPercent > max ? event.discountPercent : max;
  }, 0);

  const activePromotion = activeEvents.find(e => e.discountPercent === bestDiscount && bestDiscount > 0);

  const [currentStep, setCurrentStep] = useState<BookingStep>("service");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId: preselectedService || "",
    location: "salon",
    address: "",
    phone: "",
    stylistId: preselectedStylist || "",
    date: undefined,
    time: "",
    notes: "",
    clientName: "",
  });
  
  // Query availability when stylist and date are selected
  const availabilityDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const { data: availability, isLoading: availabilityLoading } = useQuery<AvailabilityResponse>({
    queryKey: ["/api/availability", bookingData.stylistId, availabilityDateStr],
    enabled: !!bookingData.stylistId && !!selectedDate,
  });

  useEffect(() => {
    if (user) {
      setBookingData(prev => ({
        ...prev,
        clientName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (preselectedService) {
      setBookingData(prev => ({ ...prev, serviceId: preselectedService }));
    }
    if (preselectedStylist) {
      setBookingData(prev => ({ ...prev, stylistId: preselectedStylist }));
    }
  }, [preselectedService, preselectedStylist]);

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: BookingData) => {
      const response = await apiRequest("POST", "/api/appointments", {
        clientId: user?.id || "guest",
        clientName: data.clientName,
        clientPhone: data.phone,
        stylistId: data.stylistId,
        serviceId: data.serviceId,
        date: data.date ? format(data.date, "yyyy-MM-dd") : "",
        time: data.time,
        location: data.location,
        address: data.location === "domicile" ? data.address : null,
        notes: data.notes || null,
        status: "pending",
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Rendez-vous confirme",
        description: "Votre rendez-vous a ete cree avec succes!",
      });
      navigate("/confirmation");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de creer le rendez-vous. Veuillez reessayer.",
        variant: "destructive",
      });
    },
  });

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const selectedService = services.find((s) => s.id === bookingData.serviceId);
  const selectedStylist = teamMembers.find((s) => s.id === bookingData.stylistId);

  // Calculate discounted prices
  const calculateDiscountedPrice = (price: number) => {
    if (bestDiscount > 0) {
      return Math.round(price * (1 - bestDiscount / 100));
    }
    return price;
  };

  const discountedPriceMin = selectedService ? calculateDiscountedPrice(selectedService.priceMin) : 0;
  const discountedPriceMax = selectedService?.priceMax ? calculateDiscountedPrice(selectedService.priceMax) : null;

  const canProceed = () => {
    switch (currentStep) {
      case "service":
        return !!bookingData.serviceId;
      case "location":
        if (bookingData.location === "domicile") {
          return !!bookingData.address && !!bookingData.phone;
        }
        return true; // Pour le salon, pas de champs requis
      case "stylist":
        return !!bookingData.stylistId;
      case "datetime":
        return !!bookingData.date && !!bookingData.time;
      case "confirm":
        return !!bookingData.clientName;
      default:
        return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour confirmer votre rendez-vous.",
        variant: "destructive",
      });
      window.location.href = "/api/login";
      return;
    }
    createAppointmentMutation.mutate(bookingData);
  };

  const minDate = startOfDay(new Date());
  const maxDate = addDays(new Date(), 30);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <h1 className="font-serif text-3xl font-bold md:text-4xl">Reserver un rendez-vous</h1>
              <p className="mt-2 text-muted-foreground">Suivez les etapes pour planifier votre visite</p>
            </div>

            <div className="mb-8 flex justify-center">
              <div className="flex items-center gap-1 sm:gap-2">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                        idx < currentStepIndex
                          ? "bg-primary text-primary-foreground"
                          : idx === currentStepIndex
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {idx < currentStepIndex ? <Check className="h-4 w-4" /> : idx + 1}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`h-0.5 w-4 sm:w-8 transition-colors ${
                          idx < currentStepIndex ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">{steps[currentStepIndex].label}</CardTitle>
                <CardDescription>
                  Etape {currentStepIndex + 1} sur {steps.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[300px]">
                {currentStep === "service" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {servicesLoading ? (
                      [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)
                    ) : services.length === 0 ? (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        Aucun service disponible
                      </div>
                    ) : (
                      services.map((service) => (
                        <div
                          key={service.id}
                          onClick={() => setBookingData({ ...bookingData, serviceId: service.id })}
                          className={`cursor-pointer rounded-lg border p-4 transition-all hover-elevate ${
                            bookingData.serviceId === service.id
                              ? "border-primary bg-primary/5 ring-2 ring-primary"
                              : "border-border"
                          }`}
                          data-testid={`service-option-${service.id}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground">{service.category}</p>
                            </div>
                            <Badge variant="secondary" className="font-serif">
                              ${service.priceMin}{service.priceMax ? `-${service.priceMax}` : ""}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {currentStep === "location" && (
                  <div className="space-y-6">
                    <RadioGroup
                      value={bookingData.location}
                      onValueChange={(val) => setBookingData({ ...bookingData, location: val as "salon" | "domicile" })}
                      className="grid gap-4 sm:grid-cols-2"
                    >
                      <div>
                        <RadioGroupItem value="salon" id="salon" className="peer sr-only" />
                        <Label
                          htmlFor="salon"
                          className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-border p-6 text-center transition-all hover-elevate peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          data-testid="location-salon"
                        >
                          <MapPin className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">Au Salon</p>
                            <p className="text-sm text-muted-foreground">Avenue du Gouverneur, Bukavu</p>
                          </div>
                        </Label>
                      </div>
                      <div>
                        <RadioGroupItem value="domicile" id="domicile" className="peer sr-only" />
                        <Label
                          htmlFor="domicile"
                          className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-border p-6 text-center transition-all hover-elevate peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          data-testid="location-domicile"
                        >
                          <Home className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">A Domicile</p>
                            <p className="text-sm text-muted-foreground">Nous venons chez vous</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {bookingData.location === "domicile" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Numero de telephone *
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+243 XXX XXX XXX"
                            value={bookingData.phone}
                            onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                            data-testid="input-phone"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="address" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Adresse complete *
                          </Label>
                          <Textarea
                            id="address"
                            placeholder="Votre adresse complete..."
                            value={bookingData.address}
                            onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                            data-testid="input-address"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {currentStep === "stylist" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {teamLoading ? (
                      [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)
                    ) : teamMembers.length === 0 ? (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        Aucun coiffeur disponible
                      </div>
                    ) : (
                      teamMembers.map((stylist) => {
                        const initials = stylist.name.split(" ").map((n) => n[0]).join("");
                        return (
                          <div
                            key={stylist.id}
                            onClick={() => setBookingData({ ...bookingData, stylistId: stylist.id })}
                            className={`cursor-pointer rounded-lg border p-4 transition-all hover-elevate ${
                              bookingData.stylistId === stylist.id
                                ? "border-primary bg-primary/5 ring-2 ring-primary"
                                : "border-border"
                            }`}
                            data-testid={`stylist-option-${stylist.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={stylist.profileImage || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{stylist.name}</p>
                                <p className="text-sm text-muted-foreground">{stylist.specialty}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {currentStep === "datetime" && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <Label className="mb-3 block">Choisir une date</Label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          setBookingData({ ...bookingData, date, time: "" });
                        }}
                        disabled={(date) => isBefore(date, minDate) || date > maxDate}
                        locale={fr}
                        className="rounded-md border"
                        data-testid="calendar"
                      />
                    </div>
                    <div>
                      <Label className="mb-3 block">Choisir une heure</Label>
                      {!selectedDate ? (
                        <p className="text-sm text-muted-foreground">Veuillez d'abord selectionner une date</p>
                      ) : availabilityLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : availability?.availableSlots?.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun creneau disponible pour cette date</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {(availability?.availableSlots || []).map((slot) => (
                            <Button
                              key={slot}
                              variant={bookingData.time === slot ? "default" : "outline"}
                              size="sm"
                              onClick={() => setBookingData({ ...bookingData, time: slot })}
                              data-testid={`time-slot-${slot.replace(":", "")}`}
                            >
                              {slot}
                            </Button>
                          ))}
                        </div>
                      )}
                      {availability?.bookedSlots && availability.bookedSlots.length > 0 && (
                        <p className="mt-3 text-xs text-muted-foreground">
                          {availability.bookedSlots.length} creneau(x) deja reserve(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {currentStep === "confirm" && (
                  <div className="space-y-6">
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <h3 className="font-semibold mb-4">Recapitulatif</h3>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground flex items-center gap-2">
                            <Scissors className="h-4 w-4" /> Service
                          </dt>
                          <dd className="font-medium">{selectedService?.name || "-"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Lieu
                          </dt>
                          <dd className="font-medium">
                            {bookingData.location === "salon" ? "Au Salon" : "A Domicile"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> Coiffeur
                          </dt>
                          <dd className="font-medium">{selectedStylist?.name || "-"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" /> Date
                          </dt>
                          <dd className="font-medium">
                            {bookingData.date ? format(bookingData.date, "d MMMM yyyy", { locale: fr }) : "-"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" /> Heure
                          </dt>
                          <dd className="font-medium">{bookingData.time || "-"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground flex items-center gap-2">
                            <Phone className="h-4 w-4" /> Telephone
                          </dt>
                          <dd className="font-medium">{bookingData.phone || "-"}</dd>
                        </div>
                        {bookingData.location === "domicile" && bookingData.address && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Adresse</dt>
                            <dd className="font-medium text-right max-w-[200px]">{bookingData.address}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientName">Votre nom *</Label>
                        <Input
                          id="clientName"
                          value={bookingData.clientName}
                          onChange={(e) => setBookingData({ ...bookingData, clientName: e.target.value })}
                          placeholder="Votre nom complet"
                          data-testid="input-client-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optionnel)</Label>
                        <Textarea
                          id="notes"
                          value={bookingData.notes}
                          onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                          placeholder="Instructions speciales ou demandes..."
                          data-testid="input-notes"
                        />
                      </div>
                    </div>

                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <div className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Le paiement se fait directement au coiffeur après la prestation.
                        {selectedService && (
                          <div className="mt-3">
                            <span className="block mb-1">Prix estimé:</span>
                            {bestDiscount > 0 ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="line-through text-muted-foreground">
                                    ${selectedService.priceMin}{selectedService.priceMax ? ` - $${selectedService.priceMax}` : ""}
                                  </span>
                                  <Badge variant="destructive" className="text-xs" data-testid="badge-discount">
                                    <Tag className="h-3 w-3 mr-1" />
                                    -{bestDiscount}%
                                  </Badge>
                                </div>
                                <span className="font-serif font-bold text-primary text-lg" data-testid="text-discounted-price">
                                  ${discountedPriceMin}{discountedPriceMax ? ` - $${discountedPriceMax}` : ""}
                                </span>
                                {activePromotion && (
                                  <span className="text-xs text-green-600 dark:text-green-400">
                                    Promotion: {activePromotion.title}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="font-serif font-bold text-primary text-lg" data-testid="text-price">
                                ${selectedService.priceMin}{selectedService.priceMax ? ` - $${selectedService.priceMax}` : ""}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="flex items-center justify-between gap-4 border-t p-6">
                <Button
                  variant="outline"
                  onClick={goPrev}
                  disabled={currentStepIndex === 0}
                  data-testid="button-prev"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>

                {currentStep === "confirm" ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={!canProceed() || createAppointmentMutation.isPending}
                    data-testid="button-confirm"
                  >
                    {createAppointmentMutation.isPending ? (
                      "Confirmation..."
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirmer le rendez-vous
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={goNext} disabled={!canProceed()} data-testid="button-next">
                    Suivant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
