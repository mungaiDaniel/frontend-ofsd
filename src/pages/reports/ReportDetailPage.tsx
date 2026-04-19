import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { reportService } from "@/services/reportService";
import { ROUTES } from "@/lib/constants";
import type { ReportRunDetail, RecipientDelivery } from "@/lib/types";

// ── Shared styles ──

const glass: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "12px",
};

// ── Helpers ──

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

function RunStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    sent:    { label: "Sent",    bg: "rgba(16,185,129,0.12)",  color: "#10B981" },
    partial: { label: "Partial", bg: "rgba(245,158,11,0.12)",  color: "#F59E0B" },
    failed:  { label: "Failed",  bg: "rgba(239,68,68,0.12)",   color: "#EF4444" },
  };
  const s = map[status] ?? { label: status, bg: "rgba(255,255,255,0.06)", color: "#94A3B8" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 9px", borderRadius: "100px", fontSize: "10px", fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: s.color }} />
      {s.label}
    </span>
  );
}

function DeliveryBadge({ delivery }: { delivery: RecipientDelivery }) {
  const map: Record<RecipientDelivery, { label: string; bg: string; color: string }> = {
    delivered: { label: "Delivered", bg: "rgba(16,185,129,0.12)", color: "#10B981" },
    failed:    { label: "Failed",    bg: "rgba(239,68,68,0.12)",  color: "#EF4444" },
    pending:   { label: "Pending",   bg: "rgba(245,158,11,0.12)", color: "#F59E0B" },
  };
  const s = map[delivery];
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

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [run, setRun] = useState<ReportRunDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    reportService.getReportRunById(Number(id))
      .then(setRun)
      .catch(() => {
        toast.error("Report run not found");
        navigate(ROUTES.REPORTS);
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "260px" }}>
        <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.07)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!run) return null;

  const deliveredCount = run.recipients.filter(r => r.delivery === "delivered").length;
  const failedCount = run.recipients.filter(r => r.delivery === "failed").length;
  const openedCount = run.recipients.filter(r => r.opened).length;

  return (
    <div style={{
      position: "relative", zIndex: 1,
      padding: "24px 32px 48px",
      maxWidth: "1100px", margin: "0 auto",
      fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
      color: "#FFFFFF",
      display: "flex", flexDirection: "column", gap: "20px",
    }}>
      {/* Back */}
      <button
        onClick={() => navigate(ROUTES.REPORTS)}
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
        Back to Reports
      </button>

      {/* Header card */}
      <div style={{ ...glass, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "4px" }}>
              {fmtPeriod(run.period)} — {run.fund_name} / {run.class_code}
            </div>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>
              Generated {fmtDateTime(run.generated_at)} · Sent by{" "}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#FFFFFF" }}>{run.sent_by}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <CurrBadge currency={run.currency} />
            <RunStatusBadge status={run.status} />
          </div>
        </div>

        {/* KPI strip */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "12px", marginTop: "20px",
        }}>
          {[
            { label: "Total recipients", value: run.recipient_count, color: "#FFFFFF" },
            { label: "Delivered",        value: deliveredCount,      color: "#10B981" },
            { label: "Failed",           value: failedCount,         color: failedCount > 0 ? "#EF4444" : "#475569" },
            { label: "Opened",           value: openedCount,         color: "#60A5FA" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              padding: "12px 14px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "8px",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "20px", fontWeight: 700, color, letterSpacing: "-0.02em", marginBottom: "3px" }}>
                {value}
              </div>
              <div style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recipients table */}
      <div style={{ ...glass, padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>Recipients</div>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%", borderCollapse: "collapse", fontSize: "12px",
            background: "rgba(0,0,0,0.15)", borderRadius: "8px", overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            <thead style={{ background: "rgba(255,255,255,0.03)" }}>
              <tr>
                {["Investor", "Client Code", "Email", "Delivery", "Opened?", ""].map((h, i) => (
                  <th key={i} style={{
                    textAlign: "left",
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
              {run.recipients.map(r => (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  {/* Name + avatar */}
                  <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "9px", fontWeight: 700, color: "#60A5FA", flexShrink: 0,
                        fontFamily: "var(--font-mono)",
                      }}>
                        {initials(r.investor_name)}
                      </div>
                      <span style={{ fontWeight: 500, color: "#FFFFFF" }}>{r.investor_name}</span>
                    </div>
                  </td>
                  {/* Code */}
                  <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3B82F6" }}>
                      {r.internal_client_code}
                    </span>
                  </td>
                  {/* Email */}
                  <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#94A3B8" }}>
                      {r.investor_email}
                    </span>
                  </td>
                  {/* Delivery */}
                  <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                    <DeliveryBadge delivery={r.delivery} />
                  </td>
                  {/* Opened */}
                  <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                    <span style={{ fontSize: "11px", color: r.opened ? "#10B981" : "#475569", fontWeight: r.opened ? 500 : 400 }}>
                      {r.opened ? "Yes" : "No"}
                    </span>
                  </td>
                  {/* Resend */}
                  <td style={{ padding: "10px 12px", verticalAlign: "middle", textAlign: "right" }}>
                    {r.delivery === "failed" && (
                      <button
                        onClick={() => toast.info(`Resend to ${r.investor_email} — not implemented yet`)}
                        style={{
                          padding: "5px 10px", borderRadius: "6px",
                          background: "transparent", border: "1px solid rgba(239,68,68,0.3)",
                          color: "#EF4444", fontFamily: "var(--font-sans)", fontSize: "11px",
                          fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#EF4444"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.08)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                      >
                        Resend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
