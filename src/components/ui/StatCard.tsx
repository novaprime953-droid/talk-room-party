import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "primary" | "accent" | "vip" | "gold" | "success";
  className?: string;
  onClick?: () => void;
}

const toneMap = {
  primary: { bg: "gradient-ember", ring: "shadow-glow-primary text-primary" },
  accent: { bg: "bg-accent", ring: "text-accent" },
  vip: { bg: "gradient-vip", ring: "text-vip" },
  gold: { bg: "gradient-gold", ring: "text-coin" },
  success: { bg: "bg-online", ring: "text-online" },
} as const;

const StatCard = ({ icon: Icon, label, value, hint, tone = "primary", className, onClick }: Props) => {
  const t = toneMap[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "glass-card rounded-2xl p-3 flex items-center gap-3 w-full text-left transition-transform active:scale-[0.97]",
        onClick && "hover:shadow-lift",
        className
      )}
    >
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", t.bg)}>
        <Icon className="w-5 h-5 text-primary-foreground" strokeWidth={2.2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className="font-display font-bold text-lg text-foreground leading-tight truncate">{value}</p>
        {hint && <p className="text-[10px] text-muted-foreground truncate">{hint}</p>}
      </div>
    </button>
  );
};

export default StatCard;