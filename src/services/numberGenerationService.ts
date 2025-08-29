
import { supabase } from "@/integrations/supabase/client";
import { generateUniqueRandomNumbers } from "@/lib/utils/generateNumbers";

interface GenerateNumbersParams {
  cpf_cnpj: string;
  quantidade: number;
}

interface GenerateNumbersResult {
  success: boolean;
  numeros?: number[];
  quantidade_gerada?: number;
  error?: string;
}

export const numberGenerationService = {
  async generateNumbers({ cpf_cnpj, quantidade }: GenerateNumbersParams): Promise<GenerateNumbersResult> {
    try {
      console.log('Iniciando geração de números:', { cpf_cnpj, quantidade });

      // 1. Buscar configuração da campanha para determinar o range máximo
      const { data: configuracao, error: configError } = await supabase
        .from('configuracao_campanha')
        .select('series_numericas')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (configError && configError.code !== "PGRST116") {
        throw configError;
      }

      const seriesNumericas = configuracao?.series_numericas || 1;
      const maxNumber = seriesNumericas * 100000;

      console.log('Configuração da campanha:', { seriesNumericas, maxNumber });

      // 2. Buscar números existentes para evitar duplicatas
      const { data: numerosExistentes, error: numerosError } = await supabase
        .from('numeros_sorte')
        .select('numero');

      if (numerosError) throw numerosError;

      const existingSet = new Set(numerosExistentes?.map(n => n.numero) || []);
      console.log('Números existentes encontrados:', existingSet.size);

      // 3. Gerar novos números únicos
      const novosNumeros = generateUniqueRandomNumbers(quantidade, maxNumber, existingSet);
      console.log('Novos números gerados:', novosNumeros);

      // 4. Usar a função simplificada do banco para inserir
      const { data, error } = await supabase.rpc('gerar_numeros_sorte' as any, {
        p_documento: cpf_cnpj,
        p_numeros: novosNumeros
      });

      if (error) {
        console.error('Erro na função do banco:', error);
        throw error;
      }

      const result = data as any;
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        };
      }

      console.log('Números inseridos com sucesso via função do banco');

      return {
        success: true,
        numeros: novosNumeros,
        quantidade_gerada: result.numeros_inseridos
      };

    } catch (error) {
      console.error('Erro no serviço de geração de números:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
};
