
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CardListView from "./CardListView";
import TableView from "./TableView";
import ViewModeToggle from "./ViewModeToggle";
import SearchInput from "./SearchInput";
import { Participante, NumeroSorte, ViewMode } from "./types";

const ParticipantesDashboard = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchTerm, setSearchTerm] = useState("");

  // Buscar todos os participantes
  const { data: participantes, isLoading: isLoadingParticipantes } = useQuery({
    queryKey: ["participantes", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("participantes")
        .select("documento, nome, email, telefone, data_cadastro");

      if (searchTerm) {
        query = query.or(`nome.ilike.%${searchTerm}%,documento.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order("data_cadastro", { ascending: false });
      if (error) throw error;
      return data as Participante[];
    }
  });

  // Buscar números da sorte para os participantes
  const { data: numerosPorParticipante } = useQuery({
    queryKey: ["numeros-participantes", participantes?.map(p => p.documento)],
    queryFn: async () => {
      if (!participantes?.length) return {};
      
      const documentos = participantes.map(p => p.documento);
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
    enabled: !!participantes?.length
  });

  if (isLoadingParticipantes) {
    return (
      <Card className="p-6">
        <CardContent className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando participantes...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <SearchInput 
          value={searchTerm} 
          onChange={setSearchTerm}
          placeholder="Buscar por nome, documento ou email..."
          className="w-full md:w-96"
        />
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {!participantes?.length ? (
        <Card className="p-6">
          <CardContent className="text-center text-muted-foreground">
            {searchTerm ? "Nenhum participante encontrado." : "Nenhum participante cadastrado ainda."}
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "table" ? (
            <Card>
              <CardContent className="p-0">
                <TableView 
                  participantes={participantes} 
                  numerosPorParticipante={numerosPorParticipante || {}} 
                />
              </CardContent>
            </Card>
          ) : (
            <CardListView 
              participantes={participantes}
              numerosPorParticipante={numerosPorParticipante || {}}
              viewMode={viewMode}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ParticipantesDashboard;
