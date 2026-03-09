import { FileX } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
}

const EmptyState = ({
  icon: Icon = FileX,
  title = "No Data Available",
  subtitle = "Records will appear here once activity is generated",
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-border flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground text-center max-w-xs">{subtitle}</p>
    </div>
  );
};

export default EmptyState;
