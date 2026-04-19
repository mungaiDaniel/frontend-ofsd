import { useEffect, useState } from "react";
import { userService } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import { formatDate } from "@/lib/utils";
import type { User } from "@/lib/types";
import { toast } from "sonner";
import { CheckCircle2, Ban, KeyRound } from "lucide-react";

const glass: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px", padding: "8px 12px", width: "100%",
  fontSize: "13px", color: "var(--color-text-primary)", outline: "none",
  fontFamily: "var(--font-sans)",
};

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    super_admin: { bg: "rgba(168,85,247,0.12)", color: "#C084FC" },
    admin:       { bg: "rgba(59,130,246,0.12)", color: "#60A5FA" },
    user:        { bg: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)" },
  };
  const c = colors[role] ?? { bg: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: "100px",
      fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em",
      background: c.bg, color: c.color,
    }}>
      {role}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", borderRadius: "100px",
      fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em",
      background: active ? "rgba(34,197,94,0.12)" : "rgba(245,158,11,0.12)",
      color: active ? "#22C55E" : "#F59E0B",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "currentColor" }} />
      {status}
    </span>
  );
}

export default function UserManagementPage() {
  const { role: myRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingReset, setSavingReset] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setUsers(await userService.getAll()); }
    catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const approve = async (userId: number) => {
    if (!confirm(`Approve user #${userId}?`)) return;
    try {
      await userService.approve(userId);
      toast.success("User approved");
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Approval failed");
    }
  };

  const deactivate = async (userId: number) => {
    if (!confirm(`Deactivate user #${userId}?`)) return;
    try {
      await userService.setStatus(userId, "pending");
      toast.success("User set to pending");
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Deactivation failed");
    }
  };

  const openResetModal = (user: User) => {
    setResetUser(user);
    setNewPassword("");
    setConfirmPassword("");
  };

  const closeResetModal = () => {
    if (savingReset) return;
    setResetUser(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const submitResetPassword = async () => {
    if (!resetUser) return;
    if (newPassword.trim().length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    try {
      setSavingReset(true);
      await userService.resetPassword(resetUser.id, newPassword.trim());
      toast.success(`Password reset for ${resetUser.email}`);
      closeResetModal();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Password reset failed");
    } finally { setSavingReset(false); }
  };

  const setRole = async (userId: number, role: "user" | "admin" | "super_admin") => {
    try {
      await userService.setRole(userId, role);
      toast.success(`Role updated to ${role}`);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Role update failed");
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];
  const pendingCount = safeUsers.filter((u) => u.status === "pending").length;

  return (
    <div>
      {/* Header */}
      <div className="page-header-row mb-4">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            Users
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Manage system users and role assignments
            {pendingCount > 0 && (
              <span style={{ marginLeft: "8px", fontSize: "10px", padding: "2px 8px", borderRadius: "100px", background: "rgba(245,158,11,0.12)", color: "#F59E0B", fontWeight: 600 }}>
                {pendingCount} pending approval
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Table card */}
      <div style={glass}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : safeUsers.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "13px" }}>No users found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Name", "Email", "Role", "Status", "Created", "Actions"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 16px", textAlign: "left",
                      fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                      color: "var(--color-text-tertiary)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {safeUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "11px 16px", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>{u.name}</td>
                    <td style={{ padding: "11px 16px", fontSize: "12px", color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>{u.email}</td>
                    <td style={{ padding: "11px 16px" }}>
                      {myRole === "super_admin" ? (
                        <select
                          value={u.role}
                          onChange={(e) => setRole(u.id, e.target.value as any)}
                          style={{
                            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "6px", padding: "3px 8px", fontSize: "11px",
                            color: "var(--color-text-primary)", cursor: "pointer", outline: "none",
                          }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          <option value="super_admin">super_admin</option>
                        </select>
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>
                    <td style={{ padding: "11px 16px" }}><StatusPill status={u.status} /></td>
                    <td style={{ padding: "11px 16px", fontSize: "12px", color: "var(--color-text-tertiary)" }}>{formatDate(u.created)}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {myRole === "super_admin" && u.status === "pending" && (
                          <button onClick={() => approve(u.id)} style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            padding: "4px 10px", borderRadius: "6px", border: "none",
                            fontSize: "11px", fontWeight: 500,
                            background: "rgba(34,197,94,0.12)", color: "#22C55E", cursor: "pointer",
                          }}>
                            <CheckCircle2 size={11} /> Approve
                          </button>
                        )}
                        {myRole === "super_admin" && u.status === "active" && (
                          <button onClick={() => deactivate(u.id)} style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            padding: "4px 10px", borderRadius: "6px", border: "none",
                            fontSize: "11px", fontWeight: 500,
                            background: "rgba(239,68,68,0.12)", color: "#F87171", cursor: "pointer",
                          }}>
                            <Ban size={11} /> Deactivate
                          </button>
                        )}
                        {myRole === "super_admin" && (
                          <button onClick={() => openResetModal(u)} style={{
                            display: "flex", alignItems: "center", gap: "4px",
                            padding: "4px 10px", borderRadius: "6px", border: "none",
                            fontSize: "11px", fontWeight: 500,
                            background: "rgba(59,130,246,0.12)", color: "#60A5FA", cursor: "pointer",
                          }}>
                            <KeyRound size={11} /> Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
          {safeUsers.length} user{safeUsers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Reset password modal */}
      {resetUser && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(6,11,26,0.72)", backdropFilter: "blur(4px)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={closeResetModal}
        >
          <div
            style={{ ...glass, maxWidth: "440px", width: "100%", padding: "28px 32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "6px" }}>Reset Password</h3>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginBottom: "20px" }}>
              Set a new password for <span style={{ fontFamily: "var(--font-mono)" }}>{resetUser.email}</span>
            </p>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" style={inputStyle} />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" style={inputStyle} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={closeResetModal} disabled={savingReset} style={{ padding: "8px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-text-secondary)", fontSize: "12px", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={submitResetPassword} disabled={savingReset} style={{ padding: "8px 16px", borderRadius: "8px", background: "#1A45FF", border: "none", color: "#fff", fontSize: "12px", fontWeight: 500, cursor: savingReset ? "not-allowed" : "pointer", opacity: savingReset ? 0.7 : 1 }}>
                {savingReset ? "Saving…" : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
