import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, User, Camera, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");

  // Sync on load
  useState(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setPhone(profile.phone ?? "");
    }
  });

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim(),
        bio: bio.trim(),
        phone: phone.trim() || null,
      });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-xl text-foreground">Settings</h1>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-card rounded-full border-2 border-background flex items-center justify-center">
              <Camera className="w-4 h-4 text-foreground" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-foreground mb-2 block">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-card rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border/50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground mb-2 block">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-card rounded-2xl px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border/50 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-foreground mb-2 block">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
              className="w-full bg-card rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50 border border-border/50"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={updateProfile.isPending}
            className="w-full py-4 rounded-2xl gradient-primary text-primary-foreground font-display font-bold text-lg glow-primary disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {updateProfile.isPending ? "Saving..." : "Save Changes"}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
