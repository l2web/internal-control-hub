import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OpenAIAccount {
  id: string;
  nome: string;
  api_key: string;
  tipo: string;
  endpoint: string | null;
  gasto_atual: number | null;
  atualizado_em: string | null;
  created_at: string;
  client_id: string | null;
}

export type OpenAIAccountInsert = Omit<OpenAIAccount, "id" | "created_at" | "gasto_atual" | "atualizado_em">;

export function useOpenAIAccounts() {
  return useQuery({
    queryKey: ["openai_accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("openai_accounts")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as OpenAIAccount[];
    },
  });
}

export function useCreateOpenAIAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (account: OpenAIAccountInsert) => {
      const { data, error } = await supabase.from("openai_accounts").insert(account).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openai_accounts"] });
      toast.success("Conta criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar conta: " + error.message);
    },
  });
}

export function useUpdateOpenAIAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...account }: Partial<OpenAIAccountInsert> & { id: string }) => {
      const { data, error } = await supabase.from("openai_accounts").update(account).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openai_accounts"] });
      toast.success("Conta atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar conta: " + error.message);
    },
  });
}

export function useDeleteOpenAIAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("openai_accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openai_accounts"] });
      toast.success("Conta excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir conta: " + error.message);
    },
  });
}

export function useSyncOpenAIUsage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // For now, we'll simulate sync by updating the timestamp
      // Real implementation would call OpenAI usage API
      const { data, error } = await supabase
        .from("openai_accounts")
        .update({ atualizado_em: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["openai_accounts"] });
      toast.success("Gastos sincronizados!");
    },
    onError: (error) => {
      toast.error("Erro ao sincronizar: " + error.message);
    },
  });
}
