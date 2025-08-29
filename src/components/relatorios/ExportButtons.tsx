import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExportButtonsProps {
  data: {
    participantes: any[];
    numeros: any[];
    stats: any;
  };
  filtros: {
    dataInicio?: Date;
    dataFim?: Date;
    loja: string;
    tipo: string;
  };
}

const ExportButtons = ({ data, filtros }: ExportButtonsProps) => {
  const formatarDados = () => {
    const { participantes, numeros } = data;
    
    // Combinar dados de participantes com seus números
    const dadosCompletos = participantes.map(participante => {
      const numerosParticipante = numeros.filter(n => n.documento === participante.documento);
      
      return {
        "Documento": participante.documento,
        "Nome": participante.nome || "Não informado",
        "Email": participante.email || "Não informado",
        "Telefone": participante.telefone || "Não informado",
        "Data Cadastro": format(new Date(participante.data_cadastro), "dd/MM/yyyy HH:mm", { locale: ptBR }),
        "Cidade": participante.cidade || "Sem cidade",
        "Estado": participante.uf || "Não informado",
        "Quantidade Números": numerosParticipante.length,
        "Números": numerosParticipante.map(n => n.numero).join(", "),
        "CEP": participante.cep || "Não informado",
        "Bairro": participante.bairro || "Não informado"
      };
    });

    return dadosCompletos;
  };

  const exportarCSV = () => {
    try {
      const dados = formatarDados();
      
      if (dados.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há participantes no período selecionado.",
          variant: "destructive"
        });
        return;
      }

      // Converter para CSV
      const headers = Object.keys(dados[0]);
      const csvContent = [
        headers.join(","),
        ...dados.map(row => 
          headers.map(header => {
            const value = row[header]?.toString() || "";
            // Escapar aspas e adicionar aspas se contém vírgula
            return value.includes(",") || value.includes('"') 
              ? `"${value.replace(/"/g, '""')}"` 
              : value;
          }).join(",")
        )
      ].join("\n");

      // Criar e baixar arquivo
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_participantes_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída",
        description: `${dados.length} registros exportados para CSV.`
      });
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para CSV.",
        variant: "destructive"
      });
    }
  };

  const exportarExcel = () => {
    try {
      const dados = formatarDados();
      
      if (dados.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há participantes no período selecionado.",
          variant: "destructive"
        });
        return;
      }

      // Criar workbook
      const wb = XLSX.utils.book_new();
      
      // Aba principal com dados dos participantes
      const ws1 = XLSX.utils.json_to_sheet(dados);
      XLSX.utils.book_append_sheet(wb, ws1, "Participantes");

      // Aba com resumo estatístico
      const estatisticas = [
        { "Métrica": "Total de Participantes", "Valor": data.stats.totalParticipantes },
        { "Métrica": "Total de Números", "Valor": data.stats.totalNumeros },
        { "Métrica": "Média de Números por Participante", "Valor": (data.stats.totalNumeros / data.stats.totalParticipantes || 0).toFixed(2) }
      ];
      
      const ws2 = XLSX.utils.json_to_sheet(estatisticas);
      XLSX.utils.book_append_sheet(wb, ws2, "Estatísticas");

      // Aba com dados por cidade
      const dadosPorCidade = Object.entries(data.stats.participantesPorLoja).map(([cidade, quantidade]) => ({
        "Cidade": cidade,
        "Participantes": quantidade,
        "Percentual": ((quantidade as number / data.stats.totalParticipantes) * 100).toFixed(1) + "%"
      }));
      
      const ws3 = XLSX.utils.json_to_sheet(dadosPorCidade);
      XLSX.utils.book_append_sheet(wb, ws3, "Por Cidade");

      // Salvar arquivo
      XLSX.writeFile(wb, `relatorio_completo_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);

      toast({
        title: "Exportação concluída",
        description: `Relatório Excel gerado com ${dados.length} registros.`
      });
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para Excel.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={exportarCSV}>
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>
      <Button variant="outline" onClick={exportarExcel}>
        <FileSpreadsheet className="h-4 w-4 mr-2" />
        Exportar Excel
      </Button>
    </div>
  );
};

export default ExportButtons;
