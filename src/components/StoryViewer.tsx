import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react";
import { useDeleteStory, useViewStory, type StoryGroup } from "@/hooks/useStories";
import FramedAvatar from "@/components/FramedAvatar";
import { toast } from "sonner";

const DURATION_MS = 5000;

const StoryViewer = ({ groups, startIndex, onClose }: { groups: StoryGroup[]; startIndex: number; onClose: () => void }) => {
  const [groupIdx, setGroupIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const view = useViewStory();
  const del = useDeleteStory();

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  useEffect(() => {
    if (!story) return;
    view.mutate(story.id);
    setProgress(0);
    const start = Date.now();
    const interval = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / DURATION_MS);
      setProgress(p);
      if (p >= 1) {
        clearInterval(interval);
        next();
      }
    }, 50);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  const next = () => {
    if (!group) return onClose();
    if (storyIdx + 1 < group.stories.length) return setStoryIdx((i) => i + 1);
    if (groupIdx + 1 < groups.length) { setGroupIdx((i) => i + 1); setStoryIdx(0); }
    else onClose();
  };

  const prev = () => {
    if (storyIdx > 0) return setStoryIdx((i) => i - 1);
    if (groupIdx > 0) { setGroupIdx((i) => i - 1); setStoryIdx(0); }
  };

  const remove = async () => {
    if (!story) return;
    try {
      await del.mutateAsync(story.id);
      toast.success("Story deleted");
      next();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete");
    }
  };

  if (!group || !story) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 overflow-hidden rounded-full">
              <div
                className="h-full bg-white"
                style={{ width: `${i < storyIdx ? 100 : i === storyIdx ? progress * 100 : 0}%` }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-3 right-3 z-20 flex items-center gap-2">
          <FramedAvatar src={group.avatarUrl} name={group.displayName ?? group.username} size="xs" />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-bold truncate">{group.displayName ?? group.username}</p>
            <p className="text-white/70 text-[10px]">{new Date(story.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          {group.isSelf && (
            <>
              <div className="text-white/80 text-[10px] flex items-center gap-1"><Eye className="w-3 h-3" />{story.view_count}</div>
              <button onClick={remove} className="p-1.5 rounded-full bg-white/10 text-white">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media */}
        <div className="relative w-full h-full max-w-lg mx-auto flex items-center justify-center">
          {story.media_type === "video" ? (
            <video src={story.media_url} className="max-w-full max-h-full" autoPlay muted playsInline />
          ) : (
            <img src={story.media_url} alt="" className="max-w-full max-h-full object-contain" />
          )}
          {story.caption && (
            <div className="absolute bottom-20 left-4 right-4 px-4 py-2 rounded-2xl bg-black/50 backdrop-blur text-white text-sm text-center">
              {story.caption}
            </div>
          )}

          {/* Tap zones */}
          <button className="absolute inset-y-0 left-0 w-1/3" onClick={prev} aria-label="Previous">
            <ChevronLeft className="w-6 h-6 text-white/40 mx-2" />
          </button>
          <button className="absolute inset-y-0 right-0 w-1/3" onClick={next} aria-label="Next">
            <ChevronRight className="w-6 h-6 text-white/40 mx-2 ml-auto" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StoryViewer;