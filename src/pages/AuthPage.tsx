import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Mic, Eye, EyeOff } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (username.trim()) {
          const { data: existing } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("username", username.trim())
            .maybeSingle();
          if (existing) {
            toast.error("Username already taken. Choose another.");
            setLoading(false);
            return;
          }
        }
        await signUp(email, password, username);
        toast.success("Account created! Check your email to verify.");
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 rounded-3xl gradient-primary mx-auto mb-4 flex items-center justify-center glow-primary">
          <Mic className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="font-display font-bold text-3xl text-foreground">Talk Room</h1>
        <p className="text-muted-foreground text-sm mt-1">Voice chat, reimagined</p>
      </motion.div>

      <motion.form
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4"
      >
        {isSignUp && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-card border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-card border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          required
        />
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-card border border-border/50 rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors pr-12"
            required
            minLength={6}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-2xl glow-primary disabled:opacity-50"
        >
          {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
        </motion.button>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-bold">
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </motion.form>

      <div className="w-full max-w-sm mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={async () => {
            try {
              const result = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (result.error) {
                toast.error("Google sign-in failed");
                return;
              }
              if (result.redirected) return;
              toast.success("Welcome!");
              navigate("/");
            } catch (err: any) {
              toast.error(err.message || "Google sign-in failed");
            }
          }}
          className="w-full bg-card border border-border/50 text-foreground font-semibold py-3 rounded-2xl flex items-center justify-center gap-3 hover:bg-muted/50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </motion.button>
      </div>
    </div>
  );
};

export default AuthPage;
