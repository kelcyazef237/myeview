import { Network } from "lucide-react";
import AttackPathGraph from "../components/dashboard/AttackPathGraph";
import { useAuthStore } from "../stores/authStore";

export default function AttackPathsPage() {
  const { user } = useAuthStore();
  
  return (
    <div className="space-y-6 max-w-[1400px] h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Network className="w-6 h-6 text-brand-500" />
          Attack Path Correlation
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Interactive visualization of discovered relationships and potential attack vectors.
        </p>
      </div>

      <div className="flex-1 min-h-0 bg-surface-800/50 rounded-2xl border border-white/5 overflow-hidden p-6 relative">
         <AttackPathGraph orgId={user?.organization_id} />
      </div>
    </div>
  );
}
