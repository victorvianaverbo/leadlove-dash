import { useEffect, lazy, Suspense } from "react";
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

// Lazy load all other routes to reduce initial bundle size
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectNew = lazy(() => import("./pages/ProjectNew"));
const ProjectEdit = lazy(() => import("./pages/ProjectEdit"));
const ProjectView = lazy(() => import("./pages/ProjectView"));
const PublicDashboard = lazy(() => import("./pages/PublicDashboard"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Documentation = lazy(() => import("./pages/Documentation"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("./pages/CheckoutCancel"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminProjects = lazy(() => import("./pages/AdminProjects"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Settings = lazy(() => import("./pages/Settings"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));

const queryClient = new QueryClient();

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
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
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
