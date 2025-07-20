import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import MobileNav from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Baby, Clock, Calendar } from "lucide-react";

export default function Admin() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: stats } = useQuery<{
    totalFamilies: number;
    activeChildren: number;
    waitingList: number;
    todaySchedules: number;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: user?.role === "coordinator",
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "coordinator")) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "coordinator") {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Painel da Coordenação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-primary mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Famílias</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats?.totalFamilies || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Baby className="h-8 w-8 text-secondary mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Crianças Ativas</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats?.activeChildren || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-yellow-50">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Lista de Espera</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats?.waitingList || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-red-600 mr-3" />
                      <div>
                        <p className="text-sm text-muted-foreground">Eventos Hoje</p>
                        <p className="text-2xl font-bold text-foreground">
                          {stats?.todaySchedules || 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Últimas Inscrições</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-muted-foreground mr-3" />
                          <div>
                            <p className="font-medium text-foreground">Aguardando dados...</p>
                            <p className="text-sm text-muted-foreground">Sistema em desenvolvimento</p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">Hoje</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Frequência Semanal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[
                        { day: "Segunda-feira", percentage: 85 },
                        { day: "Terça-feira", percentage: 92 },
                        { day: "Quarta-feira", percentage: 78 },
                        { day: "Quinta-feira", percentage: 88 },
                        { day: "Sexta-feira", percentage: 95 },
                      ].map((item) => (
                        <div key={item.day} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{item.day}</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
