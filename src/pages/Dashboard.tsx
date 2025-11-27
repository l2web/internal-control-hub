import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Brain, Users, AlertTriangle } from "lucide-react";
import { useChips } from "@/hooks/use-chips";
import { useOpenAIAccounts } from "@/hooks/use-openai-accounts";
import { useClients } from "@/hooks/use-clients";
import { formatDate, getDaysUntilExpiry, formatCurrency } from "@/lib/date-utils";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: chips = [] } = useChips();
  const { data: accounts = [] } = useOpenAIAccounts();
  const { data: clients = [] } = useClients();

  const chipsProximosVencimento = chips.filter(
    (chip) => getDaysUntilExpiry(chip.data_limite) <= 5
  );

  const totalGastos = accounts.reduce(
    (acc, account) => acc + (account.gasto_atual || 0),
    0
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema de automação"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total de Chips"
          value={chips.length}
          icon={<Smartphone className="w-6 h-6" />}
          variant="primary"
          delay={0}
        />
        <StatCard
          title="Contas OpenAI"
          value={accounts.length}
          icon={<Brain className="w-6 h-6" />}
          variant="default"
          delay={0.1}
        />
        <StatCard
          title="Clientes Ativos"
          value={clients.length}
          icon={<Users className="w-6 h-6" />}
          variant="success"
          delay={0.2}
        />
        <StatCard
          title="Gastos do Mês"
          value={formatCurrency(totalGastos)}
          icon={<Brain className="w-6 h-6" />}
          variant="warning"
          delay={0.3}
        />
      </div>

      {chipsProximosVencimento.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-destructive/50 bg-destructive/5 mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Chips Próximos ao Vencimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {chipsProximosVencimento.map((chip) => {
                  const days = getDaysUntilExpiry(chip.data_limite);
                  return (
                    <div
                      key={chip.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50"
                    >
                      <div>
                        <p className="font-medium">{chip.numero}</p>
                        <p className="text-sm text-muted-foreground">
                          {chip.api_usada}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">
                          {days <= 0
                            ? "Vencido"
                            : `${days} dia${days > 1 ? "s" : ""}`}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Limite: {formatDate(chip.data_limite)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Últimos Chips</CardTitle>
            </CardHeader>
            <CardContent>
              {chips.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum chip cadastrado
                </p>
              ) : (
                <div className="space-y-3">
                  {chips.slice(0, 5).map((chip) => (
                    <div
                      key={chip.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div>
                        <p className="font-medium">{chip.numero}</p>
                        <p className="text-sm text-muted-foreground">
                          {chip.api_usada}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(chip.data_limite)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clientes Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {clients.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum cliente cadastrado
                </p>
              ) : (
                <div className="space-y-3">
                  {clients.slice(0, 5).map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <p className="font-medium">{client.nome}</p>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {client.chips?.length || 0} chips
                        </Badge>
                        <Badge variant="outline">
                          {client.apis?.length || 0} APIs
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
