import type { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { escapeHtml } from '../sanitize';

// Rate limiters
export const sessionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many chatbot sessions from this IP, please try again later',
});

export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many chatbot messages, slow down and try again',
});

// Validation schemas
const createSessionSchema = z.object({
  categorySlug: z.string().trim().min(1).max(50).optional(),
  sessionId: z.string().trim().min(10).max(128).optional(), // resume support
});

const postMessageSchema = z.object({
  sessionId: z.string().trim().min(10).max(128),
  message: z.string().trim().min(1).max(5000),
});

const confirmSchema = z.object({
  customer_name: z.string().min(1).max(255),
  customer_email: z.string().email(),
  customer_phone: z.string().min(7).max(20),
  customer_zip_code: z.string().min(3).max(10),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  budget_min: z.number().nonnegative().optional(),
  budget_max: z.number().nonnegative().optional(),
  urgency_level: z.enum(['low','medium','high','urgent']).optional(),
  service_area_radius_km: z.number().int().nonnegative().optional(),
  category_id: z.string().uuid().optional(),
  needed_at: z.string().datetime().optional(),
});

class ChatbotController {
  createSession = asyncHandler(async (req: Request, res: Response) => {
    const { categorySlug, sessionId } = createSessionSchema.parse(req.body ?? {});
    const { createChatbotSession, findCategoryIdBySlug, getChatbotSessionByPublicId } = await import('../services/chatbot');

    // Resume if sessionId provided and exists
    if (sessionId) {
      const existing = await getChatbotSessionByPublicId(sessionId);
      if (existing) {
        console.log(`[chatbot] resume session ${existing.session_id}`);
        return res.status(200).json({
          sessionId: existing.session_id,
          phase: existing.phase,
          categoryId: existing.category_id,
          createdAt: existing.created_at,
          resumed: true,
        });
      }
    }

    let categoryId: string | null = null;
    if (categorySlug) {
      categoryId = await findCategoryIdBySlug(categorySlug);
    }

    const created = await createChatbotSession({ categoryId });
    console.log(`[chatbot] created session ${created.session_id}`);
    return res.status(201).json({
      sessionId: created.session_id,
      phase: created.phase,
      categoryId: created.category_id,
      createdAt: created.created_at,
      resumed: false,
    });
  });

  postMessage = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId, message } = postMessageSchema.parse(req.body ?? {});
    const { getChatbotSessionByPublicId, insertChatbotMessage, incrementSessionCounters, getChatbotMessages } = await import('../services/chatbot');
    const { extractLeadFieldsViaLLM } = await import('../services/llm');

    const session = await getChatbotSessionByPublicId(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    // Record user message
    await insertChatbotMessage({ sessionRowId: session.id, role: 'user', content: message });
    await incrementSessionCounters(session.id, { user: 1 });
    console.log(`[chatbot] user message in ${session.session_id}`);

    // Get conversation history for context
    const history = await getChatbotMessages(session.id);
    const historyFormatted = history
      .filter(msg => msg.role !== 'system')
      .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }));

    // Extract fields and craft assistant reply (LLM or stub)
    const { assistantMessage, extractedFields, confidence } = await extractLeadFieldsViaLLM(message, { 
      history: historyFormatted 
    });

    await insertChatbotMessage({ sessionRowId: session.id, role: 'assistant', content: assistantMessage, extractedFields });
    await incrementSessionCounters(session.id, { assistant: 1 });
    console.log(`[chatbot] assistant reply in ${session.session_id}`, { extractedFields, confidence });

    return res.status(200).json({
      assistantMessage,
      extractedFields,
      extractionConfidence: confidence,
      phase: session.phase, // remains same for stub
    });
  });

  confirmSession = asyncHandler(async (req: Request, res: Response) => {
    const body = confirmSchema.parse(req.body ?? {});
    const { sessionId } = req.params;
    const { getChatbotSessionByPublicId } = await import('../services/chatbot');
    const session = await getChatbotSessionByPublicId(sessionId);
    
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    const { db } = await import('../db');
    const { sql } = await import('drizzle-orm');
    const { sendLeadConfirmationEmail } = await import('../services/email-service');

    // 1) Upsert user by email
    const userResult = await db.execute(sql<{ id: string }>`
      WITH existing AS (
        SELECT id FROM users WHERE email = ${body.customer_email} LIMIT 1
      ), inserted AS (
        INSERT INTO users (email, name, phone, created_at, updated_at)
        SELECT ${body.customer_email}, ${body.customer_name}, ${body.customer_phone}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM existing)
        RETURNING id
      )
      SELECT id FROM inserted
      UNION ALL
      SELECT id FROM existing
      LIMIT 1;
    `);
    // @ts-ignore
    const userId = ((userResult as any).rows?.[0] || (userResult as any)[0])?.id as string;

    // 2) Create lead
    const leadResult = await db.execute(sql<{ id: string }>`
      INSERT INTO leads (
        category_id, title, description, customer_name, customer_email, customer_phone,
        customer_zip_code, budget_min, budget_max, urgency_level, service_area_radius_km,
        lead_source, base_lead_cost, status, bidding_closes_at, metadata, is_qualified,
        chatbot_session_id, original_conversation, extraction_confidence, needed_at
      ) VALUES (
        ${body.category_id ?? session.category_id},
        ${body.title},
        ${body.description},
        ${body.customer_name},
        ${body.customer_email},
        ${body.customer_phone},
        ${body.customer_zip_code},
        ${body.budget_min ?? null},
        ${body.budget_max ?? null},
        ${body.urgency_level ?? 'medium'},
        ${body.service_area_radius_km ?? null},
        'chatbot',
        0.00,
        'CREATED',
        NULL,
        NULL,
        TRUE,
        ${session.id}::uuid,
        NULL,
        0.5,
        ${body.needed_at ?? null}
      )
      RETURNING id;
    `);
    // @ts-ignore
    const leadId = ((leadResult as any).rows?.[0] || (leadResult as any)[0])?.id as string;

    // 3) Update session linkage and phase
    await db.execute(sql`UPDATE chatbot_sessions SET created_lead_id = ${leadId}, phase = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ${session.id}::uuid`);

    // 4) Send confirmation email (best-effort)
    try {
      // Sanitize user input to prevent XSS attacks
      const safeTitle = escapeHtml(body.title);
      const safeDescription = escapeHtml(body.description);
      const safeZip = escapeHtml(body.customer_zip_code);
      
      const summaryHtml = `
        <ul style="margin:0; padding-left:16px;">
          <li><strong>Title:</strong> ${safeTitle}</li>
          <li><strong>Description:</strong> ${safeDescription}</li>
          <li><strong>ZIP:</strong> ${safeZip}</li>
        </ul>`;
      const url = `${process.env.APP_DOMAIN || 'http://localhost:3000'}/verify-email`;
      await sendLeadConfirmationEmail({ 
        email: body.customer_email, 
        customerName: body.customer_name, 
        summaryHtml, 
        confirmationUrl: url 
      });
    } catch (e) {
      // non-fatal
      console.warn('sendLeadConfirmationEmail failed:', e);
    }

    return res.status(201).json({ leadId });
  });
}

const controller = new ChatbotController();
export const { createSession, postMessage, confirmSession } = controller;

