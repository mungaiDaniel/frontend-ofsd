import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { investmentService } from "@/services/investmentService";
import { fundSummaryService } from "@/services/fundSummaryService";
import { formatDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { NAVLineChart } from "@/components/data/NAVLineChart";
import type { FundSummaryClass } from "@/lib/types";

// ── Types ──

interface InvestorPosition {
  batch_id: number;
  batch_name: string;
  fund_name: string;
  class_code: string;
  currency: "KES" | "USD";
  deposit_amount: number;
  shares: number | null;
  market_value: number | null;
  performance_pct: number | null;
  deployment_nav: number | null;
  current_nav: number | null;
  deployment_date: string | null;
}

interface InvestorOverview {
  internal_client_code: string;
  investor_name: string;
  investor_email?: string;
  investor_phone?: string;
  positions: InvestorPosition[];
}

// ── Shared styles ──

const glass: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "16px",
};

// ── Helpers ──

function initials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmtMoney(v: number | null | undefined, decimals = 0): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// ── Sub-components ──

function CurrBadge({ currency }: { currency: "KES" | "USD" }) {
  const isKes = currency === "KES";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 7px", borderRadius: "5px",
      fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em",
      fontFamily: "var(--font-mono)",
      background: isKes ? "var(--color-kes-bg)" : "var(--color-usd-bg)",
      color: isKes ? "var(--color-kes)" : "var(--color-usd)",
      border: isKes ? "1px solid var(--color-kes-border)" : "1px solid var(--color-usd-border)",
    }}>{currency}</span>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ ...glass, padding: "16px 18px", borderRadius: "12px" }}>
      <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#475569", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "18px", fontWeight: 700, color: color ?? "#FFFFFF", letterSpacing: "-0.02em", marginBottom: "3px" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "10px", color: "#475569" }}>{sub}</div>}
    </div>
  );
}

// ── Main page ──

export default function InvestorOverviewPage() {
  const { clientCode } = useParams<{ clientCode: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<InvestorOverview | null>(null);
  const [allClasses, setAllClasses] = useState<FundSummaryClass[]>([]);
  const [asOfDate, setAsOfDate] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!clientCode) return;
    const code = decodeURIComponent(clientCode);
    setLoading(true);
    Promise.allSettled([
      investmentService.getInvestorOverview(code),
      fundSummaryService.getSummary(),
    ]).then(([ovRes, summRes]) => {
      if (ovRes.status === "fulfilled" && ovRes.value?.status === 200 && ovRes.value?.data) {
        setOverview(ovRes.value.data as InvestorOverview);
      } else {
        setNotFound(true);
      }
      if (summRes.status === "fulfilled" && summRes.value) {
        setAllClasses(summRes.value.funds.flatMap(f => f.classes));
        setAsOfDate(summRes.value.as_of_date ?? undefined);
      }
    }).finally(() => setLoading(false));
  }, [clientCode]);

  // ── Derived ──
  const classCodes = useMemo(() => {
    if (!overview) return new Set<string>();
    return new Set(overview.positions.map(p => p.class_code));
  }, [overview]);

  const investorKesClasses = useMemo(
    () => allClasses.filter(c => c.currency === "KES" && classCodes.has(c.class_code)),
    [allClasses, classCodes]
  );
  const investorUsdClasses = useMemo(
    () => allClasses.filter(c => c.currency === "USD" && classCodes.has(c.class_code)),
    [allClasses, classCodes]
  );

  const kesMV = useMemo(() => {
    if (!overview) return null;
    const kp = overview.positions.filter(p => p.currency === "KES");
    if (kp.length === 0 || kp.some(p => p.market_value == null)) return null;
    return kp.reduce((s, p) => s + (p.market_value ?? 0), 0);
  }, [overview]);

  const usdMV = useMemo(() => {
    if (!overview) return null;
    const up = overview.positions.filter(p => p.currency === "USD");
    if (up.length === 0 || up.some(p => p.market_value == null)) return null;
    return up.reduce((s, p) => s + (p.market_value ?? 0), 0);
  }, [overview]);

  const totalShares = useMemo(() => {
    if (!overview) return null;
    const all = overview.positions.filter(p => p.shares != null);
    return all.length > 0 ? all.reduce((s, p) => s + (p.shares ?? 0), 0) : null;
  }, [overview]);

  const activeHoldings = overview?.positions.filter(p => p.deployment_date != null).length ?? 0;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
        <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (notFound || !overview) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", fontFamily: "var(--font-sans)" }}>
        <p style={{ color: "#475569", marginBottom: "16px" }}>Investor not found.</p>
        <button onClick={() => navigate(ROUTES.INVESTORS)} style={{ fontSize: "12px", color: "#60A5FA", background: "none", border: "none", cursor: "pointer" }}>
          ← Back to investors
        </button>
      </div>
    );
  }

  const showCharts = investorKesClasses.length > 0 || investorUsdClasses.length > 0;

  return (
    <div style={{
      position: "relative", zIndex: 1,
      padding: "24px 32px 48px",
      maxWidth: "1200px", margin: "0 auto",
      fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
      color: "#FFFFFF",
      display: "flex", flexDirection: "column", gap: "20px",
    }}>
      {/* Back */}
      <button
        onClick={() => navigate(ROUTES.INVESTORS)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "transparent", border: "none",
          color: "#475569", fontFamily: "var(--font-sans)", fontSize: "12px",
          cursor: "pointer", padding: "0", alignSelf: "flex-start",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#475569"}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M9 6H3M5 8L3 6l2-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to investors
      </button>

      {/* Identity card */}
      <div style={{ ...glass, padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Initials avatar */}
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "16px", fontWeight: 700, color: "#60A5FA", flexShrink: 0,
              fontFamily: "var(--font-mono)",
            }}>
              {initials(overview.investor_name)}
            </div>
            <div>
              <div style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "4px" }}>
                {overview.investor_name}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3B82F6", letterSpacing: "0.04em", fontWeight: 600 }}>
                  {overview.internal_client_code}
                </span>
                {overview.investor_email && (
                  <>
                    <span style={{ color: "#1E293B", fontSize: "8px" }}>•</span>
                    <span style={{ fontSize: "12px", color: "#94A3B8" }}>{overview.investor_email}</span>
                  </>
                )}
                {overview.investor_phone && (
                  <>
                    <span style={{ color: "#1E293B", fontSize: "8px" }}>•</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#94A3B8" }}>{overview.investor_phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => navigate(ROUTES.INVESTOR_STATEMENT(overview.internal_client_code))}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", borderRadius: "8px",
                background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)",
                color: "#60A5FA", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500,
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.2)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.5)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.12)"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.25)"; }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <line x1="4.5" y1="4.5" x2="9.5" y2="4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                <line x1="4.5" y1="7" x2="9.5" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                <line x1="4.5" y1="9.5" x2="7.5" y2="9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              Generate Statement
            </button>
            <button
              onClick={() => toast.info("Transactions view — coming soon")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "8px 14px", borderRadius: "8px",
                background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                color: "#94A3B8", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500,
                cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.25)"; (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M1 4h12M1 8h8M1 12h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              View Transactions
            </button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
        <KpiCard
          label="Total KES Market Value"
          value={kesMV != null ? `KES ${fmtMoney(kesMV)}` : "—"}
          sub={kesMV != null ? "as of last valuation" : "no KES positions"}
          color="var(--color-kes)"
        />
        <KpiCard
          label="Total USD Market Value"
          value={usdMV != null ? `$ ${fmtMoney(usdMV)}` : "—"}
          sub={usdMV != null ? "as of last valuation" : "no USD positions"}
          color="var(--color-usd)"
        />
        <KpiCard
          label="Total Shares"
          value={totalShares != null ? totalShares.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—"}
          sub="across all classes"
        />
        <KpiCard
          label="Active Holdings"
          value={String(activeHoldings)}
          sub={`${overview.positions.length} total position${overview.positions.length !== 1 ? "s" : ""}`}
        />
      </div>

      {/* Charts + Holdings grid */}
      {showCharts && (
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "14px" }}>
          {/* NAV charts — left */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {investorKesClasses.length > 0 && (
              <div style={{ ...glass, padding: "20px 24px", borderRadius: "12px" }}>
                <NAVLineChart
                  classes={investorKesClasses}
                  currency="KES"
                  title="KES Holdings — NAV / Share"
                  asOfDate={asOfDate}
                />
              </div>
            )}
            {investorUsdClasses.length > 0 && (
              <div style={{ ...glass, padding: "20px 24px", borderRadius: "12px" }}>
                <NAVLineChart
                  classes={investorUsdClasses}
                  currency="USD"
                  title="USD Holdings — NAV / Share"
                  asOfDate={asOfDate}
                />
              </div>
            )}
          </div>

          {/* Current Holdings — right */}
          <div style={{ ...glass, padding: "0", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: "12px", fontWeight: 600 }}>
              Current Holdings
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {overview.positions.map(pos => {
                const isKes = pos.currency === "KES";
                const mvColor = isKes ? "var(--color-kes)" : "var(--color-usd)";
                return (
                  <div
                    key={pos.batch_id}
                    onClick={() => navigate(ROUTES.BATCH_DETAIL(pos.batch_id))}
                    style={{
                      padding: "12px 18px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      cursor: "pointer", transition: "background 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <CurrBadge currency={pos.currency} />
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#FFFFFF", fontWeight: 600 }}>
                          {pos.class_code}
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: pos.market_value != null ? mvColor : "#475569" }}>
                        {pos.market_value != null ? fmtMoney(pos.market_value) : "Pending"}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", color: "#475569" }}>{pos.fund_name}</span>
                      {pos.performance_pct != null && (
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 600, color: pos.performance_pct >= 0 ? "#10B981" : "#EF4444" }}>
                          {pos.performance_pct >= 0 ? "+" : ""}{pos.performance_pct.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    {pos.shares != null && (
                      <div style={{ fontSize: "9px", color: "#475569", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
                        {pos.shares.toLocaleString("en-US", { maximumFractionDigits: 2 })} shares
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Positions table (full) */}
      <div style={{ ...glass, borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", fontWeight: 600 }}>All Positions</span>
          <span style={{ fontSize: "11px", color: "#475569" }}>{overview.positions.length} holding{overview.positions.length !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["Batch", "Fund / Class", "Deposited", "Shares", "Market Value", "NAV / Share", "Performance", "Deployed"].map(h => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
                    color: "#475569",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overview.positions.map(pos => {
                const isKes = pos.currency === "KES";
                const perf = pos.performance_pct;
                return (
                  <tr
                    key={pos.batch_id}
                    onClick={() => navigate(ROUTES.BATCH_DETAIL(pos.batch_id))}
                    style={{ cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: "#FFFFFF" }}>
                      {pos.batch_name}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "12px", color: "#94A3B8" }}>{pos.fund_name}</span>
                        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>›</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color: isKes ? "var(--color-kes)" : "var(--color-usd)" }}>{pos.class_code}</span>
                        <CurrBadge currency={pos.currency} />
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "#94A3B8" }}>
                      {(isKes ? "KES " : "$ ") + fmtMoney(pos.deposit_amount)}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {pos.shares != null
                        ? <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#FFFFFF" }}>{pos.shares.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                        : <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "#475569" }}>Pending</span>
                      }
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {pos.market_value != null
                        ? <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#FFFFFF" }}>{(isKes ? "KES " : "$ ") + fmtMoney(pos.market_value)}</span>
                        : <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "#475569" }}>Pending</span>
                      }
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {pos.current_nav != null
                        ? <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#94A3B8" }}>{pos.current_nav.toFixed(4)}</span>
                        : <span style={{ fontSize: "11px", color: "#475569" }}>—</span>
                      }
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {perf != null
                        ? <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: perf >= 0 ? "#34D399" : "#F87171" }}>
                            {perf >= 0 ? "+" : ""}{perf.toFixed(2)}%
                          </span>
                        : <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(255,255,255,0.05)", color: "#475569" }}>Pending</span>
                      }
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#94A3B8" }}>
                      {pos.deployment_date ? formatDate(pos.deployment_date) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
