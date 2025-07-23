import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Baby, 
  GraduationCap,
  MapPin,
  CheckCircle,
  AlertCircle,
  User,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface CuidotecaDetail {
  id: number;
  name: string;
  hours: string;
  institutionId: number;
  institution: {
    id: number;
    name: string;
    institutionName: string;
  };
}

interface EnrolledCuidador {
  id: number;
  cuidadorId: number;
  status: string;
  requestedDays: string[];
  requestedHours: string;
  enrollmentDate: string;
  cuidador: {
    id: number;
    name: string;
    email: string;
    course?: string;
    semester?: number;
  };
}

interface EnrolledChild {
  id: number;
  childId: number;
  status: string;
  requestedDays: string[];
  requestedHours: string;
  enrollmentDate: string;
  child: {
    id: number;
    name: string;
    age: number;
    specialNeeds?: string;
  };
  parent: {
    id: number;
    name: string;
    email: string;
  };
}

export default function CuidotecaDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const cuidotecaId = params.id;

  const formatDays = (days: string[]) => {
    const dayNames: { [key: string]: string } = {
      monday: 'Seg',
      tuesday: 'Ter',
      wednesday: 'Qua',
      thursday: 'Qui',
      friday: 'Sex',
    };
    return days.map(day => dayNames[day] || day).join(', ');
  };

  const formatSchedule = (schedule: string) => {
    const scheduleNames: { [key: string]: string } = {
      morning: 'Manhã (8h-12h)',
      afternoon: 'Tarde (13h-17h)',
      full: 'Período integral (8h-17h)',
    };
    return scheduleNames[schedule] || schedule;
  };

  const { data: cuidoteca, isLoading: loadingCuidoteca } = useQuery({
    queryKey: ["/api/cuidotecas", cuidotecaId],
    enabled: !!cuidotecaId,
  });

  // Show approved cuidadores to ALL users, not just institutions
  const { data: approvedCuidadores = [], isLoading: loadingCuidadores } = useQuery({
    queryKey: ["/api/cuidotecas", cuidotecaId, "approved-cuidadores"],
    enabled: !!cuidotecaId,
  });

  // Show approved children count to ALL users
  const { data: approvedChildren = [], isLoading: loadingChildren } = useQuery({
    queryKey: ["/api/cuidotecas", cuidotecaId, "approved-children"],
    enabled: !!cuidotecaId,
  });

  const { data: pendingChildren = [], isLoading: loadingPendingChildren } = useQuery({
    queryKey: ["/api/cuidotecas", cuidotecaId, "pending-children"],
    enabled: !!cuidotecaId && user?.role === 'institution',
  });

  const { data: pendingCuidadores = [], isLoading: loadingPendingCuidadores } = useQuery({
    queryKey: ["/api/cuidotecas", cuidotecaId, "pending-cuidadores"],
    enabled: !!cuidotecaId && user?.role === 'institution',
  });

  if (loadingCuidoteca || loadingCuidadores || loadingChildren || (user?.role === 'institution' && (loadingPendingChildren || loadingPendingCuidadores))) {
    return (
      <div className="min-h-screen bg-neutral p-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cuidoteca) {
    return (
      <div className="min-h-screen bg-neutral p-4">
        <div className="max-w-6xl mx-auto text-center py-8">
          <h1 className="text-2xl font-bold mb-4">Cuidoteca não encontrada</h1>
          <Button onClick={() => setLocation("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao dashboard
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.role === 'institution' && user?.id === cuidoteca.institutionId;

  return (
    <div className="min-h-screen bg-neutral p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{cuidoteca.name}</h1>
              <p className="text-muted-foreground">
                {cuidoteca.institution?.institutionName || cuidoteca.institution?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Cuidoteca Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Informações da Cuidoteca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Horário: {formatSchedule(cuidoteca.hours)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Cuidadores aprovados: {approvedCuidadores.length}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Baby className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Crianças aprovadas: {approvedChildren.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approved Cuidadores - Visible to all */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2" />
              Cuidadores Aprovados ({approvedCuidadores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approvedCuidadores.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum cuidador aprovado ainda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedCuidadores.map((enrollment: EnrolledCuidador) => (
                  <Card 
                    key={enrollment.id} 
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar>
                          <AvatarFallback>
                            {enrollment.cuidador.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="font-medium truncate cursor-pointer hover:text-primary"
                            onClick={() => setLocation(`/profile/${enrollment.cuidador.id}`)}
                          >
                            {enrollment.cuidador.name}
                          </h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {enrollment.cuidador.course && (
                              <p className="truncate">{enrollment.cuidador.course}</p>
                            )}
                            {enrollment.cuidador.semester && (
                              <p>{enrollment.cuidador.semester}º semestre</p>
                            )}
                            <p>Dias: {formatDays(enrollment.requestedDays || [])}</p>
                            <p>Horário: {formatSchedule(enrollment.requestedHours)}</p>
                          </div>
                        </div>
                      </div>
                      {user && user.role === "parent" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => setLocation(`/messages?user=${enrollment.cuidador.id}`)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Enviar mensagem
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Institution-only sections */}
        {isOwner && (
          <>
            {/* Approved Children */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                  Crianças Aprovadas ({approvedChildren.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {approvedChildren.length === 0 ? (
                  <div className="text-center py-8">
                    <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma criança aprovada ainda
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvedChildren.map((enrollment: EnrolledChild) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Baby className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">
                              {enrollment.child.name}
                            </h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Idade: {enrollment.child.age} anos</p>
                              <p>Responsável: {enrollment.parent.name}</p>
                              <p>Dias: {formatDays(enrollment.requestedDays || [])}</p>
                              <p>Horário: {formatSchedule(enrollment.requestedHours)}</p>
                              {enrollment.child.specialNeeds && (
                                <p>Necessidades especiais: {enrollment.child.specialNeeds}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant="default" className="text-green-600 border-green-200">
                          Aprovado
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Children */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                  Crianças Aguardando Aprovação ({pendingChildren.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingChildren.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma criança aguardando aprovação
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingChildren.map((enrollment: EnrolledChild) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Baby className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">
                              {enrollment.child.name}
                            </h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>Idade: {enrollment.child.age} anos</p>
                              <p>Responsável: {enrollment.parent.name}</p>
                              <p>Dias: {formatDays(enrollment.requestedDays || [])}</p>
                              <p>Horário: {formatSchedule(enrollment.requestedHours)}</p>
                              {enrollment.child.specialNeeds && (
                                <p>Necessidades especiais: {enrollment.child.specialNeeds}</p>
                              )}
                              <p>Data da solicitação: {new Date(enrollment.enrollmentDate).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-orange-600 border-orange-200">
                          Pendente
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Cuidadores */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                  Cuidadores Aguardando Aprovação ({pendingCuidadores.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingCuidadores.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum cuidador aguardando aprovação
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingCuidadores.map((enrollment: EnrolledCuidador) => (
                      <div
                        key={enrollment.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => setLocation(`/profile/${enrollment.cuidador?.id}`)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground hover:text-primary">
                              {enrollment.cuidador?.name}
                            </h4>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                <span>Email: {enrollment.cuidador?.email}</span>
                              </div>
                              {enrollment.cuidador?.course && (
                                <p>Curso: {enrollment.cuidador.course}</p>
                              )}
                              {enrollment.cuidador?.semester && (
                                <p>Semestre: {enrollment.cuidador.semester}º</p>
                              )}
                              <p>Dias solicitados: {formatDays(enrollment.requestedDays || [])}</p>
                              <p>Horário solicitado: {formatSchedule(enrollment.requestedHours)}</p>
                              <p>Data da inscrição: {new Date(enrollment.enrollmentDate).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-orange-600 border-orange-200">
                          Pendente
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}