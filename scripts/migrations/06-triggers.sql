
-- Triggers creation
-- Last updated: 2025-05-16

-- Trigger para atualizar updated_at na configuração da campanha
CREATE TRIGGER update_configuracao_campanha_updated_at
BEFORE UPDATE ON public.configuracao_campanha
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar a quantidade de números do participante
CREATE TRIGGER update_participante_quantidade
AFTER INSERT OR DELETE ON public.numeros_sorte
FOR EACH ROW
EXECUTE FUNCTION public.update_participante_quantidade_numeros();
