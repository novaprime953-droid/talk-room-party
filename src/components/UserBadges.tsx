import { useUserBadges } from "@/hooks/useBadges";
import { cn } from "@/lib/utils";

interface UserBadgesProps {
  userId?: string | null;
  size?: number;
  max?: number;
  className?: string;
}

/**
 * Horizontal row of earned role/title badges, sized to sit next to a username.
 */
const UserBadges = ({ userId, size = 22, max = 6, className }: UserBadgesProps) => {
  const { data: badges } = useUserBadges(userId);
  if (!badges || badges.length === 0) return null;
  const shown = badges.slice(0, max);
  const extra = badges.length - shown.length;

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {shown.map((b) => (
        <img
          key={b.key}
          src={b.image_url}
          alt={b.name}
          title={b.name}
          loading="lazy"
          style={{ height: size, width: size }}
          className="object-contain drop-shadow"
        />
      ))}
      {extra > 0 && (
        <span className="text-[9px] font-bold text-muted-foreground bg-muted/40 rounded-full px-1.5 py-0.5">
          +{extra}
        </span>
      )}
    </div>
  );
};

export default UserBadges;