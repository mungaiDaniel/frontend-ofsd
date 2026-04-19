import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { investmentService } from "@/services/investmentService";
import { ROUTES } from "@/lib/constants";
import { Plus, Search, UserCircle2 } from "lucide-react";

interface InvestorRow {
  id?: number;
  investor_name: string;
  internal_client_code: string;
  investor_email?: string;
  investor_phone?: string;
  fund_name?: string;
  class_code?: string;
  currency?: "KES" | "USD";
  shares?: number | null;
  market_value?: number | null;
  performance_pct?: number | null;
}

const glass: React.CSSProperties = {
  background: "rgba(16,24,45,0.72)",
  backdropFilter: "blur(20px) saturate(150%)",
  WebkitBackdropFilter: "blur(20px) saturate(150%)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
};

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

function PerfBadge({ pct }: { pct?: number | null }) {
  if (pct == null) return <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>—</span>;
  const up = pct >= 0;
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 600,
      color: up ? "#34D399" : "#F87171",
    }}>
      {up ? "+" : ""}{pct.toFixed(2)}%
    </span>
  );
}

export default function InvestorDirectoryPage() {
  const navigate = useNavigate();
  const [investors, setInvestors] = useState<InvestorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    investmentService.getInvestorDirectory()
      .then((res) => setInvestors((res.data as InvestorRow[]) || []))
      .catch(() => setInvestors([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return investors;
    const q = search.toLowerCase();
    return investors.filter((inv) =>
      inv.investor_name.toLowerCase().includes(q) ||
      inv.internal_client_code.toLowerCase().includes(q) ||
      (inv.investor_email ?? "").toLowerCase().includes(q) ||
      (inv.class_code ?? "").toLowerCase().includes(q)
    );
  }, [investors, search]);

  return (
    <div>
      {/* Header */}
      <div className="page-header-row mb-4">
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "4px" }}>
            Investors
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
            {investors.length} registered investor{investors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={12} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-tertiary)", pointerEvents: "none" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, email…"
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "8px", paddingLeft: "30px", paddingRight: "12px",
                paddingTop: "6px", paddingBottom: "6px",
                fontSize: "12px", color: "var(--color-text-primary)", width: "240px",
                outline: "none",
              }}
            />
          </div>
          <button
            onClick={() => navigate(ROUTES.INVESTOR_ADD)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "8px 18px", borderRadius: "8px",
              background: "#1A45FF", border: "none",
              color: "#fff", fontSize: "12px", fontWeight: 500,
              cursor: "pointer", boxShadow: "0 0 16px rgba(26,69,255,0.3)",
            }}
          >
            <Plus size={14} /> Add investor
          </button>
        </div>
      </div>

      {/* Table card */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div style={{ width: "24px", height: "24px", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        <div style={glass}>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
              {search ? "No investors match your search." : "No investors yet."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Investor", "Client Code", "Fund / Class", "Shares", "Market Value", "Performance"].map((h) => (
                      <th key={h} style={{
                        padding: "10px 16px", textAlign: "left",
                        fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                        color: "var(--color-text-tertiary)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr
                      key={inv.internal_client_code}
                      onClick={() => navigate(ROUTES.INVESTOR_OVERVIEW(inv.internal_client_code))}
                      style={{ cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{
                            width: "28px", height: "28px", borderRadius: "50%",
                            background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <UserCircle2 size={14} style={{ color: "#60A5FA" }} />
                          </div>
                          <div>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                              {inv.investor_name}
                            </div>
                            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", fontFamily: "var(--font-mono)" }}>
                              {inv.investor_email ?? "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: "var(--color-text-secondary)" }}>
                          {inv.internal_client_code}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {inv.fund_name && (
                            <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{inv.fund_name}</span>
                          )}
                          {inv.class_code && (
                            <>
                              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "10px" }}>›</span>
                              <span style={{
                                fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700,
                                color: inv.currency === "KES" ? "var(--color-kes)" : "var(--color-usd)",
                              }}>{inv.class_code}</span>
                            </>
                          )}
                          <CurrBadge currency={inv.currency} />
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {inv.shares != null
                          ? <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-primary)" }}>{inv.shares.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                          : <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>Pending</span>
                        }
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {inv.market_value != null
                          ? <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--color-text-primary)" }}>
                              {inv.currency === "KES" ? "KES " : inv.currency === "USD" ? "$ " : ""}
                              {inv.market_value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                            </span>
                          : <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>Pending</span>
                        }
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <PerfBadge pct={inv.performance_pct} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
