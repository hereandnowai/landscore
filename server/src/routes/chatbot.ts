import { Router, Request, Response } from 'express';
import { ChatbotService } from '../services/chatbotService.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/errorHandler.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { chatRequestSchema } from '../validation/schemas.js';

const router = Router();

/**
 * POST /api/chatbot
 * Send a message to the AI chatbot
 */
router.post(
  '/',
  optionalAuth,
  validate(chatRequestSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const result = await ChatbotService.chat(req.body, userId);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/chatbot/sessions
 * Get user's chat sessions
 */
router.get(
  '/sessions',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const sessions = await ChatbotService.getUserSessions(req.user!.userId);

    res.json({
      success: true,
      data: sessions,
    });
  })
);

/**
 * GET /api/chatbot/sessions/:sessionId
 * Get chat history for a session
 */
router.get(
  '/sessions/:sessionId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const messages = await ChatbotService.getChatHistory(sessionId);

    res.json({
      success: true,
      data: messages,
    });
  })
);

/**
 * DELETE /api/chatbot/sessions/:sessionId
 * Delete a chat session
 */
router.delete(
  '/sessions/:sessionId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    
    try {
      await ChatbotService.deleteSession(sessionId, req.user!.userId);
      res.json({
        success: true,
        message: 'Session deleted',
      });
    } catch (error) {
      throw ApiError.notFound('Session not found');
    }
  })
);

export default router;
