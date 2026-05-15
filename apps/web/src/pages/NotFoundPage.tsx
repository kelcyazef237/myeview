import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldOff } from "lucide-react";

/**
 * 404 Not Found page with branded design.
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 grid-bg">
      <div className="text-center animate-slide-up">
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-brand-500/10 border border-brand-500/20">
            <ShieldOff size={36} className="text-brand-400" />
          </div>
        </div>

        <h1 className="text-6xl font-bold gradient-text mb-2">404</h1>
        <h2 className="text-xl font-semibold text-white mb-2">
          Page not found
        </h2>
        <p className="text-sm text-white/40 max-w-sm mx-auto mb-8">
          The resource you're looking for doesn't exist or has been moved.
          Check the URL or return to the dashboard.
        </p>

        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500/10 text-brand-400 text-sm font-medium border border-brand-500/20 hover:bg-brand-500/20 transition-all duration-200"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
