import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Image, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SearchInput from "./SearchInput";
import ViewModeToggle from "./ViewModeToggle";
import CupomUpload from "./CupomUpload";
import { ViewMode } from "./types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Venda {
  id: string;
  documento: string;
  documentoFiscal: string;
  imagemCupom?: string;
  created_at: string;
}

const VendasDashboard = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendaId, setSelectedVendaId] = useState<string | null>(null);

  // Buscar todas as vendas
  const { data: vendas, isLoading: isLoadingVendas } = useQuery({
    queryKey: ["vendas", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("vendas")
        .select(`
          id,
          documento,
          documentoFiscal,
          imagemCupom,
          created_at
        `);

      if (searchTerm) {
        query = query.or(`documento.ilike.%${searchTerm}%,documentoFiscal.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as Venda[];
    }
  });

  if (isLoadingVendas) {
    return (
      <Card className="p-6">
        <CardContent className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando vendas...</span>
        </CardContent>
      </Card>
    );
  }

  const VendaCard = ({ venda }: { venda: Venda }) => {
    const hasCupom = !!venda.imagemCupom;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Doc. Fiscal: {venda.documentoFiscal || 'N/A'}</CardTitle>
            <Badge variant={hasCupom ? "default" : "secondary"}>
              {hasCupom ? "Com Cupom" : "Sem Cupom"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <p><strong>Documento:</strong> {venda.documento}</p>
            <p><strong>Data:</strong> {new Date(venda.created_at).toLocaleDateString()}</p>
          </div>
          
          <div className="flex gap-2">
            {hasCupom && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(venda.imagemCupom, '_blank')}
                className="flex-1"
              >
                <Image className="h-4 w-4 mr-2" />
                Ver Cupom
              </Button>
            )}
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="default"
                  className="flex-1"
                  onClick={() => setSelectedVendaId(venda.id)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Cupom
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload do Cupom Fiscal</DialogTitle>
                </DialogHeader>
                <CupomUpload
                  vendaId={venda.id}
                  imagemCupomAtual={venda.imagemCupom}
                  onUploadSuccess={() => {
                    // Refresh dos dados será feito automaticamente pelo react-query
                    setSelectedVendaId(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  const VendaTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3">Documento Fiscal</th>
            <th className="text-left p-3">Documento</th>
            <th className="text-left p-3">Data</th>
            <th className="text-left p-3">Status Cupom</th>
            <th className="text-left p-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {vendas?.map((venda) => {
            const hasCupom = !!venda.imagemCupom;
            return (
              <tr key={venda.id} className="border-b hover:bg-muted/50">
                <td className="p-3 font-medium">{venda.documentoFiscal || 'N/A'}</td>
                <td className="p-3">{venda.documento}</td>
                <td className="p-3">{new Date(venda.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <Badge variant={hasCupom ? "default" : "secondary"}>
                    {hasCupom ? "Com Cupom" : "Sem Cupom"}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {hasCupom && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(venda.imagemCupom, '_blank')}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => setSelectedVendaId(venda.id)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Upload do Cupom Fiscal - {venda.documentoFiscal || 'N/A'}</DialogTitle>
                        </DialogHeader>
                        <CupomUpload
                          vendaId={venda.id}
                          imagemCupomAtual={venda.imagemCupom}
                          onUploadSuccess={() => {
                            setSelectedVendaId(null);
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <SearchInput 
          value={searchTerm} 
          onChange={setSearchTerm}
          placeholder="Buscar por documento ou documento fiscal..."
          className="w-full md:w-96"
        />
        <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
      </div>

      {!vendas?.length ? (
        <Card className="p-6">
          <CardContent className="text-center text-muted-foreground">
            {searchTerm ? "Nenhuma venda encontrada." : "Nenhuma venda registrada ainda."}
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === "table" ? (
            <Card>
              <CardContent className="p-0">
                <VendaTable />
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendas.map((venda) => (
                <VendaCard key={venda.id} venda={venda} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VendasDashboard;