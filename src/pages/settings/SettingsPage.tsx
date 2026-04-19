import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { LogOut, User, Shield, Info } from "lucide-react";

const glass: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export default function SettingsPage() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  const PERMS = [
    { perm: "View dashboard, batches, funds, valuations, reports", has: true },
    { perm: "Create and manage batches and investments", has: true },
    { perm: "Commit valuations and trigger pro-rata allocation", has: true },
    { perm: "Manage user roles", has: role === "admin" || role === "super_admin" },
    { perm: "Access audit logs (super admin only)", has: role === "super_admin" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "4px" }}>
        Settings
      </h1>
      <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "24px" }}>
        Account settings and system info
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "540px" }}>
        {/* Account */}
        <div style={{ ...glass, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <User size={16} style={{ color: "#60A5FA" }} />
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>Account</h3>
          </div>
          <Row
            label="Role"
            value={
              <span style={{
                fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "100px",
                background: role === "super_admin" ? "rgba(168,85,247,0.12)" : role === "admin" ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.06)",
                color: role === "super_admin" ? "#C084FC" : role === "admin" ? "#60A5FA" : "var(--color-text-secondary)",
              }}>
                {role ?? "—"}
              </span>
            }
          />
          <Row
            label="API endpoint"
            value={<span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-tertiary)" }}>{import.meta.env.VITE_API_URL}</span>}
          />
          <Row
            label="Mock mode"
            value={
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: import.meta.env.VITE_USE_MOCKS === "true" ? "#F59E0B" : "var(--color-text-tertiary)" }}>
                {import.meta.env.VITE_USE_MOCKS === "true" ? "ON" : "OFF"}
              </span>
            }
          />
        </div>

        {/* Permissions */}
        <div style={{ ...glass, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Shield size={16} style={{ color: "#60A5FA" }} />
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>Permissions</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {PERMS.map((p) => (
              <div key={p.perm} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0,
                  background: p.has ? "#22C55E" : "rgba(255,255,255,0.15)",
                }} />
                <span style={{ fontSize: "12px", color: p.has ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                  {p.perm}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        <div style={{ ...glass, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Info size={16} style={{ color: "#60A5FA" }} />
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", margin: 0 }}>About</h3>
          </div>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: "0 0 4px" }}>OFSD — Offshore Fund System & Distribution</p>
          <p style={{ fontSize: "11px", color: "var(--color-text-tertiary)", margin: 0 }}>AIB AXYS Africa · v2.0.0</p>
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: "12px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#F87171", fontSize: "13px", fontWeight: 500,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.14)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)")}
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  );
}
