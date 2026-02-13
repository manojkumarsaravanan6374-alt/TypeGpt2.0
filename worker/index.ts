import { Hono } from "hono";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware as mochaAuthMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { GoogleGenAI } from "@google/genai";
import { streamSSE } from "hono/streaming";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import { createMiddleware } from "hono/factory";

const EMAIL_SESSION_COOKIE = "typegpt_session";

const app = new Hono<{ Bindings: Env }>();

// Combined auth: try email session first, then Mocha OAuth
const authMiddleware = createMiddleware<{ Bindings: Env; Variables: { user: { id: string; email: string } } }>(
  async (c, next) => {
    const emailToken = getCookie(c, EMAIL_SESSION_COOKIE);
    if (emailToken) {
      const session = await c.env.DB.prepare(
        "SELECT s.user_id, u.email FROM auth_sessions s JOIN auth_users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > ?"
      )
        .bind(emailToken, Math.floor(Date.now() / 1000))
        .first();
      if (session) {
        c.set("user", { id: (session as any).user_id, email: (session as any).email });
        return next();
      }
    }
    if (c.env.MOCHA_USERS_SERVICE_API_URL && c.env.MOCHA_USERS_SERVICE_API_KEY) {
      return mochaAuthMiddleware(c, next);
    }
    return c.json({ error: "Unauthorized" }, 401);
  }
);

// Email/password sign up
app.post("/api/auth/register", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    if (!email || !password) {
      return c.json({ error: "Email and password required" }, 400);
    }
    const emailLower = String(email).toLowerCase().trim();
    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }
    const existing = await c.env.DB.prepare("SELECT id FROM auth_users WHERE email = ?").bind(emailLower).first();
    if (existing) {
      return c.json({ error: "Email already registered" }, 400);
    }
    const userId = "ep-" + crypto.randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    await c.env.DB.prepare("INSERT INTO auth_users (id, email, password_hash) VALUES (?, ?, ?)")
      .bind(userId, emailLower, passwordHash)
      .run();
    const token = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60; // 60 days
    await c.env.DB.prepare("INSERT INTO auth_sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
      .bind(token, userId, expiresAt)
      .run();
    setCookie(c, EMAIL_SESSION_COOKIE, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: c.req.url.startsWith("https"),
      maxAge: 60 * 24 * 60 * 60,
    });
    return c.json({ success: true, user: { id: userId, email: emailLower } }, 201);
  } catch (e) {
    console.error("Register error:", e);
    return c.json({ error: "Registration failed" }, 500);
  }
});

// Email/password sign in
app.post("/api/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;
    if (!email || !password) {
      return c.json({ error: "Email and password required" }, 400);
    }
    const emailLower = String(email).toLowerCase().trim();
    const user = await c.env.DB.prepare("SELECT id, email, password_hash FROM auth_users WHERE email = ?")
      .bind(emailLower)
      .first();
    if (!user || !(await bcrypt.compare(password, (user as any).password_hash))) {
      return c.json({ error: "Invalid email or password" }, 401);
    }
    const token = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60;
    await c.env.DB.prepare("INSERT INTO auth_sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
      .bind(token, (user as any).id, expiresAt)
      .run();
    setCookie(c, EMAIL_SESSION_COOKIE, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: c.req.url.startsWith("https"),
      maxAge: 60 * 24 * 60 * 60,
    });
    return c.json({ success: true, user: { id: (user as any).id, email: (user as any).email } });
  } catch (e) {
    console.error("Login error:", e);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Get redirect URI for Google OAuth - must EXACTLY match Google Cloud Console
function getGoogleRedirectUri(c: { req: { url: string }; env: Env }): string {
  if (c.env.GOOGLE_REDIRECT_URI) {
    const uri = c.env.GOOGLE_REDIRECT_URI.trim().replace(/\/$/, "");
    return uri.includes("/auth/callback") ? uri : `${uri}/auth/callback`;
  }
  if (c.env.CLIENT_URL) return `${c.env.CLIENT_URL.replace(/\/$/, "")}/auth/callback`;
  const url = new URL(c.req.url);
  return `${url.protocol}//${url.host}/auth/callback`;
}

// Obtain redirect URL - supports direct Google OAuth or Mocha
app.get("/api/oauth/google/redirect_url", async (c) => {
  if (c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET) {
    const redirectUri = getGoogleRedirectUri(c);
    const scopes = encodeURIComponent("openid email profile");
    const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${c.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent`;
    return c.json({ redirectUrl }, 200);
  }
  if (c.env.MOCHA_USERS_SERVICE_API_URL && c.env.MOCHA_USERS_SERVICE_API_KEY) {
    const redirectUrl = await getOAuthRedirectUrl("google", {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
    return c.json({ redirectUrl }, 200);
  }
  return c.json({ error: "Google sign-in not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .dev.vars" }, 503);
});

// Debug: returns redirect URI so you can verify it matches Google Console
app.get("/api/oauth/google/redirect_uri_debug", async (c) => {
  const redirectUri = getGoogleRedirectUri(c);
  return c.json({
    redirectUri,
    message: "Add this EXACT URL to Google Cloud Console → APIs & Credentials → OAuth Client → Authorized redirect URIs",
  });
});

// Exchange code for session - supports direct Google OAuth or Mocha
app.post("/api/sessions", async (c) => {
  const body = await c.req.json();
  const code = body?.code;
  if (!code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  if (c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET) {
    const redirectUri = getGoogleRedirectUri(c);
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID,
        client_secret: c.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google token error:", err);
      return c.json({ error: "Google authentication failed" }, 401);
    }
    const tokens = await tokenRes.json();
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userRes.ok) {
      return c.json({ error: "Failed to get user info" }, 401);
    }
    const googleUser = await userRes.json();
    const email = (googleUser.email || "").toLowerCase();
    if (!email) return c.json({ error: "No email from Google" }, 400);

    let user = await c.env.DB.prepare("SELECT id, email FROM auth_users WHERE email = ?").bind(email).first();
    if (!user) {
      const userId = "google-" + crypto.randomUUID();
      await c.env.DB.prepare("INSERT INTO auth_users (id, email, password_hash) VALUES (?, ?, ?)")
        .bind(userId, email, "oauth-google")
        .run();
      user = { id: userId, email };
    }
    const token = crypto.randomUUID();
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60;
    await c.env.DB.prepare("INSERT INTO auth_sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
      .bind(token, (user as any).id, expiresAt)
      .run();
    setCookie(c, EMAIL_SESSION_COOKIE, token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: c.req.url.startsWith("https"),
      maxAge: 60 * 24 * 60 * 60,
    });
    return c.json({ success: true }, 200);
  }

  if (c.env.MOCHA_USERS_SERVICE_API_URL && c.env.MOCHA_USERS_SERVICE_API_KEY) {
    const sessionToken = await exchangeCodeForSessionToken(code, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
    setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 60 * 24 * 60 * 60,
    });
    return c.json({ success: true }, 200);
  }

  return c.json({ error: "Google sign-in not configured" }, 503);
});

// Get the current user object for the frontend
app.get("/api/users/me", authMiddleware, async (c) => {
  return c.json(c.get("user"));
});

// Logout endpoint - clears both email and Mocha sessions
app.get("/api/logout", async (c) => {
  const mochaToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  if (mochaToken && c.env.MOCHA_USERS_SERVICE_API_URL && c.env.MOCHA_USERS_SERVICE_API_KEY) {
    await deleteSession(mochaToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }
  deleteCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
  deleteCookie(c, EMAIL_SESSION_COOKIE);
  return c.json({ success: true }, 200);
});

// Get all chats for the current user
app.get("/api/chats", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const chats = await c.env.DB.prepare(
    "SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC"
  )
    .bind(user.id)
    .all();

  return c.json({ chats: chats.results }, 200);
});

// Create a new chat
app.post("/api/chats", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();

  const result = await c.env.DB.prepare(
    "INSERT INTO chats (user_id, title) VALUES (?, ?) RETURNING *"
  )
    .bind(user.id, body.title || "New Chat")
    .first();

  return c.json({ chat: result }, 201);
});

// Delete a chat
app.delete("/api/chats/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const chatId = c.req.param("id");

  // Verify the chat belongs to the user
  const chatRecord = await c.env.DB.prepare(
    "SELECT * FROM chats WHERE id = ? AND user_id = ?"
  )
    .bind(chatId, user.id)
    .first();

  if (!chatRecord) {
    return c.json({ error: "Chat not found" }, 404);
  }

  // Delete messages first
  await c.env.DB.prepare("DELETE FROM messages WHERE chat_id = ?")
    .bind(chatId)
    .run();

  // Delete the chat
  await c.env.DB.prepare("DELETE FROM chats WHERE id = ?").bind(chatId).run();

  return c.json({ success: true }, 200);
});

// Get messages for a chat
app.get("/api/chats/:id/messages", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const chatId = c.req.param("id");

  // Verify the chat belongs to the user
  const chatRecord = await c.env.DB.prepare(
    "SELECT * FROM chats WHERE id = ? AND user_id = ?"
  )
    .bind(chatId, user.id)
    .first();

  if (!chatRecord) {
    return c.json({ error: "Chat not found" }, 404);
  }

  const messages = await c.env.DB.prepare(
    "SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC"
  )
    .bind(chatId)
    .all();

  return c.json({ messages: messages.results }, 200);
});

// Send a message and stream AI response
app.post("/api/chats/:id/messages", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const chatId = c.req.param("id");
  const body = await c.req.json();

  // Verify the chat belongs to the user
  const chatRecord = await c.env.DB.prepare(
    "SELECT * FROM chats WHERE id = ? AND user_id = ?"
  )
    .bind(chatId, user.id)
    .first();

  if (!chatRecord) {
    return c.json({ error: "Chat not found" }, 404);
  }

  // Save user message
  const userMessage = await c.env.DB.prepare(
    "INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?) RETURNING *"
  )
    .bind(chatId, "user", body.content)
    .first();

  if (!userMessage) {
    return c.json({ error: "Failed to save message" }, 500);
  }

  // Update chat title if it's the first user message
  const messageCount = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM messages WHERE chat_id = ?"
  )
    .bind(chatId)
    .first();

  if (messageCount && (messageCount as any).count === 1) {
    const title = body.content.slice(0, 50);
    await c.env.DB.prepare(
      "UPDATE chats SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
      .bind(title, chatId)
      .run();
  }

  // Get chat history
  const history = await c.env.DB.prepare(
    "SELECT role, content FROM messages WHERE chat_id = ? AND id < ? ORDER BY created_at ASC"
  )
    .bind(chatId, (userMessage as any).id)
    .all();

  // Initialize Gemini AI
  const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });

  // Convert history to Gemini format
  const chatHistory = history.results.map((msg: any) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const geminiChat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: chatHistory,
  });

  // Stream response
  return streamSSE(c, async (stream) => {
    try {
      const response = await geminiChat.sendMessageStream({
        message: body.content,
      });

      let fullResponse = "";

      for await (const chunk of response) {
        if (chunk.text) {
          fullResponse += chunk.text;
          await stream.writeSSE({
            data: JSON.stringify({ content: chunk.text }),
          });
        }
      }

      // Save assistant message
      await c.env.DB.prepare(
        "INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)"
      )
        .bind(chatId, "assistant", fullResponse)
        .run();

      // Update chat timestamp
      await c.env.DB.prepare(
        "UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
        .bind(chatId)
        .run();

      await stream.writeSSE({
        data: JSON.stringify({ done: true }),
      });
    } catch (error) {
      console.error("Gemini error:", error);
      await stream.writeSSE({
        data: JSON.stringify({ error: "Failed to generate response" }),
      });
    }
  });
});

// Generate image with Gemini
app.post("/api/images/generate", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const { prompt, aspectRatio = "1:1" } = body;

  if (!prompt) {
    return c.json({ error: "Prompt is required" }, 400);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: c.env.GEMINI_API_KEY });

    // Nano Banana - gemini-2.5-flash-image for text-to-image
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: prompt,
    });

    // Extract image from response
    let imageData: string | null = null;
    let mimeType = "image/png";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      const inline = (part as any).inlineData || (part as any).inline_data;
      if (inline?.data) {
        imageData = typeof inline.data === "string" ? inline.data : Buffer.from(inline.data).toString("base64");
        mimeType = inline.mimeType || inline.mime_type || "image/png";
        break;
      }
    }

    if (!imageData) {
      return c.json({ error: "No image generated. Try a different prompt." }, 500);
    }

    // Convert base64 to data URI
    const imageUrl = `data:${mimeType};base64,${imageData}`;

    // Save to database
    const result = await c.env.DB.prepare(
      "INSERT INTO generated_images (user_id, prompt, image_url, aspect_ratio) VALUES (?, ?, ?, ?) RETURNING *"
    )
      .bind(user.id, prompt, imageUrl, aspectRatio)
      .first();

    return c.json({ image: result }, 201);
  } catch (error: any) {
    console.error("Image generation error:", error);
    return c.json(
      {
        error:
          error.message?.includes("quota") || error.message?.includes("billing")
            ? "Billing account required for image generation"
            : "Failed to generate image",
      },
      500
    );
  }
});

// Get user's generated images
app.get("/api/images", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const images = await c.env.DB.prepare(
    "SELECT * FROM generated_images WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(user.id)
    .all();

  return c.json({ images: images.results }, 200);
});

// Upload file to R2
app.post("/api/files/upload", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const formData = await c.req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  const fileKey = `uploads/${user.id}/${Date.now()}-${file.name}`;

  try {
    await c.env.R2_BUCKET.put(fileKey, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Save metadata to database
    const result = await c.env.DB.prepare(
      "INSERT INTO uploaded_files (user_id, filename, file_key, content_type, file_size) VALUES (?, ?, ?, ?, ?) RETURNING *"
    )
      .bind(user.id, file.name, fileKey, file.type, file.size)
      .first();

    return c.json({ file: result }, 201);
  } catch (error) {
    console.error("File upload error:", error);
    return c.json({ error: "Failed to upload file" }, 500);
  }
});

// Get user's uploaded files
app.get("/api/files", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const files = await c.env.DB.prepare(
    "SELECT * FROM uploaded_files WHERE user_id = ? ORDER BY created_at DESC"
  )
    .bind(user.id)
    .all();

  return c.json({ files: files.results }, 200);
});

// Download file from R2
app.get("/api/files/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const fileId = c.req.param("id");

  const fileRecord = await c.env.DB.prepare(
    "SELECT * FROM uploaded_files WHERE id = ? AND user_id = ?"
  )
    .bind(fileId, user.id)
    .first();

  if (!fileRecord) {
    return c.json({ error: "File not found" }, 404);
  }

  const object = await c.env.R2_BUCKET.get((fileRecord as any).file_key);

  if (!object) {
    return c.json({ error: "File not found in storage" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return c.body(object.body, { headers });
});

// Delete file
app.delete("/api/files/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const fileId = c.req.param("id");

  const fileRecord = await c.env.DB.prepare(
    "SELECT * FROM uploaded_files WHERE id = ? AND user_id = ?"
  )
    .bind(fileId, user.id)
    .first();

  if (!fileRecord) {
    return c.json({ error: "File not found" }, 404);
  }

  try {
    await c.env.R2_BUCKET.delete((fileRecord as any).file_key);
    await c.env.DB.prepare("DELETE FROM uploaded_files WHERE id = ? AND user_id = ?")
      .bind(fileId, user.id)
      .run();
    return c.json({ success: true }, 200);
  } catch (error) {
    console.error("File delete error:", error);
    return c.json({ error: "Failed to delete file" }, 500);
  }
});

// Create Stripe checkout session
app.post("/api/checkout", authMiddleware, async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const { priceCents, description, successUrl, cancelUrl } = body;

  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ error: "Stripe not configured" }, 500);
  }

  try {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: description || "TypeGPT Credits",
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
      },
    });

    return c.json({ url: session.url }, 200);
  } catch (error: any) {
    console.error("Stripe error:", error);
    return c.json({ error: "Failed to create checkout session" }, 500);
  }
});

// Stripe webhook handler
app.post("/api/webhooks/stripe", async (c) => {
  const body = await c.req.text();
  const sig = c.req.header("stripe-signature") || "";

  if (!c.env.STRIPE_WEBHOOK_SECRET) {
    return c.json({ error: "Webhook secret not configured" }, 500);
  }

  try {
    const stripe = new Stripe(c.env.STRIPE_SECRET_KEY!);
    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      c.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;

      if (userId) {
        // Handle successful payment
        console.log(`Payment completed for user ${userId}`);
        // You can add logic here to update user credits, etc.
      }
    }

    return c.json({ received: true }, 200);
  } catch (error: any) {
    console.error("Webhook error:", error);
    return c.json({ error: "Invalid signature" }, 400);
  }
});

export default app;
