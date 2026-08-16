/**
 * Abstract base for "listening" services - platforms that let you POLL
 * for public content matching a hashtag/keyword (as opposed to platforms
 * that only PUSH events to you, like Facebook mentions via webhook - see
 * webhooks/facebookWebhookController.js for that pattern instead).
 *
 * Mirrors services/social/BaseSocialService.js on purpose: same shape,
 * different contract (search by term, not fetch by account).
 */
export default class BaseListenerService {
  constructor(account) {
    if (new.target === BaseListenerService) {
      throw new Error('BaseListenerService is abstract and cannot be instantiated directly');
    }
    this.account = account; // SocialAccount mongoose document
  }

  /**
   * Must be implemented by subclasses. Calls the platform's search API
   * for a given term and returns an array of RAW result objects.
   */
  // eslint-disable-next-line class-methods-use-this, no-unused-vars
  async searchRaw(term) {
    throw new Error('searchRaw() must be implemented by subclass');
  }

  /**
   * Must be implemented by subclasses. Transforms ONE raw result into
   * our unified Lead shape (see models/Lead.js).
   */
  // eslint-disable-next-line class-methods-use-this
  normalizeLead(raw, term) {
    throw new Error('normalizeLead() must be implemented by subclass');
  }

  /**
   * Public entry point used by LeadService. Not meant to be overridden.
   */
  async getLeadsForTerm(term) {
    const rawResults = await this.searchRaw(term);
    return rawResults.map((raw) => this.normalizeLead(raw, term));
  }
}
