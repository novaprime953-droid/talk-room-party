import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MoreVertical, Mic, MicOff, Hand, MessageCircle, Gift, Share2, Users, LogOut } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import VoiceSeat from "@/components/VoiceSeat";
import RoomChat from "@/components/RoomChat";

const mockSeats = [
  { name: "DJ Luna", isSpeaking: true, isHost: true },
  { name: "Sarah", isSpeaking: false, isMuted: true },
  { name: "Mike", isSpeaking: true },
  { name: "Alex", isSpeaking: false },
  null,
  { name: "Luna", isSpeaking: false, isMuted: true },
  null,
  null,
];

const RoomPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isMuted, setIsMuted] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [handRaised, setHandRaised] = useState(false);

  return (
    <div className="min-h-screen bg-background gradient-room flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1">
          <h1 className="font-display font-bold text-sm text-foreground">🎶 Late Night Vibes</h1>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-live rounded-full animate-pulse" />
              <span className="text-[10px] text-live font-bold">LIVE</span>
            </div>
            <span className="text-[10px] text-muted-foreground">•</span>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">234</span>
            </div>
          </div>
        </div>
        <button className="p-2 text-foreground">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Seats Grid */}
      <div className="flex-1 px-4 py-4">
        <div className="grid grid-cols-4 gap-y-6 justify-items-center max-w-sm mx-auto">
          {mockSeats.map((seat, i) => (
            <VoiceSeat
              key={i}
              index={i}
              user={seat ? { ...seat } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "40vh" }}
            exit={{ height: 0 }}
            className="bg-card/90 backdrop-blur-lg border-t border-border/50 overflow-hidden"
          >
            <RoomChat />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="bg-card/90 backdrop-blur-lg border-t border-border/50 px-4 py-3 safe-bottom">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full ${showChat ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground"}`}
          >
            <MessageCircle className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-3 rounded-full bg-accent/10 text-accent"
          >
            <Gift className="w-5 h-5" />
          </motion.button>

          {/* Mic button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full ${
              isMuted
                ? "bg-muted/40 text-muted-foreground"
                : "gradient-primary text-primary-foreground glow-primary"
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setHandRaised(!handRaised)}
            className={`p-3 rounded-full ${handRaised ? "bg-accent/20 text-accent" : "bg-muted/40 text-muted-foreground"}`}
          >
            <Hand className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/")}
            className="p-3 rounded-full bg-destructive/10 text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
