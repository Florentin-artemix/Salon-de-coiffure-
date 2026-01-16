import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Crown, Calendar, LogOut, LayoutDashboard, User } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import logoUrl from "@assets/WhatsApp_Image_2025-08-22_at_13.10.40_1768572587833.jpeg";

const navLinks = [
  { href: "/#services", label: "Services" },
  { href: "/#equipe", label: "Équipe" },
  { href: "/#galerie", label: "Galerie" },
  { href: "/#promotions", label: "Promotions" },
];

export function Header() {
  const { user, isAuthenticated, isLoading, logout, isAdmin, isStylist } = useAuth();
  const [location, navigate] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2" data-testid="link-home">
          <img src={logoUrl} alt="King and Queen Salon" className="h-10 w-10 rounded-full object-cover" />
          <span className="hidden font-serif text-xl font-semibold sm:inline-block">
            King & Queen
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              data-testid={`link-nav-${link.label.toLowerCase()}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.profileImageUrl || ""} alt={user.displayName || "User"} />
                      <AvatarFallback>
                        {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground capitalize">
                        {user.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer" data-testid="link-admin">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Administration
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  {(isAdmin || isStylist) && (
                    <DropdownMenuItem asChild>
                      <Link href="/mes-rendez-vous" className="cursor-pointer" data-testid="link-my-appointments-stylist">
                        <Calendar className="mr-2 h-4 w-4" />
                        Mes Rendez-vous
                      </Link>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem asChild>
                    <Link href="/mes-rendez-vous" className="cursor-pointer" data-testid="link-my-appointments">
                      <Calendar className="mr-2 h-4 w-4" />
                      Mes Réservations
                    </Link>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer" data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link href="/connexion">
              <Button data-testid="button-login">
                <User className="mr-2 h-4 w-4" />
                Connexion
              </Button>
            </Link>
          )}

          <Link href="/reserver" className="hidden sm:block">
            <Button variant="default" data-testid="button-book-cta">
              <Calendar className="mr-2 h-4 w-4" />
              Réserver
            </Button>
          </Link>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="font-serif text-lg">Menu</SheetTitle>
              <nav className="mt-6 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium transition-colors hover:text-primary"
                    data-testid={`link-mobile-${link.label.toLowerCase()}`}
                  >
                    {link.label}
                  </a>
                ))}
                
                {isAuthenticated && user && (
                  <>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-medium transition-colors hover:text-primary"
                      >
                        Administration
                      </Link>
                    )}
                    <Link
                      href="/mes-rendez-vous"
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-medium transition-colors hover:text-primary"
                    >
                      Mes Réservations
                    </Link>
                  </>
                )}
                
                <Link
                  href="/reserver"
                  onClick={() => setIsOpen(false)}
                  className="mt-4"
                >
                  <Button className="w-full" data-testid="button-mobile-book">
                    <Calendar className="mr-2 h-4 w-4" />
                    Réserver
                  </Button>
                </Link>
                
                {!isAuthenticated && (
                  <Link
                    href="/connexion"
                    onClick={() => setIsOpen(false)}
                  >
                    <Button variant="outline" className="w-full" data-testid="button-mobile-login">
                      <User className="mr-2 h-4 w-4" />
                      Connexion
                    </Button>
                  </Link>
                )}
                
                {isAuthenticated && (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    data-testid="button-mobile-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
