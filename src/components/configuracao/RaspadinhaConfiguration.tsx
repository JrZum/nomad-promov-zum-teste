
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Upload, Calendar, Award } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface SorteioRaspadinha {
  id: string;
  data_sorteio: string;
  premiacao_id: string;
  hora_inicio: string;
  hora_fim: string;
  quantidade_premiados: number;
  premiacao_raspadinha?: {
    premio: string;
  } | null;
}

interface PremiacaoRaspadinha {
  id: string;
  premio: string;
  descricao: string;
  quantidade_disponivel: number;
  imagepremio: string | null;
}

const RaspadinhaConfiguration = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados para configuração geral
  const [raspadinhaAtiva, setRaspadinhaAtiva] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para premiação
  const [premiacoes, setPremiacoes] = useState<PremiacaoRaspadinha[]>([]);
  const [showPremiacaoDialog, setShowPremiacaoDialog] = useState(false);
  const [editingPremiacao, setEditingPremiacao] = useState<PremiacaoRaspadinha | null>(null);
  const [premiacaoForm, setPremiacaoForm] = useState({
    premio: "",
    descricao: "",
    quantidade_disponivel: 1,
    imagepremio: null as File | null
  });
  
  // Estados para sorteios
  const [sorteios, setSorteios] = useState<SorteioRaspadinha[]>([]);
  const [showSorteioDialog, setShowSorteioDialog] = useState(false);
  const [editingSorteio, setEditingSorteio] = useState<SorteioRaspadinha | null>(null);
  const [sorteioForm, setSorteioForm] = useState({
    data_sorteio: "",
    premiacao_id: "",
    hora_inicio: "",
    hora_fim: "",
    quantidade_premiados: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Carregar prêmios primeiro
      await loadPremiacoes();
      // Depois carregar sorteios (que dependem dos prêmios)
      await loadSorteios();
    } finally {
      setIsLoading(false);
    }
  };

  const loadPremiacoes = async () => {
    try {
      const { data, error } = await supabase
        .from("premiacao_raspadinha" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar premiações:", error);
        return;
      }

      setPremiacoes((data || []) as unknown as PremiacaoRaspadinha[]);
    } catch (error) {
      console.error("Erro ao carregar premiações:", error);
    }
  };

  const loadSorteios = async () => {
    try {
      const { data, error } = await supabase
        .from("sorteios_raspadinha" as any)
        .select("*")
        .order('data_sorteio', { ascending: false });

      if (error) {
        console.error("Erro ao carregar sorteios:", error);
        return;
      }

      // Carregar os dados dos prêmios para cada sorteio
      const sortedData = (data || []) as unknown as SorteioRaspadinha[];
      const sorteiosComPremios = await Promise.all(
        sortedData.map(async (sorteio) => {
          // Buscar o prêmio correspondente
          const premio = premiacoes.find(p => p.id === sorteio.premiacao_id);
          return {
            ...sorteio,
            premiacao_raspadinha: premio ? { premio: premio.premio } : null
          };
        })
      );

      setSorteios(sorteiosComPremios);
      // Atualizar status ativo baseado na existência de sorteios
      setRaspadinhaAtiva(sorteiosComPremios.length > 0);
    } catch (error) {
      console.error("Erro ao carregar sorteios:", error);
    }
  };

  const toggleRaspadinha = () => {
    // Para ativar/desativar, apenas controlamos a interface
    // A funcionalidade real depende de ter sorteios configurados
    setRaspadinhaAtiva(!raspadinhaAtiva);
    toast({
      title: "Sucesso",
      description: `Raspadinha ${!raspadinhaAtiva ? "ativada" : "desativada"} com sucesso`,
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('premios-raspadinha')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      toast({
        title: "Erro",
        description: `Erro ao fazer upload da imagem: ${uploadError.message}`,
        variant: "destructive",
      });
      return null;
    }

    const { data } = supabase.storage
      .from('premios-raspadinha')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSavePremiacao = async () => {
    if (!premiacaoForm.premio.trim()) {
      toast({
        title: "Erro",
        description: "Nome do prêmio é obrigatório",
        variant: "destructive",
      });
      return;
    }

    let imagemUrl = editingPremiacao?.imagepremio || null;

    if (premiacaoForm.imagepremio) {
      imagemUrl = await uploadImage(premiacaoForm.imagepremio);
      if (!imagemUrl) return;
    }

    const premiacaoData = {
      premio: premiacaoForm.premio,
      descricao: premiacaoForm.descricao,
      quantidade_disponivel: premiacaoForm.quantidade_disponivel,
      imagepremio: imagemUrl
    };

    let error;

    if (editingPremiacao) {
      const { error: updateError } = await supabase
        .from("premiacao_raspadinha" as any)
        .update(premiacaoData)
        .eq("id", editingPremiacao.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("premiacao_raspadinha" as any)
        .insert(premiacaoData);
      error = insertError;
    }

    if (error) {
      toast({
        title: "Erro",
        description: `Erro ao salvar premiação: ${error.message}`,
        variant: "destructive",
      });
      return;
    }

    await loadPremiacoes();
    resetPremiacaoForm();
    setShowPremiacaoDialog(false);
    
    toast({
      title: "Sucesso",
      description: `Premiação ${editingPremiacao ? "atualizada" : "criada"} com sucesso`,
    });
  };

  const handleSaveSorteio = async () => {
    if (!sorteioForm.data_sorteio || !sorteioForm.premiacao_id || !sorteioForm.hora_inicio || !sorteioForm.hora_fim) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const sorteioData = {
      data_sorteio: sorteioForm.data_sorteio,
      premiacao_id: sorteioForm.premiacao_id,
      hora_inicio: sorteioForm.hora_inicio,
      hora_fim: sorteioForm.hora_fim,
      quantidade_premiados: sorteioForm.quantidade_premiados
    };

    let error;

    if (editingSorteio) {
      const { error: updateError } = await supabase
        .from("sorteios_raspadinha" as any)
        .update(sorteioData)
        .eq("id", editingSorteio.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("sorteios_raspadinha" as any)
        .insert(sorteioData);
      error = insertError;
    }

    if (error) {
      toast({
        title: "Erro",
        description: `Erro ao salvar sorteio: ${error.message}`,
        variant: "destructive",
      });
      return;
    }

    await loadSorteios();
    resetSorteioForm();
    setShowSorteioDialog(false);
    
    toast({
      title: "Sucesso",
      description: `Sorteio ${editingSorteio ? "atualizado" : "criado"} com sucesso`,
    });
  };

  const handleDeletePremiacao = async (id: string) => {
    const { error } = await supabase
      .from("premiacao_raspadinha" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar premiação",
        variant: "destructive",
      });
      return;
    }

    await loadPremiacoes();
    toast({
      title: "Sucesso",
      description: "Premiação deletada com sucesso",
    });
  };

  const handleDeleteSorteio = async (id: string) => {
    const { error } = await supabase
      .from("sorteios_raspadinha" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar sorteio",
        variant: "destructive",
      });
      return;
    }

    await loadSorteios();
    toast({
      title: "Sucesso",
      description: "Sorteio deletado com sucesso",
    });
  };

  const resetPremiacaoForm = () => {
    setPremiacaoForm({
      premio: "",
      descricao: "",
      quantidade_disponivel: 1,
      imagepremio: null
    });
    setEditingPremiacao(null);
  };

  const resetSorteioForm = () => {
    setSorteioForm({
      data_sorteio: "",
      premiacao_id: "",
      hora_inicio: "",
      hora_fim: "",
      quantidade_premiados: 1
    });
    setEditingSorteio(null);
  };

  const openEditPremiacao = (premiacao: PremiacaoRaspadinha) => {
    setEditingPremiacao(premiacao);
    setPremiacaoForm({
      premio: premiacao.premio,
      descricao: premiacao.descricao,
      quantidade_disponivel: premiacao.quantidade_disponivel,
      imagepremio: null
    });
    setShowPremiacaoDialog(true);
  };

  const openEditSorteio = (sorteio: SorteioRaspadinha) => {
    setEditingSorteio(sorteio);
    setSorteioForm({
      data_sorteio: sorteio.data_sorteio,
      premiacao_id: sorteio.premiacao_id,
      hora_inicio: sorteio.hora_inicio,
      hora_fim: sorteio.hora_fim,
      quantidade_premiados: sorteio.quantidade_premiados
    });
    setShowSorteioDialog(true);
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Configuração Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Configuração Geral da Raspadinha
          </CardTitle>
          <CardDescription>
            Ative ou desative o módulo de raspadinha digital na campanha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="raspadinha-ativa"
              checked={raspadinhaAtiva}
              onCheckedChange={toggleRaspadinha}
            />
            <Label htmlFor="raspadinha-ativa">
              {raspadinhaAtiva ? "Raspadinha Ativada" : "Raspadinha Desativada"}
            </Label>
          </div>
          {raspadinhaAtiva && (
            <div className="mt-2">
              <Badge variant="default">Ativo</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gerenciamento de Prêmios e Sorteios */}
      {raspadinhaAtiva && (
        <Tabs defaultValue="premios" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="premios">Cadastro de Prêmios</TabsTrigger>
            <TabsTrigger value="sorteios">Configuração de Sorteios</TabsTrigger>
          </TabsList>

          {/* Aba de Prêmios */}
          <TabsContent value="premios">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Prêmios Cadastrados</CardTitle>
                    <CardDescription>
                      Gerencie os prêmios disponíveis para a raspadinha
                    </CardDescription>
                  </div>
                  <Dialog open={showPremiacaoDialog} onOpenChange={setShowPremiacaoDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { resetPremiacaoForm(); setShowPremiacaoDialog(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Prêmio
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingPremiacao ? "Editar Prêmio" : "Adicionar Novo Prêmio"}
                        </DialogTitle>
                        <DialogDescription>
                          Preencha as informações do prêmio
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="premio">Nome do Prêmio</Label>
                          <Input
                            id="premio"
                            value={premiacaoForm.premio}
                            onChange={(e) => setPremiacaoForm(prev => ({ ...prev, premio: e.target.value }))}
                            placeholder="Ex: Smartphone, Vale-compras, etc."
                          />
                        </div>
                        <div>
                          <Label htmlFor="descricao">Descrição</Label>
                          <Textarea
                            id="descricao"
                            value={premiacaoForm.descricao}
                            onChange={(e) => setPremiacaoForm(prev => ({ ...prev, descricao: e.target.value }))}
                            placeholder="Descrição detalhada do prêmio"
                          />
                        </div>
                        <div>
                          <Label htmlFor="quantidade">Quantidade Disponível</Label>
                          <Input
                            id="quantidade"
                            type="number"
                            min="1"
                            value={premiacaoForm.quantidade_disponivel}
                            onChange={(e) => setPremiacaoForm(prev => ({ ...prev, quantidade_disponivel: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="imagem">Imagem do Prêmio</Label>
                          <Input
                            id="imagem"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setPremiacaoForm(prev => ({ ...prev, imagepremio: e.target.files?.[0] || null }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPremiacaoDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSavePremiacao}>
                          {editingPremiacao ? "Atualizar" : "Salvar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Imagem</TableHead>
                      <TableHead>Prêmio</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {premiacoes.map((premiacao) => (
                      <TableRow key={premiacao.id}>
                        <TableCell>
                          {premiacao.imagepremio && (
                            <img 
                              src={premiacao.imagepremio} 
                              alt={premiacao.premio}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{premiacao.premio}</TableCell>
                        <TableCell>{premiacao.descricao}</TableCell>
                        <TableCell>{premiacao.quantidade_disponivel}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditPremiacao(premiacao)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeletePremiacao(premiacao.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {premiacoes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum prêmio cadastrado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Sorteios */}
          <TabsContent value="sorteios">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Configuração de Sorteios
                    </CardTitle>
                    <CardDescription>
                      Configure as datas e horários dos sorteios
                    </CardDescription>
                  </div>
                  <Dialog open={showSorteioDialog} onOpenChange={setShowSorteioDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => { resetSorteioForm(); setShowSorteioDialog(true); }}
                        disabled={premiacoes.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Sorteio
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingSorteio ? "Editar Sorteio" : "Adicionar Novo Sorteio"}
                        </DialogTitle>
                        <DialogDescription>
                          Configure os detalhes do sorteio
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="data_sorteio">Data do Sorteio</Label>
                          <Input
                            id="data_sorteio"
                            type="date"
                            value={sorteioForm.data_sorteio}
                            onChange={(e) => setSorteioForm(prev => ({ ...prev, data_sorteio: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="premiacao">Prêmio</Label>
                          <Select
                            value={sorteioForm.premiacao_id}
                            onValueChange={(value) => setSorteioForm(prev => ({ ...prev, premiacao_id: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um prêmio" />
                            </SelectTrigger>
                            <SelectContent>
                              {premiacoes.map((premiacao) => (
                                <SelectItem key={premiacao.id} value={premiacao.id}>
                                  {premiacao.premio}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="hora_inicio">Hora de Início</Label>
                            <Input
                              id="hora_inicio"
                              type="time"
                              value={sorteioForm.hora_inicio}
                              onChange={(e) => setSorteioForm(prev => ({ ...prev, hora_inicio: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="hora_fim">Hora de Fim</Label>
                            <Input
                              id="hora_fim"
                              type="time"
                              value={sorteioForm.hora_fim}
                              onChange={(e) => setSorteioForm(prev => ({ ...prev, hora_fim: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="quantidade_premiados">Quantidade de Premiados</Label>
                          <Input
                            id="quantidade_premiados"
                            type="number"
                            min="1"
                            value={sorteioForm.quantidade_premiados}
                            onChange={(e) => setSorteioForm(prev => ({ ...prev, quantidade_premiados: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSorteioDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveSorteio}>
                          {editingSorteio ? "Atualizar" : "Salvar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {premiacoes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Cadastre prêmios primeiro para configurar sorteios</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Prêmio</TableHead>
                        <TableHead>Horário</TableHead>
                        <TableHead>Premiados</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorteios.map((sorteio) => (
                        <TableRow key={sorteio.id}>
                          <TableCell>
                            {new Date(sorteio.data_sorteio).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>{sorteio.premiacao_raspadinha?.premio}</TableCell>
                          <TableCell>
                            {sorteio.hora_inicio} - {sorteio.hora_fim}
                          </TableCell>
                          <TableCell>{sorteio.quantidade_premiados}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditSorteio(sorteio)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteSorteio(sorteio.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {sorteios.length === 0 && premiacoes.length > 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum sorteio configurado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default RaspadinhaConfiguration;
