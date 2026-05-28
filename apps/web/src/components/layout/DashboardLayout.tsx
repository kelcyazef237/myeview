import { useState } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "../../lib/utils";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/**
 * Main dashboard layout wrapper.
 * Combines the sidebar, top bar, and scrollable content area.
 */
export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-body)" }}>
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          sidebarCollapsed ? "ml-[72px]" : "ml-[260px]"
        )}
      >
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
