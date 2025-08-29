
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConfiguracaoCampanha from "./ConfiguracaoCampanha";
import LoginMethodConfiguration from "./configuracao/LoginMethodConfiguration";
import AdvancedConfiguration from "./configuracao/AdvancedConfiguration";
import LojasParticipantes from "./configuracao/LojasParticipantes";
import GamificacaoConfiguration from "./configuracao/GamificacaoConfiguration";

const ConfiguracaoGeral = () => {
  return (
    <div className="space-y-6">
      {/* Desktop: Show tabs */}
      <div className="hidden md:block">
        <Tabs defaultValue="campanha" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="campanha">Configuração da Campanha</TabsTrigger>
            <TabsTrigger value="lojas">Lojas Participantes</TabsTrigger>
            <TabsTrigger value="login">Configuração de Login</TabsTrigger>
            <TabsTrigger value="gamificacao">Gamificação</TabsTrigger>
            <TabsTrigger value="avancada">Configuração Avançada</TabsTrigger>
          </TabsList>
          
          <TabsContent value="campanha">
            <ConfiguracaoCampanha />
          </TabsContent>
          
          <TabsContent value="lojas">
            <LojasParticipantes />
          </TabsContent>
          
          <TabsContent value="login">
            <LoginMethodConfiguration />
          </TabsContent>
          
          <TabsContent value="gamificacao">
            <GamificacaoConfiguration />
          </TabsContent>
          
          <TabsContent value="avancada">
            <AdvancedConfiguration />
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile: Show only active content without tabs */}
      <div className="md:hidden">
        <ConfiguracaoCampanha />
      </div>
    </div>
  );
};

export default ConfiguracaoGeral;
