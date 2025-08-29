
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Hash, MapPin, TrendingUp } from "lucide-react";

interface RelatorioStatsProps {
  stats: {
    totalParticipantes: number;
    totalNumeros: number;
    participantesPorLoja: Record<string, number>;
    numerosPorDia: Record<string, number>;
  };
}

const RelatorioStats = ({ stats }: RelatorioStatsProps) => {
  const mediaNumerosPorParticipante = stats.totalParticipantes > 0 
    ? (stats.totalNumeros / stats.totalParticipantes).toFixed(1)
    : "0";

  const cidadeMaisParticipantes = Object.entries(stats.participantesPorLoja)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Participantes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalParticipantes}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Números</CardTitle>
          <Hash className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalNumeros}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Média por Participante</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mediaNumerosPorParticipante}</div>
          <p className="text-xs text-muted-foreground">números por pessoa</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cidade Líder</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {cidadeMaisParticipantes ? cidadeMaisParticipantes[0] : "N/A"}
          </div>
          <p className="text-xs text-muted-foreground">
            {cidadeMaisParticipantes ? `${cidadeMaisParticipantes[1]} participantes` : "Sem dados"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioStats;
