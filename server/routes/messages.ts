import { Router, Request, Response } from 'express';
import { pg } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

// Get all conversations for the current user
router.get('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;

    const result = await pg(
      `SELECT
        c.id,
        c.created_at,
        c.updated_at,
        c.last_message_at,
        json_agg(
          json_build_object(
            'id', u.id,
            'name', u.name,
            'email', u.email,
            'companyName', u.company_name
          )
        ) FILTER (WHERE u.id != $1) as participants,
        (
          SELECT json_build_object(
            'id', m.id,
            'content', m.content,
            'sender_id', m.sender_id,
            'created_at', m.created_at,
            'attachment_url', m.attachment_url,
            'attachment_type', m.attachment_type
          )
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message,
        (
          SELECT COUNT(*)::int
          FROM messages m
          LEFT JOIN message_read_receipts mrr ON mrr.message_id = m.id AND mrr.user_id = $1
          WHERE m.conversation_id = c.id
            AND m.sender_id != $1
            AND mrr.id IS NULL
        ) as unread_count
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id
      JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
      JOIN users u ON u.id = cp2.user_id
      WHERE cp.user_id = $1
      GROUP BY c.id, c.created_at, c.updated_at, c.last_message_at
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
      [userId]
    );

    res.json(result);
  } catch (error) {
    console.error('[Messages API] Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const conversationId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before ? parseInt(req.query.before as string) : null;

    // Verify user is participant
    const participantCheck = await pg(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    if (participantCheck.length === 0) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    // Build query with optional pagination
    let query = `
      SELECT
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.created_at,
        m.updated_at,
        m.is_edited,
        m.attachment_url,
        m.attachment_type,
        json_build_object(
          'id', u.id,
          'name', u.name,
          'email', u.email
        ) as sender,
        COALESCE(
          json_agg(
            json_build_object(
              'userId', mrr.user_id,
              'readAt', mrr.read_at
            )
          ) FILTER (WHERE mrr.id IS NOT NULL),
          '[]'::json
        ) as read_receipts
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN message_read_receipts mrr ON mrr.message_id = m.id
      WHERE m.conversation_id = $1
    `;

    const params: any[] = [conversationId];
    let paramIndex = 2;

    if (before) {
      query += ` AND m.id < $${paramIndex}`;
      params.push(before);
      paramIndex++;
    }

    query += ` GROUP BY m.id, u.id, u.name, u.email
               ORDER BY m.created_at DESC
               LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await pg(query, params);

    // Return messages in chronological order (oldest first)
    res.json(result.reverse());
  } catch (error) {
    console.error('[Messages API] Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a new conversation
router.post('/conversations', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: 'participantIds is required and must be a non-empty array' });
    }

    // Check if conversation already exists between these users
    const allParticipants = [...new Set([userId, ...participantIds])];

    const existingConversation = await pg(
      `SELECT c.id
       FROM conversations c
       WHERE (
         SELECT COUNT(DISTINCT user_id)
         FROM conversation_participants
         WHERE conversation_id = c.id
           AND user_id = ANY($1::varchar[])
       ) = $2
       AND (
         SELECT COUNT(*)
         FROM conversation_participants
         WHERE conversation_id = c.id
       ) = $2
       LIMIT 1`,
      [allParticipants, allParticipants.length]
    );

    if (existingConversation.length > 0) {
      return res.json({ id: existingConversation[0].id, exists: true });
    }

    // Create new conversation
    const conversationResult = await pg(
      'INSERT INTO conversations DEFAULT VALUES RETURNING *'
    );
    const conversation = conversationResult[0];

    // Add participants
    for (const participantId of allParticipants) {
      await pg(
        'INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2)',
        [conversation.id, participantId]
      );
    }

    res.status(201).json({ id: conversation.id, exists: false });
  } catch (error) {
    console.error('[Messages API] Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Send a message (REST fallback, Socket.IO is preferred)
router.post('/conversations/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const conversationId = parseInt(req.params.id);
    const { content, attachmentUrl, attachmentType } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Verify user is participant
    const participantCheck = await pg(
      `SELECT 1 FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    if (participantCheck.length === 0) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
    }

    // Insert message
    const result = await pg(
      `INSERT INTO messages (conversation_id, sender_id, content, attachment_url, attachment_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [conversationId, userId, content, attachmentUrl, attachmentType]
    );

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('[Messages API] Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark messages as read
router.patch('/conversations/:id/read', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const conversationId = parseInt(req.params.id);

    // Update last_read_at
    await pg(
      `UPDATE conversation_participants
       SET last_read_at = CURRENT_TIMESTAMP
       WHERE conversation_id = $1 AND user_id = $2`,
      [conversationId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('[Messages API] Error marking conversation as read:', error);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

export default router;
