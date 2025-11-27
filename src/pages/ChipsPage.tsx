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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Search, Eye, X } from "lucide-react";
import { useChips, useCreateChip, useUpdateChip, useDeleteChip, Chip } from "@/hooks/use-chips";
import { useClients } from "@/hooks/use-clients";
import { formatDate, getDaysUntilExpiry, getExpiryStatus } from "@/lib/date-utils";
import { motion } from "framer-motion";

export default function ChipsPage() {
  const { data: chips = [], isLoading } = useChips();
  const { data: clients = [] } = useClients();
  const createChip = useCreateChip();
  const updateChip = useUpdateChip();
  const deleteChip = useDeleteChip();

  const [search, setSearch] = useState("");
  const [filterExpiry, setFilterExpiry] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChip, setEditingChip] = useState<Chip | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewingChip, setViewingChip] = useState<Chip | null>(null);

  const [formData, setFormData] = useState({
    numero: "",
    api_usada: "",
    token: "",
    url: "",
    ultima_recarga: "",
    client_id: "",
  });

  const filteredChips = useMemo(() => {
    return chips.filter((chip) => {
      const matchesSearch =
        chip.numero.toLowerCase().includes(search.toLowerCase()) ||
        chip.api_usada.toLowerCase().includes(search.toLowerCase());

      if (filterExpiry === "all") return matchesSearch;
      const days = getDaysUntilExpiry(chip.data_limite);
      if (filterExpiry === "expired") return matchesSearch && days <= 0;
      if (filterExpiry === "critical") return matchesSearch && days > 0 && days <= 5;
      if (filterExpiry === "warning") return matchesSearch && days > 5 && days <= 15;
      return matchesSearch;
    });
  }, [chips, search, filterExpiry]);

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "Sem cliente";
    const client = clients.find((c) => c.id === clientId);
    return client?.nome || "Cliente não encontrado";
  };

  const handleOpenDialog = (chip?: Chip) => {
    if (chip) {
      setEditingChip(chip);
      setFormData({
        numero: chip.numero,
        api_usada: chip.api_usada,
        token: chip.token || "",
        url: chip.url || "",
        ultima_recarga: chip.ultima_recarga,
        client_id: chip.client_id || "",
      });
    } else {
      setEditingChip(null);
      setFormData({
        numero: "",
        api_usada: "",
        token: "",
        url: "",
        ultima_recarga: new Date().toISOString().split("T")[0],
        client_id: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    const dataToSave = {
      ...formData,
      client_id: formData.client_id || null,
    };
    if (editingChip) {
      updateChip.mutate({ id: editingChip.id, ...dataToSave });
    } else {
      createChip.mutate(dataToSave);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteChip.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (dataLimite: string) => {
    const status = getExpiryStatus(dataLimite);
    const days = getDaysUntilExpiry(dataLimite);

    if (status === "danger") {
      return (
        <Badge variant="destructive">
          {days <= 0 ? "Vencido" : `${days}d restantes`}
        </Badge>
      );
    }
    if (status === "warning") {
      return <Badge className="bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]">{days}d restantes</Badge>;
    }
    return <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]">{days}d restantes</Badge>;
  };

  return (
    <DashboardLayout>
      <PageHeader title="Gestão de Chips" description="Controle de linhas telefônicas e datas de recarga">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Chip
        </Button>
      </PageHeader>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número ou API..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterExpiry} onValueChange={setFilterExpiry}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="expired">Vencidos</SelectItem>
                  <SelectItem value="critical">Críticos (≤5 dias)</SelectItem>
                  <SelectItem value="warning">Atenção (≤15 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Número</TableHead>
                    <TableHead>API</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Última Recarga</TableHead>
                    <TableHead>Data Limite</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredChips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum chip encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChips.map((chip, index) => (
                      <TableRow 
                        key={chip.id} 
                        className={`${index % 2 === 0 ? "bg-muted/20" : ""} cursor-pointer hover:bg-muted/40`}
                        onClick={() => setViewingChip(chip)}
                      >
                        <TableCell className="font-medium">{chip.numero}</TableCell>
                        <TableCell>{chip.api_usada}</TableCell>
                        <TableCell>{getClientName(chip.client_id)}</TableCell>
                        <TableCell>{formatDate(chip.ultima_recarga)}</TableCell>
                        <TableCell>{formatDate(chip.data_limite)}</TableCell>
                        <TableCell>{getStatusBadge(chip.data_limite)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button size="icon" variant="ghost" onClick={() => setViewingChip(chip)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(chip)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteId(chip.id)}>
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

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChip ? "Editar Chip" : "Novo Chip"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Número do Chip</Label>
              <Input
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="+55 11 99999-9999"
              />
            </div>
            <div>
              <Label>API Utilizada</Label>
              <Input
                value={formData.api_usada}
                onChange={(e) => setFormData({ ...formData, api_usada: e.target.value })}
                placeholder="Evolution, Z-API, etc."
              />
            </div>
            <div>
              <Label>Cliente</Label>
              <Select 
                value={formData.client_id || "none"} 
                onValueChange={(value) => setFormData({ ...formData, client_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Token da API</Label>
              <Input
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                placeholder="Token de autenticação"
              />
            </div>
            <div>
              <Label>URL da API</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.exemplo.com"
              />
            </div>
            <div>
              <Label>Data da Última Recarga</Label>
              <Input
                type="date"
                value={formData.ultima_recarga}
                onChange={(e) => setFormData({ ...formData, ultima_recarga: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.numero || !formData.api_usada || !formData.ultima_recarga}>
              {editingChip ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!viewingChip} onOpenChange={() => setViewingChip(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Detalhes do Chip
            </DialogTitle>
          </DialogHeader>
          {viewingChip && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-sm">Número</Label>
                  <p className="font-medium">{viewingChip.numero}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">API Utilizada</Label>
                  <p className="font-medium">{viewingChip.api_usada}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Cliente</Label>
                  <p className="font-medium">{getClientName(viewingChip.client_id)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Status</Label>
                  <div className="mt-1">{getStatusBadge(viewingChip.data_limite)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Última Recarga</Label>
                  <p className="font-medium">{formatDate(viewingChip.ultima_recarga)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Data Limite</Label>
                  <p className="font-medium">{formatDate(viewingChip.data_limite)}</p>
                </div>
              </div>
              {viewingChip.token && (
                <div>
                  <Label className="text-muted-foreground text-sm">Token</Label>
                  <p className="font-mono text-sm bg-muted p-2 rounded break-all">{viewingChip.token}</p>
                </div>
              )}
              {viewingChip.url && (
                <div>
                  <Label className="text-muted-foreground text-sm">URL da API</Label>
                  <p className="font-mono text-sm bg-muted p-2 rounded break-all">{viewingChip.url}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label className="text-muted-foreground text-sm">Criado em</Label>
                  <p>{formatDate(viewingChip.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Atualizado em</Label>
                  <p>{formatDate(viewingChip.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingChip(null)}>
              Fechar
            </Button>
            <Button onClick={() => { setViewingChip(null); handleOpenDialog(viewingChip!); }}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este chip? Esta ação não pode ser desfeita.
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
