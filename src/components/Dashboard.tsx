
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Store } from "lucide-react";
import ParticipantesDashboard from "./dashboard/ParticipantesDashboard";
import LojasDashboard from "./dashboard/LojasDashboard";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("participantes");

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie participantes e monitore o desempenho das lojas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="participantes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participantes
          </TabsTrigger>
          <TabsTrigger value="lojas" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Por Loja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participantes">
          <ParticipantesDashboard />
        </TabsContent>

        <TabsContent value="lojas">
          <LojasDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
