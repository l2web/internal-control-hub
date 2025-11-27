-- Add client_id column to openai_accounts table
ALTER TABLE public.openai_accounts 
ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;