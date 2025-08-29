
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { numberGenerationService } from "@/services/numberGenerationService";

const NumberGenerationForm = ({ isLoading }: { isLoading: boolean }) => {
  const { toast } = useToast();
  const [cpf_cnpj, setCpfCnpj] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const gerarNumerosMutation = useMutation({
    mutationFn: async ({ cpf_cnpj, quantidade }: { cpf_cnpj: string; quantidade: string }) => {
      const parsedQuantidade = parseInt(quantidade);
      
      // Validar entrada
      if (!cpf_cnpj || isNaN(parsedQuantidade) || parsedQuantidade < 1) {
        throw new Error('Dados inválidos');
      }

      console.log('Usando novo serviço de geração com:', { cpf_cnpj, quantidade: parsedQuantidade });

      // Usar o novo serviço de geração
      const result = await numberGenerationService.generateNumbers({
        cpf_cnpj,
        quantidade: parsedQuantidade
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao gerar números');
      }

      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Números gerados com sucesso",
        description: `Foram gerados ${data.quantidade_gerada} números para o CPF/CNPJ ${cpf_cnpj}`
      });
      setCpfCnpj("");
      setQuantidade("");
    },
    onError: (error: any) => {
      // Verificar mensagens específicas de erro
      if (error.message?.includes("não encontrado") || 
          error.message?.includes("Participante não encontrado")) {
        toast({
          title: "Participante não cadastrado",
          description: "Este CPF/CNPJ não pertence a um participante cadastrado.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : "Erro ao gerar números",
          variant: "destructive"
        });
      }
      console.error("Erro ao gerar números:", error);
    }
  });

  const handleGerarNumeros = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf_cnpj || !quantidade) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para gerar números",
        variant: "destructive"
      });
      return;
    }
    gerarNumerosMutation.mutate({ cpf_cnpj, quantidade });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Geração Manual de Números</h3>
      <form onSubmit={handleGerarNumeros} className="space-y-4">
        <div className="space-y-2">
          <Label>CPF/CNPJ</Label>
          <Input
            value={cpf_cnpj}
            onChange={(e) => setCpfCnpj(e.target.value)}
            placeholder="Digite o CPF ou CNPJ"
          />
        </div>
        <div className="space-y-2">
          <Label>Quantidade de Números</Label>
          <Input
            type="number"
            min="1"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Digite a quantidade de números"
          />
        </div>
        <Button 
          type="submit"
          disabled={isLoading || gerarNumerosMutation.isPending}
        >
          {gerarNumerosMutation.isPending ? "Gerando..." : "Gerar Números"}
        </Button>
      </form>
    </Card>
  );
};

export default NumberGenerationForm;
