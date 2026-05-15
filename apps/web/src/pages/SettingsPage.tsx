import { useState } from "react";
import { Settings as SettingsIcon, User, Building, Moon, Sun, Key, Shield, Bell, Save, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../hooks/useTheme";

type SettingsTab = "profile" | "organization" | "appearance" | "api-keys" | "notifications";

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "organization", label: "Organization", icon: Building },
  { id: "appearance", label: "Appearance", icon: Moon },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saved, setSaved] = useState(false);
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-brand-500" /> Settings
        </h1>
        <p className="text-sm text-white/40 mt-1">Manage your profile, organization, and platform preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <nav className="bg-surface-800/50 rounded-2xl border border-white/5 p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    activeTab === tab.id ? "bg-brand-500/10 text-brand-400" : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]")}>
                  <Icon className="w-4 h-4" /> {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-surface-800/50 rounded-2xl border border-white/5 p-6 animate-fade-in">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Profile Settings</h2>
              <div className="flex items-center gap-5 p-4 bg-surface-900/50 rounded-xl border border-white/5">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-cyber-purple text-white text-xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-white font-semibold">{user?.name || "User"}</p>
                  <p className="text-sm text-white/40">{user?.email || "user@example.com"}</p>
                  <span className="text-[10px] uppercase tracking-wider text-brand-400 font-semibold bg-brand-500/10 px-2 py-0.5 rounded mt-1 inline-block">{user?.role || "analyst"}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <input type="text" defaultValue={user?.name || ""} className="bg-surface-900 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white w-full focus:border-brand-500/50 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Email</label>
                  <input type="email" defaultValue={user?.email || ""} disabled className="bg-surface-900 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white/40 w-full cursor-not-allowed" />
                </div>
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-all active:scale-95">
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          )}

          {/* Organization Tab */}
          {activeTab === "organization" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Organization</h2>
              <div className="p-4 bg-surface-900/50 rounded-xl border border-white/5 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-brand-500/10"><Building className="w-6 h-6 text-brand-400" /></div>
                <div>
                  <p className="text-white font-semibold">{user?.organization_name || "My Organization"}</p>
                  <p className="text-xs text-white/40">ID: {user?.organization_id || "—"}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Organization Name</label>
                <input type="text" defaultValue={user?.organization_name || ""} className="bg-surface-900 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white w-full max-w-md focus:border-brand-500/50 outline-none transition-all" />
              </div>
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-all active:scale-95">
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Appearance</h2>
              <div className="flex items-center justify-between p-4 bg-surface-900/50 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon className="w-5 h-5 text-brand-400" /> : <Sun className="w-5 h-5 text-cyber-amber" />}
                  <div>
                    <p className="text-sm font-medium text-white">Theme</p>
                    <p className="text-xs text-white/40">Currently using {theme} mode</p>
                  </div>
                </div>
                <button onClick={toggleTheme}
                  className="px-4 py-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium hover:bg-brand-500/20 transition-all">
                  Switch to {theme === "dark" ? "Light" : "Dark"}
                </button>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === "api-keys" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">API Keys</h2>
              <p className="text-sm text-white/40">Manage API keys for third-party intelligence sources. These are used by the Discovery and Enrichment services.</p>
              {[
                { name: "Shodan", env: "SHODAN_API_KEY", desc: "Passive host intelligence" },
                { name: "Censys", env: "CENSYS_API_ID / CENSYS_SECRET", desc: "Certificate and host search" },
                { name: "VirusTotal", env: "VIRUSTOTAL_API_KEY", desc: "Threat intelligence lookups" },
              ].map((key) => (
                <div key={key.name} className="p-4 bg-surface-900/50 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyber-purple/10"><Key className="w-4 h-4 text-cyber-purple" /></div>
                    <div>
                      <p className="text-sm font-medium text-white">{key.name}</p>
                      <p className="text-xs text-white/35">{key.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/25 font-mono">{key.env}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-cyber-amber/10 text-cyber-amber border border-cyber-amber/20">ENV</span>
                  </div>
                </div>
              ))}
              <p className="text-xs text-white/25 flex items-center gap-1.5"><Shield className="w-3 h-3" /> API keys are managed via environment variables for security.</p>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              {[
                { label: "Discovery Alerts", desc: "Get notified when new assets are discovered", default: true },
                { label: "Risk Alerts", desc: "Alerts for critical and high severity findings", default: true },
                { label: "Compliance Changes", desc: "Notifications when compliance status changes", default: false },
                { label: "Weekly Reports", desc: "Receive weekly attack surface summary", default: false },
              ].map((n) => (
                <div key={n.label} className="flex items-center justify-between p-4 bg-surface-900/50 rounded-xl border border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">{n.label}</p>
                    <p className="text-xs text-white/35 mt-0.5">{n.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={n.default} className="sr-only peer" />
                    <div className="w-9 h-5 bg-white/10 peer-focus:ring-2 peer-focus:ring-brand-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white/60 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
