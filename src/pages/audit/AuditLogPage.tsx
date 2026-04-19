import { useEffect, useState } from "react";
import { auditService } from "@/services/auditService";
import { formatDateTime } from "@/lib/utils";
import type { AuditLogEntry } from "@/lib/types";
import { Search, ShieldCheck, AlertTriangle, Download } from "lucide-react";

const glass: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    setLoading(true);
    auditService.getAll({ action: actionFilter || undefined })
      .then((data) => { setLogs(data); setUnavailable(false); })
      .catch(() => setUnavailable(true))
      .finally(() => setLoading(false));
  }, [actionFilter]);

  const filtered = search
    ? logs.filter((l) =>
        (l.action || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.target_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (l.description || "").toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();

  const onDownload = async () => {
    try { await auditService.download({ action: actionFilter || undefined }); }
    catch { setUnavailable(true); }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header-row mb-4">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <ShieldCheck size={20} style={{ color: "#60A5FA" }} />
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "4px" }}>
              Audit Log
            </h1>
            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
              System-wide activity — super admin only
            </p>
          </div>
        </div>
        <button
          onClick={onDownload}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", borderRadius: "8px",
            background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)",
            color: "#60A5FA", fontSize: "12px", fontWeight: 500, cursor: "pointer",
          }}
        >
          <Download size={14} /> Download CSV
        </button>
      </div>

      {unavailable && (
        <div style={{
          ...glass, padding: "16px 20px", marginBottom: "16px",
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
          display: "flex", alignItems: "flex-start", gap: "12px",
        }}>
          <AlertTriangle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: "2px" }} />
          <div>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#F59E0B", margin: "0 0 2px" }}>Audit log endpoint not available</p>
            <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", margin: 0 }}>
              The backend needs to implement <span style={{ fontFamily: "var(--font-mono)" }}>GET /api/v1/audit-logs</span>. This UI is ready and will work once deployed.
            </p>
          </div>
        </div>
      )}

      {/* Table card */}
      <div style={glass}>
        {/* Filter bar */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px", padding: "6px 10px", fontSize: "12px",
              color: "var(--color-text-primary)", cursor: "pointer", outline: "none",
            }}
          >
            <option value="">All actions</option>
            {uniqueActions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          <div style={{ position: "relative", marginLeft: "auto" }}>
            <Search size={12} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs…"
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px", paddingLeft: "30px", paddingRight: "12px",
                paddingTop: "6px", paddingBottom: "6px",
                fontSize: "12px", color: "var(--color-text-primary)", width: "220px", outline: "none",
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Timestamp", "Action", "Target", "User", "Description", "Status", "IP"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 16px", textAlign: "left",
                      fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                      color: "var(--color-text-tertiary)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "48px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
                      {unavailable ? "Waiting for backend endpoint." : "No audit logs found."}
                    </td>
                  </tr>
                ) : filtered.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "11px 16px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: "100px",
                        fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em",
                        background: "rgba(59,130,246,0.12)", color: "#60A5FA",
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                      {log.target_type || "—"}{log.target_name ? ` · ${log.target_name}` : ""}
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: "12px", color: "var(--color-text-tertiary)" }}>
                      {log.user_name || "Unknown"}
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: "12px", color: "var(--color-text-secondary)", maxWidth: "280px" }}>
                      {log.description || "—"}
                    </td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{
                        display: "inline-block", padding: "2px 8px", borderRadius: "100px",
                        fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em",
                        background: log.success ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                        color: log.success ? "#22C55E" : "#F87171",
                      }}>
                        {log.success ? "OK" : "FAIL"}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                      {log.ip_address || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
          {filtered.length} entries
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
