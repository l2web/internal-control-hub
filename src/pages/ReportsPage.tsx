import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Trash2, FileText, Download } from "lucide-react";
import { useReports, useCreateReport, useDeleteReport } from "@/hooks/use-reports";
import { useClients } from "@/hooks/use-clients";
import { useChips } from "@/hooks/use-chips";
import { useOpenAIAccounts } from "@/hooks/use-openai-accounts";
import { formatCurrency } from "@/lib/date-utils";
import { StatCard } from "@/components/ui/stat-card";
import { motion } from "framer-motion";

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

  const filteredReports = useMemo(() => {
    if (!selectedClient) return reports;
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
    // Simple PDF export simulation - in production, use a library like jsPDF
    const content = `
RELATÓRIO MENSAL - ${MONTHS[report.mes - 1]} ${report.ano}
Cliente: ${getClientName(report.client_id)}

RESUMO FINANCEIRO
━━━━━━━━━━━━━━━━━
Total Chips: ${formatCurrency(report.total_chips)}
Total API: ${formatCurrency(report.total_api)}
━━━━━━━━━━━━━━━━━
TOTAL GERAL: ${formatCurrency(report.total_geral)}

Gerado em: ${new Date().toLocaleString('pt-BR')}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${getClientName(report.client_id)}_${report.mes}_${report.ano}.txt`;
    a.click();
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
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filtrar por cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os clientes</SelectItem>
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
            <div>
              <Label>Total de Chips (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.total_chips}
                onChange={(e) => setFormData({ ...formData, total_chips: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Total de API (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.total_api}
                onChange={(e) => setFormData({ ...formData, total_api: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Total Geral</p>
              <p className="text-2xl font-bold">
                {formatCurrency(formData.total_chips + formData.total_api)}
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
