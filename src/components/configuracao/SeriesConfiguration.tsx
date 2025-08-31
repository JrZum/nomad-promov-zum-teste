
import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface SerieNumericaInfo {
  numero_serie: number;
  intervalo_inicial: number;
  intervalo_final: number;
}

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
  const [previewSeries, setPreviewSeries] = useState<SerieNumericaInfo[]>([]);

  // Fetch current series from database
  const { data: seriesData } = useQuery({
    queryKey: ["series-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("obter_series_ativas");
      if (error) throw error;
      return data;
    },
    enabled: true
  });

  // Calculate preview series when input changes
  useEffect(() => {
    const calculatePreview = () => {
      const preview: SerieNumericaInfo[] = [];
      for (let i = 1; i <= seriesNumericas; i++) {
        preview.push({
          numero_serie: i,
          intervalo_inicial: (i - 1) * 100000,
          intervalo_final: (i * 100000) - 1
        });
      }
      setPreviewSeries(preview);
    };

    if (seriesNumericas > 0) {
      calculatePreview();
    } else {
      setPreviewSeries([]);
    }
  }, [seriesNumericas]);

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
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Número de Séries Numéricas</Label>
          <Input
            type="number"
            min="1"
            max="10"
            value={seriesNumericas}
            onChange={(e) => setSeriesNumericas(parseInt(e.target.value) || 1)}
          />
          <p className="text-sm text-muted-foreground">
            Cada série contém 100.000 números consecutivos
          </p>
        </div>

        {/* Preview das séries */}
        {previewSeries.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Preview dos Intervalos:</Label>
            <div className="grid gap-2 max-h-48 overflow-y-auto">
              {previewSeries.map((serie) => (
                <div key={serie.numero_serie} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="font-mono">
                    Série {serie.numero_serie}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-mono">
                    {serie.intervalo_inicial.toLocaleString('pt-BR')} - {serie.intervalo_final.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Séries ativas atuais */}
        {seriesData?.success && seriesData.series?.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Séries Ativas no Sistema:</Label>
            <div className="grid gap-2 max-h-32 overflow-y-auto">
              {seriesData.series.map((serie: any) => (
                <div key={serie.numero_serie} className="flex items-center justify-between p-2 bg-primary/5 rounded-lg border">
                  <Badge variant="default" className="font-mono">
                    Série {serie.numero_serie}
                  </Badge>
                  <span className="text-sm font-mono">
                    {serie.intervalo_inicial.toLocaleString('pt-BR')} - {serie.intervalo_final.toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={handleUpdateSeries}
          disabled={isLoading || updateSeriesMutation.isPending}
          className="w-full"
        >
          {updateSeriesMutation.isPending ? "Atualizando..." : "Atualizar Configuração"}
        </Button>
      </div>
    </Card>
  );
};

export default SeriesConfiguration;
