import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building, Users, GraduationCap, ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import CuidotecasSection from "@/components/institution/cuidotecas-section";

interface Institution {
  id: number;
  name: string;
  email: string;
  institutionName: string;
  connectionCount?: number;
  role: string;
}

interface ConnectedUser {
  id: number;
  name: string;
  email: string;
  course?: string;
  semester?: string;
  universityId?: string;
}

interface Connection {
  id: number;
  userId: number;
  institutionId: number;
}

export default function InstitutionProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: institution, isLoading: loadingInstitution } = useQuery({
    queryKey: ["/api/institutions", id],
    enabled: !!id,
  });

  const { data: connectedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["/api/institutions", id, "connections"],
    enabled: !!id,
  });

  const { data: userConnections = [], isLoading: loadingConnections } = useQuery({
    queryKey: ["/api/users/connections"],
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/institutions/${id}/connect`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/institutions", id, "connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/connections"] });
      toast({
        title: "Conectado com sucesso!",
        description: "Você agora está conectado a esta instituição.",
      });
    },
    onError: () => {
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar à instituição.",
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/institutions/${id}/connect`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/institutions", id, "connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/connections"] });
      toast({
        title: "Desconectado",
        description: "Você foi desconectado da instituição.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível desconectar da instituição.",
        variant: "destructive",
      });
    },
  });

  const isConnected = userConnections.some((conn: Connection) => 
    conn.institutionId === parseInt(id || "0")
  );

  if (loadingInstitution || loadingUsers || loadingConnections) {
    return (
      <div className="min-h-screen bg-neutral p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando perfil da instituição...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="min-h-screen bg-neutral p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Instituição não encontrada</h3>
              <p className="text-muted-foreground mb-4">
                A instituição que você está procurando não existe ou foi removida.
              </p>
              <Button onClick={() => setLocation("/institutions")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar às Instituições
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with navigation */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/institutions")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/")}
          >
            <Building className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* Institution Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Building className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{institution.institutionName}</CardTitle>
                  <p className="text-muted-foreground">Coordenado por {institution.name}</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                {institution.connectionCount || 0} estudantes conectados
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Institution Info */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{institution.email}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{institution.connectionCount || 0} estudantes conectados</span>
                </div>
              </div>

              {/* Connection Action */}
              {user?.role === "parent" && (
                <div className="flex flex-col justify-center">
                  {isConnected ? (
                    <Button
                      variant="outline"
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                      className="w-full"
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      {disconnectMutation.isPending ? "Desconectando..." : "Conectado"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => connectMutation.mutate()}
                      disabled={connectMutation.isPending}
                      className="w-full"
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      {connectMutation.isPending ? "Conectando..." : user?.role === "cuidador" ? "Sou cuidador" : "Sou estudante"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cuidotecas Section */}
        <CuidotecasSection 
          institutionId={parseInt(id || "0")} 
          user={user} 
        />

        {/* Connected Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Estudantes Conectados ({connectedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectedUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum estudante conectado</h3>
                <p className="text-muted-foreground">
                  Seja o primeiro a se conectar a esta instituição!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connectedUsers.map((connectedUser: ConnectedUser) => (
                  <Card 
                    key={connectedUser.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setLocation(`/profile/${connectedUser.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {connectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{connectedUser.name}</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {connectedUser.course && (
                              <p className="truncate">{connectedUser.course}</p>
                            )}
                            {connectedUser.semester && (
                              <p>{connectedUser.semester}º semestre</p>
                            )}
                            {connectedUser.universityId && (
                              <p className="truncate">RA: {connectedUser.universityId}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}