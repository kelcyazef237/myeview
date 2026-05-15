import {
  Search,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useThemeStore } from "../../hooks/useTheme";
import { useAuthStore } from "../../stores/authStore";

/**
 * Top navigation bar with search, theme toggle, notifications, and user menu.
 */
export default function TopBar() {
  const { theme, toggleTheme } = useThemeStore();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-surface-900/80 backdrop-blur-xl border-b border-border-subtle">
      {/* Left: Search */}
      <div className="flex items-center flex-1 max-w-md">
        <div
          className={cn(
            "flex items-center gap-2 w-full rounded-lg px-3 py-2 transition-all duration-200",
            "bg-white/[0.04] border",
            searchFocused
              ? "border-brand-500/50 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]"
              : "border-transparent hover:border-border-subtle"
          )}
        >
          <Search size={16} className="text-white/30 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search assets, domains, IPs..."
            className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/25 outline-none"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.06] text-[10px] text-white/30 font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyber-red animate-pulse-glow" />
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border-subtle mx-2" />

        {/* User Menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all duration-200",
              "hover:bg-white/[0.04]",
              userMenuOpen && "bg-white/[0.04]"
            )}
          >
            {/* Avatar */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-cyber-purple text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-white/80 leading-none">
                {user?.name || "User"}
              </p>
              <p className="text-[11px] text-white/35 leading-none mt-0.5">
                {user?.role || "analyst"}
              </p>
            </div>
            <ChevronDown
              size={14}
              className={cn(
                "text-white/30 transition-transform duration-200 hidden sm:block",
                userMenuOpen && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-surface-800 border border-border-default shadow-dropdown animate-fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-border-subtle">
                <p className="text-sm font-medium text-white/80">{user?.name || "User"}</p>
                <p className="text-xs text-white/40 mt-0.5">{user?.email || "user@example.com"}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { setUserMenuOpen(false); navigate("/settings"); }}
                  className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.04] transition-colors"
                >
                  <User size={15} />
                  Profile & Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm text-cyber-red/70 hover:text-cyber-red hover:bg-cyber-red/[0.06] transition-colors"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
