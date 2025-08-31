
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Store, Users, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Loja {
  id: string;
  nome_loja: string;
  identificador_url: string;
  descricao: string;
  ativa: boolean;
  created_at: string;
  total_participantes: number;
}

interface FunctionResult {
  success: boolean;
  message?: string;
  error?: string;
}

const LojasParticipantes = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome_loja: '',
    identificador_url: '',
    descricao: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as lojas
  const { data: lojas = [], isLoading, error: queryError } = useQuery({
    queryKey: ['lojas-participantes'],
    queryFn: async () => {
      console.log('Buscando lojas participantes...');
      const { data, error } = await supabase.rpc('listar_lojas_participantes');
      
      if (error) {
        console.error('Erro ao buscar lojas:', error);
        throw new Error(`Erro na função RPC: ${error.message}`);
      }
      
      console.log('Lojas encontradas:', data);
      return data || [];
    },
    retry: (failureCount, error) => {
      console.log(`Tentativa ${failureCount} falhou:`, error);
      return failureCount < 2;
    }
  });

  // Mutation para cadastrar nova loja
  const cadastrarLojaMutation = useMutation({
    mutationFn: async (dadosLoja: typeof formData) => {
      console.log('Cadastrando loja:', dadosLoja);
      const { data, error } = await supabase.rpc('cadastrar_loja_participante', {
        p_nome_loja: dadosLoja.nome_loja,
        p_identificador_url: dadosLoja.identificador_url,
        p_descricao: dadosLoja.descricao || null
      });
      
      if (error) {
        console.error('Erro ao cadastrar loja:', error);
        throw new Error(`Erro na função RPC: ${error.message}`);
      }
      
      console.log('Resposta do cadastro:', data);
      return data as FunctionResult;
    },
    onSuccess: (result) => {
      console.log('Resultado do cadastro:', result);
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Loja cadastrada com sucesso!"
        });
        setFormData({ nome_loja: '', identificador_url: '', descricao: '' });
        setIsDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ['lojas-participantes'] });
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro desconhecido ao cadastrar loja",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('Erro na mutation:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao cadastrar loja. Verifique se as funções do banco estão configuradas.",
        variant: "destructive"
      });
    }
  });

  // Mutation para alterar status da loja
  const alterarStatusMutation = useMutation({
    mutationFn: async ({ id, ativa }: { id: string; ativa: boolean }) => {
      console.log('Alterando status da loja:', { id, ativa });
      const { data, error } = await supabase.rpc('alterar_status_loja_participante', {
        p_loja_id: id,
        p_ativa: ativa
      });
      
      if (error) {
        console.error('Erro ao alterar status:', error);
        throw new Error(`Erro na função RPC: ${error.message}`);
      }
      
      console.log('Resposta do status:', data);
      return data;
    },
    onSuccess: (result) => {
      console.log('Status alterado:', result);
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Status da loja alterado com sucesso!"
        });
        queryClient.invalidateQueries({ queryKey: ['lojas-participantes'] });
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao alterar status",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error('Erro na mutation de status:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao alterar status da loja",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_loja || !formData.identificador_url) {
      toast({
        title: "Erro",
        description: "Nome da loja e identificador são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    cadastrarLojaMutation.mutate(formData);
  };

  const gerarIdentificador = (nomeLoja: string) => {
    const identificador = nomeLoja
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    setFormData(prev => ({ ...prev, identificador_url: identificador }));
  };

  if (isLoading) {
    return <div className="text-center py-8">Carregando lojas...</div>;
  }

  if (queryError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-semibold mb-2 text-destructive">Erro ao carregar lojas</h3>
          <p className="text-muted-foreground text-center mb-4">
            {queryError.message}
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Verifique se as funções do banco de dados estão configuradas corretamente.
            Execute o script: scripts/setup-lojas-participantes-complete.sql
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lojas Participantes</h2>
          <p className="text-muted-foreground">
            Gerencie as lojas que participam da campanha
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Loja
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Loja</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Loja</Label>
                <Input
                  id="nome"
                  value={formData.nome_loja}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, nome_loja: e.target.value }));
                    if (e.target.value && !formData.identificador_url) {
                      gerarIdentificador(e.target.value);
                    }
                  }}
                  placeholder="Ex: Loja Centro"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="identificador">Identificador URL</Label>
                <Input
                  id="identificador"
                  value={formData.identificador_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, identificador_url: e.target.value }))}
                  placeholder="Ex: centro"
                  pattern="^[a-z0-9-]+$"
                  title="Apenas letras minúsculas, números e hífens"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  URL: /auth?loja={formData.identificador_url || 'identificador'}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição da loja..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={cadastrarLojaMutation.isPending}
                  className="flex-1"
                >
                  {cadastrarLojaMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lojas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Store className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma loja cadastrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Cadastre a primeira loja para começar a segmentar os participantes
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lojas.map((loja) => (
            <Card key={loja.id} className={!loja.ativa ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{loja.nome_loja}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={loja.ativa ? 'default' : 'secondary'}>
                      {loja.ativa ? 'Ativa' : 'Inativa'}
                    </Badge>
                    <Switch
                      checked={loja.ativa}
                      onCheckedChange={(checked) => 
                        alterarStatusMutation.mutate({ id: loja.id, ativa: checked })
                      }
                      disabled={alterarStatusMutation.isPending}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Identificador</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {loja.identificador_url}
                  </code>
                </div>
                
                {loja.descricao && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                    <p className="text-sm">{loja.descricao}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {loja.total_participantes} participante{loja.total_participantes !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    URL de cadastro:
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
                    /auth?loja={loja.identificador_url}
                  </code>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LojasParticipantes;
