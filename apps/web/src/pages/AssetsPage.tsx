import { useEffect, useState } from "react";
import { Globe, Search, Filter, AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../stores/authStore";

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await fetch(`/api/v1/discovery/assets?organization_id=${user?.organization_id}`);
        if (res.ok) {
          const data = await res.json();
          setAssets(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch assets", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAssets();
  }, [user]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-brand-500" />
            Asset Inventory
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Comprehensive view of all discovered public-facing assets.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
             <input type="text" placeholder="Search assets..." className="bg-surface-800 border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white w-64 focus:border-brand-500/50 outline-none" />
           </div>
           <button className="flex items-center gap-2 px-3 py-2 bg-surface-800 border border-white/5 rounded-lg text-white/70 hover:text-white transition-colors text-sm">
             <Filter className="w-4 h-4" /> Filter
           </button>
        </div>
      </div>

      <div className="bg-surface-800/50 rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : assets.length === 0 ? (
           <div className="p-12 text-center text-white/40">
             No assets discovered yet. Run a discovery scan from the dashboard.
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-surface-900/50 border-b border-white/5 text-white/50">
                <tr>
                  <th className="px-6 py-4 font-medium theme-text-secondary">Asset Name</th>
                  <th className="px-6 py-4 font-medium theme-text-secondary">Type</th>
                  <th className="px-6 py-4 font-medium theme-text-secondary">Risk Score</th>
                  <th className="px-6 py-4 font-medium theme-text-secondary">Status</th>
                  <th className="px-6 py-4 font-medium theme-text-secondary">TLS Status</th>
                  <th className="px-6 py-4 font-medium theme-text-secondary">TLS Issuer</th>
                  <th className="px-6 py-4 font-medium theme-text-secondary">TLS Expiry</th>
                  <th className="px-6 py-4 font-medium theme-text-secondary">Discovered</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-border-subtle">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{asset.name}</td>
                    <td className="px-6 py-4 text-white/70 capitalize">{asset.type}</td>
                    <td className="px-6 py-4">
                      {asset.risk_score > 0 ? (
                        <span className="flex items-center gap-1.5 text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5" /> {asset.risk_score}
                        </span>
                      ) : (
                        <span className="text-white/30">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {asset.is_active ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="theme-text-muted text-xs font-semibold">Inactive</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {asset.tls_valid === true ? (
                        <span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider badge-low">Valid</span>
                      ) : asset.tls_valid === false && asset.tls_cert_issuer ? (
                        <span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider badge-critical">Invalid</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider theme-bg-card theme-text-muted theme-border-subtle">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs theme-text-secondary max-w-[150px] truncate" title={asset.tls_cert_issuer || "N/A"}>
                      {asset.tls_cert_issuer ? asset.tls_cert_issuer.split(",")[0].replace("CN=", "") : "-"}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {asset.tls_cert_expiry && asset.tls_cert_expiry !== "0001-01-01T00:00:00Z" ? (
                        <span className={new Date(asset.tls_cert_expiry) < new Date() ? "text-cyber-red font-bold" : "theme-text-secondary"}>
                          {new Date(asset.tls_cert_expiry).toLocaleDateString()}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4 theme-text-tertiary text-xs">
                      {new Date(asset.discovered_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
