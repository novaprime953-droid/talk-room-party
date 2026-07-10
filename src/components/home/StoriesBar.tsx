import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useStoryGroups, usePostStory, type StoryGroup } from "@/hooks/useStories";
import { useProfile } from "@/hooks/useProfile";
import FramedAvatar from "@/components/FramedAvatar";
import StoryViewer from "@/components/StoryViewer";

const StoriesBar = () => {
  const { data: groups } = useStoryGroups();
  const { data: me } = useProfile();
  const post = usePostStory();
  const fileRef = useRef<HTMLInputElement>(null);
  const [viewer, setViewer] = useState<{ groups: StoryGroup[]; index: number } | null>(null);

  const selfGroup = groups?.find((g) => g.isSelf);
  const otherGroups = (groups ?? []).filter((g) => !g.isSelf);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) return toast.error("File must be under 8MB");
    try {
      await post.mutateAsync({ file });
      toast.success("Story posted");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    }
  };

  return (
    <div className="px-4 pt-3">
      <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={onPick} />
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {/* Add Story */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => (selfGroup ? setViewer({ groups: [selfGroup, ...otherGroups], index: 0 }) : fileRef.current?.click())}
          className="flex flex-col items-center gap-1 min-w-[64px]"
        >
          <div className="relative">
            <div className={`rounded-full p-[2px] ${selfGroup ? "bg-gradient-to-br from-primary via-secondary to-accent" : "bg-muted/50"}`}>
              <div className="rounded-full p-[2px] bg-background">
                <FramedAvatar src={me?.avatar_url} name={me?.display_name ?? me?.username ?? "You"} size="sm" />
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background text-white"
              style={{ background: "var(--gradient-sunset)" }}
              aria-label="Add story"
            >
              <Plus className="w-3 h-3" strokeWidth={3} />
            </button>
          </div>
          <span className="text-[9px] font-semibold text-muted-foreground truncate w-14 text-center">
            {selfGroup ? "Your story" : "Add story"}
          </span>
        </motion.button>

        {otherGroups.map((g, i) => (
          <motion.button
            key={g.userId}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setViewer({ groups: [g, ...otherGroups.filter((x) => x.userId !== g.userId), ...(selfGroup ? [selfGroup] : [])], index: 0 })}
            className="flex flex-col items-center gap-1 min-w-[64px]"
          >
            <div className="rounded-full p-[2px] bg-gradient-to-br from-primary via-secondary to-accent animate-pulse-glow">
              <div className="rounded-full p-[2px] bg-background">
                <FramedAvatar src={g.avatarUrl} name={g.displayName ?? g.username} size="sm" />
              </div>
            </div>
            <span className="text-[9px] font-semibold text-muted-foreground truncate w-14 text-center">
              {g.displayName ?? g.username}
            </span>
          </motion.button>
        ))}
      </div>

      {viewer && (
        <StoryViewer
          groups={viewer.groups}
          startIndex={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
};

export default StoriesBar;