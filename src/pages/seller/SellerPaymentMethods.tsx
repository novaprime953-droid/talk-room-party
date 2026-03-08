import { Wallet, Copy, Info } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const paymentMethods = [
  {
    name: "Bank Transfer",
    icon: "🏦",
    details: [
      { label: "Bank Name", value: "HBL / Meezan / UBL" },
      { label: "Account Title", value: "TalkRoom Party Ltd." },
      { label: "Account Number", value: "1234-5678-9012-3456" },
    ],
    instructions: "Transfer the exact amount and share the receipt screenshot with your recharge request.",
  },
  {
    name: "JazzCash",
    icon: "📱",
    details: [
      { label: "Account Name", value: "TalkRoom Party" },
      { label: "Account Number", value: "0300-1234567" },
    ],
    instructions: "Send money to the number above and include the transaction ID in the payment reference field.",
  },
  {
    name: "EasyPaisa",
    icon: "💳",
    details: [
      { label: "Account Name", value: "TalkRoom Party" },
      { label: "Account Number", value: "0345-7654321" },
    ],
    instructions: "Send via EasyPaisa app or agent. Include CNIC last 4 digits and TID in the reference.",
  },
  {
    name: "Crypto (USDT)",
    icon: "₿",
    details: [
      { label: "Network", value: "TRC-20 (Tron)" },
      { label: "Wallet Address", value: "TXyz...abc123" },
    ],
    instructions: "Send USDT on TRC-20 network only. Other networks will result in lost funds. Include TX hash in reference.",
  },
];

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard!");
};

const SellerPaymentMethods = () => {
  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-2 flex items-center gap-2">
        <Wallet className="w-6 h-6 text-accent" /> Payment Methods
      </h1>
      <p className="text-xs text-muted-foreground mb-6">Supported payment methods for coin recharges</p>

      <div className="space-y-4">
        {paymentMethods.map((method, i) => (
          <motion.div
            key={method.name}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl shadow-card overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
              <span className="text-2xl">{method.icon}</span>
              <h3 className="font-display font-bold text-foreground">{method.name}</h3>
            </div>

            <div className="p-4 space-y-3">
              {method.details.map((detail) => (
                <div key={detail.label} className="flex items-center justify-between bg-muted/20 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{detail.label}</p>
                    <p className="text-sm font-semibold text-foreground">{detail.value}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(detail.value)}
                    className="p-1.5 rounded-lg hover:bg-muted/40 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              ))}

              <div className="flex items-start gap-2 bg-primary/5 rounded-xl px-3 py-2.5">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">{method.instructions}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SellerPaymentMethods;
