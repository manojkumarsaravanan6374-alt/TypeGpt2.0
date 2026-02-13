import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bot } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      if (!code) {
        console.error("No auth code in callback");
        navigate("/");
        return;
      }
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
          credentials: "include",
        });
        if (res.ok) {
          window.location.href = "/chat";
        } else {
          const data = await res.json().catch(() => ({}));
          console.error("Auth failed:", data.error);
          navigate("/");
        }
      } catch (error) {
        console.error("Authentication failed:", error);
        navigate("/");
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
      <div className="text-center space-y-4">
        <div className="animate-spin mx-auto w-16 h-16 rounded-full border-4 border-primary border-t-transparent"></div>
        <div className="flex items-center gap-2 justify-center">
          <Bot className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Completing sign in...</h2>
        </div>
        <p className="text-muted-foreground">Please wait a moment</p>
      </div>
    </div>
  );
}
