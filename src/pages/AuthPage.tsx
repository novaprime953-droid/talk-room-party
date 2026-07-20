import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Mic, Eye, EyeOff, Phone, Mail, ArrowLeft } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import SplashPage from "./SplashPage";

const AuthPage = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authMode, setAuthMode] = useState<"main" | "email" | "phone">("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+92");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextRaw = searchParams.get("next");
  const nextPath = nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/";
  const redirectOrigin = window.location.origin + nextPath;

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
        navigate(nextPath);
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneOtp = async () => {
    if (phoneNumber.length < 10) {
      toast.error("Enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
        if (error) throw error;
        setOtpSent(true);
        toast.success("OTP sent to " + phoneNumber);
      } else {
        const { error } = await supabase.auth.verifyOtp({ phone: phoneNumber, token: otpCode, type: "sms" });
        if (error) throw error;
        toast.success("Welcome!");
        navigate(nextPath);
      }
    } catch (err: any) {
      toast.error(err.message || "Phone auth failed");
    } finally {
      setLoading(false);
    }
  };

  if (showSplash) {
    return <SplashPage onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-accent/8 blur-[100px] pointer-events-none" />

      {authMode !== "main" && (
        <button onClick={() => { setAuthMode("main"); setOtpSent(false); }} className="absolute top-6 left-6 z-20 text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {authMode === "main" ? (
        /* Main auth selection screen */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm space-y-4 relative z-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-3xl gradient-primary mx-auto mb-4 flex items-center justify-center glow-primary">
              <Mic className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="font-display font-bold text-3xl text-foreground">Talk Room</h1>
            <p className="text-muted-foreground text-sm mt-1">Premium Voice Chat Experience</p>
          </div>

          {/* Phone login */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setAuthMode("phone")}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold flex items-center justify-center gap-3 shadow-lg"
          >
            <Phone className="w-5 h-5" /> Continue with Phone
          </motion.button>

          {/* Google */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={async () => {
            try {
              const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: redirectOrigin });
              if (result.error) { toast.error("Google sign-in failed"); return; }
              if (result.redirected) return;
              toast.success("Welcome!"); navigate(nextPath);
            } catch (err: any) { toast.error(err.message || "Google sign-in failed"); }
          }}
            className="w-full py-3.5 rounded-2xl glass text-foreground font-semibold flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

          {/* Facebook (placeholder - not supported natively) */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => toast.info("Facebook login coming soon!")}
            className="w-full py-3.5 rounded-2xl bg-[#1877F2] text-white font-semibold flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Continue with Facebook
          </motion.button>

          {/* Email */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setAuthMode("email")}
            className="w-full py-3.5 rounded-2xl glass text-foreground font-semibold flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
          >
            <Mail className="w-5 h-5" /> Continue with Email
          </motion.button>

          <p className="text-center text-[10px] text-muted-foreground mt-4 px-4">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      ) : authMode === "phone" ? (
        /* Phone OTP */
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm space-y-4 relative z-10">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-green-500/10 mx-auto mb-3 flex items-center justify-center">
              <Phone className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="font-display font-bold text-2xl text-foreground">
              {otpSent ? "Enter OTP Code" : "Phone Login"}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {otpSent ? `We sent a code to ${phoneNumber}` : "We'll send you a verification code"}
            </p>
          </div>

          {!otpSent ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="glass rounded-2xl px-4 py-3.5 text-sm text-foreground w-20 flex items-center justify-center font-bold">
                  🇵🇰 +92
                </div>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phoneNumber.replace("+92", "")}
                  onChange={(e) => setPhoneNumber("+92" + e.target.value.replace(/\D/g, ""))}
                  className="flex-1 glass rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-green-500/40"
                />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handlePhoneOtp} disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send OTP"}
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="w-full glass rounded-2xl px-4 py-3.5 text-center text-xl tracking-[0.5em] font-bold text-foreground placeholder:text-muted-foreground placeholder:tracking-normal placeholder:text-sm outline-none focus:ring-2 focus:ring-green-500/40"
              />
              <motion.button whileTap={{ scale: 0.97 }} onClick={handlePhoneOtp} disabled={loading || otpCode.length < 6}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </motion.button>
              <button onClick={() => setOtpSent(false)} className="w-full text-sm text-muted-foreground hover:text-foreground">
                Resend Code
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        /* Email auth */
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm relative z-10">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-3 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-display font-bold text-2xl text-foreground">{isSignUp ? "Create Account" : "Welcome Back"}</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full glass rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40" required />
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full glass rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40" required />
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full glass rounded-2xl px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40 pr-12" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
              className="w-full gradient-primary text-primary-foreground font-bold py-3.5 rounded-2xl glow-primary disabled:opacity-50">
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </motion.button>
            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-bold">
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </form>
        </motion.div>
      )}
    </div>
  );
};

export default AuthPage;
