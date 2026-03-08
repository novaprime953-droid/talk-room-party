import { Settings, Mic, Coins, CreditCard, Shield, Bell } from "lucide-react";

const settingsSections = [
  {
    icon: Mic,
    title: "Voice Settings",
    settings: [
      { label: "Max mic seats per room", value: "12" },
      { label: "Default room capacity", value: "100" },
      { label: "Auto-close inactive rooms", value: "30 min" },
    ],
  },
  {
    icon: Coins,
    title: "Coin Settings",
    settings: [
      { label: "Host commission rate", value: "70%" },
      { label: "Agency commission rate", value: "10%" },
      { label: "Min withdrawal amount", value: "$10.00" },
    ],
  },
  {
    icon: CreditCard,
    title: "Payment Settings",
    settings: [
      { label: "Payment gateway", value: "Not configured" },
      { label: "Withdrawal processing", value: "Manual" },
      { label: "Transaction limit (daily)", value: "$5,000" },
    ],
  },
  {
    icon: Shield,
    title: "Security Settings",
    settings: [
      { label: "Auto-ban threshold", value: "3 reports" },
      { label: "Spam protection", value: "Enabled" },
      { label: "Content moderation", value: "Manual" },
    ],
  },
  {
    icon: Bell,
    title: "Notification Settings",
    settings: [
      { label: "Push notifications", value: "Enabled" },
      { label: "Email notifications", value: "Disabled" },
      { label: "System announcements", value: "Enabled" },
    ],
  },
];

const AdminSettings = () => {
  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" /> System Settings
      </h1>

      <div className="space-y-4">
        {settingsSections.map((section) => (
          <div key={section.title} className="bg-card rounded-2xl p-5 shadow-card">
            <h2 className="font-display font-bold text-sm text-foreground mb-4 flex items-center gap-2">
              <section.icon className="w-4 h-4 text-primary" /> {section.title}
            </h2>
            <div className="space-y-3">
              {section.settings.map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <span className="text-sm font-bold text-foreground bg-muted/30 px-3 py-1 rounded-lg">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Settings changes require admin privileges. Some settings may require a system restart to take effect.
      </p>
    </div>
  );
};

export default AdminSettings;
