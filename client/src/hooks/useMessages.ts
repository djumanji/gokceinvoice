import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useSocket } from './useSocket';
import { useEffect } from 'react';

export interface Conversation {
  id: number;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  participants: Array<{
    id: string;
    name: string;
    email: string;
    companyName: string | null;
  }>;
  last_message: {
    id: number;
    content: string;
    sender_id: string;
    created_at: string;
    attachment_url: string | null;
    attachment_type: string | null;
  } | null;
  unread_count: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  attachment_url: string | null;
  attachment_type: string | null;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  read_receipts: Array<{
    userId: string;
    readAt: string;
  }>;
}

// Hook to get all conversations
export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['/api/messages/conversations'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/messages/conversations');
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Hook to get messages for a conversation
export function useConversationMessages(conversationId: number | null) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Subscribe to real-time messages for this conversation
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join the conversation room
    socket.emit('conversation:join', conversationId);

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      if (message.conversation_id === conversationId) {
        queryClient.setQueryData<Message[]>(
          ['/api/messages/conversations', conversationId, 'messages'],
          (old) => [...(old || []), message]
        );

        // Update conversations list
        queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      }
    };

    socket.on('message:receive', handleNewMessage);

    // Cleanup
    return () => {
      socket.off('message:receive', handleNewMessage);
      socket.emit('conversation:leave', conversationId);
    };
  }, [socket, conversationId, queryClient]);

  return useQuery<Message[]>({
    queryKey: ['/api/messages/conversations', conversationId, 'messages'],
    queryFn: async () => {
      if (!conversationId) return [];
      return await apiRequest('GET', `/api/messages/conversations/${conversationId}/messages`);
    },
    enabled: !!conversationId,
  });
}

// Hook to send a message
export function useSendMessage(conversationId: number) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      content: string;
      attachmentUrl?: string;
      attachmentType?: string;
    }) => {
      if (socket && socket.connected) {
        // Send via Socket.IO for real-time delivery
        socket.emit('message:send', {
          conversationId,
          ...data,
        });
        return { success: true };
      } else {
        // Fallback to REST API
        return await apiRequest('POST', `/api/messages/conversations/${conversationId}/messages`, data);
      }
    },
    onSuccess: () => {
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    },
  });
}

// Hook to create a new conversation
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantIds: string[]) => {
      return await apiRequest('POST', '/api/messages/conversations', { participantIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    },
  });
}

// Hook to mark conversation as read
export function useMarkConversationRead(conversationId: number) {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageIds: number[]) => {
      if (socket && socket.connected && messageIds.length > 0) {
        socket.emit('messages:read', { conversationId, messageIds });
      }
      return await apiRequest('PATCH', `/api/messages/conversations/${conversationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    },
  });
}

// Hook for typing indicator
export function useTypingIndicator(conversationId: number | null) {
  const { socket } = useSocket();

  const setTyping = (isTyping: boolean) => {
    if (socket && conversationId) {
      socket.emit('message:typing', { conversationId, isTyping });
    }
  };

  return { setTyping };
}
