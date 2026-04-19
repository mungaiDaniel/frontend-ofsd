import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { fundSummaryService } from "@/services/fundSummaryService";
import { fundService } from "@/services/fundService";
import { formatNav, formatPercentSigned } from "@/lib/utils";
import type { FundSummaryFund, FundSummaryClass, FundSummaryResponse, ShareClass } from "@/lib/types";
import { NAVLineChart } from "@/components/data/NAVLineChart";

// ── Shared style constants ──

const GRID_COLS = "44px minmax(180px,1.5fr) 1.1fr 1.1fr 1.1fr 100px 20px";

const CARD_BASE: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  backdropFilter: "blur(20px) saturate(150%)",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  transition: "background 0.2s",
};

const MODAL_FIELD_INPUT: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#FFFFFF",
  fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
  fontSize: "13px",
  outline: "none",
  transition: "all 0.15s",
};

// ── Helpers ──

function navDisplay(classes: FundSummaryClass[], currency: "KES" | "USD"): string {
  const vals = classes
    .filter((c) => c.currency === currency && c.current_nav != null)
    .map((c) => formatNav(c.current_nav));
  return vals.join(" / ") || "—";
}

function hasValuation(fund: FundSummaryFund): boolean {
  return fund.classes.some((c) => c.current_nav != null);
}

function totalClassCount(funds: FundSummaryFund[]): number {
  return funds.reduce((acc, f) => acc + f.classes.length, 0);
}

function fundStatusLabel(fund: FundSummaryFund): string {
  if (fund.classes.length === 0) return "Pending setup";
  return fund.is_active ? "Active" : "Inactive";
}

function fundStatusStyle(fund: FundSummaryFund): React.CSSProperties {
  if (fund.classes.length === 0 || !fund.is_active) {
    return {
      background: "rgba(255,255,255,0.06)",
      color: "#475569",
    };
  }
  return {
    background: "rgba(16,185,129,0.12)",
    color: "#10B981",
  };
}

function fundStatusDotColor(fund: FundSummaryFund): string {
  if (fund.classes.length === 0 || !fund.is_active) return "#475569";
  return "#10B981";
}

// ── CurrencyBadge ──

function CurrencyBadge({ currency }: { currency: "KES" | "USD" }) {
  const isKes = currency === "KES";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "2px 8px",
        borderRadius: "6px",
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.04em",
        background: isKes ? "var(--color-kes-bg)" : "var(--color-usd-bg)",
        color: isKes ? "var(--color-kes)" : "var(--color-usd)",
        border: isKes ? "1px solid var(--color-kes-border)" : "1px solid var(--color-usd-border)",
      }}
    >
      {currency}
    </span>
  );
}

// ── StatusPill ──

function StatusPill({ label, dotColor, bg, color }: { label: string; dotColor: string; bg: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 9px",
        borderRadius: "100px",
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        background: bg,
        color,
        width: "fit-content",
        justifySelf: "end",
      }}
    >
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: dotColor }} />
      {label}
    </span>
  );
}

// ── Classes table inside expanded fund ──

function ClassesTable({
  fund,
  onAddClass,
}: {
  fund: FundSummaryFund;
  onAddClass: (fund: FundSummaryFund) => void;
}) {
  const hasClasses = fund.classes.length > 0;

  return (
    <div
      style={{
        padding: "4px 18px 18px 76px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        paddingTop: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "#475569",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 500,
          }}
        >
          Share Classes
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddClass(fund);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "6px 12px",
            borderRadius: "8px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#94A3B8",
            fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
            fontSize: "11px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.45)";
            (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8";
          }}
        >
          <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Add class
        </button>
      </div>

      {!hasClasses ? (
        <div
          style={{
            padding: "18px",
            textAlign: "center",
            fontSize: "11px",
            color: "#475569",
            background: "rgba(0,0,0,0.1)",
            borderRadius: "8px",
            border: "1px dashed rgba(255,255,255,0.07)",
          }}
        >
          No share classes yet. Add at least one class before investors can be assigned to this fund.
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            background: "rgba(0,0,0,0.15)",
            borderRadius: "8px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <thead style={{ background: "rgba(255,255,255,0.02)" }}>
            <tr>
              {["Class Name", "Code", "Currency", "NAV / Share", "Total NAV", "Performance", "Status"].map(
                (h, i) => (
                  <th
                    key={h}
                    style={{
                      textAlign: i >= 3 && i <= 5 ? "right" : "left",
                      padding: "9px 12px",
                      fontSize: "9px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      color: "#475569",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {fund.classes.map((cls) => {
              const hasNav = cls.current_nav != null;
              const gain = (cls.performance_pct ?? 0) > 0;
              const perfColor = !hasNav
                ? "#475569"
                : gain
                  ? "#10B981"
                  : "#EF4444";
              return (
                <tr
                  key={cls.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background = "transparent")
                  }
                >
                  {/* Class Name */}
                  <td
                    style={{
                      padding: "10px 12px",
                      color: "#FFFFFF",
                      fontWeight: 500,
                      verticalAlign: "middle",
                    }}
                  >
                    {cls.class_name}
                  </td>
                  {/* Code */}
                  <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontSize: "11px",
                        color: "#3B82F6",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {cls.class_code}
                    </span>
                  </td>
                  {/* Currency */}
                  <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                    <CurrencyBadge currency={cls.currency} />
                  </td>
                  {/* NAV / Share */}
                  <td
                    style={{
                      padding: "10px 12px",
                      textAlign: "right",
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: "11px",
                      color: "#FFFFFF",
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                      verticalAlign: "middle",
                    }}
                  >
                    {hasNav ? (
                      <>
                        {formatNav(cls.current_nav)}
                        {cls.prev_nav != null && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "9px",
                              color: "#475569",
                              fontWeight: 400,
                              marginTop: "1px",
                              letterSpacing: "0.04em",
                            }}
                          >
                            prev {formatNav(cls.prev_nav)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                          fontSize: "10px",
                          color: "#475569",
                          fontStyle: "italic",
                        }}
                      >
                        Not yet valued
                      </span>
                    )}
                  </td>
                  {/* Total NAV */}
                  <td
                    style={{
                      padding: "10px 12px",
                      textAlign: "right",
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: "11px",
                      color: "#FFFFFF",
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                      verticalAlign: "middle",
                    }}
                  >
                    {cls.total_nav != null ? (
                      <>
                        {new Intl.NumberFormat("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(cls.total_nav)}
                        {cls.total_shares != null && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "9px",
                              color: "#475569",
                              fontWeight: 400,
                              marginTop: "1px",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {cls.total_shares.toFixed(2)} shares
                          </span>
                        )}
                      </>
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                          fontSize: "10px",
                          color: "#475569",
                          fontStyle: "italic",
                        }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  {/* Performance */}
                  <td
                    style={{
                      padding: "10px 12px",
                      textAlign: "right",
                      verticalAlign: "middle",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontWeight: hasNav ? 600 : 400,
                        color: perfColor,
                        fontSize: "11px",
                      }}
                    >
                      {cls.performance_pct != null ? formatPercentSigned(cls.performance_pct) : "—"}
                    </span>
                  </td>
                  {/* Status */}
                  <td style={{ padding: "10px 12px", verticalAlign: "middle" }}>
                    <StatusPill
                      label={cls.is_active ? "Active" : "Inactive"}
                      dotColor={cls.is_active ? "#10B981" : "#475569"}
                      bg={cls.is_active ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.06)"}
                      color={cls.is_active ? "#10B981" : "#475569"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ── Fund card row ──

function FundCard({
  fund,
  isExpanded,
  onToggle,
  onAddClass,
}: {
  fund: FundSummaryFund;
  isExpanded: boolean;
  onToggle: () => void;
  onAddClass: (fund: FundSummaryFund) => void;
}) {
  const valuation = hasValuation(fund);
  const kesCurrent = navDisplay(fund.classes, "KES");
  const usdCurrent = navDisplay(fund.classes, "USD");
  const hasKes = fund.classes.some((c) => c.currency === "KES" && c.current_nav != null);
  const hasUsd = fund.classes.some((c) => c.currency === "USD" && c.current_nav != null);
  const kesTotal = fund.totals_by_currency?.KES;
  const usdTotal = fund.totals_by_currency?.USD;

  const perf = fund.weighted_performance_pct;
  const perfGain = (perf ?? 0) > 0;
  const perfColor = perf == null ? "#475569" : perfGain ? "#10B981" : "#EF4444";

  return (
    <div
      style={{
        ...CARD_BASE,
        ...(isExpanded ? { background: "rgba(16,24,45,0.85)" } : {}),
      }}
      onMouseEnter={(e) => {
        if (!isExpanded)
          (e.currentTarget as HTMLElement).style.background = "rgba(20,30,55,0.8)";
      }}
      onMouseLeave={(e) => {
        if (!isExpanded)
          (e.currentTarget as HTMLElement).style.background = "rgba(16,24,45,0.72)";
      }}
    >
      {/* Fund row */}
      <div
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: GRID_COLS,
          alignItems: "center",
          padding: "16px 18px",
          gap: "14px",
          cursor: "pointer",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "9px",
            background: "rgba(26,69,255,0.12)",
            border: "1px solid rgba(59,130,246,0.22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L1 5v2l8-4 8 4V5L9 1z" stroke="#60A5FA" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M3 8v7M6 8v7M12 8v7M15 8v7" stroke="#60A5FA" strokeWidth="1.3" />
            <path d="M1 17h16" stroke="#60A5FA" strokeWidth="1.3" />
          </svg>
        </div>

        {/* Fund name + code + class count */}
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#FFFFFF",
              marginBottom: "2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {fund.fund_name}
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: "10px",
                color: "#475569",
                letterSpacing: "0.04em",
              }}
            >
              {fund.fund_code}
            </span>
            <span
              style={{ width: "2px", height: "2px", background: "#475569", borderRadius: "50%" }}
            />
            <span style={{ fontSize: "11px", color: "#94A3B8" }}>
              {fund.classes.length === 0
                ? "No classes yet"
                : `${fund.classes.length} share class${fund.classes.length !== 1 ? "es" : ""}`}
            </span>
          </div>
        </div>

        {/* Total NAV */}
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
          {valuation && (kesTotal != null || usdTotal != null) ? (
            <>
              <div
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px",
                  alignItems: "flex-end",
                }}
              >
                {kesTotal != null && (
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-kes)" }}>
                    KES{" "}
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(kesTotal)}
                  </span>
                )}
                {usdTotal != null && (
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#60A5FA" }}>
                    USD{" "}
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(usdTotal)}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: "9px",
                  color: "#475569",
                  letterSpacing: "0.04em",
                }}
              >
                Aggregate
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: "12px",
                  color: "#475569",
                  fontWeight: 400,
                }}
              >
                {fund.classes.length > 0 ? "Awaiting first valuation" : "—"}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: "9px",
                  color: "#475569",
                  letterSpacing: "0.04em",
                }}
              >
                &nbsp;
              </div>
            </>
          )}
        </div>

        {/* Weighted NAV / share */}
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
          {valuation ? (
            <>
              <div
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px",
                  alignItems: "flex-end",
                }}
              >
                {hasKes && (
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-kes)" }}>
                    {kesCurrent}
                  </span>
                )}
                {hasUsd && (
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "#60A5FA" }}>
                    {usdCurrent}
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: "9px",
                  color: "#475569",
                  letterSpacing: "0.04em",
                }}
              >
                Per share
              </div>
            </>
          ) : (
            <div
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: "12px",
                color: "#475569",
                fontWeight: 400,
              }}
            >
              —
            </div>
          )}
        </div>

        {/* Performance */}
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "2px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: "13px",
              fontWeight: perf != null ? 600 : 400,
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              gap: "3px",
              justifyContent: "flex-end",
              color: perfColor,
            }}
          >
            {perf != null && perfGain && (
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M1 7l3.5-5L8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {perf != null && !perfGain && (
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M1 2l3.5 5L8 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {perf != null ? formatPercentSigned(perf) : "—"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: "9px",
              color: "#475569",
              letterSpacing: "0.04em",
            }}
          >
            {perf != null ? "Weighted avg" : "—"}
          </div>
        </div>

        {/* Status pill */}
        <StatusPill
          label={fundStatusLabel(fund)}
          dotColor={fundStatusDotColor(fund)}
          bg={fundStatusStyle(fund).background as string}
          color={fundStatusStyle(fund).color as string}
        />

        {/* Chevron */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          style={{
            color: isExpanded ? "#3B82F6" : "#475569",
            transition: "transform 0.25s",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
            justifySelf: "end",
          }}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Expandable classes section */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="expand"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <ClassesTable fund={fund} onAddClass={onAddClass} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Add Fund Modal ──

function AddFundModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fundName, setFundName] = useState("");
  const [fundCode, setFundCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onSubmit = async () => {
    if (!fundName.trim() || !fundCode.trim()) return;
    setSubmitting(true);
    try {
      await fundService.createFund(fundName.trim(), fundCode.trim());
      toast.success(`Fund "${fundName}" created`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to create fund");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        WebkitBackdropFilter: "blur(6px)",
        backdropFilter: "blur(6px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(16,24,45,0.95)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          backdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(59,130,246,0.25)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "440px",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(26,69,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 22px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#FFFFFF", marginBottom: "3px" }}>
              Add Fund
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8" }}>
              Create a new fund. Classes are added separately.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#475569",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#475569";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div
          style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: 500, color: "#94A3B8" }}>Fund Name</label>
            <input
              ref={nameRef}
              value={fundName}
              onChange={(e) => setFundName(e.target.value)}
              placeholder="e.g. Axiom"
              autoComplete="off"
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "#3B82F6";
                (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.target as HTMLInputElement).style.boxShadow = "none";
              }}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              style={MODAL_FIELD_INPUT}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "#94A3B8",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              Fund Code{" "}
              <span style={{ fontSize: "10px", color: "#475569", fontWeight: 400 }}>
                Short identifier, uppercase
              </span>
            </label>
            <input
              value={fundCode}
              onChange={(e) => setFundCode(e.target.value.toUpperCase())}
              placeholder="e.g. AXM"
              autoComplete="off"
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "#3B82F6";
                (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.target as HTMLInputElement).style.boxShadow = "none";
              }}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              style={{
                ...MODAL_FIELD_INPUT,
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px 18px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              padding: "9px 16px",
              borderRadius: "8px",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#94A3B8")
            }
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !fundName.trim() || !fundCode.trim()}
            style={{
              background: submitting || !fundName.trim() || !fundCode.trim() ? "rgba(26,69,255,0.5)" : "#1A45FF",
              color: "#fff",
              border: "none",
              fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: submitting || !fundName.trim() || !fundCode.trim() ? "not-allowed" : "pointer",
              padding: "9px 16px",
              borderRadius: "8px",
              boxShadow: "0 0 16px rgba(26,69,255,0.3)",
              transition: "all 0.15s",
            }}
          >
            {submitting ? "Creating…" : "Create fund"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Add Class Modal ──

function AddClassModal({
  fund,
  onClose,
  onSuccess,
}: {
  fund: FundSummaryFund;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [className, setClassName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [currency, setCurrency] = useState<"KES" | "USD" | "">("");
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canSubmit = className.trim() && classCode.trim() && currency !== "";

  const onSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await fundService.createClass(fund.id, {
        class_name: className.trim(),
        class_code: classCode.trim(),
        currency: currency as "KES" | "USD",
      });
      toast.success(`Class "${classCode.toUpperCase()}" added to ${fund.fund_name}`);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to create class");
    } finally {
      setSubmitting(false);
    }
  };

  const selectBg =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") no-repeat right 12px center";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        WebkitBackdropFilter: "blur(6px)",
        backdropFilter: "blur(6px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(16,24,45,0.95)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          backdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(59,130,246,0.25)",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "440px",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(26,69,255,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 22px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "14px",
          }}
        >
          <div>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#FFFFFF", marginBottom: "3px" }}>
              Add Share Class
            </div>
            <div style={{ fontSize: "11px", color: "#94A3B8" }}>
              Adding to{" "}
              <strong style={{ color: "#FFFFFF" }}>{fund.fund_name}</strong>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#475569",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#475569";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div
          style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: "14px" }}
        >
          {/* Class Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: 500, color: "#94A3B8" }}>Class Name</label>
            <input
              ref={nameRef}
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. Class I Participating Shares"
              autoComplete="off"
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "#3B82F6";
                (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.target as HTMLInputElement).style.boxShadow = "none";
              }}
              style={MODAL_FIELD_INPUT}
            />
          </div>

          {/* Class Code */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "#94A3B8",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              Class Code{" "}
              <span style={{ fontSize: "10px", color: "#475569", fontWeight: 400 }}>
                Must be unique
              </span>
            </label>
            <input
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              placeholder="e.g. KES_I"
              autoComplete="off"
              onFocus={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "#3B82F6";
                (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)";
              }}
              onBlur={(e) => {
                (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.target as HTMLInputElement).style.boxShadow = "none";
              }}
              style={{
                ...MODAL_FIELD_INPUT,
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            />
          </div>

          {/* Currency */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "11px", fontWeight: 500, color: "#94A3B8" }}>Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "KES" | "USD" | "")}
              onFocus={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = "#3B82F6";
                (e.target as HTMLSelectElement).style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)";
              }}
              onBlur={(e) => {
                (e.target as HTMLSelectElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.target as HTMLSelectElement).style.boxShadow = "none";
              }}
              style={{
                ...MODAL_FIELD_INPUT,
                cursor: "pointer",
                appearance: "none",
                paddingRight: "32px",
                background: `rgba(0,0,0,0.25) ${selectBg}`,
              }}
            >
              <option value="">Select currency…</option>
              <option value="KES">KES — Kenyan Shilling</option>
              <option value="USD">USD — US Dollar</option>
            </select>
          </div>

          {/* Amber callout */}
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.18)",
              borderRadius: "8px",
              fontSize: "11px",
              color: "rgba(251,191,36,0.9)",
              lineHeight: 1.5,
              display: "flex",
              gap: "8px",
              alignItems: "flex-start",
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 14 14"
              fill="none"
              style={{ flexShrink: 0, color: "#F59E0B", marginTop: "1px" }}
            >
              <path
                d="M7 1L1 12h12L7 1z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
              <line x1="7" y1="5.5" x2="7" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="7" cy="10" r="0.6" fill="currentColor" />
            </svg>
            <span>
              Currency cannot be changed after the class is created. Each class holds one currency
              only, never mixed.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px 18px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94A3B8",
              fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              padding: "9px 16px",
              borderRadius: "8px",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLButtonElement).style.color = "#94A3B8")
            }
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !canSubmit}
            style={{
              background: submitting || !canSubmit ? "rgba(26,69,255,0.5)" : "#1A45FF",
              color: "#fff",
              border: "none",
              fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: submitting || !canSubmit ? "not-allowed" : "pointer",
              padding: "9px 16px",
              borderRadius: "8px",
              boxShadow: "0 0 16px rgba(26,69,255,0.3)",
              transition: "all 0.15s",
            }}
          >
            {submitting ? "Creating…" : "Create class"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main page ──

export default function FundManagementPage() {
  const [data, setData] = useState<FundSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedFunds, setExpandedFunds] = useState<Set<number>>(new Set());
  const [showAddFund, setShowAddFund] = useState(false);
  const [addClassFund, setAddClassFund] = useState<FundSummaryFund | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Primary: summary endpoint (NAV + classes in one shot)
      const summary = await fundSummaryService.getSummary();
      if (summary) {
        setData(summary);
        setLoading(false);
        return;
      }
      // Fallback: basic fund list + per-fund classes (no NAV data)
      const basicFunds = await fundService.getAll();
      const fundsWithClasses = await Promise.all(
        basicFunds.map(async (f) => {
          let classes: ShareClass[] = [];
          try {
            classes = await fundService.getClasses(f.id);
          } catch {
            // classes stays empty
          }
          const summaryFund: FundSummaryFund = {
            id: f.id,
            fund_name: f.fund_name,
            fund_code: f.fund_code ?? "",
            is_active: f.is_active,
            classes: classes.map((cls) => ({
              id: cls.id,
              class_name: cls.class_name,
              class_code: cls.class_code,
              currency: cls.currency,
              is_active: cls.is_active,
              total_shares: null,
              prev_nav: null,
              current_nav: null,
              total_nav: null,
              performance_pct: null,
              valuation_date: null,
            })),
            totals_by_currency: {},
            weighted_performance_pct: null,
          };
          return summaryFund;
        })
      );
      setData({ as_of_date: "", funds: fundsWithClasses });
    } catch (err) {
      console.error("Failed to load funds", err);
      toast.error("Failed to load funds");
      setData({ as_of_date: "", funds: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleFund = (id: number) => {
    setExpandedFunds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const funds = data?.funds ?? [];
  const asOfDate = data?.as_of_date;
  const classCount = totalClassCount(funds);

  const kesClasses = useMemo(
    () => data?.funds.flatMap(f => f.classes.filter(c => c.currency === "KES" && c.is_active)) ?? [],
    [data]
  );
  const usdClasses = useMemo(
    () => data?.funds.flatMap(f => f.classes.filter(c => c.currency === "USD" && c.is_active)) ?? [],
    [data]
  );

  const formattedAsOf = asOfDate
    ? new Date(asOfDate)
        .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        .toUpperCase()
    : null;

  // Loading spinner
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "260px",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            border: "2px solid rgba(255,255,255,0.07)",
            borderTopColor: "#3B82F6",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isEmpty = funds.length === 0;

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        padding: "24px 32px 48px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
        color: "#FFFFFF",
      }}
    >
      {/* Page header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "22px",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              marginBottom: "4px",
              margin: 0,
            }}
          >
            Fund Management
          </h1>
          <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
            {isEmpty
              ? "Create funds and their share classes. This is one-time setup."
              : `${funds.length} fund${funds.length !== 1 ? "s" : ""} · ${classCount} share class${classCount !== 1 ? "es" : ""} configured`}
          </div>
        </div>
        {formattedAsOf && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 12px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "8px",
              fontSize: "11px",
              color: "#94A3B8",
            }}
          >
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#10B981",
                boxShadow: "0 0 6px #10B981",
                flexShrink: 0,
              }}
            />
            NAV as of{" "}
            <strong
              style={{
                color: "#FFFFFF",
                fontWeight: 500,
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: "10px",
                letterSpacing: "0.04em",
              }}
            >
              {formattedAsOf}
            </strong>
          </div>
        )}
      </div>

      {/* Empty state */}
      {isEmpty ? (
        <div style={{ textAlign: "center", padding: "64px 24px", maxWidth: "480px", margin: "40px auto" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: "rgba(26,69,255,0.08)",
              border: "1px solid rgba(59,130,246,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="5" y="11" width="22" height="15" rx="1.5" stroke="rgba(100,140,255,0.8)" strokeWidth="1.5" />
              <path d="M5 13h22" stroke="rgba(100,140,255,0.8)" strokeWidth="1.5" />
              <path d="M11 11V8l5-3 5 3v3" stroke="rgba(100,140,255,0.8)" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="10" y1="17" x2="10" y2="22" stroke="rgba(100,140,255,0.6)" strokeWidth="1.2" />
              <line x1="16" y1="17" x2="16" y2="22" stroke="rgba(100,140,255,0.6)" strokeWidth="1.2" />
              <line x1="22" y1="17" x2="22" y2="22" stroke="rgba(100,140,255,0.6)" strokeWidth="1.2" />
            </svg>
          </div>
          <div
            style={{ fontSize: "17px", fontWeight: 600, color: "#FFFFFF", marginBottom: "8px" }}
          >
            No funds created yet
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#94A3B8",
              lineHeight: 1.65,
              marginBottom: "24px",
            }}
          >
            Funds are the foundation of OFSD. Every investor, batch, and valuation flows from a fund
            and its share classes. Create your first fund to begin.
          </div>
          <button
            onClick={() => setShowAddFund(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 16px",
              borderRadius: "8px",
              background: "#1A45FF",
              color: "#fff",
              border: "none",
              fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              boxShadow: "0 0 16px rgba(26,69,255,0.3)",
              transition: "all 0.15s",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 2v9M2 6.5h9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Create first fund
          </button>

          {/* Currency rule callout */}
          <div
            style={{
              marginTop: "28px",
              padding: "14px 16px",
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.18)",
              borderRadius: "9px",
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              textAlign: "left",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              style={{ flexShrink: 0, color: "#F59E0B", marginTop: "1px" }}
            >
              <path d="M7 1L1 12h12L7 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              <line x1="7" y1="5.5" x2="7" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              <circle cx="7" cy="10" r="0.6" fill="currentColor" />
            </svg>
            <div style={{ fontSize: "11px", color: "rgba(251,191,36,0.9)", lineHeight: 1.55 }}>
              <strong style={{ color: "#FCD34D", fontWeight: 600 }}>Currency rule:</strong> each
              share class can only hold ONE currency. KES classes are KES only. USD classes are USD
              only. A fund can have classes in both currencies, but never mix within a class.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* NAV charts */}
          {(kesClasses.length > 0 || usdClasses.length > 0) && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: "14px",
              marginBottom: "20px",
            }}>
              <div style={{
                background: "rgba(16,24,45,0.72)",
                WebkitBackdropFilter: "blur(20px) saturate(150%)",
                backdropFilter: "blur(20px) saturate(150%)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "20px 24px",
              }}>
                <NAVLineChart
                  classes={kesClasses}
                  currency="KES"
                  title="KES Classes — NAV / Share"
                  asOfDate={data?.as_of_date}
                />
              </div>
              <div style={{
                background: "rgba(16,24,45,0.72)",
                WebkitBackdropFilter: "blur(20px) saturate(150%)",
                backdropFilter: "blur(20px) saturate(150%)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "20px 24px",
              }}>
                <NAVLineChart
                  classes={usdClasses}
                  currency="USD"
                  title="USD Classes — NAV / Share"
                  asOfDate={data?.as_of_date}
                />
              </div>
            </div>
          )}

          {/* List header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px 18px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "12px 12px 0 0",
              borderBottom: "none",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "11px",
                  color: "#94A3B8",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                Funds
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: "10px",
                  color: "#475569",
                  marginLeft: "8px",
                }}
              >
                {funds.length} total
              </span>
            </div>
            <button
              onClick={() => setShowAddFund(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 12px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94A3B8",
                fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
                fontSize: "11px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.45)";
                (e.currentTarget as HTMLButtonElement).style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add fund
            </button>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID_COLS,
              alignItems: "center",
              padding: "10px 18px",
              gap: "14px",
              fontSize: "9px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#475569",
              fontWeight: 600,
              background: "rgba(255,255,255,0.03)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderTop: "none",
            }}
          >
            <div />
            <div>Fund</div>
            <div style={{ textAlign: "right" }}>Total NAV</div>
            <div style={{ textAlign: "right" }}>Weighted NAV / share</div>
            <div style={{ textAlign: "right" }}>Performance</div>
            <div />
            <div />
          </div>

          {/* Fund cards */}
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.07)",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              overflow: "hidden",
            }}
          >
            {funds.map((fund) => (
              <FundCard
                key={fund.id}
                fund={fund}
                isExpanded={expandedFunds.has(fund.id)}
                onToggle={() => toggleFund(fund.id)}
                onAddClass={(f) => setAddClassFund(f)}
              />
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAddFund && (
          <AddFundModal
            key="add-fund-modal"
            onClose={() => setShowAddFund(false)}
            onSuccess={() => {
              setShowAddFund(false);
              loadData();
            }}
          />
        )}
        {addClassFund && (
          <AddClassModal
            key="add-class-modal"
            fund={addClassFund}
            onClose={() => setAddClassFund(null)}
            onSuccess={() => {
              setAddClassFund(null);
              loadData();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
