import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Phone, MapPin, GraduationCap, User, Building } from "lucide-react";

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
}

export default function PublicProfile() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/users/public", id],
    enabled: !!id,
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/")}
          >
            <User className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>

        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
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
                     user.role === "caregiver" ? "Cuidador" : "Instituição"}
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