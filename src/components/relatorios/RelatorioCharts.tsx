
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RelatorioChartsProps {
  data: {
    participantes: any[];
    numeros: any[];
    stats: {
      totalParticipantes: number;
      totalNumeros: number;
      participantesPorLoja: Record<string, number>;
      numerosPorDia: Record<string, number>;
    };
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const RelatorioCharts = ({ data }: RelatorioChartsProps) => {
  // Dados para gráfico de participantes por cidade
  const dadosCidade = Object.entries(data.stats.participantesPorLoja).map(([cidade, quantidade]) => ({
    cidade: cidade === "null" || cidade === "undefined" ? "Sem Cidade" : cidade,
    quantidade,
    percentual: ((quantidade as number / data.stats.totalParticipantes) * 100).toFixed(1)
  }));

  // Dados para gráfico temporal
  const dadosTempo = Object.entries(data.stats.numerosPorDia)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dia, quantidade]) => ({
      dia: format(parseISO(dia), "dd/MM", { locale: ptBR }),
      quantidade,
      diaCompleto: dia
    }));

  // Distribuição de números por participante
  const distribuicaoNumeros = data.participantes.reduce((acc, participante) => {
    const qtdNumeros = data.numeros.filter(n => n.documento === participante.documento).length;
    const range = qtdNumeros === 0 ? "0" : 
                  qtdNumeros === 1 ? "1" :
                  qtdNumeros <= 3 ? "2-3" :
                  qtdNumeros <= 5 ? "4-5" : "6+";
    
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dadosDistribuicao = Object.entries(distribuicaoNumeros).map(([range, quantidade]) => ({
    range: `${range} números`,
    quantidade
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Participantes por Cidade */}
        <Card>
          <CardHeader>
            <CardTitle>Participantes por Cidade</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosCidade}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cidade" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Distribuição por Cidade */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Cidade (%)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosCidade}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ cidade, percentual }) => `${cidade}: ${percentual}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantidade"
                >
                  {dadosCidade.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Temporal */}
        {dadosTempo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Números Gerados por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosTempo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="quantidade" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Distribuição de Números por Participante */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Números</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosDistribuicao}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RelatorioCharts;
