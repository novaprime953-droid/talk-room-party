import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Save, Bell, BellOff, Volume2, VolumeX,
  Gift, Globe, Shield, Wallet, Crown, LogOut, ChevronRight,
  Mic, Sparkles, Eye, EyeOff, Smartphone, Moon, Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import AvatarUpload from "@/components/AvatarUpload";
import FramedAvatar from "@/components/FramedAvatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [editProfile, setEditProfile] = useState(false);

  // Toggle states
  const [msgNotif, setMsgNotif] = useState(true);
  const [roomAlerts, setRoomAlerts] = useState(true);
  const [eventNotif, setEventNotif] = useState(true);
  const [giftAnim, setGiftAnim] = useState(true);
  const [giftSound, setGiftSound] = useState(true);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setBio(profile.bio ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName.trim(),
        bio: bio.trim(),
        phone: phone.trim() || null,
      });
      toast.success("Profile updated!");
      setEditProfile(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarUploaded = async (url: string) => {
    try {
      await updateProfile.mutateAsync({ avatar_url: url });
    } catch {
      toast.error("Failed to save avatar");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const ToggleSwitch = ({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!on)}
      className={`w-10 h-5.5 rounded-full relative transition-colors ${on ? "bg-primary" : "bg-muted/50"}`}
    >
      <motion.div
        animate={{ x: on ? 18 : 2 }}
        className="absolute top-0.5 w-4.5 h-4.5 rounded-full bg-foreground shadow"
        style={{ width: 18, height: 18 }}
      />
    </button>
  );

  const SettingRow = ({ icon: Icon, label, right, onClick, danger }: { icon: any; label: string; right?: React.ReactNode; onClick?: () => void; danger?: boolean }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors ${danger ? "text-destructive" : "text-foreground"}`}
    >
      <Icon className="w-4.5 h-4.5 flex-shrink-0" />
      <span className="flex-1 text-sm font-medium text-left">{label}</span>
      {right ?? <ChevronRight className="w-4 h-4 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-display font-bold text-xl text-foreground">Settings</h1>
      </div>

      {/* Profile Card */}
      <div className="mx-4 mb-4 bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="p-4 flex items-center gap-3">
          <AvatarUpload
            currentUrl={profile?.avatar_url}
            storagePath={`${user?.id}/profile`}
            onUploaded={handleAvatarUploaded}
          >
            <FramedAvatar src={profile?.avatar_url} name={profile?.display_name} size="lg" />
          </AvatarUpload>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground truncate">{profile?.display_name ?? "User"}</p>
            <p className="text-xs text-muted-foreground">ID: {profile?.user_id_number ?? "—"}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary">Lv.{profile?.level ?? 1}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/20 text-accent">{profile?.coins_balance?.toLocaleString() ?? 0} coins</span>
            </div>
          </div>
          <button
            onClick={() => setEditProfile(!editProfile)}
            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold"
          >
            Edit
          </button>
        </div>

        {/* Edit form */}
        {editProfile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="px-4 pb-4 space-y-3 border-t border-border/50"
          >
            <div className="pt-3">
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block">DISPLAY NAME</label>
              <input
                type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-muted/30 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block">BIO</label>
              <textarea
                value={bio} onChange={(e) => setBio(e.target.value)} rows={2}
                className="w-full bg-muted/30 rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/50 resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted-foreground mb-1 block">PHONE</label>
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional"
                className="w-full bg-muted/30 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={updateProfile.isPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Notifications */}
      <div className="mx-4 mb-3">
        <p className="text-[10px] font-bold text-muted-foreground px-1 mb-1.5 uppercase tracking-wider">Notifications</p>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
          <SettingRow icon={Bell} label="Message Notifications" right={<ToggleSwitch on={msgNotif} onChange={setMsgNotif} />} />
          <SettingRow icon={Bell} label="Room Alerts" right={<ToggleSwitch on={roomAlerts} onChange={setRoomAlerts} />} />
          <SettingRow icon={Sparkles} label="Event Notifications" right={<ToggleSwitch on={eventNotif} onChange={setEventNotif} />} />
        </div>
      </div>

      {/* Audio */}
      <div className="mx-4 mb-3">
        <p className="text-[10px] font-bold text-muted-foreground px-1 mb-1.5 uppercase tracking-wider">Audio</p>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
          <SettingRow icon={Mic} label="Mic Sensitivity" right={<span className="text-xs text-muted-foreground">Medium</span>} />
          <SettingRow icon={Volume2} label="Speaker Volume" right={<span className="text-xs text-muted-foreground">80%</span>} />
        </div>
      </div>

      {/* Gifts */}
      <div className="mx-4 mb-3">
        <p className="text-[10px] font-bold text-muted-foreground px-1 mb-1.5 uppercase tracking-wider">Gifts</p>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
          <SettingRow icon={Gift} label="Gift Animations" right={<ToggleSwitch on={giftAnim} onChange={setGiftAnim} />} />
          <SettingRow icon={Volume2} label="Gift Sounds" right={<ToggleSwitch on={giftSound} onChange={setGiftSound} />} />
        </div>
      </div>

      {/* Privacy */}
      <div className="mx-4 mb-3">
        <p className="text-[10px] font-bold text-muted-foreground px-1 mb-1.5 uppercase tracking-wider">Appearance</p>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30 mb-3">
          <SettingRow
            icon={theme === 'dark' ? Moon : Sun}
            label={theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            right={<ToggleSwitch on={theme === 'dark'} onChange={toggleTheme} />}
          />
        </div>
        <p className="text-[10px] font-bold text-muted-foreground px-1 mb-1.5 uppercase tracking-wider">Privacy & Security</p>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
          <SettingRow icon={Shield} label="Blocked Users" onClick={() => {}} />
          <SettingRow icon={Eye} label="Account Visibility" right={<span className="text-xs text-muted-foreground">Public</span>} />
          <SettingRow icon={Smartphone} label="Device Management" onClick={() => {}} />
        </div>
      </div>

      {/* Wallet & VIP */}
      <div className="mx-4 mb-3">
        <p className="text-[10px] font-bold text-muted-foreground px-1 mb-1.5 uppercase tracking-wider">Account</p>
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/30">
          <SettingRow icon={Wallet} label="Wallet" onClick={() => navigate("/wallet")} right={
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-accent">{profile?.coins_balance?.toLocaleString() ?? 0}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          } />
          <SettingRow icon={Crown} label="VIP Membership" onClick={() => navigate("/store")} />
          <SettingRow icon={Globe} label="Language" right={<span className="text-xs text-muted-foreground">English</span>} />
        </div>
      </div>

      {/* Logout */}
      <div className="mx-4 mb-6">
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
          <SettingRow icon={LogOut} label="Logout" danger onClick={handleLogout} right={null} />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
