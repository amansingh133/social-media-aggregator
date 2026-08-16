import InstagramHashtagListener from './InstagramHashtagListener.js';
import { PLATFORMS } from '../../constants/platforms.js';
import ApiError from '../../utils/ApiError.js';

// Facebook is intentionally NOT registered here. There is no public,
// pollable "search Facebook by keyword/hashtag" API available to normal
// developers - Facebook leads only arrive via the webhook flow in
// webhooks/facebookWebhookController.js, which pushes directly into
// LeadService.recordFacebookMention() instead of going through a listener.
const registry = {
  [PLATFORMS.INSTAGRAM]: InstagramHashtagListener,
};

export default class ListenerServiceFactory {
  static create(account) {
    const ListenerClass = registry[account.platform];
    if (!ListenerClass) {
      throw new ApiError(
        400,
        `No pollable listening service for platform: ${account.platform}. ` +
          `(Facebook leads arrive via webhook, not polling - see webhooks/.)`
      );
    }
    return new ListenerClass(account);
  }

  static supportedPlatforms() {
    return Object.keys(registry);
  }
}
