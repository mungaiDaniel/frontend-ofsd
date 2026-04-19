import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { fundSummaryService } from "@/services/fundSummaryService";
import { formatNav, formatPercentSigned } from "@/lib/utils";
import type { FundSummaryClass, FundSummaryFund } from "@/lib/types";

// ── Tips content (static) ──

const TIPS = [
  "Batches progress through four stages: Deposited → Transferred → Deployed → Active. Use the Batch detail page to advance stage and log deployment dates.",
  "Each share class carries a single currency — KES or USD are always kept separate. Never mix currencies within the same share class.",
  "Before committing a valuation, verify the NAV per share is correct. Committed valuations trigger pro-rata share allocation across all investors in the batch.",
  "Use Investor Overview to see a client's full position: share balance, KES/USD deployment history, and pending withdrawals in one view.",
  "Monthly statements are generated per investor from Reports. Ensure the valuation for the relevant period is committed before generating.",
  "The Audit Log (super admin only) records every state-changing action with timestamp, actor, and affected record.",
  "When uploading a withdrawal file, the system reconciles against existing investments automatically. Review the preview before confirming.",
];

// ── Performance slide data shape ──

interface PerfSlide {
  period: string;
  nav: string;
  ret: string;
  gain: boolean;
  currency: "KES" | "USD";
  pts: number[];
}

function buildSparklinePoints(prevNav: number | null, currentNav: number | null, gain: boolean): number[] {
  if (prevNav == null || currentNav == null) {
    return gain ? [40, 30, 18, 10, 4, 0] : [0, 8, 18, 28, 38, 48];
  }
  const lo = Math.min(prevNav, currentNav);
  const hi = Math.max(prevNav, currentNav);
  const range = hi - lo || 1;
  return [0, 1, 2, 3, 4, 5].map((i) => {
    const t = i / 5;
    const nav = prevNav + (currentNav - prevNav) * t;
    const normalized = (nav - lo) / range;
    // Invert: high NAV = low SVG y (top of chart)
    return Math.round(48 - normalized * 44);
  });
}

function classToPerfSlide(cls: FundSummaryClass, fund: FundSummaryFund): PerfSlide {
  const gain = (cls.performance_pct ?? 0) >= 0;
  const navLabel =
    cls.current_nav != null
      ? cls.currency === "KES"
        ? `KES ${formatNav(cls.current_nav)}`
        : `$${formatNav(cls.current_nav)}`
      : "—";
  return {
    period: `${fund.fund_name} / ${cls.class_code}`,
    nav: navLabel,
    ret: cls.performance_pct != null ? formatPercentSigned(cls.performance_pct) : "—",
    gain,
    currency: cls.currency,
    pts: buildSparklinePoints(cls.prev_nav, cls.current_nav, gain),
  };
}

// ── Sparkline SVG ──

function Sparkline({ pts, gain }: { pts: number[]; gain: boolean }) {
  const color = gain ? "#10B981" : "#EF4444";
  const xs = [0, 20, 40, 60, 80, 100];
  const linePath = "M" + xs.map((x, i) => `${x},${pts[i]}`).join(" L");
  const areaPath = linePath + " L100,48 L0,48 Z";
  const gradId = `spark-grad-${gain ? "gain" : "loss"}`;
  return (
    <svg
      viewBox="0 0 100 48"
      preserveAspectRatio="none"
      style={{ width: "100%", height: "48px", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Fund Performance Card ──

function FundPerformanceCard({ slides }: { slides: PerfSlide[] | null }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % slides.length);
    }, 3000);
    return () => clearInterval(id);
  }, [slides]);

  const CARD_STYLE = {
    background: "rgba(16,24,45,0.85)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "22px 24px",
    WebkitBackdropFilter: "blur(20px) saturate(150%)",
    backdropFilter: "blur(20px) saturate(150%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)",
    transition: "border-color 0.3s",
  } as const;

  const noData = !slides || slides.length === 0;
  const current = slides?.[idx] ?? null;

  return (
    <div style={CARD_STYLE}>
      {/* Card label */}
      <div
        style={{
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: "10px",
          letterSpacing: "0.12em",
          color: "rgba(100,140,255,0.75)",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "14px",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <polyline
            points="1,9 4,5 7,7 11,2"
            stroke="rgba(100,140,255,0.75)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Fund Performance
      </div>

      {/* Slide area */}
      <div style={{ position: "relative", width: "100%", minHeight: "100px", overflow: "hidden" }}>
        {noData ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              padding: "16px 0",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: "13px",
                color: "rgba(148,163,184,0.5)",
              }}
            >
              No valuation data yet
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: "10px",
                color: "rgba(148,163,184,0.35)",
                letterSpacing: "0.04em",
              }}
            >
              Awaiting first valuation
            </span>
          </div>
        ) : (
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {/* Perf header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: "10px",
                      color: "rgba(160,180,255,0.6)",
                      marginBottom: "3px",
                    }}
                  >
                    {current!.period}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "#fff",
                    }}
                  >
                    {current!.nav}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: "11px",
                    padding: "3px 10px",
                    borderRadius: "7px",
                    fontWeight: 500,
                    color: current!.gain ? "#10B981" : "#EF4444",
                    background: current!.gain
                      ? "rgba(16,185,129,0.12)"
                      : "rgba(239,68,68,0.12)",
                  }}
                >
                  {current!.ret}
                </div>
              </div>

              {/* Sparkline */}
              <div style={{ height: "48px", width: "100%" }}>
                <Sparkline pts={current!.pts} gain={current!.gain} />
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

// ── Quick Tips Card ──

function QuickTipsCard() {
  const [tipIdx, setTipIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const elapsedRef = useRef(0);
  const TIP_DUR = 5000;
  const TICK = 60;

  const goTip = (i: number) => {
    setTipIdx(i);
    elapsedRef.current = 0;
    setProgress(0);
  };

  useEffect(() => {
    const id = setInterval(() => {
      elapsedRef.current += TICK;
      setProgress(Math.min((elapsedRef.current / TIP_DUR) * 100, 100));
      if (elapsedRef.current >= TIP_DUR) {
        elapsedRef.current = 0;
        setTipIdx((i) => (i + 1) % TIPS.length);
        setProgress(0);
      }
    }, TICK);
    return () => clearInterval(id);
  }, []);

  const CARD_STYLE = {
    background: "rgba(16,24,45,0.85)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    padding: "22px 24px",
    WebkitBackdropFilter: "blur(20px) saturate(150%)",
    backdropFilter: "blur(20px) saturate(150%)",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)",
    transition: "border-color 0.3s",
  } as const;

  return (
    <div style={CARD_STYLE}>
      {/* Card label */}
      <div
        style={{
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: "10px",
          letterSpacing: "0.12em",
          color: "rgba(100,140,255,0.75)",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "14px",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke="rgba(100,140,255,0.75)" strokeWidth="1.2" />
          <line
            x1="6"
            y1="3.5"
            x2="6"
            y2="6.5"
            stroke="rgba(100,140,255,0.75)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="6" cy="8.5" r="0.6" fill="rgba(100,140,255,0.75)" />
        </svg>
        Quick Tips
      </div>

      {/* Tip text */}
      <p
        style={{
          fontSize: "12px",
          color: "var(--color-text-secondary, #94A3B8)",
          lineHeight: 1.7,
          minHeight: "52px",
          margin: 0,
        }}
      >
        {TIPS[tipIdx]}
      </p>

      {/* Progress bar */}
      <div
        style={{
          height: "2px",
          background: "rgba(255,255,255,0.07)",
          borderRadius: "2px",
          marginTop: "10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #1A45FF, #3B82F6)",
            borderRadius: "2px",
            width: `${progress}%`,
            transition: "width 0.07s linear",
          }}
        />
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: "5px", marginTop: "10px" }}>
        {TIPS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTip(i)}
            style={{
              height: "3px",
              width: i === tipIdx ? "16px" : "5px",
              borderRadius: "2px",
              background: i === tipIdx ? "#1A45FF" : "rgba(255,255,255,0.12)",
              boxShadow: i === tipIdx ? "0 0 6px rgba(1,31,252,0.5)" : "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Landing Page ──

export default function LandingPage() {
  const navigate = useNavigate();
  const [perfSlides, setPerfSlides] = useState<PerfSlide[] | null>(null);

  useEffect(() => {
    fundSummaryService.getSummary().then((data) => {
      if (!data || !data.funds || data.funds.length === 0) {
        setPerfSlides([]);
        return;
      }
      const slides: PerfSlide[] = [];
      for (const fund of data.funds) {
        for (const cls of fund.classes) {
          if (cls.is_active) {
            slides.push(classToPerfSlide(cls, fund));
          }
        }
      }
      setPerfSlides(slides);
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "radial-gradient(circle at 80% 20%, rgba(59,130,246,0.09) 0%, transparent 40%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.06) 0%, transparent 50%), #060B1A",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
        color: "#FFFFFF",
        overflowX: "hidden",
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.03,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Emblem watermark */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "-8%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        <img
          src="/emblem.webp"
          alt=""
          style={{
            width: "min(900px, 80vw)",
            height: "auto",
            opacity: 0.05,
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* Header */}
      <header
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          padding: "18px 40px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              lineHeight: 1.3,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
                fontSize: "11px",
                color: "#FFFFFF",
                fontWeight: 500,
                letterSpacing: "0.02em",
              }}
            >
              System Status
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                fontSize: "10px",
                color: "#FFFFFF",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              All Systems Operational
            </span>
          </div>
          {/* Pulsing green dot */}
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#10B981",
              boxShadow: "0 0 10px #10B981",
              flexShrink: 0,
              animation: "pulseg 2.5s ease-in-out infinite",
            }}
          />
        </div>
      </header>

      {/* Main two-column grid */}
      <main
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "40px",
          alignItems: "center",
          padding: "0 40px 32px",
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {/* ── Left: Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}
        >
          {/* Logo */}
          <img
            src="/logo.webp"
            alt="OFSD"
            style={{
              width: "min(420px, 55vw)",
              height: "auto",
              maxHeight: "90px",
              objectFit: "contain",
              objectPosition: "left",
              marginLeft: "-4px",
            }}
          />

          {/* Lock badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "5px 14px",
              borderRadius: "100px",
              background: "rgba(239,68,68,0.10)",
              border: "1px solid rgba(239,68,68,0.22)",
              fontSize: "11px",
              fontWeight: 500,
              color: "rgba(255,130,130,0.85)",
              width: "fit-content",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="8" rx="2" stroke="rgba(255,130,130,0.9)" strokeWidth="1.4" />
              <path
                d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
                stroke="rgba(255,130,130,0.9)"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            Internal — Authorised Access Only
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(40px, 6vw, 68px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            Offshore Fund
            <br />
            Management
          </h1>

          {/* Tagline */}
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: "#94A3B8",
              maxWidth: "460px",
              margin: 0,
            }}
          >
            Secure, real-time tracking and allocation for offshore entity portfolios. NAV-based share
            valuation and regulatory compliance built-in.
          </p>

          {/* Button row */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              marginTop: "6px",
              flexWrap: "wrap",
            }}
          >
            {/* Primary: Authenticate */}
            <button
              onClick={() => navigate("/login")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
                padding: "14px 28px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
                background: "#1A45FF",
                color: "#fff",
                fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
                fontWeight: 600,
                fontSize: "14px",
                boxShadow: "0 0 28px rgba(26,69,255,0.38)",
                transition: "all 0.2s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLButtonElement).style.background = "#2E57FF";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 42px rgba(26,69,255,0.55)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLButtonElement).style.background = "#1A45FF";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 28px rgba(26,69,255,0.38)";
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="7" width="10" height="8" rx="2" stroke="white" strokeWidth="1.4" />
                <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              Authenticate
              <span style={{ transition: "transform 0.2s", display: "inline-flex" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7h9M8 3.5l4 3.5-4 3.5"
                    stroke="white"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {/* Ghost: Request Access */}
            <button
              onClick={() => navigate("/register")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "13px 20px",
                borderRadius: "10px",
                cursor: "pointer",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.10)",
                color: "rgba(200,208,255,0.72)",
                fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
                fontSize: "13px",
                fontWeight: 500,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(59,130,246,0.45)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(220,228,255,0.95)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.10)";
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(200,208,255,0.72)";
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="4.5" r="2.2" stroke="currentColor" strokeWidth="1.2" />
                <path
                  d="M1.5 11.5C1.5 9 3.7 7.5 6.5 7.5s5 1.5 5 4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              Request Access
            </button>
          </div>

          {/* Stat strip */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginTop: "8px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#F0F2FF",
                }}
              >
                KES &amp; USD
              </span>
              <span style={{ fontSize: "10px", color: "rgba(160,170,220,0.5)" }}>Dual currency</span>
            </div>
            <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.08)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#F0F2FF",
                }}
              >
                v2.0
              </span>
              <span style={{ fontSize: "10px", color: "rgba(160,170,220,0.5)" }}>Active build</span>
            </div>
          </div>
        </motion.div>

        {/* ── Right column: cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          className="landing-right-col"
        >
          <FundPerformanceCard slides={perfSlides} />
          <QuickTipsCard />
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        style={{
          position: "relative",
          zIndex: 10,
          padding: "16px 40px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            fontSize: "10px",
            color: "rgba(160,170,220,0.4)",
            margin: 0,
          }}
        >
          &copy; 2026 OFSD. Strictly Confidential.
        </p>
      </footer>

      {/* Keyframe for pulsing status dot + responsive right-col hide */}
      <style>{`
        @keyframes pulseg {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.75); }
        }
        @media (max-width: 768px) {
          .landing-right-col { display: none !important; }
        }
      `}</style>
    </div>
  );
}
