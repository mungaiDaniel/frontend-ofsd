import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fundSummaryService } from "@/services/fundSummaryService";
import { batchService } from "@/services/batchService";
import api from "@/services/api";
import { formatDate } from "@/lib/utils";
import { ROUTES, API } from "@/lib/constants";
import type { FundSummaryResponse, FundSummaryClass, Batch } from "@/lib/types";
import { NAVLineChart } from "@/components/data/NAVLineChart";

// ── Helpers ──

function formatNav(n: number | null | undefined, decimals = 4) {
  if (n == null) return "—";
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}


function formatPerf(p: number | null | undefined) {
  if (p == null) return null;
  return (p >= 0 ? "+" : "") + p.toFixed(2) + "%";
}

function msUntil(isoDate: string): { days: number; hours: number } {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0 };
  const hours = Math.floor(diff / 3_600_000);
  return { days: Math.floor(hours / 24), hours: hours % 24 };
}


// ── Type badges ──
type TxType = "deposit" | "withdrawal" | "valuation";

function TypeBadge({ type }: { type: TxType }) {
  const map: Record<TxType, { label: string; bg: string; color: string }> = {
    deposit:    { label: "Deposit",    bg: "rgba(59,130,246,0.12)",  color: "#60A5FA" },
    withdrawal: { label: "Withdrawal", bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
    valuation:  { label: "Valuation",  bg: "rgba(245,208,11,0.12)",  color: "#FCD34D" },
  };
  const s = map[type] ?? map.deposit;
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: "4px",
      fontSize: "10px", fontWeight: 600, letterSpacing: "0.04em",
      background: s.bg, color: s.color,
    }}>
      {s.label}
    </span>
  );
}

// ── Status dot ──
function StatusDot({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const color = s === "completed" || s === "committed" ? "#22c55e"
    : s === "pending" ? "#F59E0B"
    : "#475569";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, display: "inline-block" }} />
      <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{status}</span>
    </span>
  );
}

// ── Glass card ──
const glass: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "16px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
};

// ── Currency badge ──
function CurrBadge({ currency }: { currency: "KES" | "USD" }) {
  const isKes = currency === "KES";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "1px 6px", borderRadius: "4px",
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

// ── Countdown pill ──
function CountdownPill({ closeAt }: { closeAt: string }) {
  const { days, hours } = msUntil(closeAt);
  if (days <= 0 && hours <= 0) return <span style={{ fontSize: "10px", color: "#475569" }}>Closed</span>;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 7px", borderRadius: "100px",
      background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
      fontSize: "10px", fontWeight: 600, color: "#F59E0B",
    }}>
      {days > 0 ? `${days}d ${hours}h` : `${hours}h`}
    </span>
  );
}

export default function OverviewPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<FundSummaryResponse | null>(null);
  const [openBatches, setOpenBatches] = useState<Batch[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fundSummaryService.getSummary(),
      batchService.getAll(),
      api.get<{ status: number; data: any[] }>(API.TRANSACTIONS_RECENT),
    ]).then(([sumRes, batchRes, txRes]) => {
      if (sumRes.status === "fulfilled" && sumRes.value) setSummary(sumRes.value);
      if (batchRes.status === "fulfilled") {
        setOpenBatches((batchRes.value as Batch[]).filter((b) => b.is_open));
      }
      if (txRes.status === "fulfilled") {
        const payload = (txRes.value as any)?.data?.data ?? (txRes.value as any)?.data ?? [];
        setTransactions(Array.isArray(payload) ? payload : []);
      }
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived data ──
  const allClasses = useMemo<FundSummaryClass[]>(() => {
    if (!summary) return [];
    return summary.funds.flatMap((f) => f.classes);
  }, [summary]);

  const kesClasses = useMemo(() => allClasses.filter((c) => c.currency === "KES" && c.current_nav != null), [allClasses]);
  const usdClasses = useMemo(() => allClasses.filter((c) => c.currency === "USD" && c.current_nav != null), [allClasses]);

  const totalKes = useMemo(() => summary?.funds.reduce((sum, f) => sum + (f.totals_by_currency?.KES ?? 0), 0) ?? 0, [summary]);
  const totalUsd = useMemo(() => summary?.funds.reduce((sum, f) => sum + (f.totals_by_currency?.USD ?? 0), 0) ?? 0, [summary]);

  const activeInvestors = useMemo(() => {
    const codes = new Set(transactions.map((t: any) => t.internal_client_code).filter(Boolean));
    return codes.size || allClasses.reduce((s, c) => s + (c.total_shares != null ? 1 : 0), 0);
  }, [transactions, allClasses]);

  const sectionLabel: React.CSSProperties = {
    fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em",
    textTransform: "uppercase", color: "var(--color-text-tertiary)",
    marginBottom: "12px",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "var(--color-brand-400)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px" }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "4px" }}>
          Portfolio Overview
        </h1>
        <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
          {summary?.as_of_date ? `NAV as of ${formatDate(summary.as_of_date)}` : "Live fund data"}
        </p>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "22px" }}>

        {/* Total AUM KES */}
        <div style={{ ...glass, padding: "18px 22px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "8px" }}>
            Total AUM <span style={{ color: "var(--color-kes)", marginLeft: "4px" }}>KES</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--color-kes)", letterSpacing: "-0.02em" }}>
            {totalKes > 0 ? totalKes.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
            {kesClasses.length} active class{kesClasses.length !== 1 ? "es" : ""}
          </div>
        </div>

        {/* Total AUM USD */}
        <div style={{ ...glass, padding: "18px 22px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "8px" }}>
            Total AUM <span style={{ color: "var(--color-usd)", marginLeft: "4px" }}>USD</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--color-usd)", letterSpacing: "-0.02em" }}>
            {totalUsd > 0 ? `$ ${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
            {usdClasses.length} active class{usdClasses.length !== 1 ? "es" : ""}
          </div>
        </div>

        {/* Active Investors */}
        <div style={{ ...glass, padding: "18px 22px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "8px" }}>
            Active Investors
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
            {allClasses.filter((c) => c.total_shares != null && c.total_shares > 0).length > 0 ? activeInvestors || "—" : "—"}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>Across all funds</div>
        </div>

        {/* Open Batches */}
        <div style={{ ...glass, padding: "18px 22px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "8px" }}>
            Open Batches
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color: "var(--color-text-primary)" }}>
              {openBatches.length}
            </div>
            {openBatches[0]?.auto_close_at && (
              <CountdownPill closeAt={openBatches[0].auto_close_at!} />
            )}
          </div>
          <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "4px" }}>
            {openBatches.length > 0 ? "Accepting investors" : "No open batches"}
          </div>
        </div>
      </div>

      {/* ── Middle row: Charts (60%) + Right cards (40%) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: "16px", marginBottom: "22px", alignItems: "start" }}>

        {/* Left: Side-by-side NAV charts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

          {/* KES chart */}
          <div style={{ ...glass, padding: "20px 24px" }}>
            <NAVLineChart
              classes={kesClasses}
              currency="KES"
              title="KES Classes — NAV / Share"
              asOfDate={summary?.as_of_date}
            />
          </div>

          {/* USD chart */}
          <div style={{ ...glass, padding: "20px 24px" }}>
            <NAVLineChart
              classes={usdClasses}
              currency="USD"
              title="USD Classes — NAV / Share"
              asOfDate={summary?.as_of_date}
            />
          </div>
        </div>

        {/* Right: Latest Valuation + Open Batches */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Latest Valuation card */}
          <div style={{ ...glass, padding: "20px 22px" }}>
            <p style={sectionLabel}>Latest Valuation</p>
            {summary?.as_of_date && (
              <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "12px", fontFamily: "var(--font-mono)" }}>
                as of {formatDate(summary.as_of_date)}
              </div>
            )}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Class", "NAV / Share", "Total NAV", "Perf"].map((h) => (
                      <th key={h} style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", padding: "4px 6px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allClasses.filter((c) => c.current_nav != null).map((cls) => {
                    const isKes = cls.currency === "KES";
                    const perf = formatPerf(cls.performance_pct);
                    const gain = (cls.performance_pct ?? 0) >= 0;
                    return (
                      <tr key={cls.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "7px 6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{
                              fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700,
                              color: isKes ? "var(--color-kes)" : "var(--color-usd)",
                            }}>
                              {cls.class_code}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "7px 6px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-primary)" }}>
                          {formatNav(cls.current_nav)}
                        </td>
                        <td style={{ padding: "7px 6px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-text-secondary)" }}>
                          {cls.total_nav != null ? (isKes ? "KES " : "$ ") + cls.total_nav.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—"}
                        </td>
                        <td style={{ padding: "7px 6px", fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: gain ? "#22c55e" : "#EF4444" }}>
                          {perf ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {allClasses.filter((c) => c.current_nav != null).length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" }}>
                        No valuation data yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Open Batches card */}
          <div style={{ ...glass, padding: "20px 22px" }}>
            <p style={sectionLabel}>Open Batches</p>
            {openBatches.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--color-text-tertiary)", fontSize: "12px" }}>
                No batches currently open
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {openBatches.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => navigate(ROUTES.BATCH_DETAIL(b.id))}
                    style={{
                      padding: "10px 12px", borderRadius: "10px",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                        {b.batch_name}
                      </span>
                      {b.class_currency && <CurrBadge currency={b.class_currency as "KES" | "USD"} />}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                        {b.investors_count} investor{b.investors_count !== 1 ? "s" : ""} · {b.total_capital?.toLocaleString("en-US", { maximumFractionDigits: 0 }) ?? "—"}
                      </span>
                      {b.auto_close_at && <CountdownPill closeAt={b.auto_close_at} />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div style={{ ...glass, padding: "0" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ ...sectionLabel, marginBottom: 0 }}>Recent Transactions</p>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Investor", "Client Code", "Type", "Fund / Class", "Amount", "Currency", "Status"].map((h) => (
                  <th key={h} style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)", padding: "10px 16px", textAlign: "left", background: "rgba(255,255,255,0.02)", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
                    No recent transactions
                  </td>
                </tr>
              )}
              {transactions.map((tx: any) => (
                <tr
                  key={tx.id}
                  onClick={() => tx.internal_client_code && navigate(ROUTES.INVESTOR_OVERVIEW(tx.internal_client_code))}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.12s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(59,130,246,0.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "10px 16px", fontSize: "12px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                    {formatDate(tx.date)}
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: "12px", color: "var(--color-text-primary)", fontWeight: 500 }}>
                    {tx.investor_name}
                  </td>
                  <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                    {tx.internal_client_code ?? "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <TypeBadge type={tx.type as TxType} />
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                    {tx.fund_name}
                    {tx.class_code && (
                      <span style={{
                        marginLeft: "6px", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700,
                        color: tx.currency === "KES" ? "var(--color-kes)" : "var(--color-usd)",
                      }}>
                        {tx.class_code}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>
                    {tx.currency === "KES" ? "KES " : "$ "}
                    {tx.amount != null ? tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <CurrBadge currency={tx.currency as "KES" | "USD"} />
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <StatusDot status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

