import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { LogOut, User, Shield, Info } from "lucide-react";

export default function SettingsPage() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div>
      <h1 className="fs-4 fw-bold tracking-tight mb-1" style={{ color: "var(--color-text-primary)" }}>Settings</h1>
      <p className="text-xs mb-4" style={{ color: "var(--color-text-secondary)" }}>Account settings and preferences</p>

      <div className="max-w-xl space-y-4">
        {/* Account info */}
        <div className="rounded-lg border p-3 p-md-5" style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-border-subtle)" }}>
          <div className="flex items-center gap-3 mb-4">
            <User size={18} style={{ color: "var(--color-brand-400)" }} />
            <h3 className="text-sm fw-bold" style={{ color: "var(--color-text-primary)" }}>Account</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-[13px]">
              <span style={{ color: "var(--color-text-secondary)" }}>Role</span>
              <span className="text-[10px] fw-bold px-2.5 py-0.5 rounded" style={{ background: "var(--color-brand-50)", color: "var(--color-brand-300)" }}>{role}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span style={{ color: "var(--color-text-secondary)" }}>API endpoint</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-tertiary)", fontSize: "12px" }}>{import.meta.env.VITE_API_URL}</span>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div className="rounded-lg border p-3 p-md-5" style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-border-subtle)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Shield size={18} style={{ color: "var(--color-brand-400)" }} />
            <h3 className="text-sm fw-bold" style={{ color: "var(--color-text-primary)" }}>Permissions</h3>
          </div>
          <div className="space-y-2">
            {[
              { perm: "View dashboard, batches, funds, valuations, reports", has: true },
              { perm: "Create and manage batches and investments", has: true },
              { perm: "Commit valuations and trigger pro-rata", has: true },
              { perm: "Manage user roles", has: role === "admin" || role === "super_admin" },
              { perm: "Access audit logs", has: role === "super_admin" },
            ].map((p) => (
              <div key={p.perm} className="flex items-center gap-2 text-[12px]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.has ? "var(--color-success)" : "var(--color-border-default)" }} />
                <span style={{ color: p.has ? "var(--color-text-primary)" : "var(--color-text-disabled)" }}>{p.perm}</span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="rounded-lg border p-3 p-md-5" style={{ background: "var(--color-bg-surface)", borderColor: "var(--color-border-subtle)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Info size={18} style={{ color: "var(--color-brand-400)" }} />
            <h3 className="text-sm fw-bold" style={{ color: "var(--color-text-primary)" }}>About</h3>
          </div>
          <p className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>OFDS — Operations Fund Distribution System</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--color-text-tertiary)" }}>AIB AXYS Africa · v1.0.0</p>
        </div>

        {/* Logout */}
        <button onClick={handleLogout} className="w-full rounded-lg border p-4 flex items-center justify-center gap-2 text-sm font-medium cursor-pointer transition-colors" style={{ background: "transparent", borderColor: "var(--color-destructive)", color: "var(--color-destructive)" }}>
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );
}
