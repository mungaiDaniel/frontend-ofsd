import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { KPICard } from "@/components/data/KPICard";
import { StatusBadge } from "@/components/data/StatusBadge";
import { BatchStageStepper } from "@/components/data/BatchStageStepper";
import { EmailFailureModal } from "@/components/data/EmailFailureModal";
import { ChartCard } from "@/components/charts/ChartCard";
import { FundPerformanceLineChart } from "@/components/charts/FundPerformanceLineChart";
import { PortfolioAUMChart } from "@/components/charts/PortfolioAUMChart";
import { DepositsWithdrawalsBarChart } from "@/components/charts/DepositsWithdrawalsBarChart";
import { FundAllocationDoughnut } from "@/components/charts/FundAllocationDoughnut";
import { batchService } from "@/services/batchService";
import { investmentService } from "@/services/investmentService";
import { calculateBatchTotals } from "@/lib/batchCalculations";
import { formatCurrency, formatDate, formatCurrencyCompact } from "@/lib/utils";
import { getBatchDepositBaseTotal, getEntryFeePercent, getInvestorPrincipalAfterTransfer } from "@/lib/transferDeductions";
import { getFundColor, FLOW_COLORS } from "@/lib/chartConfig";
import { ROUTES, STAGE_LABELS } from "@/lib/constants";
import type { Batch, BatchStage } from "@/lib/types";
import { toast } from "sonner";
import { useBatchReconciliation } from "@/hooks/useBatchReconciliation";
import { ArrowLeft, Download, Trash2, ChevronRight, ChevronDown, Wallet, ArrowLeftRight, Rocket, CheckCircle, AlertTriangle, X } from "lucide-react";
import { reportService } from "@/services/reportService";
import { EmailConfirmationModal } from "@/components/ui/EmailConfirmationModal";
import { DeploymentDateModal } from "@/components/ui/DeploymentDateModal";
import { TransferCostModal } from "@/components/ui/TransferCostModal";

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [batchHistory, setBatchHistory] = useState<any[]>([]);
  const [emailSummary, setEmailSummary] = useState<{total_attempted:number;sent:number;failed:number;distinct_investors:number}>({
    total_attempted:0,
    sent:0,
    failed:0,
    distinct_investors:0,
  });
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [failureDetails, setFailureDetails] = useState<any[]>([]);
  const [emailFailures, setEmailFailures] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [emailFailureModalOpen, setEmailFailureModalOpen] = useState(false);
  const [recentActivityOpen, setRecentActivityOpen] = useState(false);
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
  const [reports, setReports] = useState<any[]>([]); // All reports (will be filtered by batch funds)
  const [statementClosingByClient, setStatementClosingByClient] = useState<Record<string, number>>({});

  const batchId = Number(id);
  const { reconciliation, loading: reconciliationLoading, error: reconciliationError } = useBatchReconciliation(batchId);

  useEffect(() => {
    async function load() {
      if (!batchId || isNaN(batchId)) return;
      setLoading(true);
      try {
        // Fetch batch details
        const data = await batchService.getById(batchId);
        setBatch(data);
        setEditBatchName(data.batch_name);
        setEditCertificateNumber(data.certificate_number || "");
        setEditDurationDays(data.duration_days || 30);
        // Investments come nested in the batch detail response
        setInvestments((data as any).investments || []);

        // Fetch all reports (like Overview does) — will filter by batch funds later
        try {
          const reportsData = await reportService.getAll();
          console.log("[BatchDetail] Reports loaded:", reportsData.length, "reports");
          setReports(reportsData);
        } catch (reportsErr) {
          console.warn("[BatchDetail] Failed to load reports", reportsErr);
          setReports([]);
        }

        // Fetch recent activity from notifications endpoint (batch stage summaries)
        try {
          const recentRes = await investmentService.getRecentNotifications();
          if (recentRes.status === 200) {
            setRecentActivity((recentRes.data as any[]) || []);
          }
        } catch (activityErr) {
          console.warn("Failed to load recent notifications", activityErr);
        }

        // Fetch email delivery summary by batch
        try {
          const emailRes = await batchService.getEmailLogs(batchId);
          if (emailRes.status === 200) {
            setEmailSummary((emailRes as any).summary || { total_attempted: 0, sent: 0, failed: 0, distinct_investors: 0 });
          }
        } catch (emailErr) {
          console.warn("Failed to load batch email summary", emailErr);
        }

        // Fetch batch history data for charts (fallback for deposits/withdrawals)
        try {
          const histRes = await batchService.getHistory(batchId);
          console.log("===== BATCH HISTORY DEBUG =====");
          console.log("histRes:", histRes);
          console.log("histRes.data:", histRes.data);
          if (histRes) {
            const historyData = Array.isArray((histRes as any)?.data)
              ? (histRes as any).data
              : Array.isArray(histRes)
                ? histRes
                : [];
            setBatchHistory(historyData);
            console.log("setBatchHistory called with", historyData.length, "items");
          } else {
            console.warn("histRes.data is falsy");
            setBatchHistory([]);
          }
          console.log("=============================");
        } catch (histErr) {
          console.error("Failed to load batch history data", histErr);
          setBatchHistory([]);
        }
      } catch {
        toast.error("Failed to load batch");
        navigate(ROUTES.BATCHES);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [batchId, navigate]);

  useEffect(() => {
    const uniqueCodes = Array.from(
      new Set(
        (investments as any[])
          .map((inv) => String(inv?.internal_client_code || "").trim())
          .filter(Boolean)
      )
    );

    if (uniqueCodes.length === 0) {
      setStatementClosingByClient({});
      return;
    }

    let cancelled = false;
    (async () => {
      const entries = await Promise.allSettled(
        uniqueCodes.map(async (code) => {
          const res = await investmentService.getInvestorStatements(code);
          const statements = (res.data as any[]) || [];
          const latest = statements.find((s: any) => s?.end_balance != null);
          return [code, Number(latest?.end_balance ?? NaN)] as const;
        })
      );

      if (cancelled) return;

      const nextMap: Record<string, number> = {};
      for (const entry of entries) {
        if (entry.status !== "fulfilled") continue;
        const [code, closing] = entry.value;
        if (Number.isFinite(closing)) nextMap[code] = closing;
      }
      setStatementClosingByClient(nextMap);
    })();

    return () => {
      cancelled = true;
    };
  }, [investments]);

  const getInvestmentCurrentStanding = (inv: any) => {
    const code = String(inv?.internal_client_code || "").trim();
    const statementClosing = code ? statementClosingByClient[code] : undefined;
    const fallback = Number(inv?.current_balance ?? inv?.main_balance ?? inv?.opening_balance ?? inv?.amount_deposited ?? 0);
    if (statementClosing == null || !Number.isFinite(statementClosing)) return fallback;

    const sameClientInvestments = (investments as any[]).filter(
      (row) => String(row?.internal_client_code || "").trim() === code
    );
    if (sameClientInvestments.length === 0) return statementClosing;

    const totalBase = sameClientInvestments.reduce(
      (sum, row) => sum + Number(row?.main_balance ?? row?.opening_balance ?? row?.amount_deposited ?? 0),
      0
    );
    const invBase = Number(inv?.main_balance ?? inv?.opening_balance ?? inv?.amount_deposited ?? 0);

    if (totalBase > 0) return (invBase / totalBase) * statementClosing;
    return statementClosing / sameClientInvestments.length;
  };

  const advanceStage = async () => {
    if (!batch) return;
    const nextStage = (batch.stage + 1) as BatchStage;
    if (nextStage > 4) return;

    if (nextStage === 3) {
      setDeployModalOpen(true);
      return;
    }

    if (nextStage === 2) {
      setTransferModalOpen(true);
      return;
    }

    const patchData: Record<string, unknown> = { stage: nextStage };
    if (nextStage === 4) patchData.is_active = true;

    try {
      await batchService.patch(batchId, patchData);
      toast.success(`Batch advanced to ${STAGE_LABELS[nextStage]}`);
      // Reload
      const data = await batchService.getById(batchId);
      setBatch(data);
      // Open email confirmation gate — stage advance always queues emails
      setEmailConfirmModalOpen(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update";
      toast.error(msg);
    }
  };

  const handleDeployDateConfirm = async (dateString: string) => {
    setIsDeploying(true);
    const patchData: Record<string, unknown> = {
      stage: 3,
      deployment_confirmed: true,
      date_deployed: dateString
    };
    try {
      await batchService.patch(batchId, patchData);
      toast.success(`Batch advanced to Deployed`);
      const data = await batchService.getById(batchId);
      setBatch(data);
      setDeployModalOpen(false);
      setEmailConfirmModalOpen(true);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || "Failed to advance stage";
      toast.error(msg);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleTransferCostConfirm = async (transactionCostUsd: number, entryFeePercent: number) => {
    setIsTransferring(true);
    const patchData: Record<string, unknown> = {
      stage: 2,
      is_transferred: true,
      transfer_transaction_cost: transactionCostUsd,
      transfer_entry_fee_percent: entryFeePercent,
      entry_fee_percentage: entryFeePercent,
    };
    try {
      await batchService.patch(batchId, patchData);
      toast.success(`Batch advanced to Transferred`);
      const data = await batchService.getById(batchId);
      setBatch(data);
      setTransferModalOpen(false);
      setEmailConfirmModalOpen(true);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message || "Failed to advance stage";
      toast.error(msg);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleEditToggle = () => {
    setIsEditing((current) => !current);
    if (batch) {
      setEditBatchName(batch.batch_name);
      setEditCertificateNumber(batch.certificate_number || "");
      setEditDurationDays(batch.duration_days || 30);
    }
  };

  const handleSaveEdit = async () => {
    if (!batch) return;
    if (!editBatchName.trim()) {
      toast.error("Batch name is required");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        batch_name: editBatchName.trim(),
        duration_days: editDurationDays,
      };
      if (editCertificateNumber.trim()) {
        payload.certificate_number = editCertificateNumber.trim();
      } else {
        payload.certificate_number = null;
      }

      await batchService.patch(batchId, payload);
      toast.success("Batch updated");
      setIsEditing(false);
      const updated = await batchService.getById(batchId);
      setBatch(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update batch";
      toast.error(msg);
    }
  };

  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const handleBatchFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      toast.error("Please select an .xlsx or .xls file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }

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
      // Open email confirmation gate — upload triggers deposit receipt emails
      setEmailConfirmModalOpen(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "File upload failed";
      toast.error(msg);
    } finally {
      clearInterval(interval);
      setUploadingFile(false);
    }
  };

  const openBatchFileSelector = () => {
    batchFileInputRef.current?.click();
  };

  const refreshRecentActivity = async () => {
    try {
      const recentRes = await investmentService.getRecentNotifications();
      if (recentRes.status === 200) {
        setRecentActivity((recentRes.data as any[]) || []);
      }
    } catch (err) {
      console.warn("recent notifications refresh failed", err);
      toast.error("Could not refresh recent activity");
    }
  };

  const fetchEmailFailures = async () => {
    try {
      const emailRes = await batchService.getEmailLogs(batchId);
      if (emailRes.status === 200 && Array.isArray(emailRes.data)) {
        const failedLogs = emailRes.data.filter((log: any) => log.status.toLowerCase() === 'failed');
        setEmailFailures(failedLogs);
        setEmailFailureModalOpen(true);
      }
    } catch (err) {
      console.warn("Failed to fetch email failures", err);
      toast.error("Could not load email failure details");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this batch? This cannot be undone.")) return;
    try {
      await batchService.delete(batchId);
      toast.success("Batch deleted");
      navigate(ROUTES.BATCHES);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete batch";
      toast.error(msg);
    }
  };

  const handleToggleBatchActive = async () => {
    if (!batch) return;
    const actionLabel = batch.is_active ? "close" : "open";
    if (!confirm(`Are you sure you want to ${actionLabel} this batch?`)) return;
    try {
      await batchService.toggleActive(batchId);
      const refreshed = await batchService.getById(batchId);
      setBatch(refreshed);
      toast.success(batch.is_active ? "Batch closed (deactivated)" : "Batch opened (reactivated)");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update batch status";
      toast.error(msg);
    }
  };

  // ── Batch Analytics Calculations (using shared utility for consistency with Overview) ──
  const batchCalcs = calculateBatchTotals(investments);
  const totalBatchDeposit = getBatchDepositBaseTotal(investments);
  const transferTransactionCost = (() => {
    const persisted = Number(batch?.transfer_transaction_cost ?? 0);
    if (persisted > 0) return persisted;
    // Fallback to investor-level persisted transaction fees for legacy rows.
    return (investments as any[]).reduce((sum, inv) => {
      const fee = Number(
        inv?.transaction_fee_usd ??
        inv?.transfer_fee_deducted ??
        inv?.deployment_fee ??
        0
      );
      return sum + (Number.isFinite(fee) ? fee : 0);
    }, 0);
  })();
  const transferEntryFeePercent = getEntryFeePercent(batch);

  const latestHistoricalStanding = batchHistory.length > 0
    ? Number(batchHistory[batchHistory.length - 1]?.end_balance ?? 0)
    : null;
  const batchTotalBalance = latestHistoricalStanding ?? batch?.total_capital ?? batchCalcs.totalAUM;
  const batchTotalDeposits = batchCalcs.totalDeposits;
  const batchTotalWithdrawals = batchCalcs.totalWithdrawals;
  const batchProfit = batchCalcs.totalProfit;
  const batchPercentageGain = batchCalcs.percentageGain.toFixed(2);

  // ── Fund allocation data (by current balance per fund) ──
  const holdingsByFund = investments.reduce((acc: any, inv: any) => {
    const fundName = inv.fund_name || "Unallocated";
    if (!acc[fundName]) {
      acc[fundName] = { name: fundName, principal: 0, current: 0, profit: 0, deposits: 0, withdrawals: 0 };
    }
    acc[fundName].principal += Number(inv.main_balance ?? getInvestorPrincipalAfterTransfer(inv, {
      stage: batch?.stage,
      batchTotalDepositBase: totalBatchDeposit,
      transferTransactionCost,
      entryFeePercent: transferEntryFeePercent,
    }));
    acc[fundName].current += getInvestmentCurrentStanding(inv);
    acc[fundName].profit += (inv.profit || 0);
    acc[fundName].deposits += Number(inv.main_balance ?? inv.opening_balance ?? inv.amount_deposited ?? 0);
    acc[fundName].withdrawals += (inv.withdrawals || 0);
    return acc;
  }, {});
  const fundData = Object.values(holdingsByFund) as Array<{
    name: string;
    principal: number;
    current: number;
    profit: number;
    deposits: number;
    withdrawals: number;
  }>;

  // ── Chart Data ──
  // Fund performance data (Chronological line chart)
  // EXACTLY LIKE OVERVIEW: Filter reports by batch's funds, then split by fund
  console.log("===== CHART DATA DEBUG =====");
  console.log("reports state:", reports.length, "reports");
  console.log("fundData:", fundData);
  console.log("batchHistory.length:", batchHistory.length);
  
  // Extract unique fund names from current holdings (sorted for consistency)
  const fundNamesInBatch = fundData.map((f: any) => f.name).sort();
  console.log("fundNamesInBatch:", fundNamesInBatch);
  
  // Sort reports chronologically (same as Overview)
  const sortedReports = [...reports].sort(
    (a, b) => new Date(a.epoch_end).getTime() - new Date(b.epoch_end).getTime()
  );
  
  // Filter reports to only those for funds in this batch
  const batchFundReports = sortedReports.filter((r: any) => fundNamesInBatch.includes(r.fund_name));
  console.log("batchFundReports after filtering:", batchFundReports.length, "reports for", fundNamesInBatch.length, "funds");
  
  // Get epoch labels from filtered reports
  const epochLabels = [...new Set(batchFundReports.map((r: any) => {
    const d = new Date(r.epoch_end);
    return d.toLocaleDateString("en-GB", { month: "short", day: "2-digit" });
  }))];
  console.log("epochLabels:", epochLabels);
  
  // Build per-fund performance data from filtered reports (EXACT OVERVIEW LOGIC)
  const perfData = {
    labels: epochLabels.length > 0 ? epochLabels : ["No data"],
    funds: fundNamesInBatch.length > 0 
      ? fundNamesInBatch.map((fundName: string) => ({
          name: fundName,
          // Filter to reports matching this fund, extract performance % in epoch order
          data: epochLabels.map((label) => {
            const report = batchFundReports.find(
              (r: any) => r.fund_name === fundName && 
                new Date(r.epoch_end).toLocaleDateString("en-GB", { month: "short", day: "2-digit" }) === label
            );
            return report?.performance_rate_percent || 0;
          }),
        }))
      : [
          {
            name: "Performance Rate",
            data: epochLabels.map(() => 0),
          },
        ],
  };
  console.log("perfData (with per-fund lines from reports):", perfData);
  console.log("=============================");

  // Time-Series Growth data (Chronological Area Chart)
  // EXACTLY LIKE OVERVIEW: Use reports to show per-fund AUM with stacking
  const aumData = {
    labels: epochLabels.length > 0 ? epochLabels : ["No data"],
    funds: fundNamesInBatch.length > 0
      ? fundNamesInBatch.map((fundName: string) => {
          const fundInfo = fundData.find((f: any) => f.name === fundName);
          return {
            name: fundName,
            // Get AUM values from reports for this fund across epochs
            data: epochLabels.map((label) => {
              const report = batchFundReports.find(
                (r: any) => r.fund_name === fundName &&
                new Date(r.epoch_end).toLocaleDateString("en-GB", { month: "short", day: "2-digit" }) === label
              );
              return report?.summary?.total_closing_aum || fundInfo?.current || 0;
            }),
            growth: epochLabels.map((label) => {
              const report = batchFundReports.find(
                (r: any) => r.fund_name === fundName &&
                new Date(r.epoch_end).toLocaleDateString("en-GB", { month: "short", day: "2-digit" }) === label
              );
              return report?.performance_rate_percent || 0;
            }),
          };
        })
      : [
          {
            name: "Total Batch AUM",
            data: epochLabels.map(() => batchTotalBalance),
            growth: epochLabels.map(() => 0),
          },
        ],
  };
  console.log("aumData (per-fund from reports with stacking):", aumData);

  // Deposits vs withdrawals data (Chronological bar chart)
  const fallbackFlowByDate = (() => {
    const buckets: Record<string, { ts: number; deposits: number; withdrawals: number }> = {};
    const fundBuckets: Record<string, Record<string, number>> = {};
    for (const inv of investments as any[]) {
      const raw = inv?.date_deposited;
      if (!raw) continue;
      const dt = new Date(raw);
      if (Number.isNaN(dt.getTime())) continue;
      const label = dt.toLocaleDateString("en-GB", { month: "short", day: "2-digit" });
      if (!buckets[label]) buckets[label] = { ts: dt.getTime(), deposits: 0, withdrawals: 0 };
      const dep = Number(inv?.main_balance ?? inv?.opening_balance ?? inv?.amount_deposited ?? 0);
      buckets[label].deposits += dep;
      buckets[label].withdrawals += Number(inv?.withdrawals ?? 0);
      const fundName = String(inv?.fund_name || "Unassigned");
      if (!fundBuckets[fundName]) fundBuckets[fundName] = {};
      fundBuckets[fundName][label] = (fundBuckets[fundName][label] || 0) + dep;
    }
    const ordered = Object.entries(buckets).sort((a, b) => a[1].ts - b[1].ts);
    const labels = ordered.map(([label]) => label);
    const datasets = Object.entries(fundBuckets).map(([fundName, byLabel]) => ({
      label: fundName,
      data: labels.map((l) => Number(byLabel[l] || 0)),
      backgroundColor: getFundColor(fundName),
    }));
    return {
      labels,
      deposits: ordered.map(([, v]) => v.deposits),
      withdrawals: ordered.map(([, v]) => v.withdrawals),
      datasets,
    };
  })();

  // IMPORTANT: deposits/withdrawals chart should be transaction-date driven.
  // Prefer date_deposited buckets from investment rows; only fallback to epoch history if needed.
  const flowData = fallbackFlowByDate.labels.length > 0
    ? {
        labels: fallbackFlowByDate.labels,
        deposits: fallbackFlowByDate.deposits,
        withdrawals: fallbackFlowByDate.withdrawals,
      }
    : {
        labels: batchHistory.length > 0
          ? batchHistory.map((h: any) => h.month_name || h.epoch_name || "N/A")
          : ["No data"],
        deposits: batchHistory.length > 0
          ? batchHistory.map((h: any) => h.deposits || 0)
          : [batchTotalDeposits],
        withdrawals: batchHistory.length > 0
          ? batchHistory.map((h: any) => h.withdrawals || 0)
          : [batchTotalWithdrawals],
      };
  const flowDatasets = fallbackFlowByDate.labels.length > 0
    ? [
        ...(fallbackFlowByDate.datasets || []),
        { label: "Withdrawals", data: fallbackFlowByDate.withdrawals, backgroundColor: FLOW_COLORS.withdrawal },
      ]
    : undefined;

  // Fund allocation data (by current value)
  const latestPerFund = fundData.map((f: any) => ({ name: f.name, value: f.current }));
  const allocData = {
    funds: latestPerFund.length > 0 ? latestPerFund : [{ name: "No data", value: 0 }],
  };

  if (loading || !batch) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--color-border-subtle)", borderTopColor: "var(--color-brand-400)" }} />
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* Back + header */}
      <button onClick={() => navigate(ROUTES.BATCHES)} className="d-flex align-items-center gap-1 mb-3 btn btn-link p-0 text-decoration-none" style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}>
        <ArrowLeft size={14} /> Back to batches
      </button>

      <div className="page-header-row mb-3">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="fw-bold mb-0" style={{ color: "var(--color-text-primary)", fontSize: "22px" }}>{batch.batch_name}</h1>
            <StatusBadge status={batch.status} />
            {batch.batch_type && (
              <span
                style={{
                  fontSize: "11px",
                  padding: "5px 10px",
                  borderRadius: "999px",
                  background: batch.batch_type === "Carried Forward" ? "rgba(70,130,180,0.15)" : "rgba(135,206,235,0.15)",
                  color: batch.batch_type === "Carried Forward" ? "#4682B4" : "#87CEEB",
                  fontWeight: 600,
                }}
              >
                {batch.batch_type}
              </span>
            )}
          </div>
          {batch.certificate_number && (
            <p className="mb-0 mt-1" style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{batch.certificate_number}</p>
          )}
          {reconciliation && !reconciliationLoading && (
            <p className="mb-0 mt-1" style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--color-success)" }}>
              Reconciled AUM: {formatCurrency(reconciliation.total_closing_aum)}
            </p>
          )}
          {reconciliationError && (
            <p className="mb-0 mt-1" style={{ fontSize: "12px", color: "#d32f2f" }}>
              Reconciliation error: {reconciliationError}
            </p>
          )}
          {isEditing && (
            <div className="mt-2 p-3 rounded-lg" style={{ background: "rgba(0, 0, 0, 0.18)", border: "1px solid var(--color-border-default)" }}>
              <div className="mb-2">
                <label className="text-xs fw-semibold" style={{ color: "var(--color-text-secondary)" }}>Batch name</label>
                <input
                  value={editBatchName}
                  onChange={(e) => setEditBatchName(e.target.value)}
                  className="form-control" 
                  style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                />
              </div>
              <div className="mb-2">
                <label className="text-xs fw-semibold" style={{ color: "var(--color-text-secondary)" }}>Certificate number</label>
                <input
                  value={editCertificateNumber}
                  onChange={(e) => setEditCertificateNumber(e.target.value)}
                  className="form-control"
                  style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                />
              </div>
              <div className="mb-2">
                <label className="text-xs fw-semibold" style={{ color: "var(--color-text-secondary)" }}>Duration (days)</label>
                <input
                  type="number"
                  value={editDurationDays}
                  onChange={(e) => setEditDurationDays(Number(e.target.value))}
                  className="form-control"
                  style={{ background: "var(--color-bg-input)", borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
                  min={1}
                />
              </div>
              <div className="d-flex gap-2 mt-2">
                <button onClick={handleSaveEdit} className="btn btn-primary btn-sm" style={{ fontSize: "12px"}}>Save</button>
                <button onClick={handleEditToggle} className="btn btn-outline-secondary btn-sm" style={{ fontSize: "12px"}}>Cancel</button>
              </div>
            </div>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium cursor-pointer"
            style={{ borderRadius: "8px", border: "none", background: "#00005b", color: "#FFFFFF" }}
            onClick={handleToggleBatchActive}
          >
            {batch.is_active ? "Close Batch" : "Open Batch"}
          </button>
          <button onClick={() => reportService.downloadBatchSummary(batchId)} className="flex items-center gap-1.5 rounded px-3 py-2 text-[12px] font-medium cursor-pointer" style={{ borderRadius: "999px", border: "none", background: "rgba(70,130,180,0.15)", color: "#FFFFFF",  fontSize: "11px",
                  padding: "5px 10px"}}>
            <Download size={14} /> Export
          </button>
          <button onClick={() => setIsEditing(true)} className="flex btn btn-sm items-center gap-1.5 rounded px-3 py-2 text-[12px] font-medium cursor-pointer" style={{ borderRadius: "999px", border: "none", background: "rgba(70,130,180,0.15)", color: "#FFFFFF" ,fontSize: "11px",
                  padding: "5px 10px" }}>
            Edit Batch
          </button>
          <button onClick={openBatchFileSelector} className="flex btn btn-sm items-center gap-1.5 rounded px-3 py-2 text-[12px] font-medium cursor-pointer" style={{ borderRadius: "999px", border: "none", background: "rgba(70,130,180,0.15)", color: "#FFFFFF"  , fontSize: "11px",
                  padding: "5px 10px"}}>
            Upload File
          </button>
          <button onClick={handleDelete} className="flex btn-sm items-center gap-1.5 rounded px-3 py-2 text-[12px] font-medium cursor-pointer" style={{ borderRadius: "8px", border: "none", background: "rgba(255,0,0,0.1)", color: "#FF4444", fontSize: "11px", padding: "5px 10px" }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Stage stepper */}
      <div className="card shadow mb-3" style={{ background: "var(--color-bg-surface)" }}>
        <div className="card-body p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm fw-bold mb-0" style={{ color: "var(--color-text-primary)" }}>Deployment progress</h3>
            {batch.stage < 4 && (
              <button
                onClick={advanceStage}
                className="flex btn-primary btn-sm items-center gap-1.5 rounded px-3 py-2 text-[12px] font-medium cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-400))",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 102, 255, 0.2)",
                }}
              >
                Advance to {STAGE_LABELS[(batch.stage + 1) as BatchStage]}
              </button>
            )}
          </div>
          <BatchStageStepper currentStage={batch.stage} />
          <input
            ref={batchFileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="d-none"
            onChange={handleBatchFileChange}
          />
          {uploadingFile && (
            <div className="mt-2" style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
              Uploading file... {fileUploadProgress}%
              <div className="h-2 mt-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${fileUploadProgress}%`, background: "var(--color-brand-400)" }} />
              </div>
            </div>
          )}
          {!uploadingFile && selectedBatchFile && (
            <p className="mt-2 mb-0" style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
              Selected file: {selectedBatchFile.name}
            </p>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="row g-2 mb-3">
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Total capital" value={formatCurrency(batch.total_capital ?? 0)} valueSize="1rem" />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Investors" value={String(batch.investors_count)} valueSize="1rem" />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Active Days" value={`${batch.active_days ?? 0} days`} valueSize="1rem" />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard
            label="Transaction Cost"
            value={formatCurrency(transferTransactionCost)}
            valueSize="1rem"
            subtitle={batch.date_deployed ? `Deployed: ${formatDate(batch.date_deployed)}` : "Awaiting Deployment"}
          />
        </div>
      </div>

      {/* Batch Analytics KPI row — 4 equal cols ── */}
      <div className="row g-2 mb-3">
        <div className="col-lg-3 col-sm-6">
          <KPICard
            label="Fund Performance (%)"
            value={`${batchHistory.length > 0 ? batchHistory[batchHistory.length - 1].performance_pct?.toFixed(2) : "0.00"}%`}
            valueSize="1.2rem"
            subtitle={batchHistory.length > 0 ? "Latest valuation" : "No data"}
          />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard
            label="Portfolio AUM"
            value={formatCurrency(batchTotalBalance)}
            valueSize="1.2rem"
            trend={{ value: `+${formatCurrencyCompact(batchProfit)}`, direction: batchProfit >= 0 ? "up" : "down" }}
            subtitle="Current standing"
          />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard
            label="Total Deposits"
            value={formatCurrency(batchTotalDeposits)}
            valueSize="1.2rem"
            subtitle={`${investments.length} investors`}
          />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard
            label="Profit/Loss"
            value={formatCurrency(batchProfit)}
            valueSize="1.2rem"
            trend={{ value: `${batchPercentageGain}%`, direction: batchProfit >= 0 ? "up" : "down" }}
            subtitle="Cumulative return"
          />
        </div>
      </div>

      {/* Charts 2×2 — two equal cols ── */}
      <div className="row g-3 mb-3">
        <div className="col-lg-6">
          <ChartCard
            title="Fund performance (%)"
            subtitle="Performance rate over time"
            legend={fundNamesInBatch.map((n) => ({ label: n, color: getFundColor(n) }))}
          >
            <FundPerformanceLineChart data={perfData} height={280} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="Portfolio AUM"
            subtitle="Time-series growth"
            legend={fundNamesInBatch.map((n) => ({
              label: `${n} ${formatCurrencyCompact(latestPerFund.find((f: any) => f.name === n)?.value || 0)}`,
              color: getFundColor(n),
            }))}
          >
            <PortfolioAUMChart data={aumData} height={280} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="Deposits vs withdrawals"
            subtitle="Inflows and outflows over time"
            legend={flowDatasets && flowDatasets.length > 0
              ? flowDatasets.map((d: any) => ({ label: d.label, color: d.backgroundColor }))
              : [
                { label: "Deposits", color: FLOW_COLORS.deposit },
                { label: "Withdrawals", color: FLOW_COLORS.withdrawal },
              ]}
          >
            <DepositsWithdrawalsBarChart data={flowData} datasets={flowDatasets} height={280} />
          </ChartCard>
        </div>
        <div className="col-lg-6">
          <ChartCard
            title="Fund allocation"
            subtitle="Current capital distribution"
            legend={latestPerFund.map((f: any) => {
              const tot = latestPerFund.reduce((s: number, x: any) => s + x.value, 0);
              const pct = tot > 0 ? ((f.value / tot) * 100).toFixed(1) : "0";
              return { label: `${f.name} ${pct}%`, color: getFundColor(f.name) };
            })}
          >
            <FundAllocationDoughnut data={allocData} />
          </ChartCard>
        </div>
      </div>

      {/* Email Status */}
      <div className="row g-2 mb-3">
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Total Sent" value={String(emailSummary.sent)} valueSize="1rem" />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard 
            label="Total Failed" 
            value={String(emailSummary.failed)} 
            onClick={fetchEmailFailures}
            clickable={true}
            valueSize="1rem"
          />
        </div>
        <div className="col-lg-3 col-sm-6">
          <KPICard label="Distinct Investors" value={String(emailSummary.distinct_investors)} valueSize="1rem" />
        </div>
      </div>

      {/* Recent activity */}
      <div className="card shadow mb-3 overflow-hidden" style={{ background: "var(--color-bg-surface)" }}>
        <div className="d-flex align-items-center justify-content-between px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => setRecentActivityOpen((current) => !current)}
              className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1"
              style={{ fontSize: "11px", color: "var(--color-text-primary)" }}
              aria-expanded={recentActivityOpen}
            >
              {recentActivityOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span className="fw-bold">Recent activity</span>
            </button>
          </div>
          <button onClick={refreshRecentActivity} className="btn btn-link p-0 text-decoration-none" style={{ fontSize: "11px" }}>Refresh</button>
        </div>
        {recentActivityOpen ? (
          <div className="table-responsive">
            <table className="table table-dark mb-0" style={{ background: "var(--color-bg-surface)" }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4" style={{ color: "var(--color-text-tertiary)" }}>
                      No recent activity available.
                    </td>
                  </tr>
                )}
                {recentActivity.map((event: any) => {
                  const isSuccess = event.failure_count === 0;
                  let Icon = Wallet;
                  if (event.email_type === 'OFFSHORE_TRANSFER') Icon = ArrowLeftRight;
                  if (event.email_type === 'DEPLOYMENT_CONFIRMED') Icon = Rocket;
                  if (event.email_type === 'INVESTMENT_ACTIVE' || event.email_type === 'BATCH_ACTIVATED') Icon = CheckCircle;

                  return (
                    <tr key={event.id}>
                      <td>{new Date(event.timestamp).toLocaleString()}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Icon size={14} />
                          <span>
                            Batch {event.batch_name || event.batch_id}: {event.email_type} sent to {event.recipient_count} investors. (Success: {event.success_count} | Failed: {event.failure_count})
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isSuccess ? 'badge-success' : 'badge-danger'}`}>
                          {isSuccess ? 'Complete' : 'Failed'}
                        </span>
                      </td>
                      <td>
                        {!isSuccess ? (
                          <button
                            className="btn btn-sm btn-outline-light"
                            onClick={async () => {
                              setSelectedNotification(event);
                              try {
                                const failRes = await investmentService.getNotificationFailures(event.id);
                                setFailureDetails((failRes.data as any[]) || []);
                                setModalOpen(true);
                              } catch (err) {
                                toast.error('Could not load failure details');
                              }
                            }}
                          >
                            <AlertTriangle size={14} /> View failures
                          </button>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* Failure details modal */}
      {modalOpen && (
        <div className="modal d-block" role="dialog" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content" style={{ background: 'var(--color-bg-surface)' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h5 className="modal-title" style={{ color: '#00005b' }}>
                  Failed Recipients – {selectedNotification?.email_type || 'Event'}
                </h5>
                <button type="button" className="btn" onClick={() => setModalOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="modal-body" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {failureDetails.length === 0 ? (
                  <p style={{ color: 'var(--color-text-tertiary)' }}>No failed records found.</p>
                ) : (
                  <table className="table table-dark mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {failureDetails.map((f) => (
                        <tr key={`${f.investor_email}-${f.error_message}`}>
                          <td>{f.investor_name || '—'}</td>
                          <td>{f.investor_email || '—'}</td>
                          <td style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.error_message || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Failure Modal */}
      <EmailFailureModal
        isOpen={emailFailureModalOpen}
        onClose={() => setEmailFailureModalOpen(false)}
        failures={emailFailures}
      />

      {/* Fund breakdown */}
      {batch.funds && batch.funds.length > 0 && (
        <div className="row g-2 mb-3">
          {batch.funds.map((f) => (
            <div key={f.fund_name} className="col-lg-3 col-sm-6">
              <div className="card shadow p-3" style={{ background: "var(--color-bg-surface)" }}>
                <p className="text-[11px] font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>{f.fund_name}</p>
                <p className="text-base fw-bold mb-1" style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(f.total_principal)}</p>
                <p className="text-[10px] mb-0" style={{ color: "var(--color-text-tertiary)" }}>{f.investors_count} investor{f.investors_count !== 1 ? "s" : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Investments table */}
      <div className="card mb-4 overflow-hidden" style={{ background: "var(--color-bg-surface)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "none" }}>
        <div className="d-flex align-items-center justify-content-between px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm fw-bold mb-0" style={{ color: "var(--color-text-primary)" }}>Investments ({investments.length})</h3>
          <button onClick={() => navigate(ROUTES.BATCH_PERFORMANCE(batchId))} className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-1" style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-brand-400)" }}>
            Performance <ChevronRight size={12} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="table table-dark mb-0" style={{ background: "var(--color-bg-surface)" }}>
            <thead>
              <tr>
                {([
                  { label: "Investor", align: "left" },
                  { label: "Client code", align: "left" },
                  { label: "Fund", align: "left" },
                  { label: "Opening Amount", align: "right" },
                  { label: "Withdrawals", align: "right" },
                  { label: "Current Standing", align: "right" },
                  { label: "Profit", align: "right" },
                ] as const).map((h) => (
                  <th key={h.label} style={{ textAlign: h.align as "left" | "right" }}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {investments.map((inv: any) => (
                <tr key={inv.id} style={{ cursor: "pointer" }} onClick={() => inv.internal_client_code && navigate(ROUTES.INVESTOR_OVERVIEW(inv.internal_client_code))}>
                  <td>
                    <button className="btn btn-link p-0 text-decoration-none text-start" style={{ fontSize: "13px" }}>
                      <div className="fw-bold" style={{ color: "var(--color-brand-400)" }}>{inv.investor_name}</div>
                    </button>
                    <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{inv.investor_email}</div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)", fontSize: "12px", verticalAlign: "middle" }}>{inv.internal_client_code || "—"}</td>
                  <td style={{ color: "var(--color-text-secondary)", fontSize: "12px", verticalAlign: "middle" }}>{inv.fund_name || "—"}</td>
                  <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", verticalAlign: "middle" }}>
                    {formatCurrency(Number(inv.main_balance ?? inv.opening_balance ?? inv.amount_deposited ?? 0))}
                  </td>
                  <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", verticalAlign: "middle", color: inv.withdrawals > 0 ? "#d32f2f" : "var(--color-text-secondary)" }}>
                    {inv.withdrawals > 0 ? `(${formatCurrency(inv.withdrawals)})` : (batch.status === "Closed" ? "—" : formatCurrency(0))}
                  </td>
                  <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", verticalAlign: "middle" }}>{formatCurrency(getInvestmentCurrentStanding(inv))}</td>
                  <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", verticalAlign: "middle", color: inv.profit >= 0 ? "var(--color-success)" : "var(--color-destructive)" }}>
                    {formatCurrency(inv.profit)}
                  </td>
                </tr>
              ))}
              {investments.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-sm" style={{ color: "var(--color-text-tertiary)" }}>No investments in this batch yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email confirmation gate — opens after stage advance or file upload */}
      <EmailConfirmationModal
        open={emailConfirmModalOpen}
        onClose={() => setEmailConfirmModalOpen(false)}
        batchId={batchId}
      />
      <DeploymentDateModal
        open={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        onConfirm={handleDeployDateConfirm}
        isLoading={isDeploying}
      />
      <TransferCostModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        totalBatchDeposit={totalBatchDeposit}
        onConfirm={handleTransferCostConfirm}
        isLoading={isTransferring}
      />
    </div>
  );
}
