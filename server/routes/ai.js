import { Router } from 'express';
import { callAIService, getAIConfig } from '../services/aiService.js';

const router = Router();

const sendResult = async (req, res, endpoint) => {
  const { prompt, context } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'A prompt string is required.',
      },
    });
  }

  const result = await callAIService({ endpoint, prompt, context: context || {} });
  const status = result.success
    ? 200
    : ['GEMINI_NOT_CONFIGURED', 'GEMINI_TIMEOUT', 'GEMINI_NETWORK_ERROR'].includes(result.error?.code)
      ? 503
      : 502;
  return res.status(status).json(result);
};

router.get('/health', (req, res) => {
  const { model, configured } = getAIConfig();
  res.json({
    success: true,
    status: 'ok',
    app: 'StudentOS API',
    mode: configured ? 'gemini' : 'setup-required',
    provider: 'Gemini',
    model,
  });
});

router.post('/ai/chat', async (req, res) => sendResult(req, res, 'chat'));
router.post('/ai/planner', async (req, res) => sendResult(req, res, 'planner'));
router.post('/ai/study-coach', async (req, res) => sendResult(req, res, 'study-coach'));
router.post('/ai/assignment', async (req, res) => sendResult(req, res, 'assignment'));
router.post('/ai/summary', async (req, res) => sendResult(req, res, 'summary'));
router.post('/ai/analyze', async (req, res) => sendResult(req, res, 'analyze'));

export default router;
