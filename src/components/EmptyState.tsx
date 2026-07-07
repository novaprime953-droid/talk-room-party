import { FileX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

const EmptyState = ({
  icon: Icon = FileX,
  title = "No Data Available",
  subtitle = "Records will appear here once activity is generated",
  action,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="relative mb-4">
        <div className="absolute inset-0 gradient-sunset opacity-25 blur-2xl rounded-full" />
        <div className="relative w-20 h-20 rounded-3xl glass-card flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl gradient-ember flex items-center justify-center shadow-glow-primary">
            <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={2} />
          </div>
        </div>
      </div>
      <p className="text-sm font-display font-bold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{subtitle}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
