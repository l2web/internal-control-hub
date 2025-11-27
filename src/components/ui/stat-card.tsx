import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: "default" | "primary" | "warning" | "success";
  delay?: number;
}

export function StatCard({ title, value, icon, variant = "default", delay = 0 }: StatCardProps) {
  const variantStyles = {
    default: "bg-card border-border",
    primary: "bg-primary/10 border-primary/30",
    warning: "bg-[hsl(var(--warning))]/10 border-[hsl(var(--warning))]/30",
    success: "bg-[hsl(var(--success))]/10 border-[hsl(var(--success))]/30",
  };

  const iconStyles = {
    default: "text-muted-foreground",
    primary: "text-primary",
    warning: "text-[hsl(var(--warning))]",
    success: "text-[hsl(var(--success))]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={cn("border", variantStyles[variant])}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{title}</p>
              <p className="text-2xl font-bold">{value}</p>
            </div>
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center bg-muted/50", iconStyles[variant])}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
