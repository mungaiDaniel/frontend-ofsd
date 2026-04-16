import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/data/StatusBadge";
import { reportService } from "@/services/reportService";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { ReportSummary } from "@/lib/types";
import { Plus, Download, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function ValuationListPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const data = await reportService.getAll();
        setReports(data);
      } catch (err: any) {
        const message = err?.response?.data?.message || "Failed to load valuation reports";
        setErrorMessage(message);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleDownloadClick = async (report: ReportSummary) => {
    try {
      await reportService.downloadPdf(report.id);
      toast.success("Report PDF downloaded successfully");
    } catch {
      toast.error("Failed to download report PDF");
    }
  };

  return (
    <div className="container-fluid px-0">
      <div className="page-header-row mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "22px", color: "var(--color-text-primary)" }}>
            Valuation Statements
          </h1>
          <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Committed valuation reports by period
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.VALUATION_CREATE)}
          className="btn btn-primary btn-sm rounded-pill d-flex align-items-center gap-2 fw-bold"
          style={{ padding: "8px 18px" }}
        >
          <Plus size={14} /> New valuation
        </button>
      </div>

      <div className="card shadow">
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border spinner-border-sm" style={{ color: "var(--color-brand-400)" }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="py-5 text-center" style={{ color: "var(--color-text-secondary)" }}>
            <p className="fs-5 fw-bold mb-2">Unable to load valuation reports</p>
            <p className="mb-0">{errorMessage}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark mb-0" style={{ background: "var(--color-bg-surface)" }}>
              <thead>
                <tr>
                  {[
                    { label: "Fund", align: "left" },
                    { label: "Epoch Period", align: "left" },
                    { label: "Rate", align: "right" },
                    { label: "Opening", align: "right" },
                    { label: "Closing AUM", align: "right" },
                    { label: "Profit", align: "right" },
                    { label: "Investors", align: "right" },
                    { label: "Status", align: "left" },
                    { label: "Actions", align: "center" },
                    { label: "", align: "left" },
                  ].map((h) => (
                    <th key={h.label} style={{ textAlign: h.align as "left" | "right" | "center" }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => navigate(ROUTES.REPORT_DETAIL(r.id))}>
                    <td className="fw-bold" style={{ fontSize: "13px" }}>{r.fund_name}</td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "12px" }}>
                      {formatDate(r.epoch_start)} → {formatDate(r.epoch_end)}
                    </td>
                    <td className="text-end" style={{ fontFamily: "var(--font-mono)", color: "var(--color-success)", fontSize: "12px" }}>
                      {formatPercent(r.performance_rate_percent)}
                    </td>
                    <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {formatCurrency(r.summary.total_opening_capital)}
                    </td>
                    <td className="text-end fw-bold" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {formatCurrency(r.summary.total_closing_aum)}
                    </td>
                    <td
                      className="text-end"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        color: r.summary.total_profit_distributed >= 0 ? "var(--color-success)" : "var(--color-destructive)",
                      }}
                    >
                      {formatCurrency(r.summary.total_profit_distributed)}
                    </td>
                    <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {r.summary.investor_count}
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-center">
                      <Download
                        size={16}
                        style={{ color: "#00005b", cursor: "pointer" }}
                        onClick={(e) => { e.stopPropagation(); handleDownloadClick(r); }}
                      />
                    </td>
                    <td><ChevronRight size={14} style={{ color: "var(--color-text-tertiary)" }} /></td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-5" style={{ color: "var(--color-text-tertiary)" }}>
                      No valuation reports available. Commit a valuation to generate reports.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
