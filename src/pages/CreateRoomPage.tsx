import { useState } from "react";
import { motion } from "framer-motion";
import { X, Globe, Lock, Mic, Image, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categories = ["Chat", "Music", "Gaming", "Dating", "Education", "Language", "Comedy", "Podcast"];

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Chat");
  const [maxSeats, setMaxSeats] = useState(8);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <button onClick={() => navigate(-1)} className="p-2 text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-lg text-foreground">Create Room</h1>
        <div className="w-9" />
      </div>

      <div className="px-4 space-y-6">
        {/* Cover */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="w-full h-32 rounded-2xl gradient-primary flex flex-col items-center justify-center gap-2 glow-primary"
        >
          <Image className="w-8 h-8 text-primary-foreground/60" />
          <span className="text-xs text-primary-foreground/70 font-semibold">Add Cover Image</span>
        </motion.button>

        {/* Room Name */}
        <div>
          <label className="text-xs font-bold text-foreground mb-2 block">Room Name</label>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Give your room a catchy name..."
            className="w-full bg-card rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border/50"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-xs font-bold text-foreground mb-2 block">Category</label>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
                  selectedCategory === cat
                    ? "gradient-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground"
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div>
          <label className="text-xs font-bold text-foreground mb-2 block">Room Type</label>
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPrivate(false)}
              className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                !isPrivate ? "border-primary bg-primary/10" : "border-border/50 bg-card"
              }`}
            >
              <Globe className={`w-5 h-5 ${!isPrivate ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Public</p>
                <p className="text-[10px] text-muted-foreground">Anyone can join</p>
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsPrivate(true)}
              className={`flex-1 flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                isPrivate ? "border-primary bg-primary/10" : "border-border/50 bg-card"
              }`}
            >
              <Lock className={`w-5 h-5 ${isPrivate ? "text-primary" : "text-muted-foreground"}`} />
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Private</p>
                <p className="text-[10px] text-muted-foreground">Invite only</p>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Max Seats */}
        <div>
          <label className="text-xs font-bold text-foreground mb-2 block">Max Speakers</label>
          <div className="flex gap-2">
            {[4, 6, 8, 12].map((num) => (
              <motion.button
                key={num}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMaxSeats(num)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                  maxSeats === num
                    ? "gradient-primary text-primary-foreground"
                    : "bg-muted/40 text-muted-foreground"
                }`}
              >
                {num}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-display font-bold text-lg glow-primary"
        >
          <div className="flex items-center justify-center gap-2">
            <Mic className="w-5 h-5" />
            Go Live
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default CreateRoomPage;
