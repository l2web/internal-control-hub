import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Chip {
  id: string;
  numero: string;
  api_usada: string;
  token: string | null;
  url: string | null;
  ultima_recarga: string;
  data_limite: string;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

export type ChipInsert = Omit<Chip, "id" | "data_limite" | "created_at" | "updated_at">;

export function useChips() {
  return useQuery({
    queryKey: ["chips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chips")
        .select("*")
        .order("data_limite", { ascending: true });
      if (error) throw error;
      return data as Chip[];
    },
  });
}

export function useCreateChip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chip: ChipInsert) => {
      const { data, error } = await supabase.from("chips").insert(chip).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chips"] });
      toast.success("Chip criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar chip: " + error.message);
    },
  });
}

export function useUpdateChip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...chip }: Partial<ChipInsert> & { id: string }) => {
      const { data, error } = await supabase.from("chips").update(chip).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chips"] });
      toast.success("Chip atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar chip: " + error.message);
    },
  });
}

export function useDeleteChip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chips"] });
      toast.success("Chip excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir chip: " + error.message);
    },
  });
}
