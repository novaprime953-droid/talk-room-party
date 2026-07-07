import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  gradient?: boolean;
}

const SectionHeader = ({ icon: Icon, title, subtitle, action, gradient = true }: Props) => (
  <div className="flex items-end justify-between mb-4">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="w-10 h-10 rounded-2xl gradient-sunset flex items-center justify-center shadow-lift">
          <Icon className="w-5 h-5 text-primary-foreground" strokeWidth={2} />
        </div>
      )}
      <div>
        <h2 className={`font-display font-bold text-lg leading-tight ${gradient ? "text-gradient-sunset" : "text-foreground"}`}>
          {title}
        </h2>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export default SectionHeader;