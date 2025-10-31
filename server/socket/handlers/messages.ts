import { Server as SocketIOServer, Socket } from 'socket.io';
import { db } from '../../db';

export function registerMessageHandlers(io: SocketIOServer, socket: Socket) {
  const userId = socket.data.userId;

  // Join a conversation room
  socket.on('conversation:join', async (conversationId: number) => {
    try {
      // Verify user is participant in conversation
      const result = await db.query(
        `SELECT 1 FROM conversation_participants
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      if (result.rows.length === 0) {
        socket.emit('error', { message: 'Not authorized to join this conversation' });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      console.log(`[Socket.IO] User ${userId} joined conversation ${conversationId}`);
    } catch (error) {
      console.error('[Socket.IO] Error joining conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  });

  // Leave a conversation room
  socket.on('conversation:leave', (conversationId: number) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`[Socket.IO] User ${userId} left conversation ${conversationId}`);
  });

  // Send a message
  socket.on('message:send', async (data: {
    conversationId: number;
    content: string;
    attachmentUrl?: string;
    attachmentType?: string;
  }) => {
    try {
      const { conversationId, content, attachmentUrl, attachmentType } = data;

      // Verify user is participant
      const participantCheck = await db.query(
        `SELECT 1 FROM conversation_participants
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      if (participantCheck.rows.length === 0) {
        socket.emit('error', { message: 'Not authorized to send messages in this conversation' });
        return;
      }

      // Insert message
      const result = await db.query(
        `INSERT INTO messages (conversation_id, sender_id, content, attachment_url, attachment_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [conversationId, userId, content, attachmentUrl, attachmentType]
      );

      const message = result.rows[0];

      // Emit to all participants in the conversation room
      io.to(`conversation:${conversationId}`).emit('message:receive', {
        ...message,
        sender_id: userId,
      });

      console.log(`[Socket.IO] Message sent in conversation ${conversationId}`);
    } catch (error) {
      console.error('[Socket.IO] Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('message:typing', (data: { conversationId: number; isTyping: boolean }) => {
    const { conversationId, isTyping } = data;

    // Broadcast to others in the conversation (exclude sender)
    socket.to(`conversation:${conversationId}`).emit('user:typing', {
      userId,
      conversationId,
      isTyping,
    });
  });

  // Mark messages as read
  socket.on('messages:read', async (data: { conversationId: number; messageIds: number[] }) => {
    try {
      const { conversationId, messageIds } = data;

      // Insert read receipts
      for (const messageId of messageIds) {
        await db.query(
          `INSERT INTO message_read_receipts (message_id, user_id)
           VALUES ($1, $2)
           ON CONFLICT (message_id, user_id) DO NOTHING`,
          [messageId, userId]
        );
      }

      // Update last_read_at for participant
      await db.query(
        `UPDATE conversation_participants
         SET last_read_at = CURRENT_TIMESTAMP
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      // Notify other participants about read receipts
      socket.to(`conversation:${conversationId}`).emit('messages:read', {
        userId,
        conversationId,
        messageIds,
      });

      console.log(`[Socket.IO] User ${userId} read ${messageIds.length} messages in conversation ${conversationId}`);
    } catch (error) {
      console.error('[Socket.IO] Error marking messages as read:', error);
      socket.emit('error', { message: 'Failed to mark messages as read' });
    }
  });
}
