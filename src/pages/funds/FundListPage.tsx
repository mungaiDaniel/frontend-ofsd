import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fundService } from "@/services/fundService";
import { ROUTES } from "@/lib/constants";
import { formatCurrencyCompact } from "@/lib/utils";
import type { CoreFund } from "@/lib/types";
import { toast } from "sonner";
import { Plus, Landmark, ChevronRight } from "lucide-react";

export default function FundListPage() {
  const navigate = useNavigate();
  const [funds, setFunds] = useState<CoreFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFundName, setNewFundName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setFunds(await fundService.getAll()); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!newFundName.trim()) return;
    setCreating(true);
    try {
      await fundService.create(newFundName.trim());
      toast.success(`Fund "${newFundName}" created`);
      setNewFundName("");
      setShowCreate(false);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create fund");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="page-header-row mb-4">
        <div>
          <h1 className="fw-bold mb-1" style={{ fontSize: "22px", color: "var(--color-text-primary)" }}>
            Funds
          </h1>
          <p className="mb-0" style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Core funds used for performance tracking and valuation
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn btn-primary btn-sm rounded-pill d-flex align-items-center gap-2 fw-bold"
          style={{ padding: "8px 18px" }}
        >
          <Plus size={14} /> New fund
        </button>
      </div>

      {/* Inline create form */}
      {showCreate && (
        <div className="card shadow mb-4">
          <div className="card-body">
            <p className="fw-bold mb-3" style={{ fontSize: "13px", color: "var(--color-text-primary)" }}>
              Create new fund
            </p>
            <div className="d-flex align-items-end gap-3">
              <div className="flex-grow-1">
                <label className="form-label" style={{ fontSize: "12px" }}>Fund name</label>
                <input
                  value={newFundName}
                  onChange={(e) => setNewFundName(e.target.value)}
                  className="form-control"
                  placeholder="e.g. Axiom"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && onCreate()}
                />
              </div>
              <button
                onClick={onCreate}
                disabled={creating || !newFundName.trim()}
                className="btn btn-primary rounded-pill fw-bold"
                style={{ whiteSpace: "nowrap" }}
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => { setShowCreate(false); setNewFundName(""); }}
                className="btn btn-sm"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "var(--color-text-secondary)",
                  borderRadius: "20px",
                  whiteSpace: "nowrap",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fund list */}
      {loading ? (
        <div className="d-flex align-items-center justify-content-center" style={{ height: "160px" }}>
          <div className="spinner-border spinner-border-sm" style={{ color: "var(--color-brand-400)" }} role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : funds.length === 0 ? (
        <div className="card shadow text-center py-5">
          <div className="card-body d-flex flex-column align-items-center">
            <Landmark size={36} className="mb-3" style={{ color: "var(--color-text-tertiary)" }} />
            <p className="mb-0" style={{ color: "var(--color-text-tertiary)", fontSize: "13px" }}>
              No funds created yet. Upload a batch Excel or create a fund manually.
            </p>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {funds.map((fund) => (
            <div className="col-lg-4 col-sm-6" key={fund.id}>
              <div
                className="card shadow h-100"
                style={{ cursor: "pointer", transition: "background 0.15s" }}
                onClick={() => navigate(ROUTES.FUND_DETAIL(fund.id))}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#243447")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--color-bg-surface)")}
              >
                <div className="card-body d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-3"
                      style={{ width: "40px", height: "40px", background: "var(--color-brand-50)", flexShrink: 0 }}
                    >
                      <Landmark size={18} style={{ color: "var(--color-brand-400)" }} />
                    </div>
                    <div>
                      <h3 className="fw-bold mb-1" style={{ fontSize: "14px", color: "var(--color-text-primary)" }}>
                        {fund.fund_name}
                      </h3>
                      <span
                        className="badge rounded-pill"
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          background: fund.is_active ? "var(--color-success-bg)" : "var(--color-destructive-bg)",
                          color: fund.is_active ? "var(--color-success)" : "var(--color-destructive)",
                        }}
                      >
                        {fund.is_active ? "Active" : "Inactive"}
                      </span>
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <span 
                          className="badge rounded-pill border" 
                          style={{ 
                            fontSize: "10px", 
                            fontWeight: 500,
                            background: "transparent",
                            borderColor: "rgba(255,255,255,0.1)",
                            color: "var(--color-text-secondary)"
                          }}
                        >
                          {formatCurrencyCompact(fund.total_aum || 0)} AUM
                        </span>
                        <span 
                          className="badge rounded-pill border" 
                          style={{ 
                            fontSize: "10px", 
                            fontWeight: 500,
                            background: "transparent",
                            borderColor: "rgba(255,255,255,0.1)",
                            color: "var(--color-text-secondary)"
                          }}
                        >
                          {fund.investor_count || 0} Investors
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--color-text-tertiary)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
