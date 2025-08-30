import { supabase } from "@/integrations/supabase/client";

export interface StoreData {
  id?: string;
  nome_loja: string;
  identificador_url: string;
  descricao?: string;
  ativa?: boolean;
  total_participantes?: number;
  created_at?: string;
}

export interface StoreResponse {
  success: boolean;
  error?: string;
  data?: StoreData | StoreData[];
}

export const storeService = {
  async listStores(): Promise<StoreResponse> {
    try {
      const { data, error } = await supabase.rpc('listar_lojas_participantes');

      if (error) {
        console.error("Erro ao listar lojas:", error);
        return {
          success: false,
          error: error.message || "Erro ao carregar lojas"
        };
      }

      const result = data as any;
      if (result && result.success) {
        return {
          success: true,
          data: result.data || []
        };
      } else {
        return {
          success: false,
          error: "Erro ao processar lista de lojas"
        };
      }
    } catch (error) {
      console.error("Erro inesperado ao listar lojas:", error);
      return {
        success: false,
        error: "Erro inesperado ao carregar lojas"
      };
    }
  },

  async createStore(storeData: Omit<StoreData, 'id' | 'ativa' | 'created_at' | 'total_participantes'>): Promise<StoreResponse> {
    try {
      const { data, error } = await supabase.rpc('cadastrar_loja_participante', {
        p_nome_loja: storeData.nome_loja,
        p_identificador_url: storeData.identificador_url,
        p_descricao: storeData.descricao || null
      });

      if (error) {
        console.error("Erro ao cadastrar loja:", error);
        return {
          success: false,
          error: error.message || "Erro ao cadastrar loja"
        };
      }

      const result = data as any;
      if (result && result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        return {
          success: false,
          error: result.error || "Erro ao processar cadastro da loja"
        };
      }
    } catch (error) {
      console.error("Erro inesperado ao cadastrar loja:", error);
      return {
        success: false,
        error: "Erro inesperado ao cadastrar loja"
      };
    }
  },

  async toggleStoreStatus(storeId: string, active: boolean): Promise<StoreResponse> {
    try {
      const { data, error } = await supabase.rpc('alterar_status_loja_participante', {
        p_loja_id: storeId,
        p_ativa: active
      });

      if (error) {
        console.error("Erro ao alterar status da loja:", error);
        return {
          success: false,
          error: error.message || "Erro ao alterar status da loja"
        };
      }

      const result = data as any;
      if (result && result.success) {
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: result.error || "Erro ao processar alteração de status"
        };
      }
    } catch (error) {
      console.error("Erro inesperado ao alterar status da loja:", error);
      return {
        success: false,
        error: "Erro inesperado ao alterar status da loja"
      };
    }
  }
};