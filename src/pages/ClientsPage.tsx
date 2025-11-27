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
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient, Client } from "@/hooks/use-clients";
import { useChips } from "@/hooks/use-chips";
import { useOpenAIAccounts } from "@/hooks/use-openai-accounts";
import { formatDate } from "@/lib/date-utils";
import { motion } from "framer-motion";

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useClients();
  const { data: chips = [] } = useChips();
  const { data: accounts = [] } = useOpenAIAccounts();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    chips: [] as string[],
    apis: [] as string[],
  });

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        nome: client.nome,
        chips: client.chips || [],
        apis: client.apis || [],
      });
    } else {
      setEditingClient(null);
      setFormData({
        nome: "",
        chips: [],
        apis: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingClient) {
      updateClient.mutate({ id: editingClient.id, ...formData });
    } else {
      createClient.mutate(formData);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteClient.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const toggleChip = (chipId: string) => {
    setFormData((prev) => ({
      ...prev,
      chips: prev.chips.includes(chipId)
        ? prev.chips.filter((id) => id !== chipId)
        : [...prev.chips, chipId],
    }));
  };

  const toggleApi = (apiId: string) => {
    setFormData((prev) => ({
      ...prev,
      apis: prev.apis.includes(apiId)
        ? prev.apis.filter((id) => id !== apiId)
        : [...prev.apis, apiId],
    }));
  };

  const getChipName = (chipId: string) => {
    const chip = chips.find((c) => c.id === chipId);
    return chip?.numero || "Chip removido";
  };

  const getApiName = (apiId: string) => {
    const api = accounts.find((a) => a.id === apiId);
    return api?.nome || "API removida";
  };

  return (
    <DashboardLayout>
      <PageHeader title="Clientes" description="Gerenciamento de clientes e vinculação de recursos">
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
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
                    <TableHead>Chips Vinculados</TableHead>
                    <TableHead>APIs Vinculadas</TableHead>
                    <TableHead>Cadastrado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum cliente cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client, index) => (
                      <TableRow key={client.id} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                        <TableCell className="font-medium">{client.nome}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(client.chips || []).length === 0 ? (
                              <span className="text-muted-foreground text-sm">Nenhum</span>
                            ) : (
                              (client.chips || []).map((chipId) => (
                                <Badge key={chipId} variant="secondary" className="text-xs">
                                  {getChipName(chipId)}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(client.apis || []).length === 0 ? (
                              <span className="text-muted-foreground text-sm">Nenhum</span>
                            ) : (
                              (client.apis || []).map((apiId) => (
                                <Badge key={apiId} variant="outline" className="text-xs">
                                  {getApiName(apiId)}
                                </Badge>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(client.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(client)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setDeleteId(client.id)}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Nome do Cliente</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome da empresa ou pessoa"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="mb-3 block">Chips Vinculados</Label>
                <ScrollArea className="h-48 rounded-lg border p-3">
                  {chips.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum chip disponível</p>
                  ) : (
                    <div className="space-y-2">
                      {chips.map((chip) => (
                        <div key={chip.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`chip-${chip.id}`}
                            checked={formData.chips.includes(chip.id)}
                            onCheckedChange={() => toggleChip(chip.id)}
                          />
                          <label
                            htmlFor={`chip-${chip.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {chip.numero}
                            <span className="text-muted-foreground ml-2">({chip.api_usada})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div>
                <Label className="mb-3 block">APIs Vinculadas</Label>
                <ScrollArea className="h-48 rounded-lg border p-3">
                  {accounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma API disponível</p>
                  ) : (
                    <div className="space-y-2">
                      {accounts.map((account) => (
                        <div key={account.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`api-${account.id}`}
                            checked={formData.apis.includes(account.id)}
                            onCheckedChange={() => toggleApi(account.id)}
                          />
                          <label
                            htmlFor={`api-${account.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {account.nome}
                            <span className="text-muted-foreground ml-2">({account.tipo})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.nome}>
              {editingClient ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Todos os relatórios associados também serão excluídos.
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
