import type { ReactNode } from "react";
import SunsetOrbs from "@/components/SunsetOrbs";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  height?: "sm" | "md" | "lg";
  curved?: boolean;
}

const heightMap = { sm: "pt-6 pb-8", md: "pt-8 pb-14", lg: "pt-10 pb-20" };

/**
 * Curved gradient page header with ambient sunset orbs.
 * Content sits above the orb layer. Bottom edge curves into the page below.
 */
const PageHero = ({ children, className, height = "md", curved = true }: Props) => (
  <div
    className={cn(
      "relative overflow-hidden text-primary-foreground px-4",
      "gradient-sunset animate-gradient",
      curved && "rounded-b-[2.5rem]",
      heightMap[height],
      className
    )}
  >
    <SunsetOrbs variant="soft" />
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/40 pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);

export default PageHero;