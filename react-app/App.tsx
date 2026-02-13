import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/react-app/contexts/AuthContext";

/** Removes Mocha-injected UI: "Clone with Mocha" badge and chat limit/upgrade banners */
function useRemoveMochaUI() {
  useEffect(() => {
    const removeMochaElements = () => {
      document.querySelectorAll("a, button, div, span").forEach((el) => {
        const text = el.textContent?.trim().toLowerCase();
        const fixedParent = el.closest("[style*='position: fixed'], [style*='position:fixed'], [style*='position: sticky']");
        const isMochaClone = text?.includes("clone") && text?.includes("mocha");
        const isChatLimitBanner =
          fixedParent &&
          (text?.includes("chat limit") ||
            text?.includes("message limit") ||
            text?.includes("limit reached") ||
            (text?.includes("upgrade") && (text?.includes("unlimit") || text?.includes("credits"))));
        if (isMochaClone || isChatLimitBanner) {
          if (fixedParent) fixedParent.remove();
          else el.parentElement?.remove();
        }
      });
    };
    removeMochaElements();
    const timer = setTimeout(removeMochaElements, 1000);
    const observer = new MutationObserver(removeMochaElements);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);
}
import Chat from "@/react-app/pages/Chat";
import Home from "@/react-app/pages/Home";
import SignIn from "@/react-app/pages/SignIn";
import SignUp from "@/react-app/pages/SignUp";
import AuthCallback from "@/react-app/pages/AuthCallback";
import ImageGenerator from "@/react-app/pages/ImageGenerator";
import FileManager from "@/react-app/pages/FileManager";
import Pricing from "@/react-app/pages/Pricing";
import { ThemeProvider } from "@/react-app/hooks/useTheme";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isPending } = useAuth();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  useRemoveMochaUI();
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/images"
            element={
              <ProtectedRoute>
                <ImageGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/files"
            element={
              <ProtectedRoute>
                <FileManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <ProtectedRoute>
                <Pricing />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
