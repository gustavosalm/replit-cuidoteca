import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Admin from "@/pages/admin";
import Community from "@/pages/community";
import Scheduling from "@/pages/scheduling";
import Profile from "@/pages/profile";
import Institutions from "@/pages/institutions";
import InstitutionProfile from "@/pages/institution-profile";
import PublicProfile from "@/pages/public-profile";
import CuidotecaDetail from "@/pages/cuidoteca-detail";
import Messages from "@/pages/messages";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/admin" component={Admin} />
      <Route path="/community" component={Community} />
      <Route path="/scheduling" component={Scheduling} />
      <Route path="/profile" component={Profile} />
      <Route path="/institutions" component={Institutions} />
      <Route path="/institutions/:id" component={InstitutionProfile} />
      <Route path="/cuidotecas/:id" component={CuidotecaDetail} />
      <Route path="/profile/:id" component={PublicProfile} />
      <Route path="/messages" component={Messages} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
