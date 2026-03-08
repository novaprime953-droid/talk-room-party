import { Crown, Shield, Settings, Lock } from "lucide-react";

const OwnerSettings = () => {
  const settingSections = [
    {
      title: "Security",
      icon: Lock,
      items: [
        { label: "Owner account is protected from bans", status: "Active" },
        { label: "Owner role cannot be removed", status: "Active" },
        { label: "First-user-is-owner rule", status: "Active" },
      ],
    },
    {
      title: "System Access",
      icon: Shield,
      items: [
        { label: "Admin Panel access", status: "Granted" },
        { label: "Agency Panel access", status: "Granted" },
        { label: "BizDev Panel access", status: "Granted" },
        { label: "Host Center access", status: "Granted" },
        { label: "Coins Seller Panel access", status: "Granted" },
      ],
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Crown className="w-5 h-5 text-warning" />
        <h1 className="font-display font-bold text-2xl text-foreground">Global Settings</h1>
      </div>

      <div className="space-y-4">
        {settingSections.map((section) => (
          <div key={section.title} className="bg-card rounded-2xl shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
              <section.icon className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{section.title}</h3>
            </div>
            <div className="divide-y divide-border/30">
              {section.items.map((item) => (
                <div key={item.label} className="px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-online/10 text-online">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OwnerSettings;
