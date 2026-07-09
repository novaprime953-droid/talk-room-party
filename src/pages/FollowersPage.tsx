import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import FramedAvatar from "@/components/FramedAvatar";
import FollowButton from "@/components/FollowButton";
import EmptyState from "@/components/EmptyState";
import SunsetOrbs from "@/components/SunsetOrbs";
import { useAuth } from "@/hooks/useAuth";
import { useFollowCounts, useFollowList, FollowListKind } from "@/hooks/useFollow";

const FollowersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userId: paramId } = useParams<{ userId: string }>();
  const [sp, setSp] = useSearchParams();
  const targetId = paramId ?? user?.id;
  const tab = (sp.get("tab") ?? "followers") as FollowListKind;

  const { data: counts } = useFollowCounts(targetId);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="relative h-32 overflow-hidden" style={{ background: "var(--gradient-sunset)" }}>
        <SunsetOrbs variant="hero" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="absolute bottom-3 left-4 z-10 flex items-center gap-2">
          <Users className="w-5 h-5 text-white/90" />
          <h1 className="font-display font-black text-2xl text-white drop-shadow">People</h1>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        <div className="grid grid-cols-3 glass-card rounded-2xl py-3">
          <Stat label="Followers" value={counts?.followers ?? 0} />
          <Stat label="Following" value={counts?.following ?? 0} />
          <Stat label="Friends" value={counts?.friends ?? 0} />
        </div>
      </div>

      <div className="px-4 mt-5">
        <Tabs value={tab} onValueChange={(v) => setSp({ tab: v })}>
          <TabsList className="w-full grid grid-cols-4 bg-muted/30">
            <TabsTrigger value="followers" className="text-xs">Followers</TabsTrigger>
            <TabsTrigger value="following" className="text-xs">Following</TabsTrigger>
            <TabsTrigger value="friends" className="text-xs">Friends</TabsTrigger>
            <TabsTrigger value="suggested" className="text-xs">Suggested</TabsTrigger>
          </TabsList>
          {(["followers", "following", "friends", "suggested"] as FollowListKind[]).map((k) => (
            <TabsContent key={k} value={k} className="mt-4">
              <UserList kind={k} userId={targetId} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="text-center">
    <p className="font-display font-black text-foreground text-lg">{value}</p>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
  </div>
);

const UserList = ({ userId, kind }: { userId?: string; kind: FollowListKind }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useFollowList(userId, kind);
  if (isLoading) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!data?.length) {
    return <EmptyState title="No one here yet" description={kind === "suggested" ? "Come back later for new suggestions" : "Start connecting to see them here"} />;
  }
  return (
    <div className="space-y-2">
      {data.map((u: any) => (
        <div key={u.user_id} className="glass-card rounded-2xl p-3 flex items-center gap-3">
          <button onClick={() => navigate(`/u/${u.user_id_number ?? u.user_id}`)}>
            <FramedAvatar src={u.avatar_url} name={u.display_name ?? u.username} size="sm" />
          </button>
          <button onClick={() => navigate(`/u/${u.user_id_number ?? u.user_id}`)} className="flex-1 min-w-0 text-left">
            <p className="font-bold text-sm text-foreground truncate">{u.display_name ?? u.username}</p>
            <p className="text-[11px] text-muted-foreground truncate">ID: {u.user_id_number ?? "—"} · Lv {u.level ?? 1}</p>
          </button>
          <FollowButton targetId={u.user_id} variant="compact" />
        </div>
      ))}
    </div>
  );
};

export default FollowersPage;