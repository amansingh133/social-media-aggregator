import FacebookService from './FacebookService.js';
import InstagramService from './InstagramService.js';
import { PLATFORMS } from '../../constants/platforms.js';
import ApiError from '../../utils/ApiError.js';

// Adding a new platform (e.g. Twitter/X, TikTok) = one new Service class
// implementing BaseSocialService + one line registered here. Nothing else
// in the app needs to change.
const registry = {
  [PLATFORMS.FACEBOOK]: FacebookService,
  [PLATFORMS.INSTAGRAM]: InstagramService,
};

export default class SocialServiceFactory {
  static create(account) {
    const ServiceClass = registry[account.platform];
    if (!ServiceClass) {
      throw new ApiError(400, `Unsupported platform: ${account.platform}`);
    }
    return new ServiceClass(account);
  }

  static supportedPlatforms() {
    return Object.keys(registry);
  }
}
