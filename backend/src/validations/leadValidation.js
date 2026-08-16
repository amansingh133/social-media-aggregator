import Joi from 'joi';
import { LEAD_STATUSES } from '../models/Lead.js';

export const updateLeadStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(LEAD_STATUSES))
    .required(),
});

export const watchHashtagSchema = Joi.object({
  tag: Joi.string().trim().min(1).max(100).required(),
});
