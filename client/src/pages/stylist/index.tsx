import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  LayoutDashboard, Calendar, Bell, LogOut, Crown, Clock, 
  CheckCircle2, XCircle, AlertCircle, Home, User, Phone, MapPin
} from "lucide-react";
import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import type { Appointment, Service, Notification } from "@shared/schema";

const statusOptions = [
  { value: "pending", label: "En attente", icon: AlertCircle, color: "bg-yellow-100 text-yellow-800" },
  { value: "confirmed", label: "Confirme", icon: CheckCircle2, color: "bg-blue-100 text-blue-800" },
  { value: "completed", label: "Termine", icon: CheckCircle2, color: "bg-green-100 text-green-800" },
  { value: "cancelled", label: "Annule", icon: XCircle, color: "bg-red-100 text-red-800" },
];

export default function StylistDashboard() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [, navigate] = useLocation();

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments/stylist"],
    enabled: isAuthenticated && user?.role === "stylist",
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
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
      toast({ title: "Toutes les notifications marquees comme lues" });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/appointments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments/stylist"] });
      toast({ title: "Statut mis a jour" });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/connexion");
    }
    if (!authLoading && isAuthenticated && user?.role !== "stylist") {
      if (user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== "stylist") {
    return null;
  }

  const getServiceName = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    return service?.name || "Service";
  };

  const todayAppointments = appointments.filter(a => isToday(parseISO(a.date)));
  const tomorrowAppointments = appointments.filter(a => isTomorrow(parseISO(a.date)));
  const upcomingAppointments = appointments.filter(a => !isPast(parseISO(a.date)) && a.status !== "cancelled" && a.status !== "completed");
  const pendingCount = appointments.filter(a => a.status === "pending").length;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-sidebar lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Crown className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg font-semibold">Espace Coiffeur</span>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {[
              { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
              { id: "appointments", label: "Mes Rendez-vous", icon: Calendar },
              { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount.count },
            ].map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(item.id)}
                data-testid={`nav-stylist-${item.id}`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
                {item.badge && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </nav>

          <div className="border-t p-4 space-y-2">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start" data-testid="link-stylist-home">
                <Home className="mr-2 h-4 w-4" />
                Retour au site
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive" 
              onClick={handleLogout}
              data-testid="button-stylist-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Deconnexion
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
          <h1 className="font-serif text-xl font-semibold capitalize">
            {activeTab === "dashboard" ? "Tableau de bord" : 
             activeTab === "appointments" ? "Mes Rendez-vous" : "Notifications"}
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback>{user?.firstName?.[0] || "C"}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-today">{todayAppointments.length}</div>
                    <p className="text-xs text-muted-foreground">rendez-vous</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Demain</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-tomorrow">{tomorrowAppointments.length}</div>
                    <p className="text-xs text-muted-foreground">rendez-vous</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En attente</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-pending">{pendingCount}</div>
                    <p className="text-xs text-muted-foreground">a confirmer</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="stat-notifications">{unreadCount.count}</div>
                    <p className="text-xs text-muted-foreground">non lues</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Rendez-vous du jour</CardTitle>
                  <CardDescription>{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</CardDescription>
                </CardHeader>
                <CardContent>
                  {appointmentsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
                    </div>
                  ) : todayAppointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Pas de rendez-vous aujourd'hui</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {todayAppointments.sort((a, b) => a.time.localeCompare(b.time)).map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`appointment-${apt.id}`}>
                          <div className="flex items-center gap-4">
                            <div className="text-2xl font-bold text-primary">{apt.time}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{apt.clientName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{apt.clientPhone}</span>
                              </div>
                              {apt.location === "domicile" && apt.address && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{apt.address}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={apt.location === "salon" ? "default" : "secondary"}>
                              {apt.location === "salon" ? "Salon" : "Domicile"}
                            </Badge>
                            <Badge className={statusOptions.find(s => s.value === apt.status)?.color}>
                              {statusOptions.find(s => s.value === apt.status)?.label}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {upcomingAppointments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Prochains rendez-vous</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Heure</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Lieu</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingAppointments.slice(0, 5).map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell>{format(parseISO(apt.date), "d MMM", { locale: fr })}</TableCell>
                            <TableCell className="font-medium">{apt.time}</TableCell>
                            <TableCell>{apt.clientName}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {apt.location === "salon" ? "Salon" : "Domicile"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusOptions.find(s => s.value === apt.status)?.color}>
                                {statusOptions.find(s => s.value === apt.status)?.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "appointments" && (
            <Card>
              <CardHeader>
                <CardTitle>Tous mes rendez-vous</CardTitle>
                <CardDescription>Gerez vos rendez-vous clients</CardDescription>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucun rendez-vous pour le moment</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Heure</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Telephone</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Lieu</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)).map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell>{format(parseISO(apt.date), "d MMM yyyy", { locale: fr })}</TableCell>
                          <TableCell className="font-medium">{apt.time}</TableCell>
                          <TableCell>{apt.clientName}</TableCell>
                          <TableCell>{apt.clientPhone}</TableCell>
                          <TableCell>{getServiceName(apt.serviceId)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {apt.location === "salon" ? "Salon" : "Domicile"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusOptions.find(s => s.value === apt.status)?.color}>
                              {statusOptions.find(s => s.value === apt.status)?.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Restez informe des nouveaux rendez-vous</CardDescription>
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
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucune notification</p>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                              <span className="font-medium">{notification.title}</span>
                              {!notification.isRead && (
                                <span className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
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
          )}
        </div>
      </main>
    </div>
  );
}
