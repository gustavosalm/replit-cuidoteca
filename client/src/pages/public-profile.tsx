import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Mail, Phone, MapPin, GraduationCap, User, Building, MessageCircle, UserPlus, Users, UserMinus, Home, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PublicUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  universityId?: string;
  course?: string;
  semester?: string;
  address?: string;
  role: string;
  institutionName?: string;
  profilePicture?: string;
}

interface ConnectedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  profilePicture?: string;
  course?: string;
  semester?: string;
  universityId?: string;
}

export default function PublicProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/users/public", id],
    enabled: !!id,
  });

  const { data: userConnections = [], isLoading: loadingConnections } = useQuery({
    queryKey: ["/api/users", id, "connections"],
    enabled: !!id,
  });

  const { data: connectionStatus } = useQuery({
    queryKey: ["/api/users", id, "connection-status"],
    enabled: !!id && !!currentUser && currentUser.id !== parseInt(id!),
  });

  // Check if current user can connect to this user
  const canConnect = currentUser && user && 
    currentUser.id !== user.id && 
    ((currentUser.role === 'parent' && user.role === 'cuidador') || 
     (currentUser.role === 'cuidador' && user.role === 'parent'));

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      setLocation(`/messages?user=${user.id}`);
    },
  });

  // Connect mutation - implement direct user connections
  const connectMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/users/${user.id}/connect`);
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada!",
        description: "A solicitação de conexão foi enviada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "connection-status"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a solicitação de conexão.",
        variant: "destructive",
      });
    },
  });

  const removeConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await apiRequest("DELETE", `/api/connections/${connectionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Conexão removida",
        description: "A conexão foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "connection-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "connections"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível remover a conexão.",
        variant: "destructive",
      });
    },
  });

  const cancelConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await apiRequest("DELETE", `/api/connections/${connectionId}`);
    },
    onSuccess: () => {
      toast({
        title: "Solicitação cancelada",
        description: "A solicitação de conexão foi cancelada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "connection-status"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a solicitação de conexão.",
        variant: "destructive",
      });
    },
  });

  const acceptConnectionMutation = useMutation({
    mutationFn: async (connectionId: number) => {
      await apiRequest("PUT", `/api/connection-requests/${connectionId}/accept`);
    },
    onSuccess: () => {
      toast({
        title: "Conexão aceita",
        description: "Vocês agora estão conectados!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "connection-status"] });
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
    mutationFn: async (connectionId: number) => {
      await apiRequest("PUT", `/api/connection-requests/${connectionId}/decline`);
    },
    onSuccess: () => {
      toast({
        title: "Conexão recusada",
        description: "A solicitação foi recusada.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", id, "connection-status"] });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Usuário não encontrado</h3>
              <p className="text-muted-foreground mb-4">
                O perfil que você está procurando não existe ou foi removido.
              </p>
              <Button onClick={() => setLocation("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Início
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/dashboard")}
            >
              <User className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                {user.profilePicture && (
                  <AvatarImage 
                    src={user.profilePicture} 
                    alt={user.name}
                  />
                )}
                <AvatarFallback className="text-lg">
                  {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={user.role === "parent" ? "default" : "secondary"}>
                    {user.role === "parent" ? "Pai/Mãe" : 
                     user.role === "coordinator" ? "Coordenador" :
                     user.role === "cuidador" ? "Cuidador" : 
                     user.role === "caregiver" ? "Cuidador" : 
                     user.role === "institution" ? "Instituição" : user.role}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Contact Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Informações de Contato
                </h3>
                
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                
                {user.phone && (
                  <div className="flex items-center space-x-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}
                
                {user.address && (
                  <div className="flex items-center space-x-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.address}</span>
                  </div>
                )}
              </div>

              {/* Academic Information (for parents) */}
              {user.role === "parent" && (user.course || user.semester || user.universityId) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Informações Acadêmicas
                  </h3>
                  
                  {user.course && (
                    <div className="flex items-center space-x-3 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{user.course}</span>
                    </div>
                  )}
                  
                  {user.semester && (
                    <div className="flex items-center space-x-3 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>{user.semester}º semestre</span>
                    </div>
                  )}
                  
                  {user.universityId && (
                    <div className="flex items-center space-x-3 text-sm">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span>RA: {user.universityId}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Institution Information (for institutions) */}
              {user.role === "institution" && user.institutionName && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Informações da Instituição
                  </h3>
                  
                  <div className="flex items-center space-x-3 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{user.institutionName}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {canConnect && (
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Button 
                  onClick={() => sendMessageMutation.mutate()}
                  className="flex-1"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
                
                {/* Connection Status Based Actions */}
                {connectionStatus?.connected ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="flex-1"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Remover Conexão
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover conexão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover a conexão com {user.name}? 
                          Esta ação não pode ser desfeita e vocês não poderão mais se comunicar diretamente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeConnectionMutation.mutate(connectionStatus.connectionId)}
                          disabled={removeConnectionMutation.isPending}
                        >
                          {removeConnectionMutation.isPending ? "Removendo..." : "Remover"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : connectionStatus?.incoming ? (
                  <div className="flex gap-2 flex-1">
                    <Button 
                      variant="default"
                      className="flex-1"
                      onClick={() => acceptConnectionMutation.mutate(connectionStatus.connectionId)}
                      disabled={acceptConnectionMutation.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {acceptConnectionMutation.isPending ? "Aceitando..." : "Aceitar Conexão"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => declineConnectionMutation.mutate(connectionStatus.connectionId)}
                      disabled={declineConnectionMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : connectionStatus?.pending ? (
                  <>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      disabled
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Aguardando Aprovação
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar solicitação</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja cancelar a solicitação de conexão com {user.name}? 
                            Você poderá enviar uma nova solicitação posteriormente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => cancelConnectionMutation.mutate(connectionStatus.connectionId)}
                            disabled={cancelConnectionMutation.isPending}
                          >
                            {cancelConnectionMutation.isPending ? "Cancelando..." : "Sim, cancelar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={() => connectMutation.mutate()}
                    disabled={connectMutation.isPending}
                    className="flex-1"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {connectMutation.isPending ? "Conectando..." : "Conectar"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Connections */}
        {userConnections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Conexões ({userConnections.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Students (Parents) */}
                {userConnections.filter((conn: ConnectedUser) => conn.role === 'parent').length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                      Estudantes ({userConnections.filter((conn: ConnectedUser) => conn.role === 'parent').length})
                    </h3>
                    <div className="space-y-3">
                      {userConnections
                        .filter((conn: ConnectedUser) => conn.role === 'parent')
                        .map((connectedUser: ConnectedUser) => (
                          <div
                            key={connectedUser.id}
                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted cursor-pointer"
                            onClick={() => setLocation(`/profile/${connectedUser.id}`)}
                          >
                            <Avatar>
                              {connectedUser.profilePicture && (
                                <AvatarImage 
                                  src={connectedUser.profilePicture} 
                                  alt={connectedUser.name}
                                />
                              )}
                              <AvatarFallback>
                                {connectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{connectedUser.name}</h4>
                              <div className="text-sm text-muted-foreground">
                                {connectedUser.course && (
                                  <p className="truncate">{connectedUser.course}</p>
                                )}
                                {connectedUser.semester && (
                                  <p>{connectedUser.semester}º semestre</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Cuidadores */}
                {userConnections.filter((conn: ConnectedUser) => conn.role === 'cuidador').length > 0 && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                      Cuidadores ({userConnections.filter((conn: ConnectedUser) => conn.role === 'cuidador').length})
                    </h3>
                    <div className="space-y-3">
                      {userConnections
                        .filter((conn: ConnectedUser) => conn.role === 'cuidador')
                        .map((connectedUser: ConnectedUser) => (
                          <div
                            key={connectedUser.id}
                            className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted cursor-pointer"
                            onClick={() => setLocation(`/profile/${connectedUser.id}`)}
                          >
                            <Avatar>
                              {connectedUser.profilePicture && (
                                <AvatarImage 
                                  src={connectedUser.profilePicture} 
                                  alt={connectedUser.name}
                                />
                              )}
                              <AvatarFallback>
                                {connectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{connectedUser.name}</h4>
                              <div className="text-sm text-muted-foreground">
                                {connectedUser.course && (
                                  <p className="truncate">{connectedUser.course}</p>
                                )}
                                {connectedUser.semester && (
                                  <p>{connectedUser.semester}º semestre</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy Notice */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Este é um perfil público. Apenas informações básicas são exibidas.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}