import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Image, Video, Send, MoreHorizontal, Flag, X, ChevronDown, Pin, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useFeed, useCreatePost, useLikePost, useMyLikes, usePostComments, useAddComment, useReportPost } from "@/hooks/useSocial";
import { formatDistanceToNow } from "date-fns";
import { FramedAvatar } from "@/components/FramedAvatar";

const SocialPage = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: posts, isLoading } = useFeed();
  const { data: myLikes } = useMyLikes();
  const createPost = useCreatePost();
  const likePost = useLikePost();
  const addComment = useAddComment();
  const reportPost = useReportPost();

  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + mediaFiles.length > 4) return;
    setMediaFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = () => setMediaPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeMedia = (idx: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== idx));
    setMediaPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePost = () => {
    if (!content.trim() && mediaFiles.length === 0) return;
    createPost.mutate({ content: content.trim(), mediaFiles }, {
      onSuccess: () => { setContent(""); setMediaFiles([]); setMediaPreviews([]); },
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl px-4 pt-4 pb-3 border-b border-border/30">
        <h1 className="text-xl font-display font-bold text-gradient-primary">Social</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Create Post */}
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
          <div className="flex gap-3">
            <FramedAvatar src={profile?.avatar_url} fallback={profile?.display_name} size="sm" />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                rows={2}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none"
              />
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {mediaPreviews.map((src, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden aspect-square">
                      <img src={src} className="w-full h-full object-cover" alt="" />
                      <button onClick={() => removeMedia(i)} className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaSelect} />
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-xs text-primary font-medium">
                <Image className="w-4 h-4" /> Photo
              </button>
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 text-xs text-accent font-medium">
                <Video className="w-4 h-4" /> Video
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handlePost}
              disabled={createPost.isPending || (!content.trim() && mediaFiles.length === 0)}
              className="px-4 py-1.5 rounded-full gradient-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
            >
              {createPost.isPending ? "Posting..." : "Post"}
            </motion.button>
          </div>
        </div>

        {/* Feed */}
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : posts && posts.length > 0 ? (
          posts.map((post: any) => (
            <PostCard
              key={post.id}
              post={post}
              isLiked={myLikes?.has(post.id) ?? false}
              onLike={() => likePost.mutate({ postId: post.id, isLiked: myLikes?.has(post.id) ?? false })}
              onComment={() => setOpenComments(openComments === post.id ? null : post.id)}
              onReport={() => { setReportModal(post.id); setMenuOpen(null); }}
              menuOpen={menuOpen === post.id}
              onMenuToggle={() => setMenuOpen(menuOpen === post.id ? null : post.id)}
              isCommentsOpen={openComments === post.id}
              commentText={commentText}
              setCommentText={setCommentText}
              onSubmitComment={() => {
                if (!commentText.trim()) return;
                addComment.mutate({ postId: post.id, content: commentText.trim() }, {
                  onSuccess: () => setCommentText(""),
                });
              }}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">No posts yet</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Be the first to share something!</p>
          </div>
        )}
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {reportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-card rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-display font-bold text-foreground mb-3">Report Post</h3>
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Why are you reporting this post?" rows={3}
                className="w-full bg-muted/30 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none mb-3" />
              <div className="flex gap-2">
                <button onClick={() => { setReportModal(null); setReportReason(""); }} className="flex-1 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground">Cancel</button>
                <button onClick={() => {
                  if (!reportReason.trim()) return;
                  reportPost.mutate({ postId: reportModal, reason: reportReason.trim() });
                  setReportModal(null); setReportReason("");
                }} className="flex-1 py-2 rounded-xl gradient-primary text-primary-foreground text-sm font-bold">Report</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PostCard = ({ post, isLiked, onLike, onComment, onReport, menuOpen, onMenuToggle, isCommentsOpen, commentText, setCommentText, onSubmitComment }: any) => {
  const profile = post.profile;

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <FramedAvatar src={profile?.avatar_url} fallback={profile?.display_name} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground truncate">{profile?.display_name || "User"}</span>
            {post.is_promoted && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-bold flex items-center gap-0.5"><Sparkles className="w-2.5 h-2.5" />Trending</span>}
            {post.is_pinned && <Pin className="w-3 h-3 text-primary" />}
          </div>
          <p className="text-[10px] text-muted-foreground">
            ID: {profile?.user_id_number || "..."} · Lv.{profile?.level} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="relative">
          <button onClick={onMenuToggle} className="p-1 text-muted-foreground"><MoreHorizontal className="w-4 h-4" /></button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-card border border-border rounded-xl shadow-lg z-10 py-1 w-32">
              <button onClick={onReport} className="flex items-center gap-2 px-3 py-2 text-xs text-destructive w-full hover:bg-muted/30"><Flag className="w-3 h-3" /> Report</button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && <p className="px-4 pb-2 text-sm text-foreground whitespace-pre-wrap">{post.content}</p>}

      {/* Media */}
      {post.media?.length > 0 && (
        <div className={`grid gap-0.5 ${post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {post.media.map((m: any) => (
            m.media_type === "video" ? (
              <video key={m.id} src={m.media_url} controls className="w-full aspect-video object-cover" />
            ) : (
              <img key={m.id} src={m.media_url} alt="" className="w-full aspect-square object-cover" />
            )
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-border/20">
        <button onClick={onLike} className="flex items-center gap-1.5 text-xs font-medium transition-colors">
          <Heart className={`w-4 h-4 ${isLiked ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
          <span className={isLiked ? "text-destructive" : "text-muted-foreground"}>{post.likes_count || 0}</span>
        </button>
        <button onClick={onComment} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <MessageCircle className="w-4 h-4" /> {post.comments_count || 0}
        </button>
        <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Share2 className="w-4 h-4" /> {post.shares_count || 0}
        </button>
      </div>

      {/* Comments */}
      {isCommentsOpen && (
        <CommentsSection postId={post.id} commentText={commentText} setCommentText={setCommentText} onSubmit={onSubmitComment} />
      )}
    </div>
  );
};

const CommentsSection = ({ postId, commentText, setCommentText, onSubmit }: any) => {
  const { data: comments } = usePostComments(postId);

  return (
    <div className="border-t border-border/20 p-4 pt-3 space-y-3">
      {comments?.map((c: any) => (
        <div key={c.id} className={`flex gap-2 ${c.parent_id ? "ml-8" : ""}`}>
          <div className="w-6 h-6 rounded-full bg-muted/50 overflow-hidden flex-shrink-0">
            {c.profile?.avatar_url ? <img src={c.profile.avatar_url} className="w-full h-full object-cover" /> : <span className="text-[8px] font-bold flex items-center justify-center h-full text-foreground">{(c.profile?.display_name || "U")[0]}</span>}
          </div>
          <div className="flex-1 bg-muted/20 rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-foreground">{c.profile?.display_name || "User"} <span className="font-normal text-muted-foreground">· ID: {c.profile?.user_id_number}</span></p>
            <p className="text-xs text-foreground mt-0.5">{c.content}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-2 items-center">
        <input
          value={commentText}
          onChange={(e: any) => setCommentText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-muted/20 rounded-full px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none"
          onKeyDown={(e: any) => e.key === "Enter" && onSubmit()}
        />
        <button onClick={onSubmit} className="p-2 text-primary"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  );
};

export default SocialPage;
