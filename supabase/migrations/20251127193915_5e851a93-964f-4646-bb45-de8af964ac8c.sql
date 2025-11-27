-- Add client_id column to chips table
ALTER TABLE public.chips ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_chips_client_id ON public.chips(client_id);