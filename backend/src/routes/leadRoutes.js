import { Router } from 'express';
import {
  getLeads,
  updateLeadStatus,
  addWatchedHashtag,
  listWatchedHashtags,
  runHashtagSweep,
} from '../controllers/leadController.js';
import validateRequest from '../middlewares/validateRequest.js';
import { updateLeadStatusSchema, watchHashtagSchema } from '../validations/leadValidation.js';

const router = Router();

// Reading / triaging captured leads (source-agnostic: hashtag OR mention)
router.get('/', getLeads);
router.patch('/:id/status', validateRequest(updateLeadStatusSchema), updateLeadStatus);

// Instagram hashtag watch list + manual sweep trigger (poll-based)
router.get('/watched-hashtags/:accountId', listWatchedHashtags);
router.post(
  '/watched-hashtags/:accountId',
  validateRequest(watchHashtagSchema),
  addWatchedHashtag
);
router.post('/sweep/:accountId', runHashtagSweep);

export default router;
