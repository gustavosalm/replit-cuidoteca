import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Search, Plus, Check, Home } from "lucide-react";

interface Institution {
  id: number;
  name: string;
  email: string;
  institutionName: string;
  connectionCount?: number;
  role: string;
}

interface Connection {
  id: number;
  userId: number;
  institutionId: number;
}

export default function Institutions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: institutions = [], isLoading: loadingInstitutions } = useQuery({
    queryKey: ["/api/institutions"],
    enabled: !!user,
  });

  const { data: connections = [], isLoading: loadingConnections } = useQuery({
    queryKey: ["/api/users/connections"],
    enabled: !!user,
  });

  const connectMutation = useMutation({
    mutationFn: (institutionId: number) =>
      apiRequest("POST", `/api/institutions/${institutionId}/connect`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions"] });
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
    mutationFn: (institutionId: number) =>
      apiRequest("DELETE", `/api/institutions/${institutionId}/connect`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions"] });
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

  const isConnected = (institutionId: number) => {
    return connections.some((conn: Connection) => conn.institutionId === institutionId);
  };

  const filteredInstitutions = institutions.filter((institution: Institution) =>
    institution.institutionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    institution.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loadingInstitutions || loadingConnections) {
    return (
      <div className="min-h-screen bg-neutral p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando instituições...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Instituições</h1>
            <p className="text-muted-foreground">
              Conecte-se às instituições de ensino da sua região
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="text-sm">
              {institutions.length} Instituições Disponíveis
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/")}
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar instituições..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Institutions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstitutions.map((institution: Institution) => (
            <Card key={institution.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer flex-1"
                    onClick={() => setLocation(`/institutions/${institution.id}`)}
                  >
                    <div className="bg-accent/10 p-2 rounded-lg">
                      <Building className="h-6 w-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 hover:text-accent transition-colors">
                        {institution.institutionName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {institution.name}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{institution.connectionCount || 0} pessoas conectadas</span>
                  </div>
                  
                  <div className="pt-2 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setLocation(`/institutions/${institution.id}`)}
                    >
                      Ver Perfil
                    </Button>
                    {user?.role === "parent" && (
                      <>
                        {isConnected(institution.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              disconnectMutation.mutate(institution.id);
                            }}
                            disabled={disconnectMutation.isPending}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              connectMutation.mutate(institution.id);
                            }}
                            disabled={connectMutation.isPending}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredInstitutions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma instituição encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Tente usar termos diferentes na sua busca."
                  : "Ainda não há instituições cadastradas no sistema."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}