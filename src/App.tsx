
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import NumerosSorte from "./pages/NumerosSorte";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import { ThemeProvider } from "@/components/theme-provider";
import SiteTitleManager from "./components/SiteTitleManager";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SiteTitleManager />
          <BrowserRouter>
            <Routes>
              {/* Redirecionar a página principal para o painel administrativo */}
              <Route path="/" element={<Navigate to="/admin" replace />} />
              
              {/* Rotas para usuários participantes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/numeros" element={<NumerosSorte />} />
              
              {/* Rotas administrativas */}
              <Route path="/admin" element={<AdminAuth />} />
              <Route 
                path="/admin/dashboard" 
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                } 
              />
              
              {/* Rota padrão para 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AdminAuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
