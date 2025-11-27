-- Tabela de Chips/Linhas Telefônicas
CREATE TABLE public.chips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  api_usada TEXT NOT NULL,
  token TEXT,
  url TEXT,
  ultima_recarga DATE NOT NULL,
  data_limite DATE GENERATED ALWAYS AS (ultima_recarga + INTERVAL '40 days') STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Contas OpenAI
CREATE TABLE public.openai_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  api_key TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'individual',
  endpoint TEXT DEFAULT 'https://api.openai.com/v1',
  gasto_atual DECIMAL(10, 2) DEFAULT 0,
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  chips UUID[] DEFAULT '{}',
  apis UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Relatórios de Clientes
CREATE TABLE public.client_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2020),
  total_chips DECIMAL(10, 2) DEFAULT 0,
  total_api DECIMAL(10, 2) DEFAULT 0,
  total_geral DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, mes, ano)
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chips_updated_at
  BEFORE UPDATE ON public.chips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Desabilitar RLS (uso interno sem autenticação conforme solicitado)
ALTER TABLE public.chips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openai_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_reports ENABLE ROW LEVEL SECURITY;

-- Políticas públicas (acesso total - uso interno)
CREATE POLICY "Allow all for chips" ON public.chips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for openai_accounts" ON public.openai_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for client_reports" ON public.client_reports FOR ALL USING (true) WITH CHECK (true);