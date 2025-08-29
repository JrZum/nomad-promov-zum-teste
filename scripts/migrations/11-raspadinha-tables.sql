-- Migração para módulo de Raspadinha Virtual
-- Data: 2025-01-11

-- Tabela de configuração da raspadinha
CREATE TABLE IF NOT EXISTS public.configuracao_raspadinha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ativa BOOLEAN NOT NULL DEFAULT false
);

-- Tabela de premiação da raspadinha
CREATE TABLE IF NOT EXISTS public.premiacao_raspadinha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  premio TEXT NOT NULL,
  descricao TEXT,
  quantidade_disponivel INTEGER NOT NULL DEFAULT 0,
  imagem TEXT
);

-- Tabela de sorteios da raspadinha
CREATE TABLE IF NOT EXISTS public.sorteios_raspadinha (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_sorteio DATE NOT NULL,
  premiacao_id UUID NOT NULL REFERENCES public.premiacao_raspadinha(id) ON DELETE CASCADE,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  quantidade_premiados INTEGER NOT NULL DEFAULT 1
);

-- Storage bucket para imagens de prêmios
INSERT INTO storage.buckets (id, name, public) 
VALUES ('premios-raspadinha', 'premios-raspadinha', true)
ON CONFLICT (id) DO NOTHING;

-- Política para o bucket premios-raspadinha
CREATE POLICY "Premios raspadinha são publicamente acessíveis" ON storage.objects FOR SELECT USING (bucket_id = 'premios-raspadinha');
CREATE POLICY "Admins podem fazer upload de premios" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'premios-raspadinha');
CREATE POLICY "Admins podem atualizar premios" ON storage.objects FOR UPDATE USING (bucket_id = 'premios-raspadinha');
CREATE POLICY "Admins podem deletar premios" ON storage.objects FOR DELETE USING (bucket_id = 'premios-raspadinha');

-- RLS
ALTER TABLE public.configuracao_raspadinha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premiacao_raspadinha ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorteios_raspadinha ENABLE ROW LEVEL SECURITY;

-- Políticas para configuracao_raspadinha
CREATE POLICY "Configuracao raspadinha é publicamente legível" ON public.configuracao_raspadinha FOR SELECT USING (true);
CREATE POLICY "Configuracao raspadinha é editável por qualquer um" ON public.configuracao_raspadinha FOR ALL USING (true);

-- Políticas para premiacao_raspadinha
CREATE POLICY "Premiacao raspadinha é publicamente legível" ON public.premiacao_raspadinha FOR SELECT USING (true);
CREATE POLICY "Premiacao raspadinha é editável por qualquer um" ON public.premiacao_raspadinha FOR ALL USING (true);

-- Políticas para sorteios_raspadinha
CREATE POLICY "Sorteios raspadinha são publicamente legíveis" ON public.sorteios_raspadinha FOR SELECT USING (true);
CREATE POLICY "Sorteios raspadinha são editáveis por qualquer um" ON public.sorteios_raspadinha FOR ALL USING (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_configuracao_raspadinha_updated_at BEFORE UPDATE ON public.configuracao_raspadinha FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_premiacao_raspadinha_updated_at BEFORE UPDATE ON public.premiacao_raspadinha FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sorteios_raspadinha_updated_at BEFORE UPDATE ON public.sorteios_raspadinha FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir configuração inicial da raspadinha
INSERT INTO public.configuracao_raspadinha (ativa) VALUES (false)
ON CONFLICT DO NOTHING;