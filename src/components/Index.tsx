
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ConfiguracaoCampanha from "@/components/ConfiguracaoCampanha";
import Dashboard from "@/components/Dashboard";
import ParticipanteDashboard from "@/components/ParticipanteDashboard";

const Index = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-center mb-8">
        <img alt="Logo Let's Eat" className="h-24" src="https://letseat.com.br/images/logo.png" />
      </div>
      
      <div className="flex justify-end mb-4">
        <Link to="/auth">
          <Button variant="outline">Área do Participante</Button>
        </Link>
      </div>
      
      <Card className="p-6">
        <Tabs defaultValue="configuracao" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 mb-2">
            <TabsTrigger value="configuracao">Configuração da Campanha</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="consulta">Consulta de Números</TabsTrigger>
          </TabsList>
          
          <TabsContent value="configuracao">
            <ConfiguracaoCampanha />
          </TabsContent>
          
          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          
          <TabsContent value="consulta">
            <ParticipanteDashboard />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Index;
