import { useAuth } from "@/react-app/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/react-app/components/ui/button";
import { Card } from "@/react-app/components/ui/card";
import { Input } from "@/react-app/components/ui/input";
import { Bot, Sparkles, MessageSquare, Zap, Image } from "lucide-react";

export default function SignUp() {
  const { user, isPending, registerWithEmail, redirectToLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/chat");
    }
  }, [user, navigate]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await registerWithEmail(email, password);
    setLoading(false);
    if (err) setError(err);
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-background to-purple-50 dark:from-background dark:via-background dark:to-muted">
        <div className="animate-pulse">
          <Bot className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-violet-50 via-background to-purple-50 dark:from-background dark:via-background dark:to-muted">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Features */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-full">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">TypeGPT</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              Start Your AI
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 mt-2">
                Journey Today
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Join thousands using advanced AI for chat, image generation, and more
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border">
              <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 p-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Gemini AI Power</h3>
                <p className="text-sm text-muted-foreground">
                  Access to Google's most advanced AI models
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border">
              <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 p-3">
                <Image className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Image Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Create stunning images from text descriptions
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border">
              <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 p-3">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Conversation History</h3>
                <p className="text-sm text-muted-foreground">
                  Never lose your important chats and insights
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-lg bg-card/50 border">
              <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 p-3">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Real-time Streaming</h3>
                <p className="text-sm text-muted-foreground">
                  Get instant AI responses as they're generated
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Sign Up Card */}
        <Card className="p-8 space-y-6 backdrop-blur-sm bg-card/80 border-2 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 mb-4">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold">Create Account</h2>
            <p className="text-muted-foreground">
              Get started with TypeGPT in seconds
            </p>
          </div>

          <div className="space-y-4">
            <form onSubmit={handleEmailSignUp} className="space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
                required
              />
              <Input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
                minLength={6}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="w-full h-12" disabled={loading}>
                {loading ? "Creating account..." : "Sign up with Email"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              onClick={redirectToLogin}
              size="lg"
              variant="outline"
              className="w-full h-12 text-base"
            >
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/signin")}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground">
              By signing up, you agree to our{" "}
              <a href="#" className="underline hover:text-foreground">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-foreground">
                Privacy Policy
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
