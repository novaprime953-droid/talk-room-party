import { cn } from "@/lib/utils";

interface FramedAvatarProps {
  src?: string | null;
  name?: string;
  frameUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showGlow?: boolean;
}

const sizeMap = {
  xs: { container: "w-8 h-8", text: "text-xs", frameInset: "-inset-1", frameExtra: "8px" },
  sm: { container: "w-10 h-10", text: "text-sm", frameInset: "-inset-1.5", frameExtra: "12px" },
  md: { container: "w-14 h-14", text: "text-lg", frameInset: "-inset-2", frameExtra: "16px" },
  lg: { container: "w-20 h-20", text: "text-2xl", frameInset: "-inset-2.5", frameExtra: "20px" },
  xl: { container: "w-24 h-24", text: "text-3xl", frameInset: "-inset-3", frameExtra: "24px" },
};

const FramedAvatar = ({ src, name, frameUrl, size = "md", className, showGlow }: FramedAvatarProps) => {
  const s = sizeMap[size];
  const initial = (name ?? "U").charAt(0).toUpperCase();

  return (
    <div className={cn("relative flex-shrink-0", className)} style={{ width: "fit-content" }}>
      {frameUrl && (
        <img
          src={frameUrl}
          alt=""
          className={`absolute ${s.frameInset} z-10 pointer-events-none object-contain`}
          style={{
            width: `calc(100% + ${s.frameExtra})`,
            height: `calc(100% + ${s.frameExtra})`,
          }}
        />
      )}
      <div
        className={cn(
          s.container,
          "rounded-full overflow-hidden flex items-center justify-center bg-muted/50",
          showGlow && "glow-primary"
        )}
      >
        {src ? (
          <img src={src} alt={name ?? ""} className="w-full h-full object-cover" />
        ) : (
          <span className={cn(s.text, "font-bold text-foreground")}>{initial}</span>
        )}
      </div>
    </div>
  );
};

export default FramedAvatar;
