import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Globe,
  Shield,
  Activity,
  FileCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  Network,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/utils";
import Logo from "./Logo";
import { useAuthStore } from "../../stores/authStore";
import { useDiscoveryStream } from "../../hooks/useDiscoveryStream";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { label: "Assets", icon: Globe, path: "/assets" },
      { label: "Discovery", icon: Search, path: "/discovery" },
      { label: "Attack Paths", icon: Network, path: "/attack-paths" },
    ],
  },
  {
    title: "Security",
    items: [
      { label: "Risk Scoring", icon: Shield, path: "/risks" },
      { label: "Enrichment", icon: Activity, path: "/enrichment" },
      { label: "Compliance", icon: FileCheck, path: "/compliance" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", icon: Settings, path: "/settings" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * Collapsible sidebar navigation with grouped nav items.
 * Features smooth width transitions and active state indicators.
 */
export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [assetCount, setAssetCount] = useState<number | undefined>(undefined);
  const { stats } = useDiscoveryStream();

  useEffect(() => {
    const fetchAssetCount = async () => {
      try {
        const res = await fetch(`/api/v1/discovery/assets?organization_id=${user?.organization_id}`);
        if (res.ok) {
          const data = await res.json();
          setAssetCount(data ? data.length : 0);
        }
      } catch (err) {
        console.error("Failed to fetch assets count", err);
      }
    };
    if (user) {
      fetchAssetCount();
    }
  }, [user]);

  const displayCount = assetCount !== undefined ? assetCount + stats.total_assets : undefined;

  const isActive = (path: string) => location.pathname === path;

  const updatedNavigation = navigation.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.label === "Assets") {
        return { ...item, badge: displayCount };
      }
      return item;
    }),
  }));

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col",
        "bg-surface-950 border-r border-border-subtle",
        "transition-all duration-300 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border-subtle">
        <Logo collapsed={collapsed} />
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {updatedNavigation.map((group) => (
          <div key={group.title}>
            {/* Group Title */}
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/30 px-3 mb-2">
                {group.title}
              </p>
            )}

            {/* Nav Items */}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <li key={item.path}>
                    <button
                      onClick={() => navigate(item.path)}
                      onMouseEnter={() => setHoveredItem(item.path)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        "group relative flex items-center gap-3 w-full rounded-lg px-3 py-2.5",
                        "text-sm font-medium transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                        active
                          ? "bg-brand-500/10 text-brand-400"
                          : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      {/* Active Indicator */}
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand-500 rounded-r-full" />
                      )}

                      <Icon
                        size={20}
                        className={cn(
                          "flex-shrink-0 transition-colors duration-200",
                          active ? "text-brand-400" : "text-white/40 group-hover:text-white/70"
                        )}
                      />

                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand-500/20 text-brand-400 text-[11px] font-semibold">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}

                      {/* Tooltip (collapsed mode) */}
                      {collapsed && hoveredItem === item.path && (
                        <div className="absolute left-full ml-3 px-3 py-1.5 rounded-md bg-surface-700 text-white text-xs font-medium whitespace-nowrap shadow-dropdown z-50 animate-fade-in">
                          {item.label}
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-surface-700" />
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-border-subtle p-3">
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center justify-center w-full rounded-lg py-2.5",
            "text-white/30 hover:text-white/60 hover:bg-white/[0.04]",
            "transition-all duration-200"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && (
            <span className="ml-2 text-xs font-medium">Collapse</span>
          )}
        </button>
      </div>
    </aside>
  );
}
