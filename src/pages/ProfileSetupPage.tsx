import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useUpdateProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { User, Calendar, Globe } from "lucide-react";
import AvatarUpload from "@/components/AvatarUpload";

interface ProfileSetupPageProps {
  onComplete: () => void;
}

const COUNTRIES = [
  "Pakistan", "India", "Saudi Arabia", "UAE", "Egypt", "Iraq", "Morocco",
  "Turkey", "Bangladesh", "Indonesia", "Malaysia", "USA", "UK", "Germany",
  "France", "Brazil", "Philippines", "Nigeria", "Kenya", "Other"
];

const ProfileSetupPage = ({ onComplete }: ProfileSetupPageProps) => {
  const { user } = useAuth();
  const updateProfile = useUpdateProfile();
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !country) {
      toast.error("Please fill in required fields");
      return;
    }
    setLoading(true);
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim(),
        avatar_url: avatarUrl || null,
        bio: `${country}${birthDate ? ` • Born ${birthDate}` : ""}`,
      });
      toast.success("Profile setup complete! 🎉");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="text-center">
          <h1 className="font-display font-bold text-2xl text-foreground">Setup Your Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Complete your profile to get started</p>
        </div>

        <div className="flex justify-center">
          <AvatarUpload
            currentUrl={avatarUrl || null}
            storagePath={`${user?.id || 'temp'}/profile`}
            onUploaded={(url) => setAvatarUrl(url)}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Display Name *"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-card border border-border/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              placeholder="Birth Date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full bg-card border border-border/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-card border border-border/50 rounded-2xl pl-10 pr-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-colors appearance-none"
              required
            >
              <option value="">Select Country *</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <input
            type="text"
            placeholder="Invitation Code (optional)"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full bg-card border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-2xl glow-primary disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileSetupPage;