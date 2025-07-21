import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, MapPin, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function CuidadorEnrollmentsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["/api/enrollments/my-cuidador"],
  });

  const cancelMutation = useMutation({
    mutationFn: async (enrollmentId: number) => {
      return await apiRequest("DELETE", `/api/cuidador-enrollments/${enrollmentId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments/my-cuidador"] });
      toast({
        title: "Inscrição cancelada",
        description: "Sua inscrição foi cancelada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a inscrição.",
        variant: "destructive",
      });
    },
  });

  const handleCancel = (enrollmentId: number, cuidotecaName: string) => {
    if (confirm(`Tem certeza que deseja cancelar sua inscrição na cuidoteca "${cuidotecaName}"?`)) {
      cancelMutation.mutate(enrollmentId);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2" />
            Minhas Inscrições
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarDays className="h-5 w-5 mr-2" />
            Minhas Inscrições ({enrollments.length})
          </CardTitle>
        </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma inscrição</h3>
            <p className="text-muted-foreground">
              Inscreva-se em uma cuidoteca para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment: any) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-foreground">
                        {enrollment.cuidoteca.name}
                      </h4>
                      <p className="text-sm text-muted-foreground flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {enrollment.institution.institutionName || enrollment.institution.name}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          enrollment.status === "confirmed"
                            ? "default"
                            : enrollment.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {enrollment.status === "confirmed"
                          ? "Aprovado"
                          : enrollment.status === "pending"
                          ? "Aguardando aprovação"
                          : "Rejeitado"}
                      </Badge>
                      {enrollment.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleCancel(enrollment.id, enrollment.cuidoteca.name)}
                          disabled={cancelMutation.isPending}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{enrollment.requestedHours}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="h-3 w-3 mr-1" />
                      <span>
                        {enrollment.requestedDays.map((day: string) => {
                          const dayNames: { [key: string]: string } = {
                            monday: "Seg",
                            tuesday: "Ter",
                            wednesday: "Qua",
                            thursday: "Qui",
                            friday: "Sex",
                          };
                          return dayNames[day] || day;
                        }).join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
}