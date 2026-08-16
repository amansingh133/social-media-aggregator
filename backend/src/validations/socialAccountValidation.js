import Joi from 'joi';
import { PLATFORM_LIST } from '../constants/platforms.js';

export const createAccountSchema = Joi.object({
  platform: Joi.string()
    .valid(...PLATFORM_LIST)
    .required(),
  displayName: Joi.string().allow('', null),
  accessToken: Joi.string().required(),
  tokenExpiresAt: Joi.date().allow(null),
  pageId: Joi.string().when('platform', {
    is: 'facebook',
    then: Joi.required(),
  }),
  igUserId: Joi.string().when('platform', {
    is: 'instagram',
    then: Joi.required(),
  }),
});
