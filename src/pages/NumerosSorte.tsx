
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Ticket } from "lucide-react";

// Define an interface for the participante data with the correct field names
interface ParticipanteData {
  id: string | null;
  nome: string | null;
  documento: string | null;
  email: string | null;
  telefone: string | null;
  rua: string | null;
  numero: string | null;
  cidade: string | null;
  complemento: string | null;
  cep: string | null;
  uf: string | null;
  numeros_sorte: number[] | null;
  quantidade_numeros: number | null;
}

const NumerosSorte = () => {
  const navigate = useNavigate();
  const [participanteId, setParticipanteId] = useState<string | null>(null);
  const [participanteDocumento, setParticipanteDocumento] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("participanteId");
    const documento = localStorage.getItem("participanteDocumento");
    
    if (!id || !documento) {
      toast({
        title: "Acesso não autorizado",
        description: "Você precisa fazer login para acessar esta página",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    
    setParticipanteId(id);
    setParticipanteDocumento(documento);
  }, [navigate]);

  const { data: participante, isLoading } = useQuery({
    queryKey: ["participante", participanteDocumento],
    queryFn: async () => {
      if (!participanteDocumento) return null;
      
      const { data, error } = await supabase
        .from("numeros_cada_participante")
        .select("*")
        .eq("documento", participanteDocumento)
        .maybeSingle();

      if (error) {
        toast({
          title: "Erro ao buscar números",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      return data as unknown as ParticipanteData;
    },
    enabled: Boolean(participanteDocumento),
  });

  const handleLogout = () => {
    localStorage.removeItem("participanteId");
    localStorage.removeItem("participanteDocumento");
    navigate("/auth");
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso"
    });
  };

  // Use the quantidade_numeros field from the database directly now that it's available
  const quantidadeCupons = participante?.quantidade_numeros ?? participante?.numeros_sorte?.length ?? 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando seus números...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Meus Números da Sorte</h1>
        <Button variant="outline" onClick={handleLogout}>Sair</Button>
      </div>

      {participante ? (
        <div className="space-y-6">
          <Card className="p-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Dados do Participante</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{participante.nome || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Documento</p>
                  <p className="font-medium">{participante.documento || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{participante.email || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{participante.telefone || "Não informado"}</p>
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center mt-2 text-blue-600">
                    <Ticket className="h-5 w-5 mr-2" />
                    <span className="font-medium">Quantidade de cupons: {quantidadeCupons}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Meus Números da Sorte</CardTitle>
            </CardHeader>
            <CardContent>
              {participante.numeros_sorte?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {participante.numeros_sorte.map((numero: number, index: number) => (
                    <Card key={index} className="bg-green-50 border border-green-100">
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-lg text-center text-green-700">
                          {String(numero).padStart(6, '0')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-4">
                        <p className="text-xs text-center text-gray-500">
                          Número Válido
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">Você ainda não possui números da sorte.</p>
                  <p className="text-sm text-gray-400 mt-2">Números são gerados quando você participa da promoção.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-8 border border-gray-200 rounded-lg">
          <p className="text-gray-500">Nenhum registro encontrado para este participante.</p>
        </div>
      )}
    </div>
  );
};

export default NumerosSorte;
