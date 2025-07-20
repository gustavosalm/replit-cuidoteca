import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Info, CheckCircle, X, UserPlus, UserCheck, UserX, Calendar, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    select: (data: any[]) => data.slice(0, 5), // Show only first 5 notifications
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const acceptConnectionMutation = useMutation({
    mutationFn: async (connectionRequestId: number) => {
      await apiRequest("PUT", `/api/connection-requests/${connectionRequestId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Conexão aceita!",
        description: "Vocês agora estão conectados.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível aceitar a conexão.",
        variant: "destructive",
      });
    },
  });

  const declineConnectionMutation = useMutation({
    mutationFn: async (connectionRequestId: number) => {
      await apiRequest("PUT", `/api/connection-requests/${connectionRequestId}/decline`);
    },
    onSuccess: () => {
      toast({
        title: "Conexão recusada",
        description: "A solicitação de conexão foi recusada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível recusar a conexão.",
        variant: "destructive",
      });
    },
  });

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "agora";
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    return `${Math.floor(diffInHours / 24)}d atrás`;
  };

  const handleDismiss = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
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
    <section className="mb-8" data-section="notifications">
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          {!notifications?.length ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma notificação no momento
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`flex items-center p-3 rounded-lg border ${
                    notification.read 
                      ? "bg-muted border-border" 
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    {notification.type === "connection_request" ? (
                      <UserPlus className="h-4 w-4 text-white" />
                    ) : notification.type === "cuidoteca_created" ? (
                      <Users className="h-4 w-4 text-white" />
                    ) : notification.type === "event_created" ? (
                      <Calendar className="h-4 w-4 text-white" />
                    ) : notification.message.includes("confirmado") ? (
                      <CheckCircle className="h-4 w-4 text-white" />
                    ) : (
                      <Info className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {notification.message}
                      {notification.type === "cuidoteca_created" && notification.cuidotecaId && (
                        <div className="mt-1">
                          <Link href="/institutions" className="text-primary hover:underline text-xs">
                            Ver cuidotecas →
                          </Link>
                        </div>
                      )}
                      {notification.type === "event_created" && notification.eventId && (
                        <div className="mt-1">
                          <Link href="/events" className="text-primary hover:underline text-xs">
                            Ver evento →
                          </Link>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {notification.type === "connection_request" && notification.connectionRequestId && !notification.read && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => acceptConnectionMutation.mutate(notification.connectionRequestId)}
                          disabled={acceptConnectionMutation.isPending || declineConnectionMutation.isPending}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Aceitar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => declineConnectionMutation.mutate(notification.connectionRequestId)}
                          disabled={acceptConnectionMutation.isPending || declineConnectionMutation.isPending}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Recusar
                        </Button>
                      </>
                    )}
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(notification.id)}
                        disabled={markAsReadMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
