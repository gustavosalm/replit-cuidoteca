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
import { Send, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import type { Message } from "@shared/schema";

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");

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
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      return response.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/conversations"] });
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
  ) || (selectedUserInfo ? {
    otherUserId: selectedUserInfo.id,
    otherUserName: selectedUserInfo.name,
    otherUserProfilePicture: selectedUserInfo.profilePicture,
  } : null);

  if (!user) {
    return <div>Por favor, faça login para acessar suas mensagens.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mensagens</h1>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <Calendar className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nenhuma conversa ainda
                </div>
              ) : (
                conversations.map((conversation: any) => (
                  <div
                    key={conversation.otherUserId}
                    className={`p-4 cursor-pointer hover:bg-muted/50 border-b ${
                      selectedUserId === conversation.otherUserId
                        ? "bg-muted"
                        : ""
                    }`}
                    onClick={() => setSelectedUserId(conversation.otherUserId)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        {conversation.otherUserProfilePicture ? (
                          <AvatarImage src={conversation.otherUserProfilePicture} />
                        ) : (
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {conversation.otherUserName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(conversation.lastMessageDate), "HH:mm")}
                      </div>
                    </div>
                  </div>
                ))
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
                  <Avatar className="w-8 h-8">
                    {selectedConversation?.otherUserProfilePicture ? (
                      <AvatarImage src={selectedConversation.otherUserProfilePicture} />
                    ) : (
                      <AvatarFallback>
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span>{selectedConversation?.otherUserName}</span>
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