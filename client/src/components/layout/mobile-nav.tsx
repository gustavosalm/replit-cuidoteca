import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Calendar, Users, User, Building } from "lucide-react";

export default function MobileNav() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/scheduling", icon: Calendar, label: "Agenda" },
    { path: "/community", icon: Users, label: "Comunidade" },
    { path: "/institutions", icon: Building, label: "Universidades" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant="ghost"
            onClick={() => setLocation(item.path)}
            className={`flex flex-col items-center justify-center py-2 ${
              location === item.path ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
