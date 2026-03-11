import { useState } from "react";
import { ArrowLeft, RefreshCw, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const ALLOWED_DOMAINS = [
  "rayziaudiocasino.codderlab.com",
  "rayziaudioferrywheel.codderlab.com",
  "rayziaudioteenpatti.codderlab.com",
];

const GamePlayPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url") ?? "";
  const [loading, setLoading] = useState(true);

  // Security: only allow whitelisted domains
  let isAllowed = false;
  try {
    const parsed = new URL(url);
    isAllowed = ALLOWED_DOMAINS.includes(parsed.hostname);
  } catch {
    isAllowed = false;
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <X className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="font-display font-bold text-foreground">Invalid Game</h2>
          <p className="text-sm text-muted-foreground">This game URL is not allowed.</p>
          <button onClick={() => navigate("/games")} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-foreground truncate mx-2 flex-1 text-center">Game</span>
        <button onClick={() => setLoading(true)} className="p-2 text-muted-foreground">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 top-12 flex items-center justify-center bg-background z-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* WebView iframe */}
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        onLoad={() => setLoading(false)}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        allow="autoplay; fullscreen"
        title="Game"
      />
    </div>
  );
};

export default GamePlayPage;
