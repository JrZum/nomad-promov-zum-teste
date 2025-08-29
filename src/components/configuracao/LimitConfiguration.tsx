
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Shield, Users, Calendar } from "lucide-react";

interface LimitConfig {
  max_numeros_por_participante: number;
  max_numeros_por_dia: number;
  enable_daily_reset: boolean;
  enable_participant_limit: boolean;
  limite_global_diario: number;
  enable_global_daily_limit: boolean;
}

const LimitConfiguration = () => {
  const [config, setConfig] = useState<LimitConfig>({
    max_numeros_por_participante: 100,
    max_numeros_por_dia: 50,
    enable_daily_reset: true,
    enable_participant_limit: true,
    limite_global_diario: 10000,
    enable_global_daily_limit: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      // Temporariamente usando localStorage até os tipos do Supabase serem atualizados
      localStorage.setItem('limits_config', JSON.stringify(config));

      toast({
        title: "Configuração salva",
        description: "Configuração de limites salva temporariamente.",
      });
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Limites e Controles
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Limites por participante */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <h4 className="font-medium">Limites por Participante</h4>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-participant-limit"
              checked={config.enable_participant_limit}
              onCheckedChange={(checked) => setConfig({...config, enable_participant_limit: !!checked})}
            />
            <Label htmlFor="enable-participant-limit" className="text-sm">
              Ativar limite por participante
            </Label>
          </div>

          {config.enable_participant_limit && (
            <div className="space-y-2">
              <Label htmlFor="max-per-participant">Máximo de números por participante</Label>
              <Input
                id="max-per-participant"
                type="number"
                min="1"
                value={config.max_numeros_por_participante}
                onChange={(e) => setConfig({...config, max_numeros_por_participante: parseInt(e.target.value) || 100})}
                placeholder="Número máximo por participante"
              />
            </div>
          )}
        </div>

        {/* Limites diários */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <h4 className="font-medium">Limites Diários</h4>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-daily-reset"
              checked={config.enable_daily_reset}
              onCheckedChange={(checked) => setConfig({...config, enable_daily_reset: !!checked})}
            />
            <Label htmlFor="enable-daily-reset" className="text-sm">
              Reset diário de contadores
            </Label>
          </div>

          {config.enable_daily_reset && (
            <div className="space-y-2">
              <Label htmlFor="max-per-day">Máximo de números por participante por dia</Label>
              <Input
                id="max-per-day"
                type="number"
                min="1"
                value={config.max_numeros_por_dia}
                onChange={(e) => setConfig({...config, max_numeros_por_dia: parseInt(e.target.value) || 50})}
                placeholder="Máximo por dia por participante"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enable-global-daily-limit"
              checked={config.enable_global_daily_limit}
              onCheckedChange={(checked) => setConfig({...config, enable_global_daily_limit: !!checked})}
            />
            <Label htmlFor="enable-global-daily-limit" className="text-sm">
              Limite global diário (todos os participantes)
            </Label>
          </div>

          {config.enable_global_daily_limit && (
            <div className="space-y-2">
              <Label htmlFor="global-daily-limit">Limite global de números por dia</Label>
              <Input
                id="global-daily-limit"
                type="number"
                min="1"
                value={config.limite_global_diario}
                onChange={(e) => setConfig({...config, limite_global_diario: parseInt(e.target.value) || 10000})}
                placeholder="Total máximo de números por dia"
              />
              <p className="text-xs text-muted-foreground">
                Limite total de números que podem ser gerados por dia para todos os participantes
              </p>
            </div>
          )}
        </div>

        <Button 
          onClick={saveConfiguration} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? "Salvando..." : "Salvar Configuração"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LimitConfiguration;
