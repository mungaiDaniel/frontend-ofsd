import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KPICard } from "@/components/data/KPICard";
import { StatusBadge } from "@/components/data/StatusBadge";
import { BatchStageStepper } from "@/components/data/BatchStageStepper";
import { ChartCard } from "@/components/charts/ChartCard";
import { FundPerformanceLineChart } from "@/components/charts/FundPerformanceLineChart";
import { PortfolioAUMChart } from "@/components/charts/PortfolioAUMChart";
import { DepositsWithdrawalsBarChart } from "@/components/charts/DepositsWithdrawalsBarChart";
import { FundAllocationDoughnut } from "@/components/charts/FundAllocationDoughnut";
import { batchService } from "@/services/batchService";
import { reportService } from "@/services/reportService";
import { withdrawalService } from "@/services/withdrawalService";
import { dashboardService, OverviewStats, FlowPoint } from "@/services/dashboardService";
import { calculateGlobalTotals, aggregateFundMetrics } from "@/lib/batchCalculations";
import { formatCurrency, formatCurrencyCompact, formatDate } from "@/lib/utils";
import { getBatchDepositBaseTotal, getEntryFeePercent, getInvestorPrincipalAfterTransfer } from "@/lib/transferDeductions";
import { getFundColor, FLOW_COLORS } from "@/lib/chartConfig";
import { ROUTES } from "@/lib/constants";
import type { Batch, ReportSummary } from "@/lib/types";
import { ChevronRight } from "lucide-react";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OVERVIEW PAGE — BATCH-FIRST CALCULATION APPROACH
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This Overview page derives ALL global totals from Batch-level aggregations,
 * ensuring perfect synchronization with Batch Detail pages.
 * 
 * LOGIC SYNCHRONIZATION:
 * - Total AUM        = SUM(all batches' current_balance)
 * - Total Profit     = SUM(all batches' end_balance) - SUM(all batches' deposits)
 * - Total Withdrawals = SUM(all investments' withdrawals)
 * - Fund Performance  = Weighted average of fund performance across active batches
 * 
 * This eliminates discrepancies: Overview totals = SUM(Batch1 + Batch2 + Batch3...)
 * 
 * See: lib/batchCalculations.ts for the shared utility functions.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export default function OverviewPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Pending" | "Closed">("All");
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [globalWithdrawals, setGlobalWithdrawals] = useState<number>(0);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [clientFlowByBatch, setClientFlowByBatch] = useState<{
    labels: string[];
    batches: { batch_id: number; batch_name: string; deposits: number[] }[];
    withdrawals: number[];
  } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch all batches and reports
        const [batchesRes, reportsRes, overviewRes, withdrawalsRes] = await Promise.allSettled([
          batchService.getAll(),
          reportService.getAll(),
          dashboardService.getOverviewStats(),
          withdrawalService.getAll()
        ]);

        let enrichedBatches: Batch[] = [];
        if (batchesRes.status === "fulfilled") {
          enrichedBatches = batchesRes.value;
          setBatches(enrichedBatches);

          // Build a transaction-date fallback for Deposits vs Withdrawals chart
          // from actual investment rows (date_deposited) in each batch detail.
          try {
            const detailResults = await Promise.allSettled(
              enrichedBatches.map((b) => batchService.getById(b.id))
            );

            const labelsMap: Record<string, number> = {};
            const byBatch: Record<number, { batch_id: number; batch_name: string; byLabel: Record<string, number> }> = {};
            const withdrawalsByLabel: Record<string, number> = {};

            for (const res of detailResults) {
              if (res.status !== "fulfilled") continue;
              const detail: any = res.value;
              const batchId = Number(detail?.id);
              const batchName = String(detail?.batch_name || `Batch ${batchId}`);
              const invs: any[] = Array.isArray(detail?.investments) ? detail.investments : [];
              if (!byBatch[batchId]) byBatch[batchId] = { batch_id: batchId, batch_name: batchName, byLabel: {} };

              const batchBaseTotal = getBatchDepositBaseTotal(invs);
              const entryFeePercent = getEntryFeePercent(detail);
              const transferTransactionCost = Number(detail?.transfer_transaction_cost ?? 0);

              for (const inv of invs) {
                const raw = inv?.date_deposited;
                if (!raw) continue;
                const dt = new Date(raw);
                if (Number.isNaN(dt.getTime())) continue;
                const label = dt.toLocaleDateString("en-GB", { month: "short", day: "2-digit", year: "numeric" });
                labelsMap[label] = dt.getTime();
                const dep = getInvestorPrincipalAfterTransfer(inv, {
                  stage: detail?.stage,
                  batchTotalDepositBase: batchBaseTotal,
                  transferTransactionCost,
                  entryFeePercent,
                });
                byBatch[batchId].byLabel[label] = (byBatch[batchId].byLabel[label] || 0) + dep;
                const wd = Number(inv?.withdrawals ?? 0);
                withdrawalsByLabel[label] = (withdrawalsByLabel[label] || 0) + wd;
              }
            }

            const labels = Object.entries(labelsMap)
              .sort((a, b) => a[1] - b[1])
              .map(([l]) => l);

            if (labels.length > 0) {
              setClientFlowByBatch({
                labels,
                batches: Object.values(byBatch).map((b) => ({
                  batch_id: b.batch_id,
                  batch_name: b.batch_name,
                  deposits: labels.map((l) => Number(b.byLabel[l] || 0)),
                })),
                withdrawals: labels.map((l) => Number(withdrawalsByLabel[l] || 0)),
              });
            } else {
              setClientFlowByBatch(null);
            }
          } catch {
            setClientFlowByBatch(null);
          }
        }
        if (reportsRes.status === "fulfilled") setReports(reportsRes.value);
        if (overviewRes.status === "fulfilled") setOverviewStats(overviewRes.value);

        if (withdrawalsRes.status === "fulfilled") {
          const wData = withdrawalsRes.value;
          const sum = wData
            .filter(w => w.status === "Processed" || w.status === "Completed" || w.status === "Approved")
            .reduce((acc, curr) => acc + curr.amount, 0);
          setGlobalWithdrawals(sum);
        }
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [refreshNonce]);

  useEffect(() => {
    const handler = () => setRefreshNonce((n) => n + 1);
    window.addEventListener("dashboard_stats_dirty", handler as EventListener);
    return () => window.removeEventListener("dashboard_stats_dirty", handler as EventListener);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // ATOMIC BATCH SUMMATION: Global totals from backend
  // ─────────────────────────────────────────────────────────────────────────
  // PRIMARY:  overviewStats (from /api/v1/stats/overview) is the authoritative
  //           global total (batch-scoped valuations).
  // FALLBACK: sum of batch.total_capital from GET /batches (never override with
  //           /batches/:id/history — that path is not batch-atomic for the same client code).
  // ═══════════════════════════════════════════════════════════════════════════
  const globalCalcs = calculateGlobalTotals(batches);
  const totalAumFromBatchList = batches.reduce((sum, b) => sum + (b.total_capital ?? 0), 0);

  // Total AUM: prefer backend stats endpoint (authoritative global aggregate)
  const totalAUM = overviewStats?.total_aum ?? totalAumFromBatchList ?? globalCalcs.totalAUM;

  // Total Investors: prefer backend stats (guaranteed distinct internal_client_code count)
  const totalInvestors = overviewStats?.total_investors ?? globalCalcs.totalInvestors;

  const performancePct = globalCalcs.percentageGain;
  const performanceTrend = performancePct > 0 ? "up" : performancePct < 0 ? "down" : "neutral";
  const activeBatchCount = globalCalcs.activeBatchCount;

  // ── Chart data from reports ──
  const sorted = [...reports].sort(
    (a, b) => new Date(a.epoch_end).getTime() - new Date(b.epoch_end).getTime()
  );
  const fundNames = [...new Set(sorted.map((r) => r.fund_name))];
  const epochLabels = [...new Set(sorted.map((r) => {
    const d = new Date(r.epoch_end);
    return d.toLocaleDateString("en-GB", { month: "short", day: "2-digit", year: "numeric" });
  }))];

  // === FUND METRICS: Aggregate from batch holdings (batch-first approach) ===
  const fundMetrics = aggregateFundMetrics(batches);
  const fundNamesFromBatches = Object.keys(fundMetrics).sort();
  
  // ── Filter batches by status ──
  const filteredBatches = statusFilter === "All" 
    ? batches 
    : batches.filter((b) => b.status === statusFilter);
  const recentBatches = filteredBatches.slice(0, 5);

  const getLatestBatchAUM = (batchId: number, fallback?: number) => {
    const contrib = overviewStats?.batch_contributions?.[batchId];
    if (contrib && typeof contrib.balance === "number") return contrib.balance;
    return fallback ?? 0;
  };

  // ── Deposits/Withdrawals chart ── 
  // Prefer the pre-computed flow_series from backend (accurate EpochLedger data + initial deposit injection)
  const flowData = overviewStats?.flow_series && overviewStats.flow_series.length > 0
    ? {
        labels: overviewStats.flow_series.map((f: FlowPoint) => f.label),
        deposits: overviewStats.flow_series.map((f: FlowPoint) => f.deposits),
        withdrawals: overviewStats.flow_series.map((f: FlowPoint) => f.withdrawals),
      }
    : {
        // Do not fallback to epoch-end labels for transaction charts.
        // If backend flow_series is missing, show empty state instead of misleading dates.
        labels: ["—"],
        deposits: [0],
        withdrawals: [0],
      };
  const flowByBatch = (overviewStats?.flow_by_batch && overviewStats.flow_by_batch.labels.length > 0)
    ? overviewStats.flow_by_batch
    : clientFlowByBatch;
  const flowDatasets =
    flowByBatch && flowByBatch.labels.length > 0 && flowByBatch.batches.length > 0
      ? [
          {
            label: "Deposits",
            // Sum all deposits from all batches per label index
            data: flowByBatch.labels.map((_, i) => 
               flowByBatch.batches.reduce((sum, b) => sum + (b.deposits[i] || 0), 0)
            ),
            backgroundColor: FLOW_COLORS.deposit,
          },
          {
            label: "Withdrawals",
            data: flowByBatch.withdrawals,
            backgroundColor: FLOW_COLORS.withdrawal,
          },
        ]
      : undefined;
  const flowChartData = flowByBatch && flowByBatch.labels.length > 0
    ? {
        labels: flowByBatch.labels,
        deposits: flowByBatch.labels.map(() => 0),
        withdrawals: flowByBatch.withdrawals,
      }
    : flowData;

  // ── Performance and AUM data ──
  const perfData = {
    labels: epochLabels.length > 0 ? epochLabels : ["—"],
    funds: (fundNamesFromBatches.length > 0 ? fundNamesFromBatches : fundNames).map((name) => ({
      name,
      data: epochLabels.map(label => {
        const report = sorted.find(r => {
          const d = new Date(r.epoch_end);
          const rLabel = d.toLocaleDateString("en-GB", { month: "short", day: "2-digit", year: "numeric" });
          return r.fund_name === name && rLabel === label;
        });
        return report ? report.performance_rate_percent : null;
      }),
    })),
  };

  const aumData = overviewStats?.aum_data && overviewStats.aum_data.labels.length > 0
    ? overviewStats.aum_data
    : {
        labels: epochLabels.length > 0 ? epochLabels : ["—"],
        funds: (fundNamesFromBatches.length > 0 ? fundNamesFromBatches : fundNames).map((name) => {
          const fundReports = sorted.filter((r) => r.fund_name === name);
          const values = epochLabels.map(label => {
            const report = fundReports.find(r => {
              const d = new Date(r.epoch_end);
              const rLabel = d.toLocaleDateString("en-GB", { month: "short", day: "2-digit", year: "numeric" });
              return rLabel === label;
            });
            return report ? report.summary.total_closing_aum : 0;
          });
          
          const growth = values.map((value, index) => {
            if (index === 0) return 0;
            const prev = values[index - 1] || 0;
            return prev === 0 ? 0 : ((value - prev) / prev) * 100;
          });
          return { name, data: values, growth };
        }),
      };

  // Fund allocation uses batch-based metrics when available
  // IMPORTANT: Normalize fund values to match totalAUM (batch-first approach)
  const latestPerFundRaw = (fundNamesFromBatches.length > 0 ? fundNamesFromBatches : fundNames).map((name) => {
    if (fundMetrics[name]) {
      return { name, value: fundMetrics[name].totalAUM };
    }
    const fr = sorted.filter((r) => r.fund_name === name);
    return { name, value: fr[fr.length - 1]?.summary?.total_closing_aum || 0 };
  });

  // Normalize fund allocation to exactly match totalAUM
  // This ensures the doughnut chart totals match the "Total AUM" KPI card
  const fundAllocSum = latestPerFundRaw.reduce((s, x) => s + x.value, 0);
  const latestPerFund = fundAllocSum > 0 && totalAUM > 0
    ? latestPerFundRaw.map((f) => ({
      ...f,
      value: (f.value / fundAllocSum) * totalAUM, // Scale each fund proportionally to match totalAUM
    }))
    : latestPerFundRaw;

  // ALWAYS use batch-first calculation for fund allocation
  // This ensures the doughnut chart matches the "Total AUM" KPI card exactly
  const allocData = {
    funds: latestPerFund.length > 0 ? latestPerFund : [{ name: "No data", value: 0 }],
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center h-64">
        <div
          className="spinner-border"
          style={{ color: "var(--color-brand-400)", width: "1.5rem", height: "1.5rem" }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="mb-4">
        <h1 className="fw-bold" style={{ color: "var(--color-text-primary)", fontSize: "22px" }}>
          Overview
        </h1>
        <p className="mb-0 mt-1" style={{ color: "var(--color-text-secondary)", fontSize: "13px" }}>
          Portfolio summary across all active funds and batches
        </p>
      </div>

      {/* KPI row — 5 equal cols ── */}
      <div className="row g-3 mb-4">
        <div className="col-lg col-sm-6">
          <KPICard
            label="Total AUM"
            value={formatCurrency(totalAUM)}
            valueSize="1.5rem"
            trend={{ value: `${performancePct.toFixed(2)}%`, direction: performanceTrend as "up" | "down" | "neutral" }}
            subtitle={`Latest committed: ${overviewStats?.latest_epoch_end ? new Date(overviewStats.latest_epoch_end).toLocaleDateString() : "—"}`}
          />
        </div>
        <div className="col-lg col-sm-6">
          <KPICard
            label="Total withdrawals"
            value={formatCurrency(globalWithdrawals)}
            valueSize="1.5rem"
            trend={{ value: "-", direction: "down" }}
            subtitle="Approved/Processed/Completed"
          />
        </div>
        <div className="col-lg col-sm-6">
          <KPICard
            label="Total investors"
            value={String(totalInvestors)}
            valueSize="1.5rem"
            subtitle="clients"
          />
        </div>
        <div className="col-lg col-sm-6">
          <KPICard
            label="Performance"
            value={`${performancePct.toFixed(2)}%`}
            valueSize="1.5rem"
            trend={{ value: `${performancePct.toFixed(2)}%`, direction: performanceTrend as "up" | "down" | "neutral" }}
            subtitle={`From ${overviewStats?.previous_epoch_end ? new Date(overviewStats.previous_epoch_end).toLocaleDateString() : "—"}`}
          />
        </div>
        <div className="col-lg col-sm-6">
          <KPICard
            label="Active funds"
            value={String(activeBatchCount)}
            valueSize="1.5rem"
            subtitle="Committed epochs"
          />
        </div>
      </div>

      {/* Charts 2×2 — two equal cols ── */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <ChartCard
            title="Fund performance (%)"
            subtitle="Monthly performance rate by fund"
            legend={(fundNamesFromBatches.length > 0 ? fundNamesFromBatches : fundNames).map((n) => ({ label: n, color: getFundColor(n) }))}
          >
            <FundPerformanceLineChart data={perfData} height={300} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="Portfolio AUM"
            subtitle="Total assets under management over time"
            legend={(fundNamesFromBatches.length > 0 ? fundNamesFromBatches : fundNames).map((n) => ({
              label: `${n} ${formatCurrencyCompact(latestPerFund.find((f) => f.name === n)?.value || 0)}`,
              color: getFundColor(n), // Use proper fund color instead of hardcoded #00005b
            }))}
          >
            <PortfolioAUMChart data={aumData} height={300} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="Deposits vs withdrawals"
            subtitle="Inflows and outflows per epoch period"
            legend={flowDatasets && flowDatasets.length > 0
              ? flowDatasets.map((d) => ({ label: d.label, color: d.backgroundColor }))
              : [
                { label: "Deposits", color: FLOW_COLORS.deposit },
                { label: "Withdrawals", color: FLOW_COLORS.withdrawal },
              ]}
          >
            <DepositsWithdrawalsBarChart data={flowChartData} datasets={flowDatasets} height={300} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="Fund allocation"
            subtitle="Current capital distribution"
            legend={latestPerFund.map((f) => {
              const pct = totalAUM > 0 ? ((f.value / totalAUM) * 100).toFixed(1) : "0";
              return { label: `${f.name} ${pct}%`, color: getFundColor(f.name) };
            })}
          >
            <FundAllocationDoughnut data={allocData} />
          </ChartCard>
        </div>
      </div>

      {/* Recent batches table */}
      <div className="card shadow overflow-hidden">
        {/* Table header bar */}
        <div
          className="d-flex flex-wrap align-items-center justify-content-between gap-2 px-3 px-md-4 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <h3 className="fw-bold mb-0" style={{ color: "var(--color-text-primary)", fontSize: "14px" }}>
            Recent batches
          </h3>
          <div className="d-flex flex-wrap gap-2">
            {(["All", "Active", "Pending", "Closed"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="btn btn-sm"
                style={{
                  fontSize: "11px",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  border: statusFilter === status ? "1px solid var(--color-brand-400)" : "1px solid rgba(255,255,255,0.1)",
                  background: statusFilter === status ? "var(--color-brand-50)" : "transparent",
                  color: statusFilter === status ? "var(--color-brand-300)" : "var(--color-text-secondary)",
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Bootstrap table-dark */}
        <div className="table-responsive">
          <table className="table table-dark mb-0" style={{ background: "var(--color-bg-surface)" }}>
            <thead>
              <tr>
                {["Batch name", "Certificate", "Stage", "Status", "Total AUM", "Investors", "Deployed", ""].map((h) => (
                  <th key={h} style={{ textAlign: h === "Total AUM" || h === "Investors" ? "right" : "left" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentBatches.map((b) => (
                <tr key={b.id} onClick={() => navigate(ROUTES.BATCH_DETAIL(b.id))}>
                  <td className="fw-bold" style={{ fontSize: "13px" }}>{b.batch_name}</td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", fontSize: "12px" }}>
                    {b.certificate_number || "—"}
                  </td>
                  <td><BatchStageStepper currentStage={b.stage} compact /></td>
                  <td>
                    {/* Show PENDING for undeployed batches, otherwise show actual status */}
                    <StatusBadge status={!b.date_deployed && !b.is_active ? "Pending" : b.status} />
                  </td>
                  <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                    {formatCurrency(getLatestBatchAUM(b.id, b.total_capital ?? 0))}
                  </td>
                  <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                    {b.investors_count}
                  </td>
                  <td style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
                    {formatDate(b.date_deployed)}
                  </td>
                  <td><ChevronRight size={14} style={{ color: "var(--color-text-tertiary)" }} /></td>
                </tr>
              ))}
              {recentBatches.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-5" style={{ color: "var(--color-text-tertiary)" }}>
                    No batches yet. Create your first batch to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
