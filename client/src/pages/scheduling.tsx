import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Trash2 } from "lucide-react";
import ScheduleModal from "@/components/modals/schedule-modal";

export default function Scheduling() {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);

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

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    setIsScheduleModalOpen(true);
  };

  const handleModalClose = () => {
    setIsScheduleModalOpen(false);
    setEditingSchedule(null);
  };

  return (
    <>
      <div className="min-h-screen bg-neutral">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          <div className="mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">Meus Agendamentos</CardTitle>
                <Button onClick={() => setIsScheduleModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
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
                ) : !schedules?.length ? (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      Nenhum agendamento encontrado
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Crie seu primeiro agendamento para começar a usar a cuidoteca
                    </p>
                    <Button onClick={() => setIsScheduleModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Agendamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule: any) => (
                      <div
                        key={schedule.id}
                        className="flex items-center p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-foreground">
                              {dayTranslations[schedule.dayOfWeek]}
                            </h4>
                            <Badge className={getStatusColor(schedule.status)}>
                              {getStatusText(schedule.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {periodTranslations[schedule.period]}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.child?.name}
                          </p>
                          {schedule.observations && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {schedule.observations}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={handleModalClose}
        schedule={editingSchedule}
      />
    </>
  );
}
