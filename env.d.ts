interface Env {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL?: string;
  MOCHA_USERS_SERVICE_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GEMINI_API_KEY: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  R2_BUCKET: R2Bucket;
  CLIENT_URL?: string;
  GOOGLE_REDIRECT_URI?: string;
}
