import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Send, Loader2 } from "lucide-react";
import {
  useConversations,
  useConversationMessages,
  useSendMessage,
  useMarkConversationRead,
  type Conversation,
  type Message,
} from "@/hooks/useMessages";
import { useSocket } from "@/hooks/useSocket";

export default function Messages() {
  const { t } = useTranslation();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { socket, isConnected } = useSocket();
  const { data: conversations = [], isLoading: conversationsLoading } = useConversations();
  const { data: messages = [], isLoading: messagesLoading } = useConversationMessages(selectedConversationId);
  const sendMessageMutation = useSendMessage(selectedConversationId || 0);
  const markReadMutation = useMarkConversationRead(selectedConversationId || 0);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversationId && selectedConversation && selectedConversation.unread_count > 0) {
      const unreadMessageIds = messages
        .filter(m => m.sender_id !== selectedConversation.participants[0]?.id)
        .map(m => m.id);

      if (unreadMessageIds.length > 0) {
        markReadMutation.mutate(unreadMessageIds);
      }
    }
  }, [selectedConversationId, messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversationId) return;

    try {
      await sendMessageMutation.mutateAsync({
        content: messageInput.trim(),
      });
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const participant = conv.participants[0];
    return (
      participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      participant?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">Communicate with customers and contractors</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ScrollArea className="h-[500px] pr-4">
              {conversationsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed border-muted-foreground/25">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground text-sm">
                      {searchQuery ? "No conversations found" : "No conversations yet"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredConversations.map((conversation) => {
                    const participant = conversation.participants[0];
                    const isSelected = conversation.id === selectedConversationId;

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversationId(conversation.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{getInitials(participant?.name || "?")}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold truncate">
                                {participant?.name || "Unknown"}
                              </p>
                              {conversation.unread_count > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                            {conversation.last_message && (
                              <p className="text-sm truncate opacity-80">
                                {conversation.last_message.content}
                              </p>
                            )}
                            {conversation.last_message_at && (
                              <p className="text-xs opacity-60 mt-1">
                                {format(new Date(conversation.last_message_at), "MMM d, h:mm a")}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Messages View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedConversation
                ? selectedConversation.participants[0]?.name || "Unknown"
                : "Messages"}
            </CardTitle>
            <CardDescription>
              {selectedConversation
                ? selectedConversation.participants[0]?.email
                : "Select a conversation to start messaging"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedConversationId ? (
              <div className="flex items-center justify-center h-96 rounded-lg border-2 border-dashed border-muted-foreground/25">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    Select a conversation to view messages
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-[500px]">
                {/* Messages Area */}
                <ScrollArea className="flex-1 pr-4 mb-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground text-sm">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwnMessage = message.sender_id === selectedConversation?.participants[0]?.id;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[70%] ${isOwnMessage ? "order-2" : "order-1"}`}>
                              <div
                                className={`rounded-lg p-3 ${
                                  isOwnMessage
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 px-1">
                                {format(new Date(message.created_at), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    size="icon"
                  >
                    {sendMessageMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



