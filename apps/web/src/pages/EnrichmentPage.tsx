import { useEffect, useState } from "react";
import { Activity, Globe, Server, Shield, Search, Wifi, Lock, Code2 } from "lucide-react";
import { useAuthStore } from "../stores/authStore";

interface EnrichmentResult {
  id: string;
  asset_name: string;
  asset_type: string;
  organization_id: string;
  tech_stack: string[];
  dns_records: string[];
  tls_info: { issuer: string; valid_to: string; protocol: string } | null;
  http_headers: Record<string, string>;
  cloud_provider: string;
  cdn_waf: string;
  enriched_at: string;
}

export default function EnrichmentPage() {
  const [results, setResults] = useState<EnrichmentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/v1/enrichment/results?organization_id=${user?.organization_id}`);
        if (res.ok) { setResults((await res.json()) || []); }
      } catch (err) { console.error("Failed to fetch enrichment data", err); }
      finally { setLoading(false); }
    };
    if (user?.organization_id) fetchData();
    else setLoading(false);
  }, [user]);

  const filtered = results.filter((r) =>
    !searchQ || r.asset_name.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-brand-500" /> Intelligence Enrichment
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Passively enriched asset metadata — tech stacks, DNS, TLS, cloud providers, and more.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input type="text" placeholder="Search enriched assets..." value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
          className="bg-surface-800 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white w-full focus:border-brand-500/50 outline-none transition-all" />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-800/50 rounded-2xl border border-white/5 p-12 flex flex-col items-center justify-center text-center">
          <Activity className="w-16 h-16 text-brand-500/20 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {results.length === 0 ? "No Enrichment Data" : "No Matching Assets"}
          </h3>
          <p className="text-white/40 max-w-md text-sm">
            {results.length === 0
              ? "Enrichment runs automatically after assets are discovered and verified. Run a discovery scan to populate this view."
              : "Try adjusting your search query."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-surface-800/50 rounded-2xl border border-white/5 p-5 hover:border-brand-500/15 transition-all duration-200 space-y-4">
              {/* Asset Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-brand-500/10">
                    <Globe className="w-5 h-5 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.asset_name}</p>
                    <span className="text-[10px] uppercase tracking-wider text-white/40">{r.asset_type}</span>
                  </div>
                </div>
                <span className="text-[10px] text-white/25">{new Date(r.enriched_at).toLocaleDateString()}</span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Cloud Provider */}
                {r.cloud_provider && (
                  <div className="bg-surface-900/50 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1"><Server className="w-3 h-3 text-white/30" /><span className="text-[10px] text-white/40 uppercase">Cloud</span></div>
                    <p className="text-xs text-white/80 font-medium">{r.cloud_provider}</p>
                  </div>
                )}

                {/* CDN/WAF */}
                {r.cdn_waf && (
                  <div className="bg-surface-900/50 rounded-lg p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1"><Shield className="w-3 h-3 text-white/30" /><span className="text-[10px] text-white/40 uppercase">CDN/WAF</span></div>
                    <p className="text-xs text-white/80 font-medium">{r.cdn_waf}</p>
                  </div>
                )}

                {/* TLS Info */}
                {r.tls_info && (
                  <div className="bg-surface-900/50 rounded-lg p-3 border border-white/5 col-span-2">
                    <div className="flex items-center gap-1.5 mb-1"><Lock className="w-3 h-3 text-cyber-green/60" /><span className="text-[10px] text-white/40 uppercase">TLS Certificate</span></div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <span className="text-xs text-white/70">Issuer: <span className="text-white/90">{r.tls_info.issuer}</span></span>
                      <span className="text-xs text-white/70">Protocol: <span className="text-white/90">{r.tls_info.protocol}</span></span>
                      <span className="text-xs text-white/70">Expires: <span className="text-white/90">{new Date(r.tls_info.valid_to).toLocaleDateString()}</span></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tech Stack */}
              {r.tech_stack?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2"><Code2 className="w-3 h-3 text-white/30" /><span className="text-[10px] text-white/40 uppercase tracking-wider">Tech Stack</span></div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.tech_stack.map((t, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/20">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* DNS Records */}
              {r.dns_records?.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-2"><Wifi className="w-3 h-3 text-white/30" /><span className="text-[10px] text-white/40 uppercase tracking-wider">DNS Records</span></div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.dns_records.slice(0, 6).map((d, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">{d}</span>
                    ))}
                    {r.dns_records.length > 6 && <span className="text-[11px] text-white/30">+{r.dns_records.length - 6} more</span>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
