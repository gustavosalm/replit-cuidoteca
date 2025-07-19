import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  GraduationCap,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PendingCuidadorEnrollments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: pendingEnrollments = [], isLoading } = useQuery({
    queryKey: ["/api/enrollments/pending-cuidadores"],
  });

  const approveMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      return await apiRequest("PUT", `/api/cuidador-enrollments/${enrollmentId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments/pending-cuidadores"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cuidotecas"] });
      toast({
        title: "Inscrição aprovada!",
        description: "O cuidador foi aceito na cuidoteca.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a inscrição.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      return await apiRequest("PUT", `/api/cuidador-enrollments/${enrollmentId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments/pending-cuidadores"] });
      toast({
        title: "Inscrição rejeitada",
        description: "A inscrição foi rejeitada.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a inscrição.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (enrollmentId: number) => {
    approveMutation.mutate(enrollmentId);
  };

  const handleReject = (enrollmentId: number) => {
    if (confirm("Tem certeza que deseja rejeitar esta inscrição?")) {
      rejectMutation.mutate(enrollmentId);
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
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Cuidadores Aguardando Aprovação ({pendingEnrollments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingEnrollments.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma inscrição de cuidador pendente no momento
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEnrollments.map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {enrollment.cuidador?.name}
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          <span>Email: {enrollment.cuidador?.email}</span>
                        </div>
                        <p>Cuidoteca: {enrollment.cuidoteca?.name}</p>
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
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      Pendente
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => handleApprove(enrollment.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleReject(enrollment.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
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