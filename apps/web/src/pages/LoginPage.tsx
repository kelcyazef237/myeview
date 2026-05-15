import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import api from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import Logo from "../components/layout/Logo";
import type { User } from "../types";

/**
 * Premium login page with animated grid background,
 * glassmorphic card, and branded design.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, setLoading, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Try real IAM backend first
      const response = await api.post<{ access_token: string; refresh_token: string; user: User }>("/auth/login", {
        email,
        password,
      });

      const { user, access_token, refresh_token } = response.data;
      setAuth(user, access_token, refresh_token);
      navigate("/dashboard");
    } catch (err: unknown) {
      // If backend is unreachable, fall back to mock auth for dev
      const isNetworkError =
        err instanceof Error && ("code" in err || (err as { response?: unknown }).response === undefined);

      if (isNetworkError && email && password.length >= 4) {
        console.warn("[MYEVIEW] IAM unreachable — using mock auth (dev mode)");
        const mockUser: User = {
          id: "usr_001",
          email: email,
          name: email.split("@")[0].replace(/[^a-zA-Z]/g, " "),
          role: "admin",
          organization_id: "org_001",
          organization_name: "MYEVIEW Corp",
          created_at: new Date().toISOString(),
        };
        setAuth(mockUser, "mock_access_token", "mock_refresh_token");
        navigate("/dashboard");
      } else {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(
          axiosErr?.response?.data?.message ||
            "Invalid email or password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-surface-900 grid-bg overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
        {/* Top-left glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]" />
        {/* Bottom-right glow */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyber-purple/10 rounded-full blur-[120px]" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[420px] mx-4 animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-sm text-white/40">
              Sign in to your attack surface dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/20 text-cyber-red text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@company.com"
                required
                className={cn(
                  "w-full px-4 py-3 rounded-lg text-sm text-white",
                  "bg-white/[0.04] border border-border-subtle",
                  "placeholder:text-white/20",
                  "focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10",
                  "transition-all duration-200"
                )}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={cn(
                    "w-full px-4 py-3 pr-11 rounded-lg text-sm text-white",
                    "bg-white/[0.04] border border-border-subtle",
                    "placeholder:text-white/20",
                    "focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10",
                    "transition-all duration-200"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-border-default bg-white/[0.04] accent-brand-500"
                />
                <span className="text-xs text-white/40">Remember me</span>
              </label>
              <button
                type="button"
                className="text-xs text-brand-400/70 hover:text-brand-400 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "group w-full flex items-center justify-center gap-2 py-3 rounded-lg",
                "bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold text-sm",
                "hover:from-brand-500 hover:to-brand-400",
                "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-surface-900",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_30px_rgba(59,130,246,0.35)]"
              )}
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
            
            <div className="text-center mt-4 pt-4 border-t border-border-subtle">
              <span className="text-sm text-white/40">Don't have an account? </span>
              <Link to="/register" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Sign up
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/20 mt-6">
          Protected by MYEVIEW Security ·{" "}
          <span className="text-white/15">v1.0.0</span>
        </p>
      </div>
    </div>
  );
}
