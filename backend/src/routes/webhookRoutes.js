import { Router } from 'express';
import { verifyWebhook, receiveWebhookEvent } from '../webhooks/facebookWebhookController.js';

const router = Router();

// Meta calls this once when you register the callback URL in the App Dashboard
router.get('/facebook', verifyWebhook);
// Meta calls this every time a subscribed event (e.g. a Page mention) happens
router.post('/facebook', receiveWebhookEvent);

export default router;
