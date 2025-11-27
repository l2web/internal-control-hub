import { format, differenceInDays, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "-";
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function getDaysUntilExpiry(dataLimite: string | Date | null | undefined): number {
  if (!dataLimite) return Infinity;
  const d = typeof dataLimite === "string" ? parseISO(dataLimite) : dataLimite;
  if (!isValid(d)) return Infinity;
  return differenceInDays(d, new Date());
}

export function getExpiryStatus(dataLimite: string | Date | null | undefined): "ok" | "warning" | "danger" {
  const days = getDaysUntilExpiry(dataLimite);
  if (days <= 5) return "danger";
  if (days <= 15) return "warning";
  return "ok";
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
