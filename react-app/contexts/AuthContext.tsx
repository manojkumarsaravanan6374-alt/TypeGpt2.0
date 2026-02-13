import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isPending: boolean;
  loginWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  registerWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  redirectToLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUser(data.user);
        return {};
      }
      return { error: data.error || "Login failed" };
    },
    []
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setUser(data.user);
        return {};
      }
      return { error: data.error || "Registration failed" };
    },
    []
  );

  const redirectToLogin = useCallback(async () => {
    const res = await fetch("/api/oauth/google/redirect_url", { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.redirectUrl) {
      window.location.href = data.redirectUrl;
    } else {
      console.error("Google sign-in not available:", data.error);
      alert("Google sign-in is not configured. Please use email/password.");
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/logout", { credentials: "include" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isPending, loginWithEmail, registerWithEmail, redirectToLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
