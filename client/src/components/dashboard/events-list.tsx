import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit, MapPin } from "lucide-react";
import { useLocation } from "wouter";

export default function EventsList() {
  const [, setLocation] = useLocation();
  
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["/api/events"],
  });



  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "pending":
        return "Pendente";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <section className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {!Array.isArray(events) || !events.length ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum evento encontrado
              </p>
              <Button
                onClick={() => setLocation("/events")}
                className="mt-4"
              >
                Ver Eventos Disponíveis
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(events) && events.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center p-4 border border-border rounded-lg"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium text-foreground">
                      {event.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {event.eventDate && new Date(event.eventDate).toLocaleDateString('pt-BR')} - {event.startTime} às {event.endTime}
                    </p>
                    {event.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    {event.description && (
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Button onClick={() => setLocation("/events")}>
              Ver Todos os Eventos
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
