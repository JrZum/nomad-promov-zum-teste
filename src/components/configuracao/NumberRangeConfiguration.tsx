
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { MapPin, Plus, Trash2 } from "lucide-react";

interface NumberRange {
  id?: string;
  categoria: string;
  regiao: string;
  inicio: number;
  fim: number;
  ativo: boolean;
}

const NumberRangeConfiguration = () => {
  const [ranges, setRanges] = useState<NumberRange[]>([]);
  const [newRange, setNewRange] = useState<NumberRange>({
    categoria: "geral",
    regiao: "nacional",
    inicio: 1,
    fim: 100000,
    ativo: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const addRange = async () => {
    if (newRange.inicio >= newRange.fim) {
      toast({
        title: "Faixa inválida",
        description: "O número inicial deve ser menor que o final.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const newRangeWithId = { ...newRange, id: Date.now().toString() };
      setRanges([...ranges, newRangeWithId]);

      toast({
        title: "Faixa adicionada",
        description: "Nova faixa de números adicionada com sucesso.",
      });

      setNewRange({
        categoria: "geral",
        regiao: "nacional",
        inicio: 1,
        fim: 100000,
        ativo: true
      });
    } catch (error) {
      console.error("Erro ao adicionar faixa:", error);
      toast({
        title: "Erro ao adicionar faixa",
        description: "Não foi possível adicionar a faixa.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const removeRange = async (id: string) => {
    try {
      setRanges(ranges.filter(range => range.id !== id));
      toast({
        title: "Faixa removida",
        description: "Faixa de números removida com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao remover faixa:", error);
      toast({
        title: "Erro ao remover faixa",
        description: "Não foi possível remover a faixa.",
        variant: "destructive",
      });
    }
  };

  const categorias = [
    { value: "geral", label: "Geral" },
    { value: "promocional", label: "Promocional" },
    { value: "vip", label: "VIP" },
    { value: "especial", label: "Especial" }
  ];

  const regioes = [
    { value: "nacional", label: "Nacional" },
    { value: "sudeste", label: "Sudeste" },
    { value: "sul", label: "Sul" },
    { value: "nordeste", label: "Nordeste" },
    { value: "norte", label: "Norte" },
    { value: "centro-oeste", label: "Centro-Oeste" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Faixas de Números
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar nova faixa */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium">Nova Faixa</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={newRange.categoria} onValueChange={(value) => setNewRange({...newRange, categoria: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Região</Label>
              <Select value={newRange.regiao} onValueChange={(value) => setNewRange({...newRange, regiao: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regioes.map((reg) => (
                    <SelectItem key={reg.value} value={reg.value}>{reg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número Inicial</Label>
              <Input
                type="number"
                value={newRange.inicio}
                onChange={(e) => setNewRange({...newRange, inicio: parseInt(e.target.value) || 1})}
              />
            </div>

            <div className="space-y-2">
              <Label>Número Final</Label>
              <Input
                type="number"
                value={newRange.fim}
                onChange={(e) => setNewRange({...newRange, fim: parseInt(e.target.value) || 100000})}
              />
            </div>
          </div>

          <Button onClick={addRange} disabled={isSaving} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {isSaving ? "Adicionando..." : "Adicionar Faixa"}
          </Button>
        </div>

        {/* Lista de faixas existentes */}
        <div className="space-y-2">
          <h4 className="font-medium">Faixas Configuradas</h4>
          {ranges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma faixa configurada</p>
          ) : (
            <div className="space-y-2">
              {ranges.map((range) => (
                <div key={range.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium">
                      {categorias.find(c => c.value === range.categoria)?.label} - {regioes.find(r => r.value === range.regiao)?.label}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {range.inicio.toLocaleString()} - {range.fim.toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeRange(range.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NumberRangeConfiguration;
