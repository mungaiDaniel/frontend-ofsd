import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { reportService } from "@/services/reportService";
import { fundSummaryService } from "@/services/fundSummaryService";
import { ROUTES } from "@/lib/constants";
import type { EligibleInvestor, ReportRun, EligibleInvestorEmailStatus, ReportRunStatus } from "@/lib/types";

// ── Shared styles ──

const glass: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "12px",
};

// ── Helpers ──

function lastMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
}

function fmtPeriod(p: string): string {
  const [y, m] = p.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[Number(m) - 1]} ${y}`;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function initials(name: string): string {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// ── Sub-components ──

function EmailStatusBadge({ status }: { status: EligibleInvestorEmailStatus }) {
  const map = {
    ready:        { label: "Ready",        bg: "rgba(16,185,129,0.12)",  color: "#10B981", dot: "#10B981" },
    no_email:     { label: "Missing email", bg: "rgba(245,158,11,0.12)", color: "#F59E0B", dot: "#F59E0B" },
    already_sent: { label: "Already sent", bg: "rgba(96,165,250,0.12)", color: "#60A5FA", dot: "#60A5FA" },
  };
  const s = map[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "2px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: s.dot }} />
      {s.label}
    </span>
  );
}

function RunStatusBadge({ status }: { status: ReportRunStatus }) {
  const map = {
    sent:    { label: "Sent",    bg: "rgba(16,185,129,0.12)",  color: "#10B981" },
    partial: { label: "Partial", bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
    failed:  { label: "Failed",  bg: "rgba(239,68,68,0.12)",   color: "#EF4444" },
  };
  const s = map[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "2px 8px", borderRadius: "100px", fontSize: "10px", fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}

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
    }}>{currency}</span>
  );
}

// ── Main page ──

export default function ReportListPage() {
  const navigate = useNavigate();

  // ── Filter state ──
  const [period, setPeriod] = useState(lastMonth());
  const [fundFilter, setFundFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");

  // ── Data ──
  const [investors, setInvestors] = useState<EligibleInvestor[]>([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);
  const [investorsLoaded, setInvestorsLoaded] = useState(false);

  const [runs, setRuns] = useState<ReportRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(true);

  // Funds/classes for dropdowns (from fund summary)
  const [funds, setFunds] = useState<{ id: number; name: string; code: string; classes: { id: number; code: string; currency: "KES"|"USD" }[] }[]>([]);

  // ── Selection ──
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // ── Sending ──
  const [sending, setSending] = useState(false);

  // Load funds for filter dropdowns
  useEffect(() => {
    fundSummaryService.getSummary().then((s) => {
      if (s) {
        setFunds(s.funds.map(f => ({
          id: f.id,
          name: f.fund_name,
          code: f.fund_code,
          classes: f.classes.map(c => ({ id: c.id, code: c.class_code, currency: c.currency })),
        })));
      }
    }).catch(() => {});
  }, []);

  // Load recent runs
  useEffect(() => {
    reportService.getReportRuns().then(setRuns).catch(() => setRuns([])).finally(() => setLoadingRuns(false));
  }, []);

  // Filtered classes based on selected fund
  const filteredClasses = useMemo(() => {
    if (fundFilter === "all") return funds.flatMap(f => f.classes);
    const f = funds.find(f => String(f.id) === fundFilter);
    return f ? f.classes : [];
  }, [funds, fundFilter]);

  // Handle load investors
  const loadInvestors = useCallback(async () => {
    setLoadingInvestors(true);
    setInvestorsLoaded(false);
    try {
      const params: { period: string; fund_id?: number; share_class_id?: number } = { period };
      if (fundFilter !== "all") params.fund_id = Number(fundFilter);
      if (classFilter !== "all") params.share_class_id = Number(classFilter);
      const data = await reportService.getEligibleInvestors(params);
      setInvestors(data);
      // Default: select all ready ones
      setSelected(new Set(data.filter(i => i.email_status === "ready").map(i => i.id)));
      setInvestorsLoaded(true);
    } catch {
      toast.error("Failed to load eligible investors");
    } finally {
      setLoadingInvestors(false);
    }
  }, [period, fundFilter, classFilter]);

  // Selection helpers
  const toggleOne = (id: number) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const selectAll = () => setSelected(new Set(investors.map(i => i.id)));
  const deselectAll = () => setSelected(new Set());
  const selectOnlyReady = () => setSelected(new Set(investors.filter(i => i.email_status === "ready").map(i => i.id)));

  // Send
  const handleSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      const result = await reportService.generateReports({
        period,
        investor_ids: Array.from(selected),
        send_email: true,
      });
      toast.success(`Statements sent to ${selected.size} investor${selected.size !== 1 ? "s" : ""}. Run #${result.report_run_id}`);
      // Reload runs
      reportService.getReportRuns().then(setRuns).catch(() => {});
      setInvestorsLoaded(false);
      setInvestors([]);
      setSelected(new Set());
    } catch {
      toast.error("Failed to send statements");
    } finally {
      setSending(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontFamily: "var(--font-sans)",
    fontSize: "12px",
    padding: "8px 10px",
    outline: "none",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none" as const,
    paddingRight: "28px",
    background: `rgba(0,0,0,0.25) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 8px center`,
  };

  const readyCnt = investors.filter(i => i.email_status === "ready").length;
  const noEmailCnt = investors.filter(i => i.email_status === "no_email").length;
  const alreadySentCnt = investors.filter(i => i.email_status === "already_sent").length;

  return (
    <div style={{
      position: "relative", zIndex: 1,
      padding: "24px 32px 48px",
      maxWidth: "1200px", margin: "0 auto",
      fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
      color: "#FFFFFF",
      display: "flex", flexDirection: "column", gap: "24px",
    }}>
      {/* Page header */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>Reports</h1>
        <p style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
          Generate and send monthly statements to investors.
        </p>
      </div>

      {/* ── Section 1: Generate & Send ── */}
      <div style={{ ...glass, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
          Generate & Send
        </div>

        {/* Filters row */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "10px", color: "#475569", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Period</label>
            <input
              type="month"
              value={period}
              onChange={e => { setPeriod(e.target.value); setInvestorsLoaded(false); }}
              style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: "12px", minWidth: "140px" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "10px", color: "#475569", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fund</label>
            <select
              value={fundFilter}
              onChange={e => { setFundFilter(e.target.value); setClassFilter("all"); setInvestorsLoaded(false); }}
              style={{ ...selectStyle, minWidth: "140px" }}
            >
              <option value="all">All funds</option>
              {funds.map(f => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ fontSize: "10px", color: "#475569", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em" }}>Share Class</label>
            <select
              value={classFilter}
              onChange={e => { setClassFilter(e.target.value); setInvestorsLoaded(false); }}
              style={{ ...selectStyle, minWidth: "140px" }}
            >
              <option value="all">All classes</option>
              {filteredClasses.map(c => <option key={c.id} value={String(c.id)}>{c.code}</option>)}
            </select>
          </div>
          <button
            onClick={loadInvestors}
            disabled={loadingInvestors}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "9px 16px", borderRadius: "8px",
              background: loadingInvestors ? "rgba(26,69,255,0.5)" : "#1A45FF",
              color: "#fff", border: "none",
              fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500,
              cursor: loadingInvestors ? "not-allowed" : "pointer",
              boxShadow: "0 0 16px rgba(26,69,255,0.3)",
              transition: "all 0.15s",
              alignSelf: "flex-end",
            }}
          >
            {loadingInvestors ? (
              <>
                <span style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                Loading…
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1 6a5 5 0 1 0 10 0A5 5 0 0 0 1 6z" stroke="currentColor" strokeWidth="1.3" />
                  <path d="M6 3v3l2 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                Load investors
              </>
            )}
          </button>
        </div>

        {/* Investors table */}
        {investorsLoaded && (
          <>
            {/* Summary counts */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { label: "Ready", count: readyCnt, color: "#10B981" },
                { label: "Missing email", count: noEmailCnt, color: "#F59E0B" },
                { label: "Already sent", count: alreadySentCnt, color: "#60A5FA" },
              ].map(({ label, count, color }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "5px 10px", borderRadius: "8px",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  fontSize: "11px", color: "#94A3B8",
                }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color, fontSize: "12px" }}>{count}</span>
                  {label}
                </div>
              ))}
            </div>

            {/* Bulk action row */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "8px",
              flexWrap: "wrap", gap: "8px",
            }}>
              <span style={{ fontSize: "12px", color: "#94A3B8" }}>
                <strong style={{ color: "#FFFFFF" }}>{selected.size}</strong> of {investors.length} selected
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { label: "Select all", fn: selectAll },
                  { label: "Deselect all", fn: deselectAll },
                  { label: "Only ready", fn: selectOnlyReady },
                ].map(({ label, fn }) => (
                  <button
                    key={label}
                    onClick={fn}
                    style={{
                      padding: "5px 10px", borderRadius: "6px",
                      background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                      color: "#94A3B8", fontFamily: "var(--font-sans)", fontSize: "11px",
                      fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {investors.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px", fontSize: "13px", color: "#475569" }}>
                No investors found for this period / filter combination.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{
                  width: "100%", borderCollapse: "collapse", fontSize: "12px",
                  background: "rgba(0,0,0,0.15)", borderRadius: "8px", overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <thead style={{ background: "rgba(255,255,255,0.03)" }}>
                    <tr>
                      {/* Checkbox col */}
                      <th style={{ width: "36px", padding: "9px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                        <input
                          type="checkbox"
                          checked={selected.size === investors.length && investors.length > 0}
                          onChange={e => e.target.checked ? selectAll() : deselectAll()}
                          style={{ cursor: "pointer", accentColor: "#3B82F6" }}
                        />
                      </th>
                      {["Investor", "Client Code", "Fund / Class", "Currency", "Last Statement", "Email", "Status"].map((h, i) => (
                        <th key={h} style={{
                          textAlign: i >= 3 ? "right" : "left",
                          padding: "9px 12px",
                          fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                          color: "#475569", borderBottom: "1px solid rgba(255,255,255,0.07)", whiteSpace: "nowrap",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {investors.map(inv => {
                      const isSelected = selected.has(inv.id);
                      return (
                        <tr
                          key={inv.id}
                          onClick={() => toggleOne(inv.id)}
                          style={{
                            borderBottom: "1px solid rgba(255,255,255,0.03)",
                            cursor: "pointer",
                            background: isSelected ? "rgba(59,130,246,0.06)" : "transparent",
                            transition: "background 0.12s",
                          }}
                          onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                          onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                        >
                          <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleOne(inv.id)}
                              onClick={e => e.stopPropagation()}
                              style={{ cursor: "pointer", accentColor: "#3B82F6" }}
                            />
                          </td>
                          {/* Avatar + Name */}
                          <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                              <div style={{
                                width: "28px", height: "28px", borderRadius: "50%",
                                background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.3)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "9px", fontWeight: 700, color: "#60A5FA", flexShrink: 0,
                                fontFamily: "var(--font-mono)",
                              }}>
                                {initials(inv.investor_name)}
                              </div>
                              <span style={{ fontWeight: 500, color: "#FFFFFF", fontSize: "12px" }}>{inv.investor_name}</span>
                            </div>
                          </td>
                          {/* Code */}
                          <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3B82F6", letterSpacing: "0.03em" }}>
                              {inv.internal_client_code}
                            </span>
                          </td>
                          {/* Fund/Class */}
                          <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                            <span style={{ fontSize: "11px", color: "#94A3B8" }}>{inv.fund_name}</span>
                            <span style={{ margin: "0 4px", color: "#475569" }}>/</span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#FFFFFF" }}>{inv.class_code}</span>
                          </td>
                          {/* Currency */}
                          <td style={{ padding: "10px 12px", verticalAlign: "middle", textAlign: "right" }}>
                            <CurrBadge currency={inv.currency} />
                          </td>
                          {/* Last statement */}
                          <td style={{ padding: "10px 12px", verticalAlign: "middle", textAlign: "right" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: inv.last_statement_date ? "#94A3B8" : "#475569" }}>
                              {inv.last_statement_date
                                ? new Date(inv.last_statement_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()
                                : "Never"}
                            </span>
                          </td>
                          {/* Email */}
                          <td style={{ padding: "10px 12px", verticalAlign: "middle", textAlign: "right" }}>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: inv.investor_email ? "#94A3B8" : "#475569", fontStyle: inv.investor_email ? "normal" : "italic" }}>
                              {inv.investor_email ?? "—"}
                            </span>
                          </td>
                          {/* Status */}
                          <td style={{ padding: "10px 12px", verticalAlign: "middle", textAlign: "right" }}>
                            <EmailStatusBadge status={inv.email_status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer actions */}
            <div style={{
              display: "flex", gap: "10px", justifyContent: "flex-end",
              paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.05)",
            }}>
              <button
                style={{
                  padding: "9px 16px", borderRadius: "8px",
                  background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94A3B8", fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
              >
                Download all as ZIP
              </button>
              <button
                onClick={handleSend}
                disabled={sending || selected.size === 0}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "7px",
                  padding: "9px 18px", borderRadius: "8px",
                  background: sending || selected.size === 0 ? "rgba(26,69,255,0.45)" : "#1A45FF",
                  color: "#fff", border: "none",
                  fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 500,
                  cursor: sending || selected.size === 0 ? "not-allowed" : "pointer",
                  boxShadow: "0 0 16px rgba(26,69,255,0.3)", transition: "all 0.15s",
                }}
              >
                {sending ? (
                  <>
                    <span style={{ width: "12px", height: "12px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Sending…
                  </>
                ) : `Send to ${selected.size} selected`}
              </button>
            </div>
          </>
        )}

        {/* Prompt to load */}
        {!investorsLoaded && !loadingInvestors && (
          <div style={{
            textAlign: "center", padding: "28px 0",
            fontSize: "12px", color: "#475569",
          }}>
            Select a period and click <strong style={{ color: "#94A3B8" }}>Load investors</strong> to see eligible recipients for {fmtPeriod(period)}.
          </div>
        )}
      </div>

      {/* ── Section 2: Recent Report Runs ── */}
      <div style={{ ...glass, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
          Recent Report Runs
        </div>

        {loadingRuns ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "28px" }}>
            <div style={{ width: "20px", height: "20px", border: "2px solid rgba(255,255,255,0.07)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : runs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px", fontSize: "13px", color: "#475569" }}>
            No report runs yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%", borderCollapse: "collapse", fontSize: "12px",
              background: "rgba(0,0,0,0.15)", borderRadius: "8px", overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              <thead style={{ background: "rgba(255,255,255,0.03)" }}>
                <tr>
                  {["Date Sent", "Period", "Fund / Class", "Recipients", "Sent By", "Status", ""].map((h, i) => (
                    <th key={i} style={{
                      textAlign: i >= 3 && i <= 4 ? "right" : "left",
                      padding: "9px 12px",
                      fontSize: "9px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em",
                      color: "#475569", borderBottom: "1px solid rgba(255,255,255,0.07)", whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map(run => (
                  <tr
                    key={run.id}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#94A3B8" }}>
                        {fmtDateTime(run.sent_at)}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#FFFFFF", fontWeight: 500 }}>
                        {fmtPeriod(run.period)}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                      <span style={{ color: "#94A3B8", fontSize: "11px" }}>{run.fund_name}</span>
                      <span style={{ margin: "0 4px", color: "#475569" }}>/</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#FFFFFF" }}>{run.class_code}</span>
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "middle", textAlign: "right" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#FFFFFF", fontWeight: 500 }}>
                        {run.recipient_count}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "middle", textAlign: "right" }}>
                      <span style={{ fontSize: "10px", color: "#475569", fontFamily: "var(--font-mono)" }}>
                        {run.sent_by}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                      <RunStatusBadge status={run.status} />
                    </td>
                    <td style={{ padding: "10px 12px", verticalAlign: "middle", textAlign: "right" }}>
                      <button
                        onClick={() => navigate(ROUTES.REPORT_DETAIL(run.id))}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "5px 10px", borderRadius: "6px",
                          background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                          color: "#94A3B8", fontFamily: "var(--font-sans)", fontSize: "11px",
                          fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.4)"; (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
                      >
                        View details
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
