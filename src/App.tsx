import { useEffect, lazy, Suspense, ComponentType } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { initMetaPixel } from "@/lib/meta-pixel";
import { supabase } from "@/integrations/supabase/client";

// Eagerly load the landing page for fast LCP
import Index from "./pages/Index";

// Lazy with auto-retry on chunk load failure (stale deploy recovery)
function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  key: string,
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      const msg = String(err?.message || err);
      const isChunkErr =
        /Failed to fetch dynamically imported module|Loading chunk|ChunkLoadError|Importing a module script failed/i.test(
          msg,
        );
      const reloadKey = `chunk-retry:${key}`;
      if (isChunkErr && typeof window !== "undefined") {
        if (!sessionStorage.getItem(reloadKey)) {
          sessionStorage.setItem(reloadKey, "1");
          window.location.reload();
          // Return a never-resolving promise while the reload happens
          return new Promise(() => {}) as any;
        }
      }
      throw err;
    }
  });
}

const Auth = lazyWithRetry(() => import("./pages/Auth"), "Auth");
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"), "Dashboard");
const ProjectNew = lazyWithRetry(() => import("./pages/ProjectNew"), "ProjectNew");
const ProjectEdit = lazyWithRetry(() => import("./pages/ProjectEdit"), "ProjectEdit");
const ProjectView = lazyWithRetry(() => import("./pages/ProjectView"), "ProjectView");
const PublicDashboard = lazyWithRetry(() => import("./pages/PublicDashboard"), "PublicDashboard");
const Privacy = lazyWithRetry(() => import("./pages/Privacy"), "Privacy");
const Terms = lazyWithRetry(() => import("./pages/Terms"), "Terms");
const Documentation = lazyWithRetry(() => import("./pages/Documentation"), "Documentation");
const CheckoutSuccess = lazyWithRetry(() => import("./pages/CheckoutSuccess"), "CheckoutSuccess");
const CheckoutCancel = lazyWithRetry(() => import("./pages/CheckoutCancel"), "CheckoutCancel");
const Admin = lazyWithRetry(() => import("./pages/Admin"), "Admin");
const AdminProjects = lazyWithRetry(() => import("./pages/AdminProjects"), "AdminProjects");
const Pricing = lazyWithRetry(() => import("./pages/Pricing"), "Pricing");
const NotFound = lazyWithRetry(() => import("./pages/NotFound"), "NotFound");
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"), "ForgotPassword");
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"), "ResetPassword");
const Settings = lazyWithRetry(() => import("./pages/Settings"), "Settings");
const OAuthCallback = lazyWithRetry(() => import("./pages/OAuthCallback"), "OAuthCallback");

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => {
  useEffect(() => {
    // Defer meta pixel init to after page is interactive (improves TTI)
    const loadPixel = () => {
      supabase.functions.invoke('meta-pixel-config').then(({ data }) => {
        if (data?.pixelId) initMetaPixel(data.pixelId);
      });
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(loadPixel, { timeout: 3000 });
    } else {
      setTimeout(loadPixel, 2000);
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects/new" element={<ProjectNew />} />
              <Route path="/projects/:id" element={<ProjectView />} />
              <Route path="/projects/:id/edit" element={<ProjectEdit />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/documentacao" element={<Documentation />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/checkout/cancel" element={<CheckoutCancel />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/projects" element={<AdminProjects />} />
              <Route path="/oauth/callback" element={<OAuthCallback />} />
              {/* Public dashboard route - must be last to avoid conflicts */}
              <Route path="/:slug" element={<PublicDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
