import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart, Bell, User } from "lucide-react";

export default function Header() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Get notifications to check for unread ones
  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });
  
  const hasUnreadNotifications = notifications.some((notification: any) => !notification.read);

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => setLocation("/")}>
              <Heart className="h-8 w-8 text-accent mr-3" />
              <h1 className="text-xl font-semibold text-foreground hover:text-accent transition-colors">Cuidoteca</h1>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Button
                variant={location === "/" ? "default" : "ghost"}
                onClick={() => setLocation("/")}
              >
                Dashboard
              </Button>
              <Button
                variant={location === "/events" ? "default" : "ghost"}
                onClick={() => setLocation("/events")}
              >
                Eventos
              </Button>
              <Button
                variant={location === "/community" ? "default" : "ghost"}
                onClick={() => setLocation("/community")}
              >
                Comunidade
              </Button>
              <Button
                variant={location === "/messages" ? "default" : "ghost"}
                onClick={() => setLocation("/messages")}
              >
                Mensagens
              </Button>
              <Button
                variant={location === "/institutions" ? "default" : "ghost"}
                onClick={() => setLocation("/institutions")}
              >
                Instituições
              </Button>
              <Button
                variant={location === "/profile" ? "default" : "ghost"}
                onClick={() => setLocation("/profile")}
              >
                Perfil
              </Button>
              {user?.role === "coordinator" && (
                <Button
                  variant={location === "/admin" ? "default" : "ghost"}
                  onClick={() => setLocation("/admin")}
                >
                  Admin
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setLocation("/");
                  // Scroll to notifications section after a brief delay for navigation
                  setTimeout(() => {
                    const notificationsSection = document.querySelector('[data-section="notifications"]');
                    if (notificationsSection) {
                      notificationsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
              >
                <Bell className="h-4 w-4" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </Button>
            </div>
            <div className="relative">
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
