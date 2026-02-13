import { useNavigate } from "react-router-dom";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useEffect } from "react";
import { Button } from "@/react-app/components/ui/button";
import { Bot, Sparkles, MessageSquare, Zap, Image, ArrowRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/chat");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-background to-purple-50 dark:from-background dark:via-background dark:to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-full">
            <Bot className="h-7 w-7 text-primary" />
            <span className="font-semibold text-xl">TypeGPT</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            Your AI Assistant
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600 mt-4">
              Powered by Gemini
            </span>
          </h1>

          <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">
            Experience the future of AI conversation, image generation, and intelligent assistance
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              size="lg"
              onClick={() => navigate("/signup")}
              className="h-14 px-8 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/signin")}
              className="h-14 px-8 text-lg"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 max-w-6xl mx-auto">
          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border-2 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gemini AI</h3>
            <p className="text-muted-foreground">
              Access Google's most advanced AI models for intelligent conversations
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border-2 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4">
              <Image className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Image Generation</h3>
            <p className="text-muted-foreground">
              Create stunning AI-generated images from simple text descriptions
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border-2 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Chat History</h3>
            <p className="text-muted-foreground">
              Save and organize all your conversations for easy reference
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border-2 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Real-time Streaming</h3>
            <p className="text-muted-foreground">
              Get instant AI responses with smooth, real-time streaming
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center max-w-3xl mx-auto p-12 rounded-3xl bg-gradient-to-br from-violet-600 to-purple-600 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl text-violet-100 mb-8">
            Join thousands of users experiencing the power of AI
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/signup")}
            className="h-14 px-8 text-lg bg-white text-violet-600 hover:bg-violet-50"
          >
            Create Your Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
