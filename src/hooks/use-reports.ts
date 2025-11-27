import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientReport {
  id: string;
  client_id: string;
  mes: number;
  ano: number;
  total_chips: number | null;
  total_api: number | null;
  total_geral: number | null;
  created_at: string;
}

export type ReportInsert = {
  client_id: string;
  mes: number;
  ano: number;
  total_chips?: number;
  total_api?: number;
  total_geral?: number;
};

export function useReports(clientId?: string) {
  return useQuery({
    queryKey: ["reports", clientId],
    queryFn: async () => {
      let query = supabase
        .from("client_reports")
        .select("*")
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });
      
      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ClientReport[];
    },
  });
}

export function useCreateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (report: ReportInsert) => {
      const total_geral = (report.total_chips || 0) + (report.total_api || 0);
      const { data, error } = await supabase
        .from("client_reports")
        .insert({ ...report, total_geral })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Relatório criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar relatório: " + error.message);
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Relatório excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir relatório: " + error.message);
    },
  });
}
