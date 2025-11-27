import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FileText, Download, Loader2 } from "lucide-react";
import { useReports, useCreateReport, useDeleteReport } from "@/hooks/use-reports";
import { useClients } from "@/hooks/use-clients";
import { useChips } from "@/hooks/use-chips";
import { useOpenAIAccounts } from "@/hooks/use-openai-accounts";
import { formatCurrency } from "@/lib/date-utils";
import { StatCard } from "@/components/ui/stat-card";
import { motion } from "framer-motion";
import jsPDF from "jspdf";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function ReportsPage() {
  const { data: reports = [], isLoading } = useReports();
  const { data: clients = [] } = useClients();
  const { data: chips = [] } = useChips();
  const { data: accounts = [] } = useOpenAIAccounts();
  const createReport = useCreateReport();
  const deleteReport = useDeleteReport();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>("");

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [formData, setFormData] = useState({
    client_id: "",
    mes: currentMonth,
    ano: currentYear,
    total_chips: 0,
    total_api: 0,
  });

  // Calculate totals automatically when client, month, and year change
  useEffect(() => {
    if (!formData.client_id) {
      setFormData(prev => ({ ...prev, total_chips: 0, total_api: 0 }));
      return;
    }

    // Calculate chips total - count chips belonging to this client
    const clientChips = chips.filter(chip => chip.client_id === formData.client_id);
    // For chips, we'll estimate a fixed cost per chip (you can adjust this logic)
    const chipsTotal = clientChips.length * 50; // R$ 50 per chip as example

    // Calculate API total - sum gasto_atual from accounts belonging to this client
    const clientAccounts = accounts.filter(acc => acc.client_id === formData.client_id);
    const apiTotal = clientAccounts.reduce((sum, acc) => sum + (acc.gasto_atual || 0), 0);

    setFormData(prev => ({
      ...prev,
      total_chips: chipsTotal,
      total_api: apiTotal,
    }));
  }, [formData.client_id, formData.mes, formData.ano, chips, accounts]);

  const filteredReports = useMemo(() => {
    if (!selectedClient || selectedClient === "all") return reports;
    return reports.filter((r) => r.client_id === selectedClient);
  }, [reports, selectedClient]);

  const totals = useMemo(() => {
    return filteredReports.reduce(
      (acc, report) => ({
        chips: acc.chips + (report.total_chips || 0),
        api: acc.api + (report.total_api || 0),
        total: acc.total + (report.total_geral || 0),
      }),
      { chips: 0, api: 0, total: 0 }
    );
  }, [filteredReports]);

  const handleOpenDialog = () => {
    setFormData({
      client_id: "",
      mes: currentMonth,
      ano: currentYear,
      total_chips: 0,
      total_api: 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    createReport.mutate(formData);
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteReport.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.nome || "Cliente removido";
  };

  const handleExportPDF = (report: typeof reports[0]) => {
    const doc = new jsPDF();
    const clientName = getClientName(report.client_id);
    
    // Header
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO MENSAL", 105, 25, { align: "center" });
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`${MONTHS[report.mes - 1]} ${report.ano}`, 105, 35, { align: "center" });
    
    // Client info
    doc.setFontSize(12);
    doc.text(`Cliente: ${clientName}`, 20, 55);
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, 65, 190, 65);
    
    // Financial summary title
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RESUMO FINANCEIRO", 20, 80);
    
    // Values
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Chips:`, 20, 95);
    doc.text(formatCurrency(report.total_chips), 190, 95, { align: "right" });
    
    doc.text(`Total API:`, 20, 107);
    doc.text(formatCurrency(report.total_api), 190, 107, { align: "right" });
    
    // Line separator
    doc.line(20, 115, 190, 115);
    
    // Total
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL GERAL:`, 20, 128);
    doc.text(formatCurrency(report.total_geral), 190, 128, { align: "right" });
    
    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 280);
    
    // Save PDF
    doc.save(`relatorio_${clientName.replace(/\s+/g, '_')}_${report.mes}_${report.ano}.pdf`);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Relatórios" description="Relatórios mensais consolidados por cliente">
        <Button onClick={handleOpenDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Relatório
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total em Chips"
          value={formatCurrency(totals.chips)}
          icon={<FileText className="w-6 h-6" />}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Total em APIs"
          value={formatCurrency(totals.api)}
          icon={<FileText className="w-6 h-6" />}
          variant="default"
          delay={0.1}
        />
        <StatCard
          title="Total Geral"
          value={formatCurrency(totals.total)}
          icon={<FileText className="w-6 h-6" />}
          variant="success"
          delay={0.2}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle>Histórico de Relatórios</CardTitle>
              <Select value={selectedClient || "all"} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filtrar por cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Cliente</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Total Chips</TableHead>
                    <TableHead className="text-right">Total API</TableHead>
                    <TableHead className="text-right">Total Geral</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum relatório encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report, index) => (
                      <TableRow key={report.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                        <TableCell className="font-medium">{getClientName(report.client_id)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {MONTHS[report.mes - 1]} {report.ano}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(report.total_chips)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(report.total_api)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(report.total_geral)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleExportPDF(report)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setDeleteId(report.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Relatório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData({ ...formData, client_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mês</Label>
                <Select
                  value={formData.mes.toString()}
                  onValueChange={(value) => setFormData({ ...formData, mes: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ano</Label>
                <Select
                  value={formData.ano.toString()}
                  onValueChange={(value) => setFormData({ ...formData, ano: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Chips</p>
                <p className="text-lg font-semibold">
                  {formData.client_id ? formatCurrency(formData.total_chips) : "Selecione um cliente"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.client_id ? `${chips.filter(c => c.client_id === formData.client_id).length} chips` : ""}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total API</p>
                <p className="text-lg font-semibold">
                  {formData.client_id ? formatCurrency(formData.total_api) : "Selecione um cliente"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.client_id ? `${accounts.filter(a => a.client_id === formData.client_id).length} contas` : ""}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-muted-foreground">Total Geral</p>
              <p className="text-2xl font-bold text-primary">
                {formData.client_id ? formatCurrency(formData.total_chips + formData.total_api) : "R$ 0,00"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.client_id}>
              Criar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
