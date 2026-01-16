import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  LayoutDashboard, Calendar, Users, Megaphone, Images, 
  Plus, LogOut, Crown, Scissors, Clock, CheckCircle2,
  XCircle, AlertCircle, Edit, Trash2, Home, UserCog, Shield
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { Appointment, TeamMember, Event, GalleryImage, UserProfile } from "@shared/schema";

interface UserWithDetails extends UserProfile {
  email?: string;
  displayName?: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrateur",
  stylist: "Coiffeur/Coiffeuse",
  client: "Client",
};

const statusOptions = [
  { value: "pending", label: "En attente", icon: AlertCircle },
  { value: "confirmed", label: "Confirm\u00e9", icon: CheckCircle2 },
  { value: "completed", label: "Termin\u00e9", icon: CheckCircle2 },
  { value: "cancelled", label: "Annul\u00e9", icon: XCircle },
];

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    enabled: isAuthenticated,
  });

  const { data: teamMembers = [], isLoading: teamLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: userProfiles = [], isLoading: usersLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/users"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PATCH", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Rôle mis à jour avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour du rôle", variant: "destructive" });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/appointments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({ title: "Statut mis \u00e0 jour" });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsEventDialogOpen(false);
      toast({ title: "\u00c9v\u00e9nement cr\u00e9\u00e9" });
    },
  });

  const createTeamMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/team", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      setIsTeamDialogOpen(false);
      toast({ title: "Membre ajout\u00e9" });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/connexion";
    }
  }, [authLoading, isAuthenticated]);

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

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const todayCount = appointments.filter((a) => a.date === format(new Date(), "yyyy-MM-dd")).length;

  const handleEventSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createEventMutation.mutate({
      title: formData.get("title"),
      description: formData.get("description"),
      discountPercent: parseInt(formData.get("discount") as string) || null,
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      isActive: true,
    });
  };

  const handleTeamSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTeamMemberMutation.mutate({
      name: formData.get("name"),
      specialty: formData.get("specialty"),
      bio: formData.get("bio"),
      phone: formData.get("phone"),
      isActive: true,
    });
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 border-r bg-sidebar lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Crown className="h-6 w-6 text-primary" />
            <span className="font-serif text-lg font-semibold">Admin</span>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {[
              { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
              { id: "appointments", label: "Rendez-vous", icon: Calendar },
              { id: "team", label: "Équipe", icon: Users },
              { id: "events", label: "Événements", icon: Megaphone },
              { id: "users", label: "Utilisateurs", icon: UserCog },
            ].map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(item.id)}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </nav>

          <div className="border-t p-4 space-y-2">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start" data-testid="link-back-home">
                <Home className="mr-2 h-4 w-4" />
                Retour au site
              </Button>
            </Link>
            <a href="/api/logout">
              <Button variant="ghost" className="w-full justify-start text-destructive" data-testid="button-admin-logout">
                <LogOut className="mr-2 h-4 w-4" />
                D\u00e9connexion
              </Button>
            </a>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
          <h1 className="font-serif text-xl font-semibold capitalize">{activeTab}</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.profileImageUrl || ""} />
              <AvatarFallback>{user?.firstName?.[0] || "A"}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">RDV Aujourd'hui</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{todayCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">En attente</CardTitle>
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pendingCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Membres Équipe</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{teamMembers.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Promotions actives</CardTitle>
                    <Megaphone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{events.filter((e) => e.isActive).length}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Derniers rendez-vous</CardTitle>
                </CardHeader>
                <CardContent>
                  {appointmentsLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
                    </div>
                  ) : appointments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Aucun rendez-vous</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Heure</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.slice(0, 5).map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell className="font-medium">{apt.clientName}</TableCell>
                            <TableCell>{format(parseISO(apt.date), "d MMM", { locale: fr })}</TableCell>
                            <TableCell>{apt.time}</TableCell>
                            <TableCell>
                              <Badge variant={apt.status === "confirmed" ? "default" : "secondary"}>
                                {statusOptions.find((s) => s.value === apt.status)?.label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "appointments" && (
            <Card>
              <CardHeader>
                <CardTitle>Tous les rendez-vous</CardTitle>
                <CardDescription>G\u00e9rez les rendez-vous des clients</CardDescription>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>T\u00e9l\u00e9phone</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Heure</TableHead>
                        <TableHead>Lieu</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {appointments.map((apt) => (
                        <TableRow key={apt.id}>
                          <TableCell className="font-medium">{apt.clientName}</TableCell>
                          <TableCell>{apt.clientPhone}</TableCell>
                          <TableCell>{format(parseISO(apt.date), "d MMM yyyy", { locale: fr })}</TableCell>
                          <TableCell>{apt.time}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {apt.location === "salon" ? "Salon" : "Domicile"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={apt.status}
                              onValueChange={(value) => updateAppointmentMutation.mutate({ id: apt.id, status: value })}
                            >
                              <SelectTrigger className="w-32" data-testid={`select-status-${apt.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "team" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-team">
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un membre
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouveau membre</DialogTitle>
                      <DialogDescription>Ajouter un nouveau membre \u00e0 l'\u00e9quipe</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleTeamSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet</Label>
                        <Input id="name" name="name" required data-testid="input-team-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialty">Sp\u00e9cialit\u00e9s</Label>
                        <Input id="specialty" name="specialty" placeholder="Coiffure, Tresses..." data-testid="input-team-specialty" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">T\u00e9l\u00e9phone</Label>
                        <Input id="phone" name="phone" type="tel" data-testid="input-team-phone" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" name="bio" data-testid="input-team-bio" />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createTeamMemberMutation.isPending} data-testid="button-submit-team">
                          {createTeamMemberMutation.isPending ? "Ajout..." : "Ajouter"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teamLoading ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)
                ) : teamMembers.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="py-12 text-center">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucun membre dans l'\u00e9quipe</p>
                    </CardContent>
                  </Card>
                ) : (
                  teamMembers.map((member) => (
                    <Card key={member.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.profileImage || ""} />
                            <AvatarFallback>{member.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.specialty}</p>
                            {member.phone && (
                              <p className="text-sm text-muted-foreground mt-1">{member.phone}</p>
                            )}
                          </div>
                          <Badge variant={member.isActive ? "default" : "secondary"}>
                            {member.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-event">
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un \u00e9v\u00e9nement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvel \u00e9v\u00e9nement</DialogTitle>
                      <DialogDescription>Cr\u00e9er une nouvelle promotion ou un \u00e9v\u00e9nement</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEventSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Titre</Label>
                        <Input id="title" name="title" required data-testid="input-event-title" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" data-testid="input-event-description" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="discount">R\u00e9duction (%)</Label>
                        <Input id="discount" name="discount" type="number" min="0" max="100" data-testid="input-event-discount" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Date de d\u00e9but</Label>
                          <Input id="startDate" name="startDate" type="date" required data-testid="input-event-start" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">Date de fin</Label>
                          <Input id="endDate" name="endDate" type="date" data-testid="input-event-end" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={createEventMutation.isPending} data-testid="button-submit-event">
                          {createEventMutation.isPending ? "Cr\u00e9ation..." : "Cr\u00e9er"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {eventsLoading ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)
                ) : events.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="py-12 text-center">
                      <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucun \u00e9v\u00e9nement</p>
                    </CardContent>
                  </Card>
                ) : (
                  events.map((event) => (
                    <Card key={event.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          <Badge variant={event.isActive ? "default" : "secondary"}>
                            {event.isActive ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          {event.discountPercent && (
                            <Badge variant="outline">-{event.discountPercent}%</Badge>
                          )}
                          <span className="text-muted-foreground">
                            {format(parseISO(event.startDate), "d MMM", { locale: fr })}
                            {event.endDate && ` - ${format(parseISO(event.endDate), "d MMM", { locale: fr })}`}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Gestion des utilisateurs
                </CardTitle>
                <CardDescription>Gérez les comptes utilisateurs et attribuez les rôles</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
                  </div>
                ) : userProfiles.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucun utilisateur enregistré</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Utilisateur</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Rôle actuel</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Changer le rôle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userProfiles.map((profile) => (
                        <TableRow key={profile.id} data-testid={`user-row-${profile.userId}`}>
                          <TableCell className="font-mono text-sm">
                            {profile.userId.substring(0, 12)}...
                          </TableCell>
                          <TableCell>{profile.phone || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={profile.role === "admin" ? "default" : profile.role === "stylist" ? "secondary" : "outline"}>
                              {roleLabels[profile.role] || profile.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={profile.isActive ? "default" : "secondary"}>
                              {profile.isActive ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={profile.role}
                              onValueChange={(value) => updateUserRoleMutation.mutate({ userId: profile.userId, role: value })}
                              disabled={profile.userId === user?.id}
                            >
                              <SelectTrigger className="w-40" data-testid={`select-role-${profile.userId}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="client">Client</SelectItem>
                                <SelectItem value="stylist">Coiffeur/Coiffeuse</SelectItem>
                                <SelectItem value="admin">Administrateur</SelectItem>
                              </SelectContent>
                            </Select>
                            {profile.userId === user?.id && (
                              <p className="text-xs text-muted-foreground mt-1">Vous ne pouvez pas modifier votre propre rôle</p>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
