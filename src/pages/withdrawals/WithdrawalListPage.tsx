import { useEffect, useState, useRef } from "react";
import { StatusBadge } from "@/components/data/StatusBadge";
import { withdrawalService } from "@/services/withdrawalService";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Withdrawal } from "@/lib/types";
import { toast } from "sonner";
import { Upload, Check, X } from "lucide-react";

const FILTERS = ["", "Pending", "Approved", "Rejected"] as const;
const FILTER_LABELS: Record<string, string> = { "": "All", Pending: "Pending", Approved: "Approved", Rejected: "Rejected" };

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
      toast.success(`✅ Withdrawal approved for ${clientId}`);
      await load(); // Reload list
      window.dispatchEvent(new Event("dashboard_stats_dirty"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const onReject = async (withdrawalId: number, clientId: string) => {
    setProcessing(withdrawalId);
    try {
      await withdrawalService.reject(withdrawalId);
      toast.success(`❌ Withdrawal rejected for ${clientId}`);
      await load(); // Reload list
      window.dispatchEvent(new Event("dashboard_stats_dirty"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  const pillStyle = (active: boolean) => ({
    fontSize: "11px",
    fontWeight: 600 as const,
    padding: "4px 14px",
    borderRadius: "20px",
    border: active ? "1px solid var(--color-brand-400)" : "1px solid rgba(255,255,255,0.1)",
    background: active ? "var(--color-brand-50)" : "transparent",
    color: active ? "var(--color-brand-300)" : "var(--color-text-secondary)",
    cursor: "pointer" as const,
    transition: "all 0.15s",
  });

  const totalAmount = withdrawals.reduce((s, w) => s + w.amount, 0);

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="page-header-row mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "22px", color: "var(--color-text-primary)" }}>
            Withdrawals
          </h1>
          <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Track and manage investor withdrawal requests
          </p>
        </div>
        <div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="d-none" onChange={onUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn btn-sm d-flex align-items-center gap-2 fw-bold"
            style={{
              padding: "8px 18px",
              borderRadius: "20px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "transparent",
              color: "var(--color-text-secondary)",
            }}
          >
            <Upload size={14} /> {uploading ? "Uploading..." : "Upload Excel"}
          </button>
        </div>
      </div>

      {/* Table card */}
      <div className="card shadow">
        {/* Filter bar */}
        <div
          className="d-flex align-items-center gap-2 px-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          {FILTERS.map((f) => (
            <button key={f || "all"} onClick={() => setFilter(f)} style={pillStyle(filter === f)}>
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border spinner-border-sm" style={{ color: "var(--color-brand-400)" }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark mb-0" style={{ background: "var(--color-bg-surface)" }}>
              <thead>
                <tr>
                  {[
                    { label: "Client Code", align: "left"  },
                    { label: "Fund",        align: "left"  },
                    { label: "Amount",      align: "right" },
                    { label: "Status",      align: "left"  },
                    { label: "Date",        align: "left"  },
                    { label: "Approved",    align: "left"  },
                    { label: "Actions",     align: "center" },
                  ].map((h) => (
                    <th key={h.label} style={{ textAlign: h.align as "left" | "right" | "center" }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{w.client_id}</td>
                    <td className="fw-bold" style={{ fontSize: "13px" }}>{w.fund_name}</td>
                    <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-destructive)" }}>
                      {formatCurrency(w.amount)}
                    </td>
                    <td><StatusBadge status={w.status} /></td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>{formatDate(w.date_withdrawn)}</td>
                    <td style={{ color: "var(--color-text-tertiary)", fontSize: "12px" }}>{formatDate(w.approved_at)}</td>
                    <td style={{ textAlign: "center" }}>
                      {w.status === "Pending" ? (
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            onClick={() => onApprove(w.id, w.client_id)}
                            disabled={processing === w.id}
                            className="btn btn-sm d-flex align-items-center gap-1"
                            style={{
                              padding: "4px 10px",
                              fontSize: "11px",
                              borderRadius: "12px",
                              border: "none",
                              background: "#00005b",
                              color: "#ffffff",
                              cursor: processing === w.id ? "not-allowed" : "pointer",
                              opacity: processing === w.id ? 0.7 : 1,
                            }}
                            title="Approve this withdrawal"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => onReject(w.id, w.client_id)}
                            disabled={processing === w.id}
                            className="btn btn-sm d-flex align-items-center gap-1"
                            style={{
                              padding: "4px 10px",
                              fontSize: "11px",
                              borderRadius: "12px",
                              border: "none",
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "#ef4444",
                              cursor: processing === w.id ? "not-allowed" : "pointer",
                              opacity: processing === w.id ? 0.7 : 1,
                            }}
                            title="Reject this withdrawal"
                          >
                            <X size={12} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-5" style={{ color: "var(--color-text-tertiary)" }}>
                      No withdrawals found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div
          className="d-flex align-items-center justify-content-between px-4 py-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", color: "var(--color-text-tertiary)" }}
        >
          <span>{withdrawals.length} withdrawal{withdrawals.length !== 1 ? "s" : ""}</span>
          <span>Total: {formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
