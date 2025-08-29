
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ParticipanteDashboard = () => {
  const [documento, setDocumento] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: participante, isLoading } = useQuery({
    queryKey: ["participante", documento, isSearching],
    queryFn: async () => {
      if (!documento || !isSearching) return null;
      
      const { data, error } = await supabase
        .from("numeros_cada_participante")
        .select("*")
        .eq("documento", documento)
        .maybeSingle();

      if (error) {
        toast({
          title: "Erro ao buscar números",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }

      return data;
    },
    enabled: Boolean(documento && isSearching),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documento) {
      toast({
        title: "Documento obrigatório",
        description: "Por favor, informe seu CPF/CNPJ para consultar seus números",
        variant: "destructive"
      });
      return;
    }
    setIsSearching(true);
  };

  // Use the quantidade_numeros field from the database directly now that it's available
  const quantidadeCupons = participante?.quantidade_numeros ?? participante?.numeros_sorte?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Consulta de Números da Sorte</h2>
        <form onSubmit={handleSearch} className="flex gap-2 items-end mb-6">
          <div className="flex-1">
            <label htmlFor="documento" className="block text-sm font-medium text-gray-700 mb-1">
              CPF / CNPJ
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                id="documento"
                placeholder="Digite seu CPF ou CNPJ"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button type="submit">Consultar</Button>
        </form>

        {isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando seus números...</p>
          </div>
        )}

        {isSearching && !isLoading && !participante && (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-500">Nenhum registro encontrado para este CPF/CNPJ.</p>
          </div>
        )}

        {participante && (
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-medium text-lg">{participante.nome || "Participante"}</h3>
              <p className="text-sm text-gray-500">CPF/CNPJ: {participante.documento}</p>
              {participante.email && <p className="text-sm text-gray-500">Email: {participante.email}</p>}
              <div className="flex items-center mt-2 text-sm text-blue-600">
                <Ticket className="h-4 w-4 mr-1" />
                <span>Quantidade de cupons: {quantidadeCupons}</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Seus Números da Sorte:</h4>
              
              {participante.numeros_sorte?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {participante.numeros_sorte.map((numero, index) => (
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
                <p className="text-gray-500 text-sm">
                  Nenhum número da sorte foi gerado para este CPF/CNPJ ainda.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipanteDashboard;
