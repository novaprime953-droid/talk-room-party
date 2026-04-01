import { useState } from "react";
import { Search, Trash2, Eye, EyeOff, Sparkles, Pin, PinOff, Flag, CheckCircle } from "lucide-react";
import { useAllPosts, useModeratePost, usePostReports } from "@/hooks/useSocial";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

const OwnerSocial = () => {
  const [tab, setTab] = useState<"posts" | "reports">("posts");
  const [search, setSearch] = useState("");
  const { data: posts, refetch: refetchPosts } = useAllPosts();
  const { data: reports, refetch: refetchReports } = usePostReports();
  const moderate = useModeratePost();

  const filtered = posts?.filter((p: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.content?.toLowerCase().includes(s) || p.profile?.display_name?.toLowerCase().includes(s) || String(p.profile?.user_id_number).includes(s);
  });

  const handleReportAction = async (reportId: string, action: "resolved" | "dismissed") => {
    const { error } = await supabase.from("post_reports").update({ status: action }).eq("id", reportId);
    if (error) toast.error(error.message);
    else { toast.success(`Report ${action}`); refetchReports(); }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-4">Social Management</h1>

      <div className="flex gap-2 mb-4">
        {(["posts", "reports"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${tab === t ? "gradient-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border/50"}`}>
            {t === "posts" ? "All Posts" : `Reports (${reports?.length ?? 0})`}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <>
          <div className="flex items-center gap-2 bg-card rounded-2xl px-4 py-2.5 mb-4 border border-border/50">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          </div>

          <div className="space-y-3">
            {filtered?.map((post: any) => (
              <div key={post.id} className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-foreground">{post.profile?.display_name || "User"}</p>
                    <p className="text-[10px] text-muted-foreground">ID: {post.profile?.user_id_number} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                      post.status === "active" ? "bg-online/10 text-online" :
                      post.status === "hidden" ? "bg-warning/10 text-warning" :
                      "bg-destructive/10 text-destructive"
                    }`}>{post.status}</span>
                    {post.is_promoted && <Sparkles className="w-3 h-3 text-accent" />}
                    {post.is_pinned && <Pin className="w-3 h-3 text-primary" />}
                  </div>
                </div>
                {post.content && <p className="text-xs text-foreground mb-3 line-clamp-3">{post.content}</p>}
                <div className="flex gap-1 flex-wrap">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => moderate.mutate({ postId: post.id, action: "delete" })}
                    className="p-1.5 rounded-lg bg-destructive/10 text-destructive text-[10px] font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => moderate.mutate({ postId: post.id, action: post.status === "hidden" ? "delete" : "hide" })}
                    className="p-1.5 rounded-lg bg-warning/10 text-warning text-[10px] font-bold flex items-center gap-1">{post.status === "hidden" ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />} {post.status === "hidden" ? "Show" : "Hide"}</motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => moderate.mutate({ postId: post.id, action: post.is_promoted ? "unpromote" : "promote" })}
                    className="p-1.5 rounded-lg bg-accent/10 text-accent text-[10px] font-bold flex items-center gap-1"><Sparkles className="w-3 h-3" /> {post.is_promoted ? "Unpromote" : "Promote"}</motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => moderate.mutate({ postId: post.id, action: post.is_pinned ? "unpin" : "pin" })}
                    className="p-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center gap-1">{post.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />} {post.is_pinned ? "Unpin" : "Pin"}</motion.button>
                </div>
              </div>
            ))}
            {(!filtered || filtered.length === 0) && (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                  <Flag className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No posts found</p>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          {reports?.map((r: any) => (
            <div key={r.id} className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
              <p className="text-sm font-bold text-foreground mb-1">Report: {r.reason}</p>
              <p className="text-[10px] text-muted-foreground mb-3">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</p>
              <div className="flex gap-2">
                <button onClick={() => handleReportAction(r.id, "resolved")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-online/10 text-online text-xs font-bold"><CheckCircle className="w-3 h-3" /> Resolve</button>
                <button onClick={() => handleReportAction(r.id, "dismissed")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/30 text-muted-foreground text-xs font-bold">Dismiss</button>
              </div>
            </div>
          ))}
          {(!reports || reports.length === 0) && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-online mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No pending reports</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerSocial;
