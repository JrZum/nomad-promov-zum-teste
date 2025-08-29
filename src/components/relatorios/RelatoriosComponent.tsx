
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar, Download, FileText, Users, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ExportButtons from "./ExportButtons";
import RelatorioStats from "./RelatorioStats";
import RelatorioCharts from "./RelatorioCharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type RelatorioData = {
  participantes: any[];
  numeros: any[];
  stats: {
    totalParticipantes: number;
    totalNumeros: number;
    participantesPorLoja: Record<string, number>;
    numerosPorDia: Record<string, number>;
  };
};

const RelatoriosComponent = () => {
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [lojaFiltro, setLojaFiltro] = useState<string>("todas");
  const [tipoRelatorio, setTipoRelatorio] = useState<string>("geral");

  // Buscar dados do relatório
  const { data: relatorioData, isLoading, refetch } = useQuery({
    queryKey: ["relatorio-dados", dataInicio, dataFim, lojaFiltro, tipoRelatorio],
    queryFn: async (): Promise<RelatorioData> => {
      let queryParticipantes = supabase
        .from("participantes")
        .select("*");

      // Aplicar filtros de data
      if (dataInicio) {
        queryParticipantes = queryParticipantes.gte("data_cadastro", dataInicio.toISOString());
      }
      if (dataFim) {
        queryParticipantes = queryParticipantes.lte("data_cadastro", dataFim.toISOString());
      }

      const { data: participantes, error: errorParticipantes } = await queryParticipantes;
      if (errorParticipantes) throw errorParticipantes;

      // Buscar números da sorte
      const documentos = participantes?.map(p => p.documento) || [];
      let numerosData: any[] = [];
      
      if (documentos.length > 0) {
        const { data: numeros, error: errorNumeros } = await supabase
          .from("numeros_sorte")
          .select("*")
          .in("documento", documentos);
        
        if (errorNumeros) throw errorNumeros;
        numerosData = numeros || [];
      }

      // Calcular estatísticas
      const stats = {
        totalParticipantes: participantes?.length || 0,
        totalNumeros: numerosData.length,
        participantesPorLoja: {},
        numerosPorDia: {}
      };

      // Agrupar por cidade (já que não temos loja_identificador)
      participantes?.forEach(p => {
        const cidade = p.cidade || "Sem Cidade";
        stats.participantesPorLoja[cidade] = (stats.participantesPorLoja[cidade] || 0) + 1;
      });

      // Agrupar números por dia
      numerosData.forEach(n => {
        const dia = format(new Date(n.created_at), "yyyy-MM-dd");
        stats.numerosPorDia[dia] = (stats.numerosPorDia[dia] || 0) + 1;
      });

      return {
        participantes: participantes || [],
        numeros: numerosData,
        stats
      };
    },
    enabled: true
  });

  const handleGerarRelatorio = () => {
    refetch();
    toast({
      title: "Relatório atualizado",
      description: "Os dados foram atualizados com os filtros aplicados."
    });
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Relatório Geral</SelectItem>
                  <SelectItem value="participantes">Apenas Participantes</SelectItem>
                  <SelectItem value="numeros">Apenas Números</SelectItem>
                  <SelectItem value="cidades">Por Cidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade</label>
              <Select value={lojaFiltro} onValueChange={setLojaFiltro}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Cidades</SelectItem>
                  <SelectItem value="sem-cidade">Sem Cidade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <DatePicker
                date={dataInicio}
                onDateChange={setDataInicio}
                placeholder="Selecionar data"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <DatePicker
                date={dataFim}
                onDateChange={setDataFim}
                placeholder="Selecionar data"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleGerarRelatorio} disabled={isLoading}>
              <TrendingUp className="h-4 w-4 mr-2" />
              {isLoading ? "Gerando..." : "Gerar Relatório"}
            </Button>
            
            {relatorioData && (
              <ExportButtons 
                data={relatorioData}
                filtros={{
                  dataInicio,
                  dataFim,
                  loja: lojaFiltro,
                  tipo: tipoRelatorio
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {relatorioData && (
        <RelatorioStats stats={relatorioData.stats} />
      )}

      {/* Gráficos */}
      {relatorioData && (
        <RelatorioCharts data={relatorioData} />
      )}
    </div>
  );
};

export default RelatoriosComponent;
