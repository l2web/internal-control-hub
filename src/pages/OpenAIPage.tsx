import { useState } from "react";
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
import { Plus, Pencil, Trash2, RefreshCw, Eye, EyeOff } from "lucide-react";
import {
  useOpenAIAccounts,
  useCreateOpenAIAccount,
  useUpdateOpenAIAccount,
  useDeleteOpenAIAccount,
  useSyncOpenAIUsage,
  OpenAIAccount,
} from "@/hooks/use-openai-accounts";
import { useClients } from "@/hooks/use-clients";
import { formatDate, formatCurrency } from "@/lib/date-utils";
import { motion } from "framer-motion";

export default function OpenAIPage() {
  const { data: accounts = [], isLoading } = useOpenAIAccounts();
  const { data: clients = [] } = useClients();
  const createAccount = useCreateOpenAIAccount();
  const updateAccount = useUpdateOpenAIAccount();
  const deleteAccount = useDeleteOpenAIAccount();
  const syncUsage = useSyncOpenAIUsage();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<OpenAIAccount | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [viewingAccount, setViewingAccount] = useState<OpenAIAccount | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    api_key: "",
    tipo: "individual",
    endpoint: "https://api.openai.com/v1",
    client_id: null as string | null,
  });

  const getClientName = (clientId: string | null) => {
    if (!clientId) return "—";
    const client = clients.find((c) => c.id === clientId);
    return client?.nome || "—";
  };

  const handleOpenDialog = (account?: OpenAIAccount) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        nome: account.nome,
        api_key: account.api_key,
        tipo: account.tipo,
        endpoint: account.endpoint || "https://api.openai.com/v1",
        client_id: account.client_id,
      });
    } else {
      setEditingAccount(null);
      setFormData({
        nome: "",
        api_key: "",
        tipo: "individual",
        endpoint: "https://api.openai.com/v1",
        client_id: null,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingAccount) {
      updateAccount.mutate({ id: editingAccount.id, ...formData });
    } else {
      createAccount.mutate(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteAccount.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskApiKey = (key: string, show: boolean) => {
    if (show) return key;
    return key.slice(0, 7) + "..." + key.slice(-4);
  };

  return (
    <DashboardLayout>
      <PageHeader title="Contas OpenAI" description="Gerenciamento de API Keys e monitoramento de gastos">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </PageHeader>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="p-6">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Nome</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Gasto Atual</TableHead>
                    <TableHead>Última Sincronização</TableHead>
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
                  ) : accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma conta cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((account, index) => (
                      <TableRow
                        key={account.id}
                        className={`${index % 2 === 0 ? "bg-muted/20" : ""} cursor-pointer hover:bg-muted/40`}
                        onClick={() => setViewingAccount(account)}
                      >
                        <TableCell className="font-medium">{account.nome}</TableCell>
                        <TableCell>{getClientName(account.client_id)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {maskApiKey(account.api_key, showApiKey[account.id] || false)}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleApiKeyVisibility(account.id);
                              }}
                            >
                              {showApiKey[account.id] ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.tipo === "organizacional" ? "default" : "secondary"}>
                            {account.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(account.gasto_atual)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(account.atualizado_em)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                syncUsage.mutate(account.id);
                              }}
                              disabled={syncUsage.isPending}
                            >
                              <RefreshCw className={`w-4 h-4 ${syncUsage.isPending ? "animate-spin" : ""}`} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDialog(account);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(account.id);
                              }}
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar Conta" : "Nova Conta OpenAI"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Conta</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Conta principal, Backup, etc."
              />
            </div>
            <div>
              <Label>Cliente</Label>
              <Select
                value={formData.client_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, client_id: value === "none" ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>API Key</Label>
              <Input
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="sk-..."
                type="password"
              />
            </div>
            <div>
              <Label>Tipo de Acesso</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="organizacional">Organizacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Endpoint Base</Label>
              <Input
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.nome || !formData.api_key}>
              {editingAccount ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={!!viewingAccount} onOpenChange={() => setViewingAccount(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Conta</DialogTitle>
          </DialogHeader>
          {viewingAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Nome</Label>
                  <p className="font-medium">{viewingAccount.nome}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Cliente</Label>
                  <p className="font-medium">{getClientName(viewingAccount.client_id)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">API Key</Label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded flex-1 overflow-auto">
                    {maskApiKey(viewingAccount.api_key, showApiKey[`view-${viewingAccount.id}`] || false)}
                  </code>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => setShowApiKey((prev) => ({ ...prev, [`view-${viewingAccount.id}`]: !prev[`view-${viewingAccount.id}`] }))}
                  >
                    {showApiKey[`view-${viewingAccount.id}`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Tipo de Acesso</Label>
                  <Badge variant={viewingAccount.tipo === "organizacional" ? "default" : "secondary"}>
                    {viewingAccount.tipo}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Gasto Atual</Label>
                  <p className="font-medium">{formatCurrency(viewingAccount.gasto_atual)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Endpoint</Label>
                <p className="text-sm break-all">{viewingAccount.endpoint || "https://api.openai.com/v1"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Criado em</Label>
                  <p className="text-sm">{formatDate(viewingAccount.created_at)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Última Sincronização</Label>
                  <p className="text-sm">{formatDate(viewingAccount.atualizado_em)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingAccount(null)}>
              Fechar
            </Button>
            <Button onClick={() => {
              if (viewingAccount) {
                handleOpenDialog(viewingAccount);
                setViewingAccount(null);
              }
            }}>
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
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
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
