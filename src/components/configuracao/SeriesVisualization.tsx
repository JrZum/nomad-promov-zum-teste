import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp } from "lucide-react";

interface SerieStats {
  numero_serie: number;
  intervalo_inicial: number;
  intervalo_final: number;
  numeros_utilizados: number;
  total_numeros: number;
  porcentagem_uso: number;
}

const SeriesVisualization = () => {
  const { data: seriesStats, isLoading } = useQuery({
    queryKey: ["series-stats"],
    queryFn: async () => {
      // Get active series
      const { data: seriesData, error: seriesError } = await supabase
        .rpc("obter_series_ativas");
      
      if (seriesError) throw seriesError;
      
      if (!seriesData.success || !seriesData.series?.length) {
        return [];
      }
      
      // Get usage statistics for each series
      const stats: SerieStats[] = [];
      
      for (const serie of seriesData.series) {
        const { count: numerosUtilizados, error: countError } = await supabase
          .from("numeros_sorte")
          .select("*", { count: "exact", head: true })
          .gte("numero", serie.intervalo_inicial)
          .lte("numero", serie.intervalo_final);
        
        if (countError) throw countError;
        
        const totalNumeros = serie.intervalo_final - serie.intervalo_inicial + 1;
        const porcentagemUso = ((numerosUtilizados || 0) / totalNumeros) * 100;
        
        stats.push({
          numero_serie: serie.numero_serie,
          intervalo_inicial: serie.intervalo_inicial,
          intervalo_final: serie.intervalo_final,
          numeros_utilizados: numerosUtilizados || 0,
          total_numeros: totalNumeros,
          porcentagem_uso: porcentagemUso
        });
      }
      
      return stats;
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estatísticas das Séries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-2 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!seriesStats || seriesStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Estatísticas das Séries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma série ativa encontrada. Configure as séries primeiro.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalUtilizados = seriesStats.reduce((sum, serie) => sum + serie.numeros_utilizados, 0);
  const totalDisponivel = seriesStats.reduce((sum, serie) => sum + serie.total_numeros, 0);
  const porcentagemGeralUso = (totalUtilizados / totalDisponivel) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Estatísticas das Séries
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview geral */}
        <div className="p-4 bg-primary/5 rounded-lg border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Uso Geral do Sistema</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono">
                {porcentagemGeralUso.toFixed(1)}%
              </span>
            </div>
          </div>
          <Progress value={porcentagemGeralUso} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalUtilizados.toLocaleString('pt-BR')} utilizados</span>
            <span>{totalDisponivel.toLocaleString('pt-BR')} total</span>
          </div>
        </div>

        {/* Estatísticas por série */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Detalhes por Série:</h4>
          {seriesStats.map((serie) => (
            <div key={serie.numero_serie} className="space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    Série {serie.numero_serie}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {serie.intervalo_inicial.toLocaleString('pt-BR')} - {serie.intervalo_final.toLocaleString('pt-BR')}
                  </span>
                </div>
                <span className="text-sm font-mono">
                  {serie.porcentagem_uso.toFixed(1)}%
                </span>
              </div>
              
              <Progress value={serie.porcentagem_uso} className="h-1.5" />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{serie.numeros_utilizados.toLocaleString('pt-BR')} números utilizados</span>
                <span>{(serie.total_numeros - serie.numeros_utilizados).toLocaleString('pt-BR')} disponíveis</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeriesVisualization;