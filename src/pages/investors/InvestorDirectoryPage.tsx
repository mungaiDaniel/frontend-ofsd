import { useEffect, useState } from "react";
import { investmentService } from "@/services/investmentService";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/constants";

export default function InvestorDirectoryPage() {
  const navigate = useNavigate();
  const [investors, setInvestors] = useState<any[]>([]);
  const [statementClosingByCode, setStatementClosingByCode] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await investmentService.getInvestorDirectory();
        if (res.status === 200) {
          setInvestors((res.data as any[]) || []);
        } else {
          toast.error(res.message || "Failed to load investor directory");
        }
      } catch (err) {
        toast.error("Failed to load investor directory");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  useEffect(() => {
    const codes = Array.from(
      new Set(
        investors
          .map((inv) => String(inv?.internal_client_code || "").trim())
          .filter(Boolean)
      )
    );

    if (codes.length === 0) {
      setStatementClosingByCode({});
      return;
    }

    let cancelled = false;

    (async () => {
      const results = await Promise.allSettled(
        codes.map(async (code) => {
          const res = await investmentService.getInvestorStatements(code);
          const statements = (res.data as any[]) || [];
          const latest = statements.find((s: any) => s?.end_balance != null);
          return [code, Number(latest?.end_balance ?? NaN)] as const;
        })
      );

      if (cancelled) return;

      const next: Record<string, number> = {};
      for (const item of results) {
        if (item.status !== "fulfilled") continue;
        const [code, closing] = item.value;
        if (Number.isFinite(closing)) next[code] = closing;
      }
      setStatementClosingByCode(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [investors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--color-border-subtle)",
            borderTopColor: "var(--color-brand-400)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      <div className="page-header-row mb-4">
        <h1 className="fs-4 fw-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Investor Directory</h1>
        <button className="btn btn-outline-primary" onClick={() => navigate(ROUTES.BATCHES)}>
          Back to Batches
        </button>
      </div>

      <div className="card shadow mb-4 overflow-hidden" style={{ background: "var(--color-bg-surface)" }}>
        <div className="table-responsive">
          <table className="table table-dark mb-0" style={{ background: "var(--color-bg-surface)" }}>
            <thead>
              <tr>
                <th>Investor</th>
                <th>Client Code</th>
                <th>Email</th>
                <th>Investments</th>
                <th>Batches</th>
                <th>Current Balance</th>
                <th>Last Email Status</th>
                <th>Last Email</th>
              </tr>
            </thead>
            <tbody>
              {investors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4" style={{ color: "var(--color-text-tertiary)" }}>
                    No investors found.
                  </td>
                </tr>
              ) : (
                investors.map((inv) => (
                  <tr key={inv.internal_client_code} style={{ cursor: "pointer" }} onClick={() => navigate(ROUTES.INVESTOR_OVERVIEW(inv.internal_client_code))}>
                    <td>
                      <button className="btn btn-link p-0 text-decoration-none text-start" style={{ fontSize: "13px", color: "var(--color-brand-400)" }}>
                        {inv.investor_name || "—"}
                      </button>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-secondary)" }}>{inv.internal_client_code}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{inv.investor_email || "—"}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }} >{inv.investments}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }} >{inv.unique_batches ?? 0}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }} >
                      {formatCurrency(
                        statementClosingByCode[String(inv.internal_client_code || "").trim()] ??
                        inv.current_balance ??
                        inv.main_balance ??
                        inv.total_principal
                      )}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{inv.last_email_status || "N/A"}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{inv.last_email_timestamp ? new Date(inv.last_email_timestamp).toLocaleString() : "N/A"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
