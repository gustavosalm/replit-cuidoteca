import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Edit } from "lucide-react";
import { useLocation } from "wouter";

export default function SchedulesList() {
  const [, setLocation] = useLocation();
  
  const { data: schedules, isLoading } = useQuery({
    queryKey: ["/api/schedules"],
  });

  const dayTranslations: { [key: string]: string } = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
  };

  const periodTranslations: { [key: string]: string } = {
    morning: "Manhã (08:00 - 12:00)",
    afternoon: "Tarde (14:00 - 18:00)",
    full_day: "Integral (08:00 - 18:00)",
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "pending":
        return "Pendente";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
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
          <CardTitle>Próximos Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {!schedules?.length ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum agendamento encontrado
              </p>
              <Button
                onClick={() => setLocation("/scheduling")}
                className="mt-4"
              >
                Fazer primeiro agendamento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule: any) => (
                <div
                  key={schedule.id}
                  className="flex items-center p-4 border border-border rounded-lg"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium text-foreground">
                      {dayTranslations[schedule.dayOfWeek]}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {periodTranslations[schedule.period]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.child?.name}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(schedule.status)}>
                      {getStatusText(schedule.status)}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-6 text-center">
            <Button onClick={() => setLocation("/scheduling")}>
              Ver Todos os Agendamentos
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
