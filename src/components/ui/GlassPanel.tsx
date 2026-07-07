import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface Props extends HTMLAttributes<HTMLDivElement> {
  glow?: "none" | "primary" | "accent" | "vip";
  padded?: boolean;
}

const glowMap = {
  none: "",
  primary: "shadow-[0_0_32px_hsl(18_100%_60%_/_0.15)]",
  accent: "shadow-[0_0_32px_hsl(330_78%_58%_/_0.15)]",
  vip: "shadow-[0_0_32px_hsl(252_76%_66%_/_0.18)]",
} as const;

const GlassPanel = forwardRef<HTMLDivElement, Props>(
  ({ className, glow = "none", padded = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "glass-card rounded-3xl",
        padded && "p-4",
        glowMap[glow],
        className
      )}
      {...props}
    />
  )
);
GlassPanel.displayName = "GlassPanel";

export default GlassPanel;