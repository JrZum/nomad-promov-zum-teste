
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Store, Users, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CardListView from "./CardListView";
import TableView from "./TableView";
import ViewModeToggle from "./ViewModeToggle";
import SearchInput from "./SearchInput";
import { Participante, NumeroSorte, ViewMode } from "./types";

type Loja = {
  id: string;
  nome_loja: string;
  identificador_url: string;
  ativa: boolean;
  participantes_count: number;
};

const LojasDashboard = () => {
  const [selectedLoja, setSelectedLoja] = useState<string>("todas");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar todas as lojas
  const { data: lojas, isLoading: loadingLojas } = useQuery({
    queryKey: ["lojas-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('obter_todas_lojas' as any);
      if (error) throw error;
      const result = data as any;
      return (result?.lojas as Loja[]) || [];
    }
  });

  // Buscar participantes - removendo loja_identificador por enquanto
  const { data: participantesData, isLoading: loadingParticipantes } = useQuery({
    queryKey: ["participantes-por-loja", selectedLoja, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("participantes")
        .select("documento, nome, email, telefone, data_cadastro");

      // Filtrar por termo de busca
      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,documento.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order("data_cadastro", { ascending: false });
      if (error) throw error;
      return data as Participante[];
    }
  });

  // Buscar números da sorte para os participantes
  const { data: numerosData } = useQuery({
    queryKey: ["numeros-participantes", participantesData?.map(p => p.documento)],
    queryFn: async () => {
      if (!participantesData?.length) return {};
      
      const documentos = participantesData.map(p => p.documento);
      const { data, error } = await supabase
        .from("numeros_sorte")
        .select("documento, numero, created_at")
        .in("documento", documentos)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Agrupar por documento
      const numerosPorParticipante: Record<string, NumeroSorte[]> = {};
      data?.forEach((numero) => {
        if (!numerosPorParticipante[numero.documento]) {
          numerosPorParticipante[numero.documento] = [];
        }
        numerosPorParticipante[numero.documento].push(numero);
      });
      
      return numerosPorParticipante;
    },
    enabled: !!participantesData?.length
  });

  // Calcular estatísticas
  const totalParticipantes = participantesData?.length || 0;
  const totalNumeros = Object.values(numerosData || {}).reduce((acc, nums) => acc + nums.length, 0);
  const lojaAtual = lojas?.find(l => l.identificador_url === selectedLoja);

  if (loadingLojas) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando lojas...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Controles */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Select value={selectedLoja} onValueChange={setSelectedLoja}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Selecione uma loja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Lojas</SelectItem>
              <SelectItem value="sem-loja">Sem Loja Associada</SelectItem>
              {lojas?.map((loja) => (
                <SelectItem key={loja.id} value={loja.identificador_url}>
                  <div className="flex items-center gap-2">
                    <span>{loja.nome_loja}</span>
                    {!loja.ativa && (
                      <Badge variant="secondary" className="text-xs">Inativa</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <SearchInput 
            value={searchTerm} 
            onChange={setSearchTerm}
            placeholder="Buscar por nome, documento ou email..."
            className="w-full sm:w-80"
          />
        </div>
        
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedLoja === "todas" ? "Total de Participantes" : 
               selectedLoja === "sem-loja" ? "Participantes sem Loja" :
               `Participantes - ${lojaAtual?.nome_loja || selectedLoja}`}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalParticipantes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Números</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNumeros}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loja Selecionada</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {selectedLoja === "todas" ? "Todas" : 
               selectedLoja === "sem-loja" ? "Sem Loja" :
               lojaAtual?.nome_loja || selectedLoja}
            </div>
            {lojaAtual && (
              <Badge variant={lojaAtual.ativa ? "default" : "secondary"} className="mt-1">
                {lojaAtual.ativa ? "Ativa" : "Inativa"}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista de Participantes */}
      {loadingParticipantes ? (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando participantes...</span>
          </div>
        </Card>
      ) : !participantesData?.length ? (
        <Card className="p-6">
          <div className="text-center text-muted-foreground">
            {searchTerm ? 
              "Nenhum participante encontrado para os filtros aplicados." :
              "Nenhum participante encontrado."}
          </div>
        </Card>
      ) : (
        <>
          {viewMode === "table" ? (
            <Card>
              <CardContent className="p-0">
                <TableView 
                  participantes={participantesData} 
                  numerosPorParticipante={numerosData || {}} 
                />
              </CardContent>
            </Card>
          ) : (
            <CardListView 
              participantes={participantesData}
              numerosPorParticipante={numerosData || {}}
              viewMode={viewMode}
            />
          )}
        </>
      )}
    </div>
  );
};

export default LojasDashboard;
