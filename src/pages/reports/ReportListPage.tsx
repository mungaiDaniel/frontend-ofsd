import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/data/StatusBadge";
import { reportService } from "@/services/reportService";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { ReportSummary, ReportDetail } from "@/lib/types";
import { ChevronRight, FileBarChart, Eye, Download } from "lucide-react";

export default function ReportListPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const data = await reportService.getAll();
        setReports(data);
      } catch (err: any) {
        const message = err?.response?.data?.message || 'Failed to load reports';
        console.error('Failed to load reports', err);
        setErrorMessage(message);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const handleEyeClick = async (report: ReportSummary) => {
    if (report.status !== 'Committed') return;
    setModalLoading(true);
    setModalOpen(true);
    try {
      const detail = await reportService.getById(report.id);
      setSelectedReport(detail);
    } catch (err) {
      console.error('Failed to load report detail', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDownloadClick = (report: ReportSummary) => {
    reportService.downloadPdf(report.id);
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="page-header-row mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "22px", color: "var(--color-text-primary)" }}>
            Reports
          </h1>
          <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Committed valuation runs and investor statements
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.PORTFOLIO)}
          className="btn btn-sm d-flex align-items-center gap-2 fw-bold"
          style={{
            padding: "8px 18px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "transparent",
            color: "var(--color-text-secondary)",
          }}
        >
          <FileBarChart size={14} /> Portfolio view
        </button>
      </div>

      {/* Table card */}
      <div className="card shadow">
        {loading ? (
          <div className="d-flex align-items-center justify-content-center py-5">
            <div className="spinner-border spinner-border-sm" style={{ color: "var(--color-brand-400)" }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="py-5 text-center" style={{ color: "var(--color-text-secondary)" }}>
            <p className="fs-5 fw-bold mb-2">Unable to load reports</p>
            <p className="mb-0">{errorMessage}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-dark mb-0" style={{ background: "var(--color-bg-surface)" }}>
              <thead>
                <tr>
                  {[
                    { label: "Fund",         align: "left"  },
                    { label: "Epoch Period", align: "left"  },
                    { label: "Rate",         align: "right" },
                    { label: "Opening",      align: "right" },
                    { label: "Closing AUM",  align: "right" },
                    { label: "Profit",       align: "right" },
                    { label: "Investors",    align: "right" },
                    { label: "Status",       align: "left"  },
                    { label: "Actions",      align: "center" },
                    { label: "",             align: "left"  },
                  ].map((h) => (
                    <th key={h.label} style={{ textAlign: h.align as "left" | "right" | "center", color: h.label === "Actions" ? "#00005b" : undefined }}>{h.label}</th>
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
                    <td className="text-end" style={{
                      fontFamily: "var(--font-mono)", fontSize: "12px",
                      color: r.summary.total_profit_distributed >= 0 ? "var(--color-success)" : "var(--color-destructive)",
                    }}>
                      {formatCurrency(r.summary.total_profit_distributed)}
                    </td>
                    <td className="text-end" style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                      {r.summary.investor_count}
                    </td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="text-center">
                      <div className="d-flex gap-2 justify-content-center">
                        <Eye
                          size={16}
                          style={{ color: r.status === 'Committed' ? "#00005b" : "var(--color-text-tertiary)", cursor: r.status === 'Committed' ? "pointer" : "not-allowed" }}
                          onClick={(e) => { e.stopPropagation(); handleEyeClick(r); }}
                        />
                        <Download
                          size={16}
                          style={{ color: "#00005b", cursor: "pointer" }}
                          onClick={(e) => { e.stopPropagation(); handleDownloadClick(r); }}
                        />
                      </div>
                    </td>
                    <td><ChevronRight size={14} style={{ color: "var(--color-text-tertiary)" }} /></td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-5" style={{ color: "var(--color-text-tertiary)" }}>
                      No reports available. Commit a valuation to generate reports.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for JSON preview */}
      {modalOpen && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setModalOpen(false)}>
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content" style={{ background: "var(--color-bg-surface)", color: "var(--color-text-primary)" }}>
              <div className="modal-header" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
                <h5 className="modal-title">Report JSON Preview</h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                {modalLoading ? (
                  <div className="d-flex align-items-center justify-content-center py-5">
                    <div className="spinner-border spinner-border-sm" style={{ color: "var(--color-brand-400)" }} role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : selectedReport ? (
                  <pre style={{ fontSize: "12px", background: "var(--color-bg-input)", padding: "10px", borderRadius: "4px", overflow: "auto", maxHeight: "400px" }}>
                    {JSON.stringify(selectedReport, null, 2)}
                  </pre>
                ) : (
                  <p>Failed to load report detail.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
