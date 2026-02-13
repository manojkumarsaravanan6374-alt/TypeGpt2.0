import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { Button } from "@/react-app/components/ui/button";
import { Card } from "@/react-app/components/ui/card";
import { ChatSidebar } from "@/react-app/components/ChatSidebar";
import { Sparkles, Check, Loader2 } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: 4.99,
    priceCents: 499,
    credits: 500,
    features: ["500 AI credits", "Chat & Image generation", "File storage", "Email support"],
  },
  {
    name: "Pro",
    price: 9.99,
    priceCents: 999,
    credits: 1500,
    popular: true,
    features: ["1,500 AI credits", "Priority processing", "All Starter features", "Priority support"],
  },
  {
    name: "Premium",
    price: 19.99,
    priceCents: 1999,
    credits: 5000,
    features: ["5,000 AI credits", "Highest priority", "All Pro features", "Dedicated support"],
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: (typeof PLANS)[0]) => {
    if (!user) {
      navigate("/signin");
      return;
    }
    setLoadingPlan(plan.name);
    try {
      const baseUrl = window.location.origin;
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          priceCents: plan.priceCents,
          description: `TypeGPT ${plan.name} - ${plan.credits} credits`,
          successUrl: `${baseUrl}/chat?payment=success`,
          cancelUrl: `${baseUrl}/pricing`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
      }
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-80 flex-shrink-0">
        <ChatSidebar showChatList={false} />
      </div>
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Upgrade Your Plan
            </h1>
            <p className="text-muted-foreground mt-2">
              Get more credits for AI chat and image generation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`p-6 relative flex flex-col ${
                  plan.popular ? "border-2 border-primary shadow-lg" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/one-time</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{plan.credits} credits</p>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  className="mt-6 w-full"
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  onClick={() => handleCheckout(plan)}
                  disabled={!!loadingPlan}
                >
                  {loadingPlan === plan.name ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Get {plan.name}
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Secure payment powered by Stripe. Your card details are never stored.
          </p>
        </div>
      </div>
    </div>
  );
}
