import { Construction, LayoutDashboard } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function PlaceholderPage() {
  const location = useLocation();
  const pageName = location.pathname.split("/")[1];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 bg-surface-800 border border-white/5 rounded-2xl flex items-center justify-center text-brand-500 mb-4 shadow-lg shadow-brand-500/10">
        <Construction className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-white capitalize">{pageName}</h1>
      <p className="text-white/40 max-w-md">
        This view is currently under construction. Check back soon for updates to the {pageName} module.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-surface-800 hover:bg-surface-700 border border-white/5 rounded-lg text-sm text-white transition-colors"
      >
        <LayoutDashboard className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
}
