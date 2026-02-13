# Fix Google Sign-In: Error 400 redirect_uri_mismatch

## Step-by-step fix

1. **Open the debug URL** (while dev server is running):
   ```
   http://localhost:5173/api/oauth/google/redirect_uri_debug
   ```
   Copy the `redirectUri` value shown (e.g. `http://localhost:5173/auth/callback`).

2. **Go to Google Cloud Console**:
   - https://console.cloud.google.com/apis/credentials
   - Sign in with your Google account

3. **Edit your OAuth 2.0 Client ID**:
   - Under "OAuth 2.0 Client IDs", click your Web application client
   - Or create one: Application type = "Web application"

4. **Add Authorized redirect URIs**:
   - Under "Authorized redirect URIs", click "ADD URI"
   - Paste the EXACT value from step 1: `http://localhost:5173/auth/callback`
   - If you use 127.0.0.1, also add: `http://127.0.0.1:5173/auth/callback`
   - Click SAVE

5. **Ensure .dev.vars has**:
   ```
   GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
   ```
   (Must match what you added in Google Console - no trailing slash, exact same)

6. **Restart the dev server** and try Sign in with Google again.
