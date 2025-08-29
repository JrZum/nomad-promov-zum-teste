
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SeriesConfiguration = ({ 
  initialSeriesNumericas,
  isLoading
}: { 
  initialSeriesNumericas: number,
  isLoading: boolean
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [seriesNumericas, setSeriesNumericas] = useState(initialSeriesNumericas);

  const updateSeriesMutation = useMutation({
    mutationFn: async (series: number) => {
      console.log("Atualizando séries para:", series);
      
      // Verificar se já existe uma configuração
      const { data: existingConfig, error: fetchError } = await supabase
        .from("configuracao_campanha")
        .select("id")
        .maybeSingle();
      
      if (fetchError) {
        console.error("Erro ao verificar configuração existente:", fetchError);
        throw fetchError;
      }
      
      if (existingConfig) {
        // Atualizar configuração existente
        console.log("Atualizando configuração existente com ID:", existingConfig.id);
        const { error: updateError } = await supabase
          .from("configuracao_campanha")
          .update({ series_numericas: series })
          .eq("id", existingConfig.id);
        
        if (updateError) {
          console.error("Erro ao atualizar configuração:", updateError);
          throw updateError;
        }
      } else {
        // Inserir nova configuração
        console.log("Inserindo nova configuração");
        const { error: insertError } = await supabase
          .from("configuracao_campanha")
          .insert({ series_numericas: series });
        
        if (insertError) {
          console.error("Erro ao inserir configuração:", insertError);
          throw insertError;
        }
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Configuração atualizada",
        description: "O número de séries foi atualizado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ["configuracao"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a configuração.",
        variant: "destructive"
      });
      console.error("Erro ao atualizar séries:", error);
    }
  });

  const handleUpdateSeries = () => {
    updateSeriesMutation.mutate(seriesNumericas);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Configuração de Séries</h3>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Número de Séries Numéricas</Label>
          <Input
            type="number"
            min="1"
            value={seriesNumericas}
            onChange={(e) => setSeriesNumericas(parseInt(e.target.value) || 1)}
          />
          <p className="text-sm text-gray-500">
            Intervalo atual: 0 a {(seriesNumericas * 100000) - 1}
          </p>
        </div>
        <Button 
          onClick={handleUpdateSeries}
          disabled={isLoading || updateSeriesMutation.isPending}
        >
          {updateSeriesMutation.isPending ? "Atualizando..." : "Atualizar Configuração"}
        </Button>
      </div>
    </Card>
  );
};

export default SeriesConfiguration;
