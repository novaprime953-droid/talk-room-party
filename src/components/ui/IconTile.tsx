import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  label: string;
  badge?: string | number;
  tone?: "primary" | "accent" | "vip" | "gold" | "muted";
  onClick?: () => void;
  className?: string;
}

const toneMap = {
  primary: "gradient-ember",
  accent: "bg-accent",
  vip: "gradient-vip",
  gold: "gradient-gold",
  muted: "bg-muted",
} as const;

const IconTile = ({ icon: Icon, label, badge, tone = "primary", onClick, className }: Props) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1.5 group active:scale-95 transition-transform",
      className
    )}
  >
    <div className="relative">
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-card group-hover:shadow-lift transition-shadow",
          toneMap[tone]
        )}
      >
        <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={2.2} />
      </div>
      {badge !== undefined && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center border-2 border-background">
          {badge}
        </span>
      )}
    </div>
    <span className="text-[10px] font-semibold text-foreground/80 group-hover:text-foreground">{label}</span>
  </button>
);

export default IconTile;