import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import StatsCards from "@/components/dashboard/stats-cards";
import QuickActions from "@/components/dashboard/quick-actions";
import ChildrenList from "@/components/dashboard/children-list";
import EventsList from "@/components/dashboard/events-list";
import CommunityPreview from "@/components/dashboard/community-preview";
import Notifications from "@/components/dashboard/notifications";
import CuidotecasList from "@/components/dashboard/cuidotecas-list";
import PendingEnrollments from "@/components/dashboard/pending-enrollments";
import PendingCuidadorEnrollments from "@/components/dashboard/pending-cuidador-enrollments";
import { CuidadorEnrollmentsList } from "@/components/dashboard/cuidador-enrollments-list";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <div className="bg-card rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Olá, {user.name}!
                </h2>
                <p className="text-muted-foreground">
                  Bem-vinda de volta à Cuidoteca
                </p>
              </div>
              <div className="hidden md:block">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>
                    {new Date().toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long' 
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            <StatsCards />
          </div>
        </div>

        <QuickActions />
        {user.role === 'parent' && (
          <>
            <ChildrenList />
            <EventsList />
          </>
        )}
        {user.role === 'institution' && (
          <>
            <PendingEnrollments />
            <PendingCuidadorEnrollments />
            <CuidotecasList />
          </>
        )}
        {user.role === 'cuidador' && (
          <CuidadorEnrollmentsList />
        )}
        <CommunityPreview />
        <Notifications />
      </main>

      <MobileNav />
    </div>
  );
}
