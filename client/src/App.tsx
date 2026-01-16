import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Booking from "@/pages/booking";
import Confirmation from "@/pages/confirmation";
import MyAppointments from "@/pages/my-appointments";
import AdminDashboard from "@/pages/admin/index";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/reserver" component={Booking} />
      <Route path="/confirmation" component={Confirmation} />
      <Route path="/mes-rendez-vous" component={MyAppointments} />
      <Route path="/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="king-queen-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
