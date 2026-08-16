import dotenv from "dotenv";

dotenv.config();

const get = (name, fallback = undefined) => process.env[name] ?? fallback;

export const env = {
  nodeEnv: get("NODE_ENV", "development"),
  port: Number(get("PORT", 5000)),
  clientUrl: get("CLIENT_URL", "http://localhost:5173"),
  mongo: {
    uri: get("MONGODB_URI"),
  },
  facebook: {
    appId: get("FACEBOOK_APP_ID"),
    appSecret: get("FACEBOOK_APP_SECRET"),
    graphVersion: get("FACEBOOK_GRAPH_API_VERSION", "v19.0"),
    // Arbitrary string YOU choose - entered in both this .env file and
    // the Meta App Dashboard's Webhooks setup screen, so Meta can prove
    // it's really them calling your verification endpoint.
    webhookVerifyToken: get("FACEBOOK_WEBHOOK_VERIFY_TOKEN"),
  },
  instagram: {
    graphVersion: get("INSTAGRAM_GRAPH_API_VERSION", "v26.0"),
  },
  graphApi: {
    fbPageAccessToken: get("GRAPH_API_FACEBOOK_PAGE_ACCESS_TOKEN"),
    fbPageId: get("GRAPH_API_FACEBOOK_PAGE_ID"),
    igBusinessAccountId: get("GRAPH_API_IG_BUSINESS_ACCOUNT_ID"),
  },
};
