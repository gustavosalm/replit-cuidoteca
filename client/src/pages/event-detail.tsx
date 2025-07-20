import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin, Users, CheckCircle, XCircle, ArrowLeft, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function EventDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["/api/events", id],
    enabled: !!id,
  });

  const { data: rsvpData } = useQuery({
    queryKey: ["/api/events", id, "rsvps"],
    enabled: !!id,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return await apiRequest("POST", `/api/events/${id}/rsvp`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/events", id, "rsvps"] });
      toast({
        title: "Resposta registrada",
        description: "Sua participação foi registrada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao responder",
        description: "Não foi possível registrar sua resposta.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </main>
        <MobileNav />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-neutral">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Evento não encontrado</h3>
              <p className="text-muted-foreground mb-4">
                O evento que você está procurando não foi encontrado.
              </p>
              <Button onClick={() => setLocation("/events")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Eventos
              </Button>
            </CardContent>
          </Card>
        </main>
        <MobileNav />
      </div>
    );
  }

  const goingUsers = rsvpData?.rsvps?.filter((rsvp: any) => rsvp.status === 'going') || [];
  const notGoingUsers = rsvpData?.rsvps?.filter((rsvp: any) => rsvp.status === 'not_going') || [];

  return (
    <div className="min-h-screen bg-neutral">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/events")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Eventos
          </Button>
        </div>

        <div className="space-y-6">
          {/* Event Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{event.title}</CardTitle>
                  <div className="flex items-center space-x-4 text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {event.eventDate && new Date(event.eventDate).toLocaleDateString('pt-BR')} - {event.startTime} às {event.endTime}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                {user?.role !== 'institution' && (
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant={event.userRsvp?.status === 'going' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => rsvpMutation.mutate({ status: 'going' })}
                      disabled={rsvpMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Vou
                    </Button>
                    <Button
                      variant={event.userRsvp?.status === 'not_going' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => rsvpMutation.mutate({ status: 'not_going' })}
                      disabled={rsvpMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Não vou
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {event.description && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
              {event.observations && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Observações</h4>
                  <p className="text-muted-foreground italic whitespace-pre-wrap">{event.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RSVP Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Participação ({rsvpData?.counts?.going || 0} confirmados)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Going */}
                <div>
                  <h4 className="font-medium mb-3 text-green-600">
                    Vão participar ({goingUsers.length})
                  </h4>
                  <div className="space-y-2">
                    {goingUsers.length > 0 ? (
                      goingUsers.map((rsvp: any) => (
                        <div key={rsvp.id} className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {rsvp.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <button
                            className="font-medium hover:text-primary transition-colors cursor-pointer"
                            onClick={() => setLocation(`/profile/${rsvp.user.id}`)}
                          >
                            {rsvp.user.name}
                          </button>
                          <Badge variant="secondary" className="text-xs">
                            {rsvp.user.role === 'parent' ? 'Pai/Mãe' : 
                             rsvp.user.role === 'cuidador' ? 'Cuidador' : 'Instituição'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Ninguém confirmou participação ainda
                      </p>
                    )}
                  </div>
                </div>

                {/* Not Going */}
                {notGoingUsers.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 text-red-600">
                      Não vão participar ({notGoingUsers.length})
                    </h4>
                    <div className="space-y-2">
                      {notGoingUsers.map((rsvp: any) => (
                        <div key={rsvp.id} className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {rsvp.user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <button
                            className="font-medium hover:text-primary transition-colors cursor-pointer"
                            onClick={() => setLocation(`/profile/${rsvp.user.id}`)}
                          >
                            {rsvp.user.name}
                          </button>
                          <Badge variant="secondary" className="text-xs">
                            {rsvp.user.role === 'parent' ? 'Pai/Mãe' : 
                             rsvp.user.role === 'cuidador' ? 'Cuidador' : 'Instituição'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}