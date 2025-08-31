import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Loja {
  id: string;
  nome_loja: string;
  identificador_url: string;
  ativa: boolean;
  descricao: string;
}

export const useLojaAuth = () => {
  const [searchParams] = useSearchParams();
  const [loja, setLoja] = useState<Loja | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lojaParam = searchParams.get('loja');

  useEffect(() => {
    const verificarLoja = async () => {
      if (!lojaParam) {
        setLoja(null);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('Verificando loja:', lojaParam);
        const { data, error } = await supabase.rpc('obter_loja_por_identificador', {
          p_identificador: lojaParam
        });

        if (error) {
          console.error('Erro ao buscar loja:', error);
          setError(`Loja "${lojaParam}" não encontrada`);
          setLoja(null);
          return;
        }

        if (!data || data.length === 0) {
          setError(`Loja "${lojaParam}" não encontrada ou inativa`);
          setLoja(null);
          return;
        }

        const lojaData = data[0];
        console.log('Loja encontrada:', lojaData);
        setLoja(lojaData);
        
      } catch (err) {
        console.error('Erro ao verificar loja:', err);
        setError('Erro ao verificar loja');
        setLoja(null);
      } finally {
        setIsLoading(false);
      }
    };

    verificarLoja();
  }, [lojaParam]);

  return {
    loja,
    isLoading,
    error,
    isLojaMode: !!lojaParam,
    lojaIdentificador: lojaParam
  };
};