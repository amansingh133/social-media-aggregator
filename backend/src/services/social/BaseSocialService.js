/**
 * Abstract base class for all social media services.
 *
 * Every platform-specific service (Facebook, Instagram, and any future
 * platform) MUST extend this class and implement `fetchRawPosts` and
 * `normalizePost`. Doing so keeps the public contract used by PostService
 * identical across platforms, so adding a new platform never requires
 * touching PostService, the controllers, or the routes layer -- only:
 *   1. A new XyzService.js implementing this interface
 *   2. One extra line in SocialServiceFactory's registry
 */
export default class BaseSocialService {
  constructor(account) {
    if (new.target === BaseSocialService) {
      throw new Error('BaseSocialService is abstract and cannot be instantiated directly');
    }
    this.account = account; // SocialAccount mongoose document
  }

  /**
   * Must be implemented by subclasses.
   * Calls the platform API and returns an array of RAW post objects.
   */
  // eslint-disable-next-line class-methods-use-this
  async fetchRawPosts() {
    throw new Error('fetchRawPosts() must be implemented by subclass');
  }

  /**
   * Must be implemented by subclasses.
   * Transforms ONE raw platform post into our unified Post shape
   * (see models/Post.js for the target shape).
   */
  // eslint-disable-next-line class-methods-use-this
  normalizePost(rawPost) {
    throw new Error('normalizePost() must be implemented by subclass');
  }

  /**
   * Public entry point used by PostService. Not meant to be overridden --
   * subclasses only need to implement the two methods above.
   */
  async getNormalizedPosts(options) {
    const rawPosts = await this.fetchRawPosts(options);
    return rawPosts.map((raw) => this.normalizePost(raw));
  }
}
