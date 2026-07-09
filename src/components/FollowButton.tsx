import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { useIsFollowing, useToggleFollow } from "@/hooks/useFollow";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Props {
  targetId?: string | null;
  variant?: "solid" | "outline" | "compact";
  className?: string;
}

const FollowButton = ({ targetId, variant = "solid", className }: Props) => {
  const { user } = useAuth();
  const { data: following } = useIsFollowing(targetId);
  const toggle = useToggleFollow();
  if (!user || !targetId || user.id === targetId) return null;

  const busy = toggle.isPending;
  const label = following ? "Following" : "Follow";
  const Icon = following ? UserCheck : UserPlus;

  if (variant === "compact") {
    return (
      <button
        disabled={busy}
        onClick={() => toggle.mutate(targetId)}
        className={cn(
          "h-8 px-3 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition",
          following
            ? "bg-muted/40 text-muted-foreground hover:bg-muted/60"
            : "text-primary-foreground shadow-lift",
          className,
        )}
        style={!following ? { background: "var(--gradient-sunset)" } : undefined}
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
        {label}
      </button>
    );
  }

  const solid = variant === "solid" && !following;
  return (
    <button
      disabled={busy}
      onClick={() => toggle.mutate(targetId)}
      className={cn(
        "flex-1 h-11 rounded-full text-sm font-bold inline-flex items-center justify-center gap-1.5 transition",
        following ? "glass-card text-foreground" : "text-primary-foreground shadow-lift",
        className,
      )}
      style={solid ? { background: "var(--gradient-sunset)" } : undefined}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
};

export default FollowButton;