
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Settings, Zap, Hash, Clock } from "lucide-react";

type Algorithm = "random" | "sequential" | "timestamp";

interface AlgorithmConfig {
  algorithm: Algorithm;
  sequential_start: number;
  timestamp_multiplier: number;
  enable_distribution_guarantee: boolean;
}

const AlgorithmConfiguration = () => {
  const [config, setConfig] = useState<AlgorithmConfig>({
    algorithm: "random",
    sequential_start: 1,
    timestamp_multiplier: 1000,
    enable_distribution_guarantee: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const saveConfiguration = async () => {
    setIsSaving(true);
    try {
      // Temporariamente usando localStorage até os tipos do Supabase serem atualizados
      localStorage.setItem('algorithm_config', JSON.stringify(config));
      
      toast({
        title: "Configuração salva",
        description: "Configuração do algoritmo salva temporariamente.",
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

  const algorithmOptions = [
    { value: "random", label: "Aleatório", icon: Zap, description: "Geração totalmente aleatória" },
    { value: "sequential", label: "Sequencial", icon: Hash, description: "Números em sequência" },
    { value: "timestamp", label: "Baseado em Timestamp", icon: Clock, description: "Baseado no tempo atual" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Algoritmo de Geração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="algorithm">Tipo de Algoritmo</Label>
          <Select value={config.algorithm} onValueChange={(value) => setConfig({...config, algorithm: value as Algorithm})}>
            <SelectTrigger id="algorithm">
              <SelectValue placeholder="Selecione o algoritmo" />
            </SelectTrigger>
            <SelectContent>
              {algorithmOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {config.algorithm === "sequential" && (
          <div className="space-y-2">
            <Label htmlFor="sequential-start">Número Inicial (Sequencial)</Label>
            <Input
              id="sequential-start"
              type="number"
              min="1"
              value={config.sequential_start}
              onChange={(e) => setConfig({...config, sequential_start: parseInt(e.target.value) || 1})}
              placeholder="Número inicial da sequência"
            />
          </div>
        )}

        {config.algorithm === "timestamp" && (
          <div className="space-y-2">
            <Label htmlFor="timestamp-multiplier">Multiplicador Timestamp</Label>
            <Input
              id="timestamp-multiplier"
              type="number"
              min="1"
              value={config.timestamp_multiplier}
              onChange={(e) => setConfig({...config, timestamp_multiplier: parseInt(e.target.value) || 1000})}
              placeholder="Multiplicador para o timestamp"
            />
            <p className="text-xs text-muted-foreground">
              Usado para calcular o número baseado no timestamp atual
            </p>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="distribution-guarantee"
            checked={config.enable_distribution_guarantee}
            onCheckedChange={(checked) => setConfig({...config, enable_distribution_guarantee: !!checked})}
          />
          <Label htmlFor="distribution-guarantee" className="text-sm">
            Garantir distribuição uniforme
          </Label>
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

export default AlgorithmConfiguration;
