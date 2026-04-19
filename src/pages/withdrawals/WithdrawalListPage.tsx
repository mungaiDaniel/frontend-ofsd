import { useEffect, useState, useRef } from "react";
import { withdrawalService } from "@/services/withdrawalService";
import { formatDate } from "@/lib/utils";
import type { Withdrawal } from "@/lib/types";
import { toast } from "sonner";
import { Upload, Check, X } from "lucide-react";

const FILTERS = ["", "Pending", "Approved", "Rejected"] as const;
const FILTER_LABELS: Record<string, string> = { "": "All", Pending: "Pending", Approved: "Approved", Rejected: "Rejected" };

const glass: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
};

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    Pending:  { bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
    Approved: { bg: "rgba(34,197,94,0.12)",   color: "#22C55E" },
    Rejected: { bg: "rgba(239,68,68,0.12)",   color: "#F87171" },
  };
  const c = colors[status] ?? { bg: "rgba(255,255,255,0.06)", color: "var(--color-text-tertiary)" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: "100px",
      fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em",
      background: c.bg, color: c.color,
    }}>
      {status}
    </span>
  );
}

export default function WithdrawalListPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try { setWithdrawals(await withdrawalService.getAll(filter || undefined)); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await withdrawalService.uploadExcel(file);
      toast.success("Withdrawals uploaded");
      await load();
      window.dispatchEvent(new Event("dashboard_stats_dirty"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onApprove = async (withdrawalId: number, clientId: string) => {
    setProcessing(withdrawalId);
    try {
      await withdrawalService.approve(withdrawalId);
      toast.success(`Withdrawal approved for ${clientId}`);
      await load();
      window.dispatchEvent(new Event("dashboard_stats_dirty"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve");
    } finally { setProcessing(null); }
  };

  const onReject = async (withdrawalId: number, clientId: string) => {
    setProcessing(withdrawalId);
    try {
      await withdrawalService.reject(withdrawalId);
      toast.success(`Withdrawal rejected for ${clientId}`);
      await load();
      window.dispatchEvent(new Event("dashboard_stats_dirty"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally { setProcessing(null); }
  };

  const totalAmount = withdrawals.reduce((s, w) => s + w.amount, 0);
  const pendingCount = withdrawals.filter((w) => w.status === "Pending").length;

  return (
    <div>
      {/* Header */}
      <div className="page-header-row mb-4">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            Withdrawals
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Track and approve investor withdrawal requests
            {pendingCount > 0 && (
              <span style={{ marginLeft: "8px", fontSize: "10px", padding: "2px 8px", borderRadius: "100px", background: "rgba(245,158,11,0.12)", color: "#F59E0B", fontWeight: 600 }}>
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={onUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 16px", borderRadius: "8px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
              color: "var(--color-text-secondary)", fontSize: "12px", fontWeight: 500,
              cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.7 : 1,
            }}
          >
            <Upload size={14} /> {uploading ? "Uploading…" : "Upload Excel"}
          </button>
        </div>
      </div>

      {/* Table card */}
      <div style={glass}>
        {/* Filter bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button key={f || "all"} onClick={() => setFilter(f)} style={{
                padding: "4px 14px", borderRadius: "100px",
                fontSize: "11px", fontWeight: 600,
                border: active ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                background: active ? "rgba(59,130,246,0.12)" : "transparent",
                color: active ? "#60A5FA" : "var(--color-text-secondary)",
                cursor: "pointer", transition: "all 0.15s",
              }}>
                {FILTER_LABELS[f]}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
            <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : withdrawals.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
            No withdrawals{filter ? ` with status "${filter}"` : ""}.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {[
                    { label: "Client Code", align: "left" },
                    { label: "Fund", align: "left" },
                    { label: "Amount", align: "right" },
                    { label: "Status", align: "left" },
                    { label: "Date", align: "left" },
                    { label: "Approved", align: "left" },
                    { label: "Actions", align: "center" },
                  ].map((h) => (
                    <th key={h.label} style={{
                      padding: "10px 16px", textAlign: h.align as "left" | "right" | "center",
                      fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                      color: "var(--color-text-tertiary)",
                    }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "11px 16px", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--color-text-primary)" }}>{w.client_id}</td>
                    <td style={{ padding: "11px 16px", fontSize: "12px", fontWeight: 600, color: "var(--color-text-primary)" }}>{w.fund_name}</td>
                    <td style={{ padding: "11px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#F87171", fontWeight: 600 }}>
                      {w.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: "11px 16px" }}><StatusPill status={w.status} /></td>
                    <td style={{ padding: "11px 16px", fontSize: "12px", color: "var(--color-text-secondary)" }}>{formatDate(w.date_withdrawn)}</td>
                    <td style={{ padding: "11px 16px", fontSize: "12px", color: "var(--color-text-tertiary)" }}>{formatDate(w.approved_at)}</td>
                    <td style={{ padding: "11px 16px", textAlign: "center" }}>
                      {w.status === "Pending" ? (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button
                            onClick={() => onApprove(w.id, w.client_id)}
                            disabled={processing === w.id}
                            style={{
                              display: "flex", alignItems: "center", gap: "4px",
                              padding: "4px 10px", borderRadius: "6px", border: "none",
                              fontSize: "11px", fontWeight: 500,
                              background: "rgba(34,197,94,0.12)", color: "#22C55E",
                              cursor: processing === w.id ? "not-allowed" : "pointer",
                              opacity: processing === w.id ? 0.6 : 1,
                            }}
                          >
                            <Check size={11} /> Approve
                          </button>
                          <button
                            onClick={() => onReject(w.id, w.client_id)}
                            disabled={processing === w.id}
                            style={{
                              display: "flex", alignItems: "center", gap: "4px",
                              padding: "4px 10px", borderRadius: "6px", border: "none",
                              fontSize: "11px", fontWeight: 500,
                              background: "rgba(239,68,68,0.12)", color: "#F87171",
                              cursor: processing === w.id ? "not-allowed" : "pointer",
                              opacity: processing === w.id ? 0.6 : 1,
                            }}
                          >
                            <X size={11} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
          <span>{withdrawals.length} withdrawal{withdrawals.length !== 1 ? "s" : ""}</span>
          <span>Total: {totalAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
