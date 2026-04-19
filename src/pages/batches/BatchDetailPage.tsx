import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BatchStageStepper } from "@/components/data/BatchStageStepper";
import { batchService } from "@/services/batchService";
import { getBatchDepositBaseTotal, getEntryFeePercent, getInvestorPrincipalAfterTransfer } from "@/lib/transferDeductions";
import { formatDate } from "@/lib/utils";
import { ROUTES, STAGE_LABELS } from "@/lib/constants";
import type { Batch, BatchStage } from "@/lib/types";
import { toast } from "sonner";
import { useBatchReconciliation } from "@/hooks/useBatchReconciliation";
import { ArrowLeft, Download, Trash2, Upload, Pencil } from "lucide-react";
import { reportService } from "@/services/reportService";
import { EmailConfirmationModal } from "@/components/ui/EmailConfirmationModal";
import { DeploymentDateModal } from "@/components/ui/DeploymentDateModal";
import { TransferCostModal } from "@/components/ui/TransferCostModal";

// ── Glass card ──
const glass: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
};

function CurrBadge({ currency }: { currency?: "KES" | "USD" | null }) {
  if (!currency) return null;
  const isKes = currency === "KES";
  return (
    <span style={{
      padding: "2px 7px", borderRadius: "5px",
      fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em",
      fontFamily: "var(--font-mono)",
      background: isKes ? "var(--color-kes-bg)" : "var(--color-usd-bg)",
      color: isKes ? "var(--color-kes)" : "var(--color-usd)",
      border: isKes ? "1px solid var(--color-kes-border)" : "1px solid var(--color-usd-border)",
    }}>
      {currency}
    </span>
  );
}

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [emailConfirmModalOpen, setEmailConfirmModalOpen] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [editBatchName, setEditBatchName] = useState("");
  const [editCertificateNumber, setEditCertificateNumber] = useState("");
  const [editDurationDays, setEditDurationDays] = useState<number>(30);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedBatchFile, setSelectedBatchFile] = useState<File | null>(null);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);

  const batchId = Number(id);
  const { reconciliation, loading: reconciliationLoading } = useBatchReconciliation(batchId);

  useEffect(() => {
    async function load() {
      if (!batchId || isNaN(batchId)) return;
      setLoading(true);
      try {
        const data = await batchService.getById(batchId);
        setBatch(data);
        setEditBatchName(data.batch_name);
        setEditCertificateNumber(data.certificate_number || "");
        setEditDurationDays(data.duration_days || 30);
        setInvestments((data as any).investments || []);
      } catch {
        toast.error("Failed to load batch");
        navigate(ROUTES.BATCHES);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [batchId, navigate]);

  const advanceStage = async () => {
    if (!batch) return;
    const nextStage = (batch.stage + 1) as BatchStage;
    if (nextStage > 4) return;
    if (nextStage === 3) { setDeployModalOpen(true); return; }
    if (nextStage === 2) { setTransferModalOpen(true); return; }
    const patchData: Record<string, unknown> = { stage: nextStage };
    if (nextStage === 4) patchData.is_active = true;
    try {
      await batchService.patch(batchId, patchData);
      toast.success(`Batch advanced to ${STAGE_LABELS[nextStage]}`);
      const data = await batchService.getById(batchId);
      setBatch(data);
      setEmailConfirmModalOpen(true);
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message || "Failed to update");
    }
  };

  const handleDeployDateConfirm = async (dateString: string) => {
    setIsDeploying(true);
    try {
      await batchService.patch(batchId, { stage: 3, deployment_confirmed: true, date_deployed: dateString });
      toast.success("Batch advanced to Deployed");
      const data = await batchService.getById(batchId);
      setBatch(data);
      setDeployModalOpen(false);
      setEmailConfirmModalOpen(true);
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message || "Failed to advance stage");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleTransferCostConfirm = async (transactionCostUsd: number, entryFeePercent: number) => {
    setIsTransferring(true);
    try {
      await batchService.patch(batchId, {
        stage: 2, is_transferred: true,
        transfer_transaction_cost: transactionCostUsd,
        transfer_entry_fee_percent: entryFeePercent,
        entry_fee_percentage: entryFeePercent,
      });
      toast.success("Batch advanced to Transferred");
      const data = await batchService.getById(batchId);
      setBatch(data);
      setTransferModalOpen(false);
      setEmailConfirmModalOpen(true);
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message || "Failed to advance stage");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!batch || !editBatchName.trim()) { toast.error("Batch name is required"); return; }
    try {
      await batchService.patch(batchId, {
        batch_name: editBatchName.trim(),
        duration_days: editDurationDays,
        certificate_number: editCertificateNumber.trim() || null,
      } as any);
      toast.success("Batch updated");
      setIsEditing(false);
      const updated = await batchService.getById(batchId);
      setBatch(updated);
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message || "Failed to update batch");
    }
  };

  const handleToggleBatchActive = async () => {
    if (!batch) return;
    if (!confirm(`Are you sure you want to ${batch.is_active ? "close" : "open"} this batch?`)) return;
    try {
      await batchService.toggleActive(batchId);
      const refreshed = await batchService.getById(batchId);
      setBatch(refreshed);
      toast.success(batch.is_active ? "Batch closed" : "Batch opened");
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message || "Failed to update batch status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this batch? This cannot be undone.")) return;
    try {
      await batchService.delete(batchId);
      toast.success("Batch deleted");
      navigate(ROUTES.BATCHES);
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message || "Failed to delete batch");
    }
  };

  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const handleBatchFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.xlsx?$/i)) { toast.error("Please select an .xlsx or .xls file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
    setSelectedBatchFile(file);
    setUploadingFile(true);
    setFileUploadProgress(0);
    const interval = setInterval(() => setFileUploadProgress((p) => Math.min(p + 20, 90)), 250);
    try {
      await batchService.uploadExcel(batchId, file);
      setFileUploadProgress(100);
      toast.success("File uploaded to existing batch");
      const updated = await batchService.getById(batchId);
      setBatch(updated);
      setInvestments((updated as any).investments || []);
      setEmailConfirmModalOpen(true);
    } catch (err: unknown) {
      toast.error((err as any)?.response?.data?.message || "File upload failed");
    } finally {
      clearInterval(interval);
      setUploadingFile(false);
    }
  };

  // ── Derived values ──
  const totalBatchDeposit = getBatchDepositBaseTotal(investments);
  const transferTransactionCost = (() => {
    const p = Number(batch?.transfer_transaction_cost ?? 0);
    if (p > 0) return p;
    return investments.reduce((sum: number, inv: any) => sum + Number(inv?.transaction_fee_usd ?? 0), 0);
  })();
  const transferEntryFeePercent = getEntryFeePercent(batch);

  const getNetAmount = (inv: any) => {
    if (batch && batch.stage >= 2) {
      return getInvestorPrincipalAfterTransfer(inv, {
        stage: batch.stage,
        batchTotalDepositBase: totalBatchDeposit,
        transferTransactionCost,
        entryFeePercent: transferEntryFeePercent,
      });
    }
    return Number(inv?.amount_deposited ?? 0);
  };

  if (loading || !batch) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "var(--color-brand-400)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isKes = batch.class_currency === "KES";
  const currencySymbol = isKes ? "KES " : "$ ";
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Stage action button labels
  const stageActionLabel: Record<number, string> = {
    1: "Close & Export",
    2: "Confirm Transfer",
    3: "Confirm Deployment",
  };

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* ── Back link ── */}
      <button
        onClick={() => navigate(ROUTES.BATCHES)}
        style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: "none", color: "var(--color-text-tertiary)", fontSize: "12px", cursor: "pointer", marginBottom: "16px", padding: 0 }}
      >
        <ArrowLeft size={13} /> Back to batches
      </button>

      {/* ── Header glass card ── */}
      <div style={{ ...glass, padding: "22px 24px", marginBottom: "16px" }}>
        {/* Breadcrumb: Fund → Class → Currency */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
          {batch.funds?.[0]?.fund_name && (
            <>
              <span>{batch.funds[0].fund_name}</span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            </>
          )}
          {batch.class_code && (
            <>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: isKes ? "var(--color-kes)" : "var(--color-usd)" }}>
                {batch.class_code}
              </span>
              <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
            </>
          )}
          <CurrBadge currency={batch.class_currency} />
        </div>

        {/* Name row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            {isEditing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "480px" }}>
                <input
                  value={editBatchName}
                  onChange={(e) => setEditBatchName(e.target.value)}
                  className="form-control"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 600 }}
                />
                <input
                  value={editCertificateNumber}
                  onChange={(e) => setEditCertificateNumber(e.target.value)}
                  className="form-control form-control-sm"
                  placeholder="Certificate number"
                />
                <input
                  type="number"
                  value={editDurationDays}
                  onChange={(e) => setEditDurationDays(Number(e.target.value))}
                  className="form-control form-control-sm"
                  placeholder="Duration (days)"
                  min={1}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={handleSaveEdit} className="btn btn-primary btn-sm">Save</button>
                  <button onClick={() => setIsEditing(false)} className="btn btn-sm" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--color-text-secondary)" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h1 style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "6px" }}>
                  {batch.batch_name}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {batch.certificate_number && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                      {batch.certificate_number}
                    </span>
                  )}
                  {batch.is_open && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 600, color: "#22c55e" }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                      Accepting investors
                      {batch.auto_close_at && (
                        <span style={{ color: "var(--color-text-tertiary)", fontWeight: 400 }}>
                          · closes {formatDate(batch.auto_close_at)}
                        </span>
                      )}
                    </span>
                  )}
                  {!reconciliationLoading && reconciliation && (
                    <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                      Recon AUM: <span style={{ color: "#22c55e", fontFamily: "var(--font-mono)" }}>{currencySymbol}{fmt(reconciliation.total_closing_aum)}</span>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, flexWrap: "wrap" }}>
            {/* Stage action — one at a time */}
            {batch.stage < 4 && !isEditing && (
              <button
                onClick={advanceStage}
                style={{
                  padding: "8px 16px", borderRadius: "8px", border: "none",
                  background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-400))",
                  color: "#fff", fontSize: "12px", fontWeight: 500,
                  cursor: "pointer", boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
                }}
              >
                {stageActionLabel[batch.stage] ?? `Advance to ${STAGE_LABELS[(batch.stage + 1) as BatchStage]}`}
              </button>
            )}
            <button onClick={() => setIsEditing(!isEditing)} title="Edit" style={{ padding: "7px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
              <Pencil size={13} />
            </button>
            <button onClick={() => batchFileInputRef.current?.click()} title="Upload investors" style={{ padding: "7px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
              <Upload size={13} />
            </button>
            <button onClick={() => reportService.downloadBatchSummary(batchId)} title="Export" style={{ padding: "7px 10px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)", cursor: "pointer" }}>
              <Download size={13} />
            </button>
            <button onClick={handleToggleBatchActive} style={{ padding: "7px 12px", borderRadius: "8px", background: batch.is_active ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", border: `1px solid ${batch.is_active ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, color: batch.is_active ? "#EF4444" : "#22c55e", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>
              {batch.is_active ? "Close" : "Open"}
            </button>
            <button onClick={handleDelete} title="Delete" style={{ padding: "7px 10px", borderRadius: "8px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#EF4444", cursor: "pointer" }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Upload progress */}
        {uploadingFile && (
          <div style={{ marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
              <span>Uploading {selectedBatchFile?.name}</span>
              <span>{fileUploadProgress}%</span>
            </div>
            <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
              <div style={{ width: `${fileUploadProgress}%`, height: "100%", background: "var(--color-brand-400)", borderRadius: "2px", transition: "width 0.25s" }} />
            </div>
          </div>
        )}

        <input ref={batchFileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleBatchFileChange} />
      </div>

      {/* ── Stage stepper card ── */}
      <div style={{ ...glass, padding: "18px 22px", marginBottom: "16px" }}>
        <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "12px" }}>
          Deployment Progress
        </p>
        <BatchStageStepper currentStage={batch.stage} />
        {/* Step date annotations */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginTop: "12px" }}>
          {([
            { label: "Deposited", date: batch.created_at },
            { label: "Transferred", date: batch.is_transferred ? batch.date_deployed : null },
            { label: "Deployed", date: batch.deployment_date_actual ?? batch.date_deployed },
            { label: "Active", date: batch.stage === 4 ? batch.date_deployed : null },
          ] as const).map((step, i) => (
            <div key={i} style={{ fontSize: "10px", color: "var(--color-text-tertiary)", textAlign: "center" }}>
              <div style={{ fontWeight: 600, marginBottom: "2px", color: batch.stage > i ? "var(--color-text-secondary)" : "var(--color-text-tertiary)" }}>
                {step.label}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}>
                {step.date ? formatDate(step.date) : batch.stage > i ? "Done" : "Pending"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px", marginBottom: "16px" }}>
        {[
          {
            label: "Total Deposited",
            value: batch.total_capital != null ? `${currencySymbol}${fmt(batch.total_capital)}` : "—",
          },
          {
            label: "Investors",
            value: String(batch.investors_count),
          },
          {
            label: "Deployment Date",
            value: batch.deployment_date_actual ? formatDate(batch.deployment_date_actual) : batch.date_deployed ? formatDate(batch.date_deployed) : "Pending",
          },
          {
            label: "NAV at Deployment",
            value: batch.deployment_nav != null ? batch.deployment_nav.toFixed(4) : "—",
            sub: batch.deployment_nav != null ? `${batch.class_currency ?? ""} / share` : undefined,
          },
          {
            label: "Total Shares",
            value: batch.total_shares != null ? batch.total_shares.toLocaleString("en-US", { maximumFractionDigits: 4 }) : "—",
            sub: batch.class_code ?? undefined,
          },
        ].map((kpi) => (
          <div key={kpi.label} style={{ ...glass, padding: "14px 16px" }}>
            <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "6px" }}>
              {kpi.label}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {kpi.value}
            </div>
            {kpi.sub && (
              <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "2px" }}>
                {kpi.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Investors table ── */}
      <div style={{ ...glass, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-tertiary)", margin: 0 }}>
            Investors ({investments.length})
          </p>
          <button
            onClick={() => navigate(ROUTES.BATCH_PERFORMANCE(batchId))}
            style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-brand-400)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            View performance →
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Investor", "Client Code", "Deposit", "Net Amount", "Shares", "Market Value", "Perf %"].map((h) => (
                  <th key={h} style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", padding: "10px 16px", textAlign: h === "Investor" || h === "Client Code" ? "left" : "right", background: "rgba(255,255,255,0.02)", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {investments.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" }}>
                    No investors yet. Upload a file or add investors individually.
                  </td>
                </tr>
              )}
              {investments.map((inv: any) => {
                const deposit = Number(inv?.amount_deposited ?? 0);
                const netAmount = getNetAmount(inv);
                const hasShareData = batch.stage >= 3 && inv.shares != null;
                const shares = inv.shares ?? inv.shares_owned ?? null;
                const marketValue = inv.market_value ?? null;
                const perfPct = inv.performance_pct ?? null;
                const isGain = (perfPct ?? 0) >= 0;

                return (
                  <tr
                    key={inv.id}
                    onClick={() => inv.internal_client_code && navigate(ROUTES.INVESTOR_OVERVIEW(inv.internal_client_code))}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.12s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.04)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "10px 16px" }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-brand-400)" }}>{inv.investor_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{inv.investor_email}</div>
                    </td>
                    <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-secondary)" }}>
                      {inv.internal_client_code ?? "—"}
                    </td>
                    <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-primary)", textAlign: "right" }}>
                      {currencySymbol}{fmt(deposit)}
                    </td>
                    <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-secondary)", textAlign: "right" }}>
                      {batch.stage >= 2 ? `${currencySymbol}${fmt(netAmount)}` : "—"}
                    </td>
                    <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>
                      {hasShareData && shares != null ? (
                        <span style={{ color: "var(--color-text-primary)" }}>{Number(shares).toFixed(4)}</span>
                      ) : (
                        <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>Pending</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "12px", textAlign: "right" }}>
                      {hasShareData && marketValue != null ? (
                        <span style={{ color: "var(--color-text-primary)" }}>{currencySymbol}{fmt(Number(marketValue))}</span>
                      ) : (
                        <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>Pending</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, textAlign: "right" }}>
                      {hasShareData && perfPct != null ? (
                        <span style={{ color: isGain ? "#22c55e" : "#EF4444" }}>
                          {isGain ? "+" : ""}{Number(perfPct).toFixed(2)}%
                        </span>
                      ) : (
                        <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals ── */}
      <EmailConfirmationModal open={emailConfirmModalOpen} onClose={() => setEmailConfirmModalOpen(false)} batchId={batchId} />
      <DeploymentDateModal open={deployModalOpen} onClose={() => setDeployModalOpen(false)} onConfirm={handleDeployDateConfirm} isLoading={isDeploying} />
      <TransferCostModal open={transferModalOpen} onClose={() => setTransferModalOpen(false)} totalBatchDeposit={totalBatchDeposit} onConfirm={handleTransferCostConfirm} isLoading={isTransferring} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
