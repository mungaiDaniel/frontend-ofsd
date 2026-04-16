import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { KPICard } from "@/components/data/KPICard";
import { ChartCard } from "@/components/charts/ChartCard";
import { FundPerformanceLineChart } from "@/components/charts/FundPerformanceLineChart";
import { PortfolioAUMChart } from "@/components/charts/PortfolioAUMChart";
import { DepositsWithdrawalsBarChart } from "@/components/charts/DepositsWithdrawalsBarChart";
import { fundService } from "@/services/fundService";
import { batchService } from "@/services/batchService";
import { reportService } from "@/services/reportService";
import { formatCurrencyCompact, formatDate } from "@/lib/utils";
import { getFundColor, FLOW_COLORS } from "@/lib/chartConfig";
import { getBatchDepositBaseTotal, getEntryFeePercent, getInvestorPrincipalAfterTransfer } from "@/lib/transferDeductions";
import type { CoreFund, ReportSummary, BatchInvestor } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, Landmark, Layers, ChevronDown, ChevronUp, Users } from "lucide-react";

export default function FundDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fundId = Number(id);
  const [fund, setFund] = useState<CoreFund | null>(null);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatchId, setExpandedBatchId] = useState<number | null>(null);
  const [batchInvestors, setBatchInvestors] = useState<BatchInvestor[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [fundData, reps] = await Promise.allSettled([
          fundService.getById(fundId),
          reportService.getAll(fundId),
        ]);
        if (fundData.status === "fulfilled") setFund(fundData.value);
        if (reps.status === "fulfilled") setReports(reps.value);
      } finally {
        setLoading(false);
      }
    }
    if (fundId) load();
  }, [fundId]);

  const loadBatchInvestors = async (batchId: number) => {
    if (!fundId || !fund) return;

    if (expandedBatchId === batchId) {
      setExpandedBatchId(null);
      setBatchInvestors([]);
      return;
    }

    setBatchLoading(true);
    try {
      const batch = await batchService.getById(batchId);
      const fundName = fund.fund_name;
      const investors = batch?.grouped_by_fund?.[fundName]?.investors ?? [];
      const batchBaseTotal = getBatchDepositBaseTotal(batch?.investments ?? []);
      const entryFeePercent = getEntryFeePercent(batch);
      const transferTransactionCost = Number(batch?.transfer_transaction_cost ?? 0);
      const normalized = investors.map((inv: any) => ({
        ...inv,
        main_balance: getInvestorPrincipalAfterTransfer(inv, {
          stage: batch?.stage,
          batchTotalDepositBase: batchBaseTotal,
          transferTransactionCost,
          entryFeePercent,
        }),
      }));

      setBatchInvestors(normalized);
      setExpandedBatchId(batchId);
    } catch (err) {
      toast.error("Could not load batch investors");
    } finally {
      setBatchLoading(false);
    }
  };

  const sorted = [...reports].sort((a, b) => new Date(a.epoch_end).getTime() - new Date(b.epoch_end).getTime());
  const labels = sorted.map((r) => new Date(r.epoch_end).toLocaleDateString("en-GB", { month: "short", day: "2-digit" }));

  const latestAUM = fund?.total_aum ?? 0;
  const latestRate = sorted[sorted.length - 1]?.performance_rate_percent || 0;
  const totalInvestors = fund?.investor_count ?? 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-border-subtle)", borderTopColor: "var(--color-brand-400)" }} /></div>;

  return (
    <div>
      <button onClick={() => navigate("/funds")} className="flex items-center gap-1 text-[12px] mb-3 cursor-pointer" style={{ color: "var(--color-text-tertiary)" }}><ArrowLeft size={14} /> Funds</button>

      <div className="page-header-row mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="w-10 h-10 rounded-lg d-flex align-items-center justify-content-center" style={{ background: "var(--color-brand-50)" }}><Landmark size={18} style={{ color: "var(--color-brand-400)" }} /></div>
          <div>
            <h1 className="fs-4 fw-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>{fund?.fund_name || "Fund"}</h1>
            <span className="text-[10px] fw-bold px-2 py-0.5 rounded" style={{ background: fund?.is_active ? "var(--color-success-bg)" : "var(--color-destructive-bg)", color: fund?.is_active ? "var(--color-success)" : "var(--color-destructive)" }}>{fund?.is_active ? "Active" : "Inactive"}</span>
          </div>
        </div>

        <button
          onClick={async () => {
            if (!fundId || !fund) return;
            if (!confirm(`Delete fund ${fund.fund_name}? This will remove it from the system permanently.`)) return;
            try {
              await fundService.delete(fundId);
              toast.success('Fund deleted permanently');
              navigate('/funds');
            } catch (err: unknown) {
              const message = (err as any)?.response?.data?.message || 'Failed to delete fund';
              toast.error(message);
            }
          }}
          className="btn btn-outline-danger btn-sm"
          style={{ fontSize: '12px', minWidth: '110px' }}
        >
          Delete fund
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <KPICard label="Current AUM" value={formatCurrencyCompact(latestAUM)} />
        <KPICard label="Latest performance" value={`${latestRate.toFixed(2)}%`} />
        <KPICard label="Investors" value={String(totalInvestors)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Performance (%)" subtitle="Rate per epoch" legend={[{ label: fund?.fund_name || "Fund", color: getFundColor(fund?.fund_name || "") }]}>
          <FundPerformanceLineChart data={{ labels: labels.length ? labels : ["—"], funds: [{ name: fund?.fund_name || "Fund", data: sorted.map((r) => r.performance_rate_percent) }] }} />
        </ChartCard>

        <ChartCard title="AUM over time" subtitle="Closing balance per epoch" legend={[{ label: fund?.fund_name || "Fund", color: getFundColor(fund?.fund_name || "") }]}>
          <PortfolioAUMChart data={{ labels: labels.length ? labels : ["—"], funds: [{ name: fund?.fund_name || "Fund", data: sorted.map((r) => r.summary.total_closing_aum), growth: sorted.map((r) => r.performance_rate_percent || 0) }] }} />
        </ChartCard>

        <ChartCard title="Deposits vs withdrawals" subtitle="Per epoch period" legend={[{ label: "Deposits", color: FLOW_COLORS.deposit }, { label: "Withdrawals", color: FLOW_COLORS.withdrawal }]} >
          <DepositsWithdrawalsBarChart data={{ labels: labels.length ? labels : ["—"], deposits: sorted.map((r) => r.summary.total_deposits), withdrawals: sorted.map((r) => r.summary.total_withdrawals) }} />
        </ChartCard>
      </div>

      {/* Active Batches Section */}
      <div className="mt-5">
        <div className="d-flex align-items-center gap-2 mb-4">
          <Layers size={18} style={{ color: "var(--color-brand-400)" }} />
          <h2 className="fs-5 fw-bold mb-0" style={{ color: "var(--color-text-primary)" }}>Active Batches</h2>
          {fund?.batches && (
            <span className="badge rounded-pill ms-2" style={{ background: "rgba(255,255,255,0.07)", color: "var(--color-text-tertiary)", fontSize: "11px" }}>
              {fund.batches.length}
            </span>
          )}
        </div>

        <div className="card shadow border-0 overflow-hidden" style={{ background: "var(--color-bg-surface)" }}>
          <div className="table-responsive">
            <table className="table table-dark mb-0" style={{ "--bs-table-bg": "transparent" } as any}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="px-4 py-3 text-uppercase fw-bold text-muted" style={{ fontSize: "10px", letterSpacing: "0.08em" }}></th>
                  <th className="px-4 py-3 text-uppercase fw-bold text-muted" style={{ fontSize: "10px", letterSpacing: "0.08em" }}>Batch Name</th>
                  <th className="px-4 py-3 text-uppercase fw-bold text-muted" style={{ fontSize: "10px", letterSpacing: "0.08em" }}>Capital (AUM)</th>
                  <th className="px-4 py-3 text-uppercase fw-bold text-muted" style={{ fontSize: "10px", letterSpacing: "0.08em" }}>Investors</th>
                  <th className="px-4 py-3 text-uppercase fw-bold text-muted" style={{ fontSize: "10px", letterSpacing: "0.08em" }}>Deployment Date</th>
                  <th className="px-4 py-3 text-uppercase fw-bold text-muted" style={{ fontSize: "10px", letterSpacing: "0.08em" }}>Status</th>
                </tr>
              </thead>
              <tbody className="border-0">
                {fund?.batches && fund.batches.length > 0 ? (
                  fund.batches.map((batch) => {
                    const isExpanded = expandedBatchId === batch.batch_id;
                    return (
                      <>
                        {/* Batch Row */}
                        <tr
                          key={batch.batch_id}
                          style={{
                            borderBottom: isExpanded ? "none" : "1px solid rgba(255,255,255,0.04)",
                            cursor: "pointer",
                            background: isExpanded ? "rgba(255,255,255,0.03)" : "transparent",
                            transition: "background 0.15s",
                          }}
                          onClick={() => loadBatchInvestors(batch.batch_id)}
                        >
                          {/* Chevron indicator */}
                          <td className="ps-4 py-3 align-middle" style={{ width: "36px" }}>
                            {batchLoading && isExpanded ? (
                              <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-border-subtle)", borderTopColor: "var(--color-brand-400)", width: 14, height: 14 }} />
                            ) : isExpanded ? (
                              <ChevronUp size={14} style={{ color: "var(--color-brand-400)" }} />
                            ) : (
                              <ChevronDown size={14} style={{ color: "var(--color-text-tertiary)" }} />
                            )}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span className="fw-bold" style={{ color: "var(--color-text-primary)", fontSize: "13px" }}>{batch.batch_name}</span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>{formatCurrencyCompact(batch.total_aum)}</span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="d-flex align-items-center gap-2">
                              <Users size={12} style={{ color: "var(--color-text-tertiary)" }} />
                              <span style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>{batch.investor_count} investors</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span style={{ color: "var(--color-text-tertiary)", fontSize: "13px" }}>{formatDate(batch.date_deployed)}</span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span
                              className="badge rounded-pill"
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                padding: "4px 10px",
                                background: batch.is_active ? "var(--color-success-bg)" : "rgba(255,255,255,0.06)",
                                color: batch.is_active ? "var(--color-success)" : "var(--color-text-tertiary)",
                              }}
                            >
                              {batch.is_active ? "Active" : "Pending"}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Investor Dropdown */}
                        {isExpanded && (
                          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                            <td colSpan={6} className="p-0">
                              <div style={{ background: "rgba(255,255,255,0.025)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                {batchLoading ? (
                                  <div className="d-flex align-items-center justify-content-center gap-2 py-4" style={{ color: "var(--color-text-tertiary)", fontSize: "13px" }}>
                                    <div className="rounded-full animate-spin" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "var(--color-brand-400)" }} />
                                    Loading investors...
                                  </div>
                                ) : batchInvestors.length === 0 ? (
                                  <div className="d-flex align-items-center gap-2 px-4 py-4" style={{ color: "var(--color-text-tertiary)", fontSize: "13px" }}>
                                    <Users size={14} />
                                    No investor records found for this fund in this batch.
                                  </div>
                                ) : (
                                  <table className="table table-dark mb-0" style={{ "--bs-table-bg": "transparent" } as any}>
                                    <thead>
                                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                        <th className="ps-5 pe-4 py-2 text-uppercase text-muted fw-bold" style={{ fontSize: "10px", letterSpacing: "0.07em" }}>Investor</th>
                                        <th className="px-4 py-2 text-uppercase text-muted fw-bold" style={{ fontSize: "10px", letterSpacing: "0.07em" }}>Client Code</th>
                                        <th className="px-4 py-2 text-uppercase text-muted fw-bold" style={{ fontSize: "10px", letterSpacing: "0.07em" }}>Amount Deposited</th>
                                        <th className="px-4 py-2 text-uppercase text-muted fw-bold" style={{ fontSize: "10px", letterSpacing: "0.07em" }}>Fund</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {batchInvestors.map((inv) => {
                                        const initials = inv.investor_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() ?? "?";
                                        return (
                                          <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                            <td className="ps-5 pe-4 py-3 align-middle">
                                              <div className="d-flex align-items-center gap-3">
                                                <div className="d-flex align-items-center justify-content-center rounded-circle fw-bold" style={{ width: 30, height: 30, minWidth: 30, background: "var(--color-brand-50)", color: "var(--color-brand-400)", fontSize: "11px" }}>
                                                  {initials}
                                                </div>
                                                <span style={{ color: "var(--color-text-primary)", fontSize: "13px", fontWeight: 500 }}>{inv.investor_name}</span>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                              <span className="badge rounded-pill" style={{ background: "rgba(255,255,255,0.06)", color: "var(--color-text-secondary)", fontSize: "11px", fontWeight: 500, padding: "4px 10px", fontFamily: "monospace" }}>
                                                {inv.internal_client_code}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                              <span style={{ color: "var(--color-text-primary)", fontSize: "13px", fontWeight: 600 }}>
                                                {formatCurrencyCompact((inv as any).main_balance ?? inv.amount_deposited)}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 align-middle">
                                              <span style={{ color: "var(--color-text-tertiary)", fontSize: "12px" }}>{inv.fund_name ?? "—"}</span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>No active batches found for this fund.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
