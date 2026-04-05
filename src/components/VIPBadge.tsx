import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VIPBadgeProps {
  vipLevel: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const VIPBadge = ({ vipLevel, size = "sm", className }: VIPBadgeProps) => {
  if (vipLevel <= 0) return null;

  const sizeClasses = {
    xs: "text-[7px] px-1 py-[1px] gap-0.5",
    sm: "text-[9px] px-1.5 py-0.5 gap-1",
    md: "text-[10px] px-2 py-0.5 gap-1",
  };

  const iconSize = { xs: "w-2 h-2", sm: "w-3 h-3", md: "w-3.5 h-3.5" };

  return (
    <span
      className={cn(
        "rounded font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white inline-flex items-center",
        sizeClasses[size],
        className
      )}
    >
      <Crown className={iconSize[size]} />
      VIP{vipLevel}
    </span>
  );
};

export default VIPBadge;
