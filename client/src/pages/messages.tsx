import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, User, Calendar, MessageSquare, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkMessageText, setBulkMessageText] = useState("");
  const [selectedTargetGroup, setSelectedTargetGroup] = useState("");

  // Handle URL query parameter for starting new conversations
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const userId = urlParams.get('user');
    if (userId && !selectedUserId) {
      setSelectedUserId(parseInt(userId));
    }
  }, [location, selectedUserId]);

  // Get user conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/messages/conversations"],
    enabled: !!user,
  });

  // Get user's connected users for potential conversations
  const { data: connectedUsers = [] } = useQuery({
    queryKey: ["/api/users/me/connected-users"],
    enabled: !!user,
  });

  // Get messages with selected user
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedUserId],
    enabled: !!selectedUserId,
  });

  // Get selected user info for new conversations
  const { data: selectedUserInfo } = useQuery({
    queryKey: ["/api/users", selectedUserId],
    enabled: !!selectedUserId && !conversations.find((conv: any) => conv.otherUserId === selectedUserId),
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: number; content: string }) => {
      const response = await apiRequest('POST', '/api/messages', data);
      return await response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
    },
  });

  // Send bulk message mutation (for institutions)
  const sendBulkMessageMutation = useMutation({
    mutationFn: async (data: { targetGroup: string; content: string }) => {
      const response = await apiRequest('POST', '/api/messages/bulk', data);
      return await response.json();
    },
    onSuccess: (response) => {
      setBulkMessageText("");
      setSelectedTargetGroup("");
      setBulkDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
      toast({
        title: "Sucesso",
        description: `Mensagem enviada para ${response.recipientCount} usuários!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao enviar mensagem em massa",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && selectedUserId) {
      sendMessageMutation.mutate({
        receiverId: selectedUserId,
        content: messageText.trim(),
      });
    }
  };

  const selectedConversation = conversations.find(
    (conv: any) => conv.otherUserId === selectedUserId
  ) || connectedUsers.find((user: any) => user.id === selectedUserId) || (selectedUserInfo ? {
    otherUserId: selectedUserInfo.id,
    otherUserName: selectedUserInfo.name,
    otherUserProfilePicture: selectedUserInfo.profilePicture,
  } : null);

  // Check if current user is still connected to the selected user
  const isConnectedToSelectedUser = connectedUsers.some((user: any) => user.id === selectedUserId);

  if (!user) {
    return <div>Por favor, faça login para acessar suas mensagens.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mensagens</h1>
        <div className="flex gap-2">
          {user.role === 'institution' && (
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Mensagem em Massa
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Enviar Mensagem em Massa</DialogTitle>
                  <DialogDescription>
                    Envie uma mensagem para grupos específicos de usuários conectados à sua instituição. 
                    Escolha entre todos os conectados ou apenas aqueles com matrículas aprovadas nas cuidotecas.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Destinatários</label>
                    <Select value={selectedTargetGroup} onValueChange={setSelectedTargetGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parents">Todos os Pais Conectados</SelectItem>
                        <SelectItem value="cuidadores">Todos os Cuidadores Conectados</SelectItem>
                        <SelectItem value="all">Todos os Conectados</SelectItem>
                        <SelectItem value="approved-parents">Pais com Filhos Aprovados</SelectItem>
                        <SelectItem value="approved-cuidadores">Cuidadores Aprovados</SelectItem>
                        <SelectItem value="approved-all">Todos os Aprovados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mensagem</label>
                    <Textarea
                      placeholder="Digite sua mensagem..."
                      value={bulkMessageText}
                      onChange={(e) => setBulkMessageText(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => {
                        if (selectedTargetGroup && bulkMessageText.trim()) {
                          sendBulkMessageMutation.mutate({
                            targetGroup: selectedTargetGroup,
                            content: bulkMessageText.trim()
                          });
                        }
                      }}
                      disabled={!selectedTargetGroup || !bulkMessageText.trim() || sendBulkMessageMutation.isPending}
                    >
                      {sendBulkMessageMutation.isPending ? "Enviando..." : "Enviar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={() => setLocation("/")}>
            <Calendar className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Connected Users / Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conexões</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {/* Show all existing conversations, whether users are still connected or not */}
              {conversations.length === 0 && connectedUsers.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <User className="w-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma conexão ainda</p>
                  <p className="text-xs">Conecte-se com outros usuários para começar a conversar</p>
                </div>
              ) : (
                <>
                  {/* Show existing conversations */}
                  {conversations.map((conversation: any) => {
                    const isStillConnected = connectedUsers.some((user: any) => user.id === conversation.otherUserId);
                    
                    return (
                      <div
                        key={`conversation-${conversation.otherUserId}`}
                        className={`p-4 cursor-pointer hover:bg-muted/50 border-b ${
                          selectedUserId === conversation.otherUserId ? "bg-muted" : ""
                        } ${!isStillConnected ? "opacity-75" : ""}`}
                        onClick={() => setSelectedUserId(conversation.otherUserId)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/profile/${conversation.otherUserId}`);
                            }}
                            title="Ver perfil"
                          >
                            {conversation.otherUserProfilePicture ? (
                              <AvatarImage src={conversation.otherUserProfilePicture} />
                            ) : (
                              <AvatarFallback>
                                {conversation.otherUserName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p 
                                className="font-semibold text-sm truncate hover:text-primary cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/profile/${conversation.otherUserId}`);
                                }}
                                title="Ver perfil"
                              >
                                {conversation.otherUserName}
                              </p>
                              {!isStillConnected && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  Desconectado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.lastMessage}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(conversation.lastMessageDate), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Show connected users who don't have conversations yet */}
                  {connectedUsers.map((connectedUser: any) => {
                    // Skip if there's already a conversation with this user
                    const hasExistingConversation = conversations.some(
                      (conv: any) => conv.otherUserId === connectedUser.id
                    );
                    
                    if (hasExistingConversation) return null;
                    
                    return (
                      <div
                        key={connectedUser.id}
                        className={`p-4 cursor-pointer hover:bg-muted/50 border-b ${
                          selectedUserId === connectedUser.id
                            ? "bg-muted"
                            : ""
                        }`}
                        onClick={() => setSelectedUserId(connectedUser.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/profile/${connectedUser.id}`);
                            }}
                            title="Ver perfil"
                          >
                            {connectedUser.profilePicture ? (
                              <AvatarImage src={connectedUser.profilePicture} />
                            ) : (
                              <AvatarFallback>
                                {connectedUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p 
                              className="font-semibold text-sm truncate hover:text-primary cursor-pointer transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/profile/${connectedUser.id}`);
                              }}
                              title="Ver perfil"
                            >
                              {connectedUser.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Clique para conversar • Clique no nome/avatar para ver perfil
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          {selectedUserId ? (
            <>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div 
                    className="flex items-center space-x-3 cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => setLocation(`/profile/${selectedUserId}`)}
                    title="Ver perfil"
                  >
                    <Avatar className="w-8 h-8">
                      {(selectedConversation?.otherUserProfilePicture || selectedConversation?.profilePicture) ? (
                        <AvatarImage src={selectedConversation.otherUserProfilePicture || selectedConversation.profilePicture} />
                      ) : (
                        <AvatarFallback>
                          {selectedConversation?.name ? 
                            selectedConversation.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() :
                            <User className="w-4 h-4" />
                          }
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span>{selectedConversation?.otherUserName || selectedConversation?.name}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-0 flex flex-col h-[500px]">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      Nenhuma mensagem ainda. Inicie a conversa!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message: Message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === user.id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.senderId === user.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {format(new Date(message.createdAt), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t">
                  {isConnectedToSelectedUser ? (
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">
                        Você precisa estar conectado a este usuário para enviar mensagens
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/profile/${selectedUserId}`)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Conectar-se primeiro
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Selecione uma conversa para começar a conversar</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}