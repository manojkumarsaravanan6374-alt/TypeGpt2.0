## TypeGPT

AI-powered chat assistant with Google Gemini, image generation, and Stripe payments.

### Run the project

```bash
npm install
npm run dev
```

Open **http://localhost:5173**

### Setup

1. **Copy env file**: Copy `.dev.vars.example` to `.dev.vars` and add your keys
2. **GEMINI_API_KEY** (required): Get from https://aistudio.google.com/apikey
3. **Google Sign-In** (fixes Error 400: redirect_uri_mismatch):
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Open your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", add **exactly**: `http://localhost:5173/auth/callback`
   - If you use 127.0.0.1, also add: `http://127.0.0.1:5173/auth/callback`
   - Ensure GOOGLE_REDIRECT_URI in .dev.vars matches (e.g. `http://localhost:5173/auth/callback`)
4. **Stripe** (for payments): Add STRIPE_SECRET_KEY to `.dev.vars`

### Google OAuth Error 400?

See **SETUP_GOOGLE_OAUTH.md** for step-by-step fix. Or visit `http://localhost:5173/api/oauth/google/redirect_uri_debug` to see the exact redirect URI to add in Google Console.
