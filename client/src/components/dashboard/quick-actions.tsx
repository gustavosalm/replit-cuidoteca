import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Baby, MessageCircle, UserCog } from "lucide-react";
import ChildModal from "@/components/modals/child-modal";

export default function QuickActions() {
  const [, setLocation] = useLocation();
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);

  return (
    <>
      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="flex items-center p-4 h-auto"
                onClick={() => setLocation("/scheduling")}
              >
                <Plus className="h-5 w-5 text-primary mr-3" />
                <span>Novo Agendamento</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center p-4 h-auto"
                onClick={() => setIsChildModalOpen(true)}
              >
                <Baby className="h-5 w-5 text-secondary mr-3" />
                <span>Cadastrar Criança</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center p-4 h-auto"
                onClick={() => setLocation("/community")}
              >
                <MessageCircle className="h-5 w-5 text-accent mr-3" />
                <span>Ver Comunidade</span>
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center p-4 h-auto"
                onClick={() => setLocation("/profile")}
              >
                <UserCog className="h-5 w-5 text-purple-600 mr-3" />
                <span>Editar Perfil</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <ChildModal
        isOpen={isChildModalOpen}
        onClose={() => setIsChildModalOpen(false)}
      />
    </>
  );
}
