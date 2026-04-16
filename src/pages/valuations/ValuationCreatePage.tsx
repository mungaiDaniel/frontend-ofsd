import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createValuationSchema, type CreateValuationFormData } from "@/lib/validators/valuation.schema";
import { valuationService } from "@/services/valuationService";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { CoreFund } from "@/lib/types";
import { toast } from "sonner";
import { ArrowLeft, Eye } from "lucide-react";

export default function ValuationCreatePage() {
  const navigate = useNavigate();
  const [funds, setFunds] = useState<CoreFund[]>([]);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [dryRunning, setDryRunning] = useState(false);

  useEffect(() => {
    valuationService.getActiveFunds().then(setFunds).catch(() => {});
  }, []);

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<CreateValuationFormData>({
    resolver: zodResolver(createValuationSchema),
  });

  const declaredTotal = Number(dryRunResult?.head_office_total || 0);
  const excelTotal = typeof dryRunResult?.excel_total === "number" ? dryRunResult.excel_total : (typeof dryRunResult?.total_open_capital === "number" ? dryRunResult.total_open_capital : null);
  const withdrawalsTotal = typeof dryRunResult?.withdrawals_total === "number" ? dryRunResult.withdrawals_total : Number(dryRunResult?.withdrawals_applied || 0);
  // ✅ FIX: Use gross_principal (=net_excel_total) which now includes compound growth from previous epoch
  const netExcelTotal = typeof dryRunResult?.net_excel_total === "number" ? dryRunResult.net_excel_total : (typeof dryRunResult?.gross_principal === "number" ? dryRunResult.gross_principal : null);

  const totalStartBalance = Number(dryRunResult?.total_start_balance ?? 0);
  const calculatedProfit = Number(dryRunResult?.total_profit ?? dryRunResult?.performance_applied ?? 0);
  const totalToCommit = Number(dryRunResult?.expected_closing_aum ?? dryRunResult?.reconciliation_total ?? dryRunResult?.projected_portfolio_value ?? 0);

  const performanceRate = Number(getValues().performance_rate ?? dryRunResult?.performance_rate ?? 0);

  // Source values are from backend dry-run. Fallback to backend-provided totals where available.
  // ✅ basePrincipal should be total_active_capital_for_profit (already includes previous epoch + new deposits)
  const basePrincipal = excelTotal !== null ? excelTotal : totalStartBalance;
  const performanceApplied = calculatedProfit;
  const projectedValuation = totalToCommit > 0 ? totalToCommit : Number((basePrincipal + performanceApplied).toFixed(2));
  const netPrincipal = netExcelTotal !== null ? netExcelTotal : Number((basePrincipal - withdrawalsTotal).toFixed(2));

  const expectedTotal = declaredTotal;
  const calculatedTotal = Number(dryRunResult?.reconciliation_total ?? totalToCommit ?? projectedValuation);
  const reconciliationDiff = Number((calculatedTotal - expectedTotal).toFixed(2));
  const reconciliationStatus = Math.abs(reconciliationDiff) <= 0.01;

  const grossPrincipal = Number(dryRunResult?.gross_principal ?? netPrincipal ?? basePrincipal);
  const totalRowsDetected = Number(dryRunResult?.total_rows_detected ?? dryRunResult?.investors_processed ?? 0);
  const expectedBatchTotal = expectedTotal;

  const statusBoxStyles = reconciliationStatus
    ? { background: "rgba(0, 0, 91, 0.08)", border: "1px solid #00005b", borderRadius: "8px" }
    : { background: "rgba(220, 38, 38, 0.08)", border: "1px solid rgba(220, 38, 38, 0.4)", borderRadius: "8px" };


  const onSubmit = async (data: CreateValuationFormData) => {
    if (!reconciliationStatus) {
      toast.error("Cannot commit: reconciliation mismatch must be resolved before saving.");
      return;
    }

    const selectedFund = funds.find((f) => f.id === Number(data.fund_id));
    const payload = {
      fund_id: Number(data.fund_id),
      fund_name: selectedFund?.fund_name || undefined,
      start_date: data.start_date,
      end_date: data.end_date,
      performance_rate_percent: Number(data.performance_rate),
      head_office_total: Number(data.head_office_total),
    };

    try {
      await valuationService.confirm(payload);
      toast.success("Valuation committed successfully");
      // Trigger a dashboard refetch without manual refresh.
      window.dispatchEvent(new Event("dashboard_stats_dirty"));
      navigate(ROUTES.VALUATIONS);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to commit valuation");
    }
  };

  const onDryRun = async () => {
    const vals = getValues();
    if (!vals.fund_id || !vals.start_date || !vals.end_date || vals.performance_rate == null || vals.head_office_total == null) {
      toast.error("Fill all fields before previewing");
      return;
    }
    setDryRunning(true);
    try {
      const res = await valuationService.dryRun(vals);
      setDryRunResult((res as any).data || res);
      toast.success("Dry run complete");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Dry run failed");
    } finally {
      setDryRunning(false);
    }
  };

  const inputStyle = { background: "var(--color-bg-input)", borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" };

  return (
    <div className="container-fluid px-0">
      <button onClick={() => navigate(ROUTES.VALUATIONS)} className="d-flex align-items-center gap-1 mb-3 btn btn-link p-0 text-decoration-none" style={{ fontSize: "12px", color: "var(--color-text-tertiary)" }}><ArrowLeft size={14} /> Back to valuations</button>
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: "22px", color: "var(--color-text-primary)" }}>New valuation</h1>
        <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>Create an epoch valuation for a core fund</p>
      </div>

      <div className="row g-4">
        {/* Form */}
        <div className="col-lg-6">
          <div className="card shadow h-100">
            <div className="card-body p-3 p-md-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Fund *</label>
              <select {...register("fund_id", { valueAsNumber: true })} className="form-control py-3 border-secondary" style={{ ...inputStyle, borderColor: errors.fund_id ? "var(--color-destructive)" : inputStyle.borderColor }}>
                <option value="">Select fund</option>
                {funds.map((f) => <option key={f.id} value={f.id}>{f.fund_name}</option>)}
              </select>
              {errors.fund_id && <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.fund_id.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Valuation Period Start Date *</label>
                <input type="date" {...register("start_date")} className="form-control py-3 border-secondary" style={{ ...inputStyle, borderColor: errors.start_date ? "var(--color-destructive)" : inputStyle.borderColor }} />
                {errors.start_date && <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.start_date.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Valuation Period End Date *</label>
                <input type="date" {...register("end_date")} className="form-control py-3 border-secondary" style={{ ...inputStyle, borderColor: errors.end_date ? "var(--color-destructive)" : inputStyle.borderColor }} />
                {errors.end_date && <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.end_date.message}</p>}
              </div>
            </div>
            {/* Deployment reference section hidden */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Performance rate (%) *</label>
              <div className="position-relative">
                <input 
                  type="number" 
                  step="any" 
                  {...register("performance_rate", { valueAsNumber: true })} 
                  className="form-control py-3 border-secondary" 
                  style={{ ...inputStyle, borderColor: errors.performance_rate ? "var(--color-destructive)" : inputStyle.borderColor }} 
                  placeholder="e.g., 3.48 or -0.25"
                />
              </div>
              <p className="text-[11px] mt-1" style={{ color: "var(--color-text-tertiary)" }}>Enter as percentage: 2 = 2%, -0.25 = -0.25%</p>
              {errors.performance_rate && <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.performance_rate.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>Head office total ($) *</label>
              <input type="number" step="0.01" {...register("head_office_total", { valueAsNumber: true })} className="form-control py-3 border-secondary" style={{ ...inputStyle, borderColor: errors.head_office_total ? "var(--color-destructive)" : inputStyle.borderColor }} placeholder="12345678.90" />
              {errors.head_office_total && <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.head_office_total.message}</p>}
            </div>
            <div className="d-flex gap-3 pt-3">
              <button type="button" onClick={onDryRun} disabled={dryRunning} className="btn w-50 d-flex align-items-center justify-content-center gap-2 px-3 py-2 fw-bold" style={{ fontSize: "13px", border: "1px solid rgba(255,255,255,0.15)", color: "var(--color-text-secondary)", background: "transparent" }}>
                <Eye size={14} /> {dryRunning ? "Running..." : "Dry run"}
              </button>
              <button type="submit" disabled={isSubmitting || !reconciliationStatus} className="btn btn-primary w-50 px-3 py-2 fw-bold" style={{ fontSize: "13px" }}>
                {isSubmitting ? "Committing..." : "Commit valuation"}
              </button>
            </div>
          </form>
            </div>
          </div>
        </div>

        {/* Dry run preview */}
        <div className="col-lg-6">
          <div className="card shadow h-100">
            <div className="card-body p-3 p-md-4">
              <h3 className="fw-bold mb-4" style={{ fontSize: "18px", color: "var(--color-text-primary)" }}>Preview</h3>
          {dryRunResult ? (
            <div className="space-y-3">
              <div className="border rounded p-3" style={{ background: "var(--color-bg-muted)" }}>
                <h5 className="mb-2" style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>Calculation Summary</h5>
                <div className="d-flex justify-content-between text-[13px] mb-1"><span>Total rows detected</span><span style={{ fontFamily: "var(--font-mono)" }}>{totalRowsDetected}</span></div>
                <div className="d-flex justify-content-between text-[13px] mb-1"><span>Gross Principal (Net active capital)</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(grossPrincipal)}</span></div>

                {/* Withdrawals — red + parenthetical when non-zero */}
                <div className="d-flex justify-content-between text-[13px] mb-1">
                  <span style={{ color: withdrawalsTotal > 0 ? "#dc2626" : "inherit" }}>Total Withdrawals</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: withdrawalsTotal > 0 ? "#dc2626" : "inherit", fontWeight: withdrawalsTotal > 0 ? 600 : 400 }}>
                    {withdrawalsTotal > 0 ? `(${formatCurrency(withdrawalsTotal)})` : formatCurrency(withdrawalsTotal)}
                  </span>
                </div>

                {withdrawalsTotal > 0 && (
                  <div className="d-flex justify-content-between text-[13px] mb-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "4px" }}>
                    <span style={{ fontWeight: 600 }}>Net Principal (Base for Interest)</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{formatCurrency(netPrincipal)}</span>
                  </div>
                )}

                <div className="d-flex justify-content-between text-[13px] mb-1"><span>Performance Applied ({performanceRate.toFixed(2)}%)</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(performanceApplied)}</span></div>
                <div className="d-flex justify-content-between text-[13px] mb-1"><span>Projected Valuation (Net + Gain)</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(projectedValuation)}</span></div>
                <div className="d-flex justify-content-between text-[13px] mb-1"><span>Expected Batch Total</span><span style={{ fontFamily: "var(--font-mono)" }}>{formatCurrency(expectedBatchTotal)}</span></div>
                <div className="d-flex justify-content-between text-[13px] mt-1 pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <span>Distinct investors (email-distinct)</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{dryRunResult.distinct_investor_count ?? dryRunResult.investor_rows ?? 0}</span>
                </div>
              </div>

              <div className="p-3" style={statusBoxStyles}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span style={{ fontWeight: 700 }}>Reconciliation Status</span>
                  <span style={{ fontWeight: 700, color: reconciliationStatus ? "#166534" : "#991b1b" }}>
                    {reconciliationStatus
                      ? "Balanced"
                      : `Mismatch: expected ${formatCurrency(expectedTotal)} but calculated ${formatCurrency(calculatedTotal)}`}
                  </span>
                </div>
                <div className="text-[12px]" style={{ color: reconciliationStatus ? "#166534" : "#991b1b" }}>
                  {reconciliationStatus ? "Ready to commit" : `Difference: ${formatCurrency(reconciliationDiff)}`}
                </div>
              </div>

              {dryRunResult.investor_breakdown && dryRunResult.investor_breakdown.length > 0 && (
                <div className="border rounded p-3" style={{ background: "var(--color-bg-muted)" }}>
                  <h5 className="mb-2" style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-text-primary)" }}>Investor Detail Table</h5>
                  <div className="table-responsive" style={{ maxHeight: 240, overflowY: "auto" }}>
                    <table className="table table-sm mb-0 text-white" style={{ color: "var(--color-text-primary)" }}>
                      <thead>
                        <tr>
                          <th>Investor</th>
                          <th className="text-end">Days Active</th>
                          <th className="text-end">Net Base</th>
                          {withdrawalsTotal > 0 && <th className="text-end" style={{ color: "#dc2626" }}>Withdrawal</th>}
                          <th className="text-end">{performanceRate.toFixed(2)}% Gain</th>
                          <th className="text-end">New Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dryRunResult.investor_breakdown.map((investor: any) => {
                          const rowWithdrawal = Number(investor.withdrawals_during_period ?? 0);
                          // Use the backend-provided active capital so compound carry balances are preserved.
                          const rowNetBase = Number((investor.active_capital ?? (investor.principal_before_start + investor.deposits_during_period)).toFixed(2));
                          // Profit is calculated on net base, matching backend logic
                          const rowGain = Number(investor.profit ?? (rowNetBase * (performanceRate / 100)).toFixed(2));
                          const rowTotal = Number((rowNetBase + rowGain).toFixed(2));
                          return (
                            <tr key={investor.internal_client_code}>
                              <td style={{ fontFamily: "var(--font-mono)" }}>{investor.internal_client_code}</td>
                              <td className="text-end">
                                {typeof investor.active_ratio_pct === "number"
                                  ? `${investor.active_ratio_pct.toFixed(2)}% (${investor.days_active ?? 0}/${investor.period_days ?? 0})`
                                  : "—"}
                              </td>
                              <td className="text-end">{formatCurrency(rowNetBase)}</td>
                              {withdrawalsTotal > 0 && (
                                <td className="text-end" style={{ color: "#dc2626", fontWeight: 600 }}>
                                  {rowWithdrawal > 0 ? `(${formatCurrency(rowWithdrawal)})` : "—"}
                                </td>
                              )}
                              <td className="text-end">{formatCurrency(rowGain)}</td>
                              <td className="text-end">{formatCurrency(rowTotal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>Run a dry run to see the calculated preview before committing.</p>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
