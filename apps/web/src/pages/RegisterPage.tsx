import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Loader2, Building, User as UserIcon } from "lucide-react";
import { cn } from "../lib/utils";
import api from "../lib/api";
import { useAuthStore } from "../stores/authStore";
import Logo from "../components/layout/Logo";
import type { User } from "../types";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth, setLoading, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Try real IAM backend first
      const response = await api.post<{ access_token: string; refresh_token: string; user: User }>("/auth/register", {
        email,
        password,
        name,
        organization_name: organization,
      });

      const { user, access_token, refresh_token } = response.data;
      setAuth(user, access_token, refresh_token);
      navigate("/dashboard");
    } catch (err: unknown) {
      // If backend is unreachable, fall back to mock auth for dev
      const isNetworkError =
        err instanceof Error && ("code" in err || (err as { response?: unknown }).response === undefined);

      if (isNetworkError && email && password.length >= 6 && name && organization) {
        console.warn("[MYEVIEW] IAM unreachable — using mock auth (dev mode)");
        const mockUser: User = {
          id: `usr_${Math.random().toString(36).substr(2, 5)}`,
          email: email,
          name: name,
          role: "admin",
          organization_id: "06a86ad5-0320-4f45-b8f1-82a56c8f25de",
          organization_name: organization,
          created_at: new Date().toISOString(),
        };
        setAuth(mockUser, "mock_access_token", "mock_refresh_token");
        navigate("/dashboard");
      } else {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(
          axiosErr?.response?.data?.message ||
            "Registration failed. Please check your details and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-surface-900 grid-bg overflow-hidden py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08)_0%,transparent_70%)]" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyber-purple/10 rounded-full blur-[120px]" />
      </div>

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-[420px] mx-4 animate-slide-up">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo />
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-white mb-2">Create an account</h1>
            <p className="text-sm text-white/40">
              Start mapping your external attack surface
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-cyber-red/10 border border-cyber-red/20 text-cyber-red text-sm animate-fade-in">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
             {/* Name */}
             <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white",
                    "bg-white/[0.04] border border-border-subtle",
                    "placeholder:text-white/20",
                    "focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10",
                    "transition-all duration-200"
                  )}
                />
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Organization Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Acme Corp"
                  required
                  className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white",
                    "bg-white/[0.04] border border-border-subtle",
                    "placeholder:text-white/20",
                    "focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10",
                    "transition-all duration-200"
                  )}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Work Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@acme.com"
                required
                className={cn(
                  "w-full px-4 py-2.5 rounded-lg text-sm text-white",
                  "bg-white/[0.04] border border-border-subtle",
                  "placeholder:text-white/20",
                  "focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/10",
                  "transition-all duration-200"
                )}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className={cn(
                    "w-full px-4 py-2.5 pr-11 rounded-lg text-sm text-white",
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
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "group w-full flex items-center justify-center gap-2 py-3 rounded-lg mt-6",
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
                  Create Account
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
            
            <div className="text-center mt-4 pt-4 border-t border-border-subtle">
              <span className="text-sm text-white/40">Already have an account? </span>
              <Link to="/login" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
