import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, MapPin, User, Scissors, Plus, AlertCircle, Bell, Receipt, FileText, Printer, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { Appointment, Notification } from "@shared/schema";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "En attente", variant: "secondary" },
  confirmed: { label: "Confirmé", variant: "default" },
  completed: { label: "Terminé", variant: "outline" },
  cancelled: { label: "Annulé", variant: "destructive" },
};

export default function MyAppointments() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("appointments");
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments", "my"],
    enabled: isAuthenticated,
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      return apiRequest("PATCH", `/api/appointments/${appointmentId}`, { status: "cancelled" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Rendez-vous annule",
        description: "Votre rendez-vous a ete annule avec succes.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler le rendez-vous. Veuillez reessayer.",
        variant: "destructive",
      });
    },
  });

  const handlePrintReceipt = (notification: Notification) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const logoUrl = `${window.location.origin}/logo-salon.jpeg`;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Recu - King and Queen Salon</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 40px;
              max-width: 500px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #333;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .logo-img {
              max-width: 280px;
              height: auto;
              margin-bottom: 10px;
            }
            .receipt-content {
              white-space: pre-wrap;
              font-size: 14px;
              line-height: 1.6;
            }
            .footer {
              text-align: center;
              border-top: 2px dashed #333;
              padding-top: 20px;
              margin-top: 20px;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" alt="King and Queen Salon" class="logo-img" />
          </div>
          <div class="receipt-content">${notification.message}</div>
          <div class="footer">
            <p>Merci de votre confiance!</p>
            <p>Date d'impression: ${format(new Date(), "d MMMM yyyy 'a' HH:mm", { locale: fr })}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/connexion";
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
              <h1 className="font-serif text-3xl font-bold">Mon Espace</h1>
              <p className="text-muted-foreground mt-1">Gerez vos reservations et notifications</p>
            </div>
            <Link href="/reserver">
              <Button data-testid="button-new-appointment">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau RDV
              </Button>
            </Link>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="appointments" className="flex items-center gap-2" data-testid="tab-appointments">
                <Calendar className="h-4 w-4" />
                Rendez-vous
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2" data-testid="tab-notifications">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount.count > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {unreadCount.count}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="appointments">
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
                      Vous n'avez pas encore de rendez-vous. Reservez votre premiere visite!
                    </p>
                    <Link href="/reserver">
                      <Button data-testid="button-book-first">
                        <Calendar className="mr-2 h-4 w-4" />
                        Reserver maintenant
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {appointments.map((apt) => {
                    const status = statusLabels[apt.status] || statusLabels.pending;
                    const canCancel = apt.status === "pending" || apt.status === "confirmed";
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
                                  <span>{apt.location === "salon" ? "Au Salon" : "A Domicile"}</span>
                                </div>
                              </div>
                            </div>
                            {canCancel && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-destructive border-destructive hover:bg-destructive/10"
                                    data-testid={`button-cancel-${apt.id}`}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Annuler
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Annuler ce rendez-vous ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Etes-vous sur de vouloir annuler ce rendez-vous du {format(parseISO(apt.date), "d MMMM yyyy", { locale: fr })} a {apt.time} ? Cette action est irreversible.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Non, garder</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => cancelAppointmentMutation.mutate(apt.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      data-testid={`button-confirm-cancel-${apt.id}`}
                                    >
                                      Oui, annuler
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notifications et Recus
                    </CardTitle>
                    <CardDescription>Vos notifications et recus de service</CardDescription>
                  </div>
                  {notifications.some(n => !n.isRead) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => markAllReadMutation.mutate()}
                      disabled={markAllReadMutation.isPending}
                      data-testid="button-mark-all-read"
                    >
                      Tout marquer comme lu
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {notificationsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucune notification pour le moment</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${notification.isRead ? 'bg-background' : 'bg-primary/5 border-primary/20'}`}
                          onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                          data-testid={`notification-${notification.id}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {notification.type === "receipt" ? (
                                  <Receipt className="h-5 w-5 text-green-600" />
                                ) : (
                                  <FileText className="h-5 w-5 text-primary" />
                                )}
                                <span className="font-medium">{notification.title}</span>
                                {!notification.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-primary" />
                                )}
                                {notification.type === "receipt" && (
                                  <Badge variant="outline" className="text-green-600 border-green-600">
                                    Recu
                                  </Badge>
                                )}
                              </div>
                              {notification.type === "receipt" ? (
                                <div className="mt-3">
                                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-lg border">
                                    {notification.message}
                                  </pre>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePrintReceipt(notification);
                                    }}
                                    data-testid={`button-print-receipt-${notification.id}`}
                                  >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Imprimer le recu
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {notification.createdAt && format(new Date(notification.createdAt), "d MMM yyyy 'a' HH:mm", { locale: fr })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
