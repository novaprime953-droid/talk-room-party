import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Settings, Lock, DoorOpen, Coins, Shield, Percent, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface SettingValue {
  [key: string]: any;
}

const OwnerSettings = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ["owner-system-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("system_settings").select("*").order("key");
      if (error) throw error;
      return data;
    },
  });

  const [editValues, setEditValues] = useState<Record<string, SettingValue>>({});

  const getEditValue = (key: string, original: SettingValue) => {
    return editValues[key] ?? original;
  };

  const setFieldValue = (settingKey: string, field: string, value: any, original: SettingValue) => {
    const current = getEditValue(settingKey, original);
    setEditValues({ ...editValues, [settingKey]: { ...current, [field]: value } });
  };

  const saveSetting = async (key: string) => {
    const value = editValues[key];
    if (!value) { toast.info("No changes"); return; }
    const { error } = await supabase.from("system_settings")
      .update({ value: value as any, updated_by: user!.id, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) toast.error(error.message);
    else {
      toast.success(`${key.replace(/_/g, " ")} updated!`);
      setEditValues((prev) => { const n = { ...prev }; delete n[key]; return n; });
      qc.invalidateQueries({ queryKey: ["owner-system-settings"] });
    }
  };

  const settingConfig: Record<string, { icon: any; label: string; fields: { key: string; label: string; type: string }[] }> = {
    coin_transfer_limits: {
      icon: Coins,
      label: "Coin Transfer Limits",
      fields: [
        { key: "min", label: "Minimum Transfer", type: "number" },
        { key: "max", label: "Maximum Transfer", type: "number" },
      ],
    },
    commission_rates: {
      icon: Percent,
      label: "Commission Rates",
      fields: [
        { key: "host_share", label: "Host Share (0-1)", type: "number" },
        { key: "platform_share", label: "Platform Share (0-1)", type: "number" },
        { key: "agency_commission", label: "Agency Commission (0-1)", type: "number" },
      ],
    },
    voice_room_settings: {
      icon: DoorOpen,
      label: "Voice Room Settings",
      fields: [
        { key: "max_seats", label: "Max Seats Per Room", type: "number" },
        { key: "default_seats", label: "Default Seats", type: "number" },
        { key: "max_rooms_per_user", label: "Max Rooms Per User", type: "number" },
      ],
    },
    coin_packages: {
      icon: Coins,
      label: "Coin Exchange Settings",
      fields: [
        { key: "exchange_rate", label: "Coins per $1", type: "number" },
        { key: "min_recharge", label: "Min Recharge ($)", type: "number" },
        { key: "min_withdrawal", label: "Min Withdrawal ($)", type: "number" },
      ],
    },
    security_settings: {
      icon: Shield,
      label: "Security Settings",
      fields: [
        { key: "max_login_attempts", label: "Max Login Attempts", type: "number" },
        { key: "ban_duration_days", label: "Default Ban Duration (days)", type: "number" },
        { key: "auto_moderate", label: "Auto Moderate", type: "boolean" },
      ],
    },
  };

  const securityInfo = [
    { label: "Owner account is protected from bans", status: "Active" },
    { label: "Owner role cannot be removed", status: "Active" },
    { label: "First-user-is-owner rule", status: "Active" },
    { label: "Owner sends gifts without coin deduction", status: "Active" },
    { label: "Owner has unlimited coin transfers", status: "Active" },
  ];

  const accessInfo = [
    { label: "Admin Panel", status: "Granted" },
    { label: "Agency Panel", status: "Granted" },
    { label: "BizDev Panel", status: "Granted" },
    { label: "Host Center", status: "Granted" },
    { label: "Coins Seller Panel", status: "Granted" },
    { label: "Owner Panel", status: "Granted" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Crown className="w-5 h-5 text-warning" />
        <h1 className="font-display font-bold text-2xl text-foreground">System Settings</h1>
      </div>

      {/* Configurable Settings */}
      <div className="space-y-4 mb-6">
        {settings?.map((setting) => {
          const config = settingConfig[setting.key];
          if (!config) return null;
          const currentValue = getEditValue(setting.key, setting.value as SettingValue);
          const hasChanges = !!editValues[setting.key];

          return (
            <div key={setting.id} className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <config.icon className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">{config.label}</h3>
                </div>
                {hasChanges && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => saveSetting(setting.key)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl gradient-primary text-primary-foreground text-xs font-bold">
                    <Save className="w-3 h-3" /> Save
                  </motion.button>
                )}
              </div>
              <div className="p-4 space-y-3">
                {config.fields.map((field) => (
                  <div key={field.key} className="flex items-center justify-between gap-4">
                    <label className="text-sm text-foreground font-medium flex-shrink-0">{field.label}</label>
                    {field.type === "boolean" ? (
                      <button
                        onClick={() => setFieldValue(setting.key, field.key, !currentValue[field.key], setting.value as SettingValue)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                          currentValue[field.key] ? "bg-online/10 text-online" : "bg-muted/40 text-muted-foreground"
                        }`}>
                        {currentValue[field.key] ? "Enabled" : "Disabled"}
                      </button>
                    ) : (
                      <Input
                        type="number"
                        value={currentValue[field.key] ?? ""}
                        onChange={(e) => setFieldValue(setting.key, field.key, parseFloat(e.target.value) || 0, setting.value as SettingValue)}
                        className="w-40 text-right"
                      />
                    )}
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground">{setting.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Static Security Info */}
      <div className="space-y-4">
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
            <Lock className="w-4 h-4 text-warning" />
            <h3 className="font-semibold text-foreground">Owner Security Privileges</h3>
          </div>
          <div className="divide-y divide-border/30">
            {securityInfo.map((item) => (
              <div key={item.label} className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-online/10 text-online">{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">System Access</h3>
          </div>
          <div className="divide-y divide-border/30">
            {accessInfo.map((item) => (
              <div key={item.label} className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-online/10 text-online">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerSettings;
