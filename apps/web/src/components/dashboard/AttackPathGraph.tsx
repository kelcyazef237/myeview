import { useEffect, useState } from "react";
import { Activity, ShieldAlert, Globe, Server, Link } from "lucide-react";

interface Node {
  id: string;
  label: string;
  properties: any;
}

interface Edge {
  source_id: string;
  target_id: string;
  relationship: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export default function AttackPathGraph({ orgId }: { orgId?: string }) {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const url = orgId ? `/api/v1/graph?organization_id=${orgId}` : "/api/v1/graph";
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch graph data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGraph();
    // Poll every 10 seconds for demo purposes
    const interval = setInterval(fetchGraph, 10000);
    return () => clearInterval(interval);
  }, [orgId]);

  if (loading && !data) {
    return (
      <div className="bg-surface-800/50 rounded-2xl border border-white/5 p-6 h-[400px] flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="bg-surface-800/50 rounded-2xl border border-white/5 p-6 h-[400px] flex flex-col items-center justify-center text-white/40">
        <Link className="w-12 h-12 mb-3 opacity-20" />
        <p>No attack path data available.</p>
        <p className="text-xs mt-1">Run a discovery scan to populate the graph.</p>
      </div>
    );
  }

  // Simplified custom SVG renderer for a 3-tier hierarchy (Domain -> Subdomain -> IP/Port)
  // For production, integrate react-force-graph or eCharts graph series here.

  return (
    <div className="bg-surface-800/50 rounded-2xl border border-white/5 p-6 h-[400px] overflow-hidden flex flex-col relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-500" />
          Attack Path Correlation
        </h3>
        <span className="text-xs bg-surface-900 px-2 py-1 rounded text-white/50">
          Nodes: {data.nodes.length} | Edges: {data.edges.length}
        </span>
      </div>

      <div className="flex-1 w-full bg-surface-900/50 rounded-xl relative overflow-auto border border-white/5 p-4 flex items-center justify-center">
        {/* Placeholder for actual node-link diagram rendering */}
        <div className="flex flex-col items-center gap-8 min-w-[600px]">
           <div className="text-xs text-brand-400 border border-brand-500/20 bg-brand-500/10 px-3 py-1 rounded-full">
             Root Targets
           </div>
           
           <div className="flex gap-4 flex-wrap justify-center">
             {data.nodes.filter(n => n.label === "Domain").map(node => (
               <div key={node.id} className="flex flex-col items-center gap-2 p-3 bg-surface-800 rounded-lg border border-white/10 shadow-lg">
                 <Globe className="w-6 h-6 text-blue-400" />
                 <span className="text-xs text-white max-w-[120px] truncate" title={node.id}>{node.id}</span>
               </div>
             ))}
           </div>

           <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500/50 to-purple-500/50" />

           <div className="flex gap-4 flex-wrap justify-center">
             {data.nodes.filter(n => n.label === "subdomain" || n.label === "Asset").slice(0, 5).map(node => (
               <div key={node.id} className="flex flex-col items-center gap-2 p-3 bg-surface-800 rounded-lg border border-white/10 shadow-lg relative">
                 {node.properties?.risk_score > 0 && (
                   <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 shadow-sm">
                     {node.properties.risk_score}
                   </span>
                 )}
                 <Server className="w-5 h-5 text-purple-400" />
                 <span className="text-[10px] text-white/70 max-w-[100px] truncate" title={node.id}>{node.id}</span>
               </div>
             ))}
             {data.nodes.filter(n => n.label === "subdomain" || n.label === "Asset").length > 5 && (
               <div className="flex items-center justify-center p-3 text-xs text-white/40">
                 + {data.nodes.filter(n => n.label === "subdomain" || n.label === "Asset").length - 5} more
               </div>
             )}
           </div>

           <div className="w-0.5 h-8 bg-gradient-to-b from-purple-500/50 to-red-500/50" />

           <div className="flex gap-4 flex-wrap justify-center">
             {data.nodes.filter(n => n.label === "IP" || n.label === "Port").slice(0, 5).map(node => (
               <div key={node.id} className="flex flex-col items-center gap-2 p-2 bg-surface-800 rounded-lg border border-red-500/30 shadow-lg">
                 <ShieldAlert className="w-4 h-4 text-red-400" />
                 <span className="text-[9px] text-white/60 max-w-[80px] truncate" title={node.id}>{node.id}</span>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
