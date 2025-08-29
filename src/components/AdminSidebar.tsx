
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Settings, Users, Search, BarChart3, LogOut, Receipt } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const { logout } = useAdminAuth();

  const handleLogout = () => {
    logout();
    navigate("/admin");
  };

  const menuItems = [
    {
      id: "configuracoes",
      title: "Configurações",
      icon: Settings,
      description: "Configurações gerais do sistema"
    },
    {
      id: "dashboard",
      title: "Participantes",
      icon: Users,
      description: "Gerenciar participantes"
    },
    {
      id: "vendas",
      title: "Vendas",
      icon: Receipt,
      description: "Gerenciar vendas e cupons fiscais"
    },
    {
      id: "consulta",
      title: "Consulta de Números",
      icon: Search,
      description: "Consultar números de participantes"
    },
    {
      id: "relatorios",
      title: "Relatórios",
      icon: BarChart3,
      description: "Relatórios e exportações"
    }
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img 
            alt="Logo Let's Eat" 
            className="h-8 w-auto" 
            src="https://letseat.com.br/images/logo.png" 
          />
          <div>
            <h2 className="text-lg font-semibold">Admin</h2>
            <p className="text-xs text-muted-foreground">Painel Administrativo</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={activeTab === item.id}
                    className="w-full"
                  >
                    <item.icon className="h-4 w-4" />
                    <div className="flex flex-col items-start">
                      <span>{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="w-full"
          size="sm"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
