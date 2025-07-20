import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Trash2, CheckCircle, XCircle, MapPin } from "lucide-react";
import EventModal from "@/components/modals/event-modal";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Events() {
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/events"],
  });

  const checkinMutation = useMutation({
    mutationFn: async ({ eventId, status, childId }: { eventId: number; status: string; childId?: number }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/events/${eventId}/checkin`, {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status, childId }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Check-in realizado",
        description: "Sua participação foi registrada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro no check-in",
        description: "Não foi possível registrar sua participação.",
        variant: "destructive",
      });
    },
  });







  return (
    <>
      <div className="min-h-screen bg-neutral">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">
                  {user?.role === 'institution' ? 'Meus Eventos' : 'Eventos Disponíveis'}
                </CardTitle>
                {user?.role === 'institution' && (
                  <Button onClick={() => setIsEventModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Evento
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center p-4 border border-border rounded-lg">
                          <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !Array.isArray(events) || !events.length ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      {user?.role === 'institution' ? 'Nenhum evento encontrado' : 'Nenhum evento disponível'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {user?.role === 'institution' 
                        ? 'Crie seu primeiro evento para conectar com a comunidade'
                        : 'Aguarde eventos serem criados pela sua instituição'
                      }
                    </p>
                    {user?.role === 'institution' && (
                      <Button onClick={() => setIsEventModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Evento
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(events) && events.map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-foreground">
                              {event.title}
                            </h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {event.eventDate && new Date(event.eventDate).toLocaleDateString('pt-BR')} - {event.startTime} às {event.endTime}
                          </p>
                          {event.location && (
                            <div className="flex items-center text-sm text-muted-foreground mb-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.description && (
                            <p className="text-sm text-muted-foreground mb-1">
                              {event.description}
                            </p>
                          )}
                          {event.observations && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {event.observations}
                            </p>
                          )}
                          {user?.role === 'institution' && event.participations && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground">
                                {event.participations.filter((p: any) => p.status === 'confirmed').length} confirmados, {event.participations.filter((p: any) => p.status === 'pending').length} pendentes
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {user?.role === 'institution' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingEvent(event);
                                setIsEventModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          ) : (
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => checkinMutation.mutate({ 
                                  eventId: event.id, 
                                  status: 'confirmed'
                                })}
                                disabled={checkinMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => checkinMutation.mutate({ 
                                  eventId: event.id, 
                                  status: 'cancelled' 
                                })}
                                disabled={checkinMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <MobileNav />
      </div>

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
      />
    </>
  );
}
