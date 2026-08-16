import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import webhookRoutes from './routes/webhookRoutes.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';
import { env } from './config/env.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
// `verify` stashes the exact raw bytes Meta sent on req.rawBody, before
// Express parses them into req.body. The Facebook webhook signature check
// (webhooks/facebookWebhookController.js) needs those exact original bytes -
// re-serializing the parsed JSON would not reliably reproduce Meta's signature.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// Lives OUTSIDE /api/v1 on purpose - this is the exact callback URL you
// paste into the Meta App Dashboard's Webhooks product, so it needs a
// stable, dashboard-friendly path rather than our REST API's versioning.
app.use('/webhooks', webhookRoutes);

app.use('/api/v1', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
