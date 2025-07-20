import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Baby, MessageCircle, UserCog, School, Calendar } from "lucide-react";
import ChildModal from "@/components/modals/child-modal";
import CuidotecaModal from "@/components/modals/cuidoteca-modal";
import EventModal from "@/components/modals/event-modal";
import { useAuth } from "@/hooks/use-auth";

export default function QuickActions() {
  const [, setLocation] = useLocation();
  const [isChildModalOpen, setIsChildModalOpen] = useState(false);
  const [isCuidotecaModalOpen, setIsCuidotecaModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <section className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {user?.role === 'parent' && (
                <>
                  <Button
                    variant="outline"
                    className="flex items-center p-4 h-auto"
                    onClick={() => setLocation("/events")}
                  >
                    <Plus className="h-5 w-5 text-primary mr-3" />
                    <span>Ver Eventos</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center p-4 h-auto"
                    onClick={() => setIsChildModalOpen(true)}
                  >
                    <Baby className="h-5 w-5 text-secondary mr-3" />
                    <span>Cadastrar Criança</span>
                  </Button>
                </>
              )}
              
              {user?.role === 'institution' && (
                <>
                  <Button
                    variant="outline"
                    className="flex items-center p-4 h-auto"
                    onClick={() => setIsCuidotecaModalOpen(true)}
                  >
                    <School className="h-5 w-5 text-primary mr-3" />
                    <span>Nova Cuidoteca</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center p-4 h-auto"
                    onClick={() => setIsEventModalOpen(true)}
                  >
                    <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                    <span>Novo Evento</span>
                  </Button>
                </>
              )}
              
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
      
      <CuidotecaModal
        isOpen={isCuidotecaModalOpen}
        onClose={() => setIsCuidotecaModalOpen(false)}
      />
      
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
      />
    </>
  );
}
