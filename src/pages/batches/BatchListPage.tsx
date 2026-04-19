import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { batchService } from "@/services/batchService";
import { formatDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type { Batch } from "@/lib/types";
import { Plus, Search } from "lucide-react";
import { BatchStageStepper } from "@/components/data/BatchStageStepper";

type Tab = "Open" | "Closed" | "Transferred" | "Deployed" | "All";
const TABS: Tab[] = ["Open", "Deployed", "Closed", "Transferred", "All"];

// ── Helpers ──

function msUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3_600_000);
  return { days: Math.floor(h / 24), hours: h % 24 };
}

function CurrBadge({ currency }: { currency?: "KES" | "USD" | null }) {
  if (!currency) return null;
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
    }}>
      {currency}
    </span>
  );
}

function ClassBadge({ code, currency }: { code?: string | null; currency?: "KES" | "USD" | null }) {
  if (!code) return null;
  const isKes = currency === "KES";
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700,
      color: isKes ? "var(--color-kes)" : "var(--color-usd)",
    }}>
      {code}
    </span>
  );
}

function StageBadge({ stage }: { stage: number }) {
  const labels: Record<number, string> = { 1: "Deposited", 2: "Transferred", 3: "Deployed", 4: "Active" };
  const colors: Record<number, { bg: string; color: string }> = {
    1: { bg: "rgba(59,130,246,0.1)",  color: "#60A5FA" },
    2: { bg: "rgba(245,158,11,0.1)",  color: "#F59E0B" },
    3: { bg: "rgba(168,85,247,0.1)",  color: "#C084FC" },
    4: { bg: "rgba(34,197,94,0.1)",   color: "#22c55e" },
  };
  const s = colors[stage] ?? { bg: "rgba(59,130,246,0.1)", color: "#60A5FA" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: "100px",
      fontSize: "9px", fontWeight: 600, letterSpacing: "0.05em",
      background: s.bg, color: s.color,
    }}>
      {labels[stage] ?? "Unknown"}
    </span>
  );
}

function CountdownPill({ closeAt }: { closeAt: string }) {
  const t = msUntil(closeAt);
  if (!t) return <span style={{ fontSize: "10px", color: "#475569" }}>Closing soon</span>;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "2px 8px", borderRadius: "100px",
      background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
      fontSize: "10px", fontWeight: 600, color: "#F59E0B",
    }}>
      Closes in {t.days > 0 ? `${t.days}d ${t.hours}h` : `${t.hours}h`}
    </span>
  );
}

// ── Glass card style ──
const glass: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
};

export default function BatchListPage() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Open");
  const [search, setSearch] = useState("");

  useEffect(() => {
    batchService.getAll()
      .then(setBatches)
      .catch(() => setBatches([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let r = batches;
    if (activeTab === "Open")         r = r.filter((b) => b.is_open);
    else if (activeTab === "Closed")  r = r.filter((b) => !b.is_open && b.status === "Closed");
    else if (activeTab === "Transferred") r = r.filter((b) => b.stage >= 2 && b.stage < 3);
    else if (activeTab === "Deployed") r = r.filter((b) => b.stage >= 3);

    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((b) =>
        b.batch_name.toLowerCase().includes(q) ||
        (b.class_code ?? "").toLowerCase().includes(q) ||
        (b.certificate_number ?? "").toLowerCase().includes(q)
      );
    }
    return r;
  }, [batches, activeTab, search]);

  const openCount = batches.filter((b) => b.is_open).length;

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header-row mb-4">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            Batches
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            Weekly investment groups sent to AXYS
          </p>
        </div>
        <button
          onClick={() => navigate(ROUTES.BATCH_CREATE)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 18px", borderRadius: "8px",
            background: "#1A45FF", border: "none",
            color: "#fff", fontSize: "12px", fontWeight: 500,
            cursor: "pointer", boxShadow: "0 0 16px rgba(26,69,255,0.3)",
          }}
        >
          <Plus size={14} /> New batch
        </button>
      </div>

      {/* ── Tabs + Search ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "5px 14px", borderRadius: "100px",
                  fontSize: "11px", fontWeight: 600,
                  border: active ? "1px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  background: active ? "rgba(59,130,246,0.12)" : "transparent",
                  color: active ? "#60A5FA" : "var(--color-text-secondary)",
                  cursor: "pointer", transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: "5px",
                }}
              >
                {tab}
                {tab === "Open" && openCount > 0 && (
                  <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "100px", background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
                    {openCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ position: "relative" }}>
          <Search size={12} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search batches…"
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px", paddingLeft: "30px", paddingRight: "12px",
              paddingTop: "6px", paddingBottom: "6px",
              fontSize: "12px", color: "var(--color-text-primary)", width: "220px",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── Cards grid ── */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...glass, padding: "48px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
          {search ? "No batches match your search." : "No batches in this category."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: "14px" }}>
          {filtered.map((b) => (
            <BatchCard key={b.id} batch={b} onClick={() => navigate(ROUTES.BATCH_DETAIL(b.id))} />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── BatchCard ──
function BatchCard({ batch: b, onClick }: { batch: Batch; onClick: () => void }) {
  const hasClass = !!b.class_code;
  const fundName = b.funds?.[0]?.fund_name ?? "—";

  return (
    <div
      onClick={onClick}
      style={{
        ...glass,
        padding: "18px 20px",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(59,130,246,0.25)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.35)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.25)";
      }}
    >
      {/* Top row: name + badges */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {b.batch_name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{fundName}</span>
            {hasClass && (
              <>
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>›</span>
                <ClassBadge code={b.class_code} currency={b.class_currency} />
                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>›</span>
                <CurrBadge currency={b.class_currency} />
              </>
            )}
          </div>
        </div>
        <StageBadge stage={b.stage} />
      </div>

      {/* Stage stepper */}
      <div style={{ marginBottom: "12px" }}>
        <BatchStageStepper currentStage={b.stage} compact />
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
        <div style={{ display: "flex", gap: "18px" }}>
          <div>
            <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>Investors</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)", marginTop: "2px" }}>{b.investors_count}</div>
          </div>
          <div>
            <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>Deposited</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "2px" }}>
              {b.total_capital != null
                ? (b.class_currency === "KES" ? "KES " : b.class_currency === "USD" ? "$ " : "") + b.total_capital.toLocaleString("en-US", { maximumFractionDigits: 0 })
                : "—"}
            </div>
          </div>
          {b.deployment_date_actual && (
            <div>
              <div style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-text-tertiary)" }}>Deployed</div>
              <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "2px" }}>{formatDate(b.deployment_date_actual)}</div>
            </div>
          )}
        </div>
        {/* Right: open countdown or closed pill */}
        {b.is_open && b.auto_close_at ? (
          <CountdownPill closeAt={b.auto_close_at} />
        ) : (
          <span style={{
            fontSize: "9px", fontWeight: 600, padding: "2px 8px", borderRadius: "100px",
            background: "rgba(255,255,255,0.04)", color: "var(--color-text-tertiary)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            {b.status}
          </span>
        )}
      </div>
    </div>
  );
}
