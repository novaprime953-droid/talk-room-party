import { cn } from "@/lib/utils";

interface LevelBadgeProps {
  level: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const LevelBadge = ({ level, size = "sm", className }: LevelBadgeProps) => {
  const sizeClasses = {
    xs: "text-[7px] px-1 py-[1px]",
    sm: "text-[9px] px-1.5 py-0.5",
    md: "text-[10px] px-2 py-0.5",
  };

  return (
    <span
      className={cn(
        "rounded font-bold bg-primary/20 text-primary inline-block",
        sizeClasses[size],
        className
      )}
    >
      Lv.{level}
    </span>
  );
};

export default LevelBadge;
