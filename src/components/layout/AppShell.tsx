import { useCallback, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useUI } from "@/context/UIContext";
import { useAuth } from "@/context/AuthContext";
import { useKonamiCode } from "@/hooks/useKonamiCode";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { ROUTES, IDLE_TIMEOUT_MS } from "@/lib/constants";

/**
 * AppShell wraps all authenticated pages.
 * Desktop: fixed sidebar (full or icon rail) + topbar + scrollable main.
 * Mobile: sidebar off-canvas until opened; backdrop + scroll lock when open.
 */
export function AppShell() {
  const { sidebarCollapsed, isMobile, sidebarMobileOpen, setSidebarMobileOpen } = useUI();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useIdleTimeout(IDLE_TIMEOUT_MS, useCallback(() => {
    logout();
    toast.info("Signed out due to inactivity");
    navigate("/");
  }, [logout, navigate]));

  const onKonami = useCallback(() => {
    sessionStorage.setItem("credits_from_konami", "1");
    toast("🎮 Cheat code activated", {
      style: {
        background: "#F59E0B",
        color: "#1C1917",
        fontWeight: 600,
        fontSize: "13px",
      },
      duration: 2000,
    });
    setTimeout(() => navigate(ROUTES.CREDITS), 600);
  }, [navigate]);

  useKonamiCode(onKonami);

  const sidebarWidth = isMobile
    ? "0px"
    : sidebarCollapsed
      ? "var(--sidebar-collapsed)"
      : "var(--sidebar-width)";

  useEffect(() => {
    if (!isMobile || !sidebarMobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, sidebarMobileOpen]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-base)" }}>
      {isMobile && sidebarMobileOpen && (
        <button
          type="button"
          className="app-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setSidebarMobileOpen(false)}
        />
      )}

      <Sidebar />

      <div
        className="d-flex flex-column min-vh-100 app-main-column"
        style={{
          marginLeft: sidebarWidth,
          minHeight: "100vh",
          transition: "margin-left 0.2s ease",
          background: "var(--color-bg-base)",
          border: "none",
          maxWidth: isMobile ? "100%" : undefined,
        }}
      >
        <Topbar />

        <main
          className="flex-grow-1 overflow-y-auto app-main-content"
          style={{ background: "var(--color-bg-base)", border: "none" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
