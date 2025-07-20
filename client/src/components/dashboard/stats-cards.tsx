import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, Baby, Users } from "lucide-react";

export default function StatsCards() {
  const { data: schedules } = useQuery<any[]>({
    queryKey: ["/api/schedules"],
  });

  const { data: children } = useQuery<any[]>({
    queryKey: ["/api/children"],
  });

  const { data: notifications } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
  });

  const nextAppointment = schedules?.find((s: any) => s.status === "confirmed");
  const childrenCount = children?.length || 0;
  const unreadNotifications = notifications?.filter((n: any) => !n.read).length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card className="bg-gradient-to-r from-primary to-blue-600">
        <CardContent className="p-4 text-white">
          <div className="flex items-center">
            <CalendarCheck className="h-8 w-8 mr-3" />
            <div>
              <p className="text-sm opacity-80">Próximo Evento</p>
              <p className="text-lg font-semibold">
                {nextAppointment ? `${nextAppointment.dayOfWeek}, ${nextAppointment.period}` : "Nenhum"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-r from-accent to-pink-600">
        <CardContent className="p-4 text-white">
          <div className="flex items-center">
            <Users className="h-8 w-8 mr-3" />
            <div>
              <p className="text-sm opacity-80">Notificações</p>
              <p className="text-lg font-semibold">{unreadNotifications}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
