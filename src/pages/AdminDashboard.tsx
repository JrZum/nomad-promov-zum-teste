
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfiguracaoGeral from "@/components/ConfiguracaoGeral";
import Dashboard from "@/components/Dashboard";
import ParticipanteDashboard from "@/components/ParticipanteDashboard";
import BannerDisplay from "@/components/BannerDisplay";
import RelatoriosComponent from "@/components/relatorios/RelatoriosComponent";
import VendasDashboard from "@/components/dashboard/VendasDashboard";
import AdminSidebar from "@/components/AdminSidebar";
import ThemeToggle from "@/components/theme-toggle";
import { LogOut } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("configuracoes");
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "configuracoes":
        return <ConfiguracaoGeral />;
      case "dashboard":
        return <Dashboard />;
      case "vendas":
        return <VendasDashboard />;
      case "consulta":
        return <ParticipanteDashboard />;
      case "relatorios":
        return <RelatoriosComponent />;
      default:
        return <ConfiguracaoGeral />;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "configuracoes":
        return "Configurações Gerais";
      case "dashboard":
        return "Dashboard de Participantes";
      case "vendas":
        return "Gerenciamento de Vendas";
      case "consulta":
        return "Consulta de Números";
      case "relatorios":
        return "Relatórios e Exportações";
      default:
        return "Painel Administrativo";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Mobile: Sidebar + Content */}
        <div className="md:hidden flex-1">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="p-4">
            <div className="mb-4">
              <div className="flex items-center gap-4 mb-6">
                <SidebarTrigger />
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
                <ThemeToggle />
              </div>
              
              <BannerDisplay />
            </div>
            
            <Card className="p-4">
              {renderContent()}
            </Card>
          </main>
        </div>

        {/* Desktop: Tabs only */}
        <div className="hidden md:flex flex-1 flex-col">
          <main className="p-6">
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold">{getPageTitle()}</h1>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
                <ThemeToggle />
              </div>
              
              <BannerDisplay />
            </div>
            
            <Card className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="configuracoes">Configurações</TabsTrigger>
                  <TabsTrigger value="dashboard">Participantes</TabsTrigger>
                  <TabsTrigger value="vendas">Vendas</TabsTrigger>
                  <TabsTrigger value="consulta">Consulta de Números</TabsTrigger>
                  <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
                </TabsList>
                
                <TabsContent value="configuracoes">
                  <ConfiguracaoGeral />
                </TabsContent>
                
                <TabsContent value="dashboard">
                  <Dashboard />
                </TabsContent>
                
                <TabsContent value="vendas">
                  <VendasDashboard />
                </TabsContent>
                
                <TabsContent value="consulta">
                  <ParticipanteDashboard />
                </TabsContent>
                
                <TabsContent value="relatorios">
                  <RelatoriosComponent />
                </TabsContent>
              </Tabs>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
