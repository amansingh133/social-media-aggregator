import crypto from 'crypto';
import asyncHandler from '../middlewares/asyncHandler.js';
import logger from '../utils/logger.js';
import LeadService from '../services/LeadService.js';
import { env } from '../config/env.js';

/**
 * Facebook webhooks work in two parts:
 *
 * 1. GET  - the one-time "handshake" Meta sends when you register the
 *    webhook URL in the App Dashboard. You must echo back `hub.challenge`
 *    ONLY if `hub.verify_token` matches the secret you configured on
 *    both sides. This proves you control the endpoint.
 *
 * 2. POST - the actual events. Meta pushes a JSON payload every time a
 *    subscribed event happens (here: your Page being mentioned). This
 *    is fire-and-forget from Meta's side - if your server is down, the
 *    event is retried a few times, then dropped.
 *
 * NOTE: Getting the `mention` webhook field approved requires Meta App
 * Review for your app - it is not available by default. This code is
 * correct and ready, but Meta's review process is a real prerequisite
 * before this will receive live events.
 */

export const verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === env.facebook.webhookVerifyToken) {
    logger.info('Facebook webhook verified successfully');
    return res.status(200).send(challenge);
  }

  logger.warn('Facebook webhook verification failed - token mismatch');
  return res.sendStatus(403);
};

/**
 * Confirms the payload was really sent by Meta (not spoofed) by
 * recomputing the HMAC-SHA256 signature Meta attaches in the
 * `x-hub-signature-256` header, using your App Secret.
 */
function isValidSignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  if (!signature || !env.facebook.appSecret) return false;

  const expected = `sha256=${crypto
    .createHmac('sha256', env.facebook.appSecret)
    .update(req.rawBody || '')
    .digest('hex')}`;

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export const receiveWebhookEvent = asyncHandler(async (req, res) => {
  if (!isValidSignature(req)) {
    logger.warn('Facebook webhook signature verification failed');
    return res.sendStatus(403);
  }

  // Always ack immediately - Meta expects a fast 200. Process after responding.
  res.sendStatus(200);

  const entries = req.body?.entry ?? [];
  for (const entry of entries) {
    const changes = entry.changes ?? [];
    for (const change of changes) {
      if (change.field === 'mention') {
        // eslint-disable-next-line no-await-in-loop
        await LeadService.recordFacebookMention({
          postId: change.value?.post_id,
          commentId: change.value?.comment_id,
          senderName: change.value?.sender_name,
          message: change.value?.message,
          link: change.value?.link,
        }).catch((err) => logger.error(`Failed to record Facebook mention lead: ${err.message}`));
      }
    }
  }

  return undefined;
});
