import { Router } from 'express';
import { conversationService } from '../services/conversation';

const router = Router();

/**
 * POST /api/conversations/start
 * Start a new conversation for proposal requirements gathering
 */
router.post('/start', async (req, res, next) => {
  try {
    const { templateId } = req.body;

    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    const result = await conversationService.startConversation(templateId);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/conversations/:id/chat
 * Send a message in the conversation
 */
router.post('/:id/chat', async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await conversationService.chat(conversationId, message);

    res.json({
      success: true,
      conversationId,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/conversations/:id
 * Get conversation state
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id: conversationId } = req.params;

    const conversation = await conversationService.getConversation(conversationId);

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
