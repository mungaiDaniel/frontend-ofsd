import { useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { FundSummaryClass, NavHistoryPoint } from "@/lib/types";

// ── Types ──

interface ChartClass {
  id: number;
  class_code: string;
  currency: "KES" | "USD";
  nav_history: NavHistoryPoint[];
  color: string;
}

interface Props {
  classes: FundSummaryClass[];
  currency: "KES" | "USD";
  title?: string;
  asOfDate?: string | null;
}

// ── Color palette per currency ──

const KES_COLORS = ["#F59E0B", "#FCD34D", "#D97706", "#B45309"];
const USD_COLORS = ["#3B82F6", "#60A5FA", "#2563EB", "#1D4ED8"];

// ── Format helpers ──

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

// ── Custom glass tooltip ──

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(16,24,45,0.95)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "10px",
      padding: "10px 14px",
      minWidth: "160px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }}>
      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--color-text-tertiary)", marginBottom: "8px", letterSpacing: "0.04em" }}>
        {label ? fmtDate(label) : ""}
      </div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span style={{ width: "8px", height: "2px", background: p.color, display: "inline-block", borderRadius: "1px" }} />
            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{p.name}</span>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: p.color }}>
            {Number(p.value).toFixed(4)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ──

export function NAVLineChart({ classes, currency, title, asOfDate }: Props) {
  const isKes = currency === "KES";
  const palette = isKes ? KES_COLORS : USD_COLORS;

  // Build chart classes with colors and validate history
  const chartClasses: ChartClass[] = classes
    .filter((c) => c.nav_history && c.nav_history.length >= 2)
    .map((c, i) => ({
      id: c.id,
      class_code: c.class_code,
      currency: c.currency,
      nav_history: c.nav_history!,
      color: (palette[i % palette.length] ?? palette[0]) as string,
    }));

  // Toggle state — key: class id, value: visible
  const [visible, setVisible] = useState<Record<number, boolean>>(
    () => Object.fromEntries(chartClasses.map((c) => [c.id, true]))
  );

  const toggleClass = useCallback((id: number) => {
    setVisible((prev) => {
      const currentlyVisible = Object.values(prev).filter(Boolean).length;
      if (prev[id] && currentlyVisible <= 1) {
        // Flash — don't allow hiding last visible line
        return prev;
      }
      return { ...prev, [id]: !prev[id] };
    });
  }, []);

  // Merge all history dates into unified x-axis
  const dateSet = new Set<string>();
  chartClasses.forEach((c) => c.nav_history.forEach((p) => dateSet.add(p.date)));
  const dates = [...dateSet].sort();

  // Build unified data array
  const data = dates.map((date) => {
    const row: Record<string, any> = { date };
    chartClasses.forEach((c) => {
      const point = c.nav_history.find((p) => p.date === date);
      row[c.class_code] = point?.nav ?? null;
    });
    return row;
  });

  const accentColor = isKes ? "var(--color-kes)" : "var(--color-usd)";

  if (chartClasses.length === 0) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" }}>
        No {currency} valuation history yet
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      {(title || asOfDate) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            {title && (
              <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>
                {title}
              </div>
            )}
            {asOfDate && (
              <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>
                as of {fmtDate(asOfDate)}
              </div>
            )}
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "2px 7px", borderRadius: "5px",
            fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em",
            fontFamily: "var(--font-mono)",
            background: isKes ? "var(--color-kes-bg)" : "var(--color-usd-bg)",
            color: accentColor,
            border: isKes ? "1px solid var(--color-kes-border)" : "1px solid var(--color-usd-border)",
          }}>
            {currency}
          </span>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDateShort}
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)", fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-text-tertiary)", fontFamily: "var(--font-mono)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            width={60}
          />
          <Tooltip
            content={<GlassTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.12)", strokeWidth: 1, strokeDasharray: "4 2" }}
          />
          {chartClasses.map((c) => (
            <Line
              key={c.id}
              type="monotone"
              dataKey={c.class_code}
              name={c.class_code}
              stroke={c.color}
              strokeWidth={visible[c.id] ? 2 : 0}
              dot={{ r: 3, fill: c.color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: c.color, strokeWidth: 0 }}
              opacity={visible[c.id] ? 1 : 0}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Interactive legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "12px" }}>
        {chartClasses.map((c) => {
          const cls = classes.find((cl) => cl.id === c.id);
          const isVisible = visible[c.id];
          const visibleCount = Object.values(visible).filter(Boolean).length;
          const isLast = isVisible && visibleCount <= 1;
          return (
            <button
              key={c.id}
              onClick={() => toggleClass(c.id)}
              title={isLast ? "At least one class must remain visible" : ""}
              style={{
                display: "flex", alignItems: "center", gap: "7px",
                padding: "4px 10px", borderRadius: "6px",
                background: isVisible ? "rgba(255,255,255,0.05)" : "transparent",
                border: `1px solid ${isVisible ? c.color + "44" : "rgba(255,255,255,0.06)"}`,
                cursor: isLast ? "not-allowed" : "pointer",
                opacity: isVisible ? 1 : 0.4,
                transition: "all 0.15s",
              }}
            >
              <span style={{
                width: "20px", height: "2px", borderRadius: "1px",
                background: c.color,
                textDecoration: isVisible ? "none" : "line-through",
              }} />
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700,
                color: isVisible ? c.color : "var(--color-text-tertiary)",
                textDecoration: isVisible ? "none" : "line-through",
              }}>
                {c.class_code}
              </span>
              {cls?.current_nav != null && (
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-text-tertiary)" }}>
                  {cls.current_nav.toFixed(4)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
