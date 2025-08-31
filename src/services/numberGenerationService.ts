import { supabase } from "@/integrations/supabase/client";

interface GenerateNumbersParams {
  cpf_cnpj: string;
  quantidade: number;
}

interface GenerateNumbersResult {
  success: boolean;
  numeros?: number[];
  quantidade_gerada?: number;
  error?: string;
  algoritmo_usado?: string;
}

interface AlgorithmConfig {
  algorithm: string;
  sequential_start?: number;
  timestamp_multiplier?: number;
  enable_distribution_guarantee?: boolean;
}

// Load algorithm configuration from localStorage
function loadAlgorithmConfig(): AlgorithmConfig {
  try {
    const savedConfig = localStorage.getItem('algorithmConfig');
    if (savedConfig) {
      return JSON.parse(savedConfig);
    }
  } catch (error) {
    console.warn("Erro ao carregar configuração do algoritmo:", error);
  }
  
  // Default configuration
  return {
    algorithm: 'random',
    sequential_start: 0,
    timestamp_multiplier: 1000,
    enable_distribution_guarantee: false
  };
}

export const numberGenerationService = {
  async generateNumbers({ cpf_cnpj, quantidade }: GenerateNumbersParams): Promise<GenerateNumbersResult> {
    try {
      console.log("Iniciando geração de números para:", cpf_cnpj, "quantidade:", quantidade);
      
      // Load algorithm configuration
      const algorithmConfig = loadAlgorithmConfig();
      console.log("Configuração do algoritmo carregada:", algorithmConfig);
      
      // Verificar se há séries ativas
      const { data: seriesResult, error: seriesError } = await supabase
        .rpc("obter_series_ativas");
      
      if (seriesError) {
        console.error("Erro ao buscar séries ativas:", seriesError);
        return {
          success: false,
          error: "Erro ao verificar séries ativas"
        };
      }
      
      if (!seriesResult.success || !seriesResult.series?.length) {
        return {
          success: false,
          error: "Nenhuma série ativa encontrada. Configure as séries primeiro."
        };
      }
      
      console.log("Séries ativas encontradas:", seriesResult.series.length);
      
      // Chamar a função RPC do Supabase com configuração do algoritmo
      const { data: result, error: rpcError } = await supabase
        .rpc('gerar_numeros_participante', {
          p_cpf_cnpj: cpf_cnpj,
          p_quantidade: quantidade,
          p_algoritmo: algorithmConfig.algorithm,
          p_sequential_start: algorithmConfig.sequential_start,
          p_timestamp_multiplier: algorithmConfig.timestamp_multiplier,
          p_enable_distribution_guarantee: algorithmConfig.enable_distribution_guarantee
        });
      
      if (rpcError) {
        console.error("Erro na função RPC:", rpcError);
        return {
          success: false,
          error: "Erro ao gerar números no servidor"
        };
      }
      
      console.log("Resultado da função RPC:", result);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || "Erro desconhecido ao gerar números"
        };
      }
      
      return {
        success: true,
        numeros: result.numeros,
        quantidade_gerada: result.quantidade_gerada,
        algoritmo_usado: result.algoritmo_usado
      };
      
    } catch (error) {
      console.error("Erro no serviço de geração de números:", error);
      return {
        success: false,
        error: "Erro interno do serviço"
      };
    }
  }
};