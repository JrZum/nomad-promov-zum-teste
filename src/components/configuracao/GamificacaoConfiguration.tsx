import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RaspadinhaConfiguration from "./RaspadinhaConfiguration";

const GamificacaoConfiguration = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Gamificação</CardTitle>
          <CardDescription>
            Configure os módulos de gamificação da sua campanha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="raspadinha" className="space-y-4">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="raspadinha">Raspadinha Digital</TabsTrigger>
              {/* Futuros módulos de gamificação podem ser adicionados aqui */}
            </TabsList>
            
            <TabsContent value="raspadinha">
              <RaspadinhaConfiguration />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GamificacaoConfiguration;