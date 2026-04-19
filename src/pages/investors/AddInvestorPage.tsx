import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { investorService } from "@/services/investorService";
import { fundService } from "@/services/fundService";
import { fundSummaryService } from "@/services/fundSummaryService";
import { formatDate } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import type {
  InvestorLookup,
  AddInvestorResponse,
  CoreFund,
  ShareClass,
  FundSummaryFund,
} from "@/lib/types";

// ── Shared style constants ──

const FIELD_INPUT: React.CSSProperties = {
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

const FIELD_SELECT: React.CSSProperties = {
  ...FIELD_INPUT,
  cursor: "pointer",
  appearance: "none" as const,
  paddingRight: "32px",
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  backgroundSize: "12px",
};

const FIELD_LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 500,
  color: "#94A3B8",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const SECTION_HEADER: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "16px",
};

// ── Sub-components ──

function StepBadge({ num, done }: { num: number | string; done?: boolean }) {
  return (
    <span
      style={{
        width: "18px",
        height: "18px",
        borderRadius: "50%",
        background: done ? "rgba(16,185,129,0.12)" : "rgba(26,69,255,0.15)",
        border: done ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(59,130,246,0.35)",
        color: done ? "#10B981" : "#60A5FA",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        fontWeight: 600,
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        flexShrink: 0,
      }}
    >
      {done ? "✓" : num}
    </span>
  );
}

function SectionTitle({
  step,
  label,
  done,
  pill,
}: {
  step: number | string;
  label: string;
  done?: boolean;
  pill?: React.ReactNode;
}) {
  return (
    <div style={SECTION_HEADER}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          fontSize: "10px",
          fontWeight: 600,
          color: "#475569",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        <StepBadge num={step} done={done} />
        {label}
      </div>
      {pill}
    </div>
  );
}

function DetectedPill({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "3px 10px",
        borderRadius: "100px",
        background: "rgba(16,185,129,0.12)",
        border: "1px solid rgba(16,185,129,0.3)",
        fontSize: "10px",
        fontWeight: 600,
        color: "#10B981",
        letterSpacing: "0.02em",
      }}
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 6l1.5 1.5L8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </span>
  );
}

function CurrencyBadge({ currency }: { currency: "KES" | "USD" | null }) {
  if (!currency) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "3px 10px",
          borderRadius: "6px",
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.04em",
          background: "rgba(255,255,255,0.04)",
          color: "#475569",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        —
      </span>
    );
  }
  const isKes = currency === "KES";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "6px",
        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
        fontSize: "11px",
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

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = "#3B82F6";
  (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(59,130,246,0.15)";
  (e.target as HTMLElement).style.background = "rgba(0,0,0,0.35)";
}
function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
  (e.target as HTMLElement).style.boxShadow = "none";
  (e.target as HTMLElement).style.background = "rgba(0,0,0,0.25)";
}

// ── Main page ──

type LookupStatus = "idle" | "checking" | "found" | "new";

interface SuccessData {
  result: AddInvestorResponse;
  investorName: string;
  fundName: string;
}

export default function AddInvestorPage() {
  const navigate = useNavigate();

  // Form state
  const [clientCode, setClientCode] = useState("");
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle");
  const [foundInvestor, setFoundInvestor] = useState<InvestorLookup | null>(null);

  // New investor fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Fund/Class
  const [funds, setFunds] = useState<(CoreFund | FundSummaryFund)[]>([]);
  const [selectedFundId, setSelectedFundId] = useState<number | "">("");
  const [classes, setClasses] = useState<ShareClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");
  const [classesLoading, setClassesLoading] = useState(false);

  // Deposit
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDate, setDepositDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  // Debounce ref
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load funds on mount
  useEffect(() => {
    (async () => {
      try {
        const summary = await fundSummaryService.getSummary();
        if (summary?.funds?.length) {
          setFunds(summary.funds);
        } else {
          const basic = await fundService.getAll();
          setFunds(basic);
        }
      } catch {
        const basic = await fundService.getAll().catch(() => []);
        setFunds(basic);
      }
    })();
  }, []);

  // Debounced lookup when client code changes
  useEffect(() => {
    const code = clientCode.trim();
    if (!code) {
      setLookupStatus("idle");
      setFoundInvestor(null);
      return;
    }
    setLookupStatus("checking");
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    lookupTimer.current = setTimeout(async () => {
      try {
        const investor = await investorService.lookup(code);
        if (investor) {
          setFoundInvestor(investor);
          setName(investor.investor_name);
          setEmail(investor.investor_email);
          setPhone(investor.investor_phone ?? "");
          setLookupStatus("found");
        } else {
          setFoundInvestor(null);
          setLookupStatus("new");
        }
      } catch {
        setFoundInvestor(null);
        setLookupStatus("new");
      }
    }, 300);
    return () => {
      if (lookupTimer.current) clearTimeout(lookupTimer.current);
    };
  }, [clientCode]);

  // Load classes when fund selected
  useEffect(() => {
    if (!selectedFundId) {
      setClasses([]);
      setSelectedClassId("");
      return;
    }
    setClassesLoading(true);
    setSelectedClassId("");
    fundService
      .getClasses(Number(selectedFundId))
      .then(setClasses)
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  }, [selectedFundId]);

  const selectedClass = classes.find((c) => c.id === Number(selectedClassId));
  const currency = selectedClass?.currency ?? null;

  const selectedFund = funds.find((f) => f.id === Number(selectedFundId));
  const fundName = (selectedFund as CoreFund)?.fund_name ?? "";
  const fundCode = (selectedFund as CoreFund)?.fund_code ?? (selectedFund as FundSummaryFund)?.fund_code ?? "";

  // Validation
  const identityComplete =
    clientCode.trim() &&
    (lookupStatus === "found" || lookupStatus === "new") &&
    (lookupStatus === "found" || (name.trim() && email.trim()));

  const fundClassComplete = selectedFundId && selectedClassId;
  const depositComplete = depositAmount && parseFloat(depositAmount.replace(/,/g, "")) > 0 && depositDate;

  const canSubmit = identityComplete && fundClassComplete && depositComplete && !submitting;

  // Batch info (derived from known pattern while waiting for API)
  const batchLabel = selectedClass
    ? `${fundCode}_${selectedClass.class_code}`
    : null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const rawAmount = parseFloat(depositAmount.replace(/,/g, ""));
      let result: AddInvestorResponse;

      if (lookupStatus === "found") {
        result = await investorService.addExisting({
          internal_client_code: clientCode.trim(),
          fund_id: Number(selectedFundId),
          share_class_id: Number(selectedClassId),
          deposit_amount: rawAmount,
          deposit_date: depositDate,
        });
      } else {
        result = await investorService.addNew({
          internal_client_code: clientCode.trim(),
          investor_name: name.trim(),
          investor_email: email.trim(),
          investor_phone: phone.trim() || undefined,
          fund_id: Number(selectedFundId),
          share_class_id: Number(selectedClassId),
          deposit_amount: rawAmount,
          deposit_date: depositDate,
        });
      }

      setSuccess({
        result,
        investorName: lookupStatus === "found" ? (foundInvestor?.investor_name ?? name.trim()) : name.trim(),
        fundName: result.fund_name ?? fundName,
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to add investor. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setClientCode("");
    setLookupStatus("idle");
    setFoundInvestor(null);
    setName("");
    setEmail("");
    setPhone("");
    setSelectedFundId("");
    setSelectedClassId("");
    setDepositAmount("");
    setDepositDate(new Date().toISOString().slice(0, 10));
    setSuccess(null);
  };

  // Format deposit amount with commas on blur
  const handleAmountBlur = () => {
    const raw = parseFloat(depositAmount.replace(/,/g, ""));
    if (!isNaN(raw) && raw > 0) {
      setDepositAmount(raw.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    }
  };

  // ── Success state ──
  if (success) {
    const { result, investorName } = success;
    const isKes = result.currency === "KES";
    const amtColor = isKes ? "var(--color-kes)" : "var(--color-usd)";
    const amtPrefix = isKes ? "KES" : "USD";
    const amtFormatted = `${amtPrefix} ${result.deposit_amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "24px 32px 48px",
          maxWidth: "800px",
          margin: "0 auto",
          fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
          color: "#FFFFFF",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center" }}
        >
          {/* Success icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 0 30px rgba(16,185,129,0.15)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <path d="M9 16l5 5 9-10" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div style={{ fontSize: "22px", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            Investor added
          </div>
          <div style={{ fontSize: "13px", color: "#94A3B8", lineHeight: 1.6, marginBottom: "28px", maxWidth: "420px", margin: "0 auto 28px" }}>
            {investorName} has been assigned to the open batch. No further action is required until the batch closes.
          </div>

          {/* Summary card */}
          <div
            style={{
              background: "rgba(16,24,45,0.72)",
              WebkitBackdropFilter: "blur(20px) saturate(150%)",
              backdropFilter: "blur(20px) saturate(150%)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
              overflow: "hidden",
              maxWidth: "480px",
              margin: "0 auto 24px",
              textAlign: "left",
            }}
          >
            {/* Card header */}
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Investor Details
              </span>
              <CurrencyBadge currency={result.currency} />
            </div>

            {/* Detail rows */}
            <div style={{ padding: "4px 0" }}>
              {[
                { k: "Name", v: investorName },
                { k: "Client Code", v: result.batch_name ? null : clientCode.trim(), mono: true },
                { k: "Fund", v: success.fundName },
                { k: "Share Class", v: result.class_code, mono: true },
              ].map(({ k, v, mono }) =>
                v ? (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "9px 18px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "#475569" }}>{k}</span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#FFFFFF",
                        fontFamily: mono ? "var(--font-mono, 'JetBrains Mono', monospace)" : undefined,
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ) : null
              )}
              {/* Client code row (from state) */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span style={{ fontSize: "11px", color: "#475569" }}>Client Code</span>
                <span style={{ fontSize: "12px", color: "#FFFFFF", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}>
                  {clientCode.trim().toUpperCase()}
                </span>
              </div>
              {/* Deposit amount — highlighted */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "11px 18px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: "rgba(255,255,255,0.015)",
                }}
              >
                <span style={{ fontSize: "11px", color: "#475569" }}>Deposit amount</span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: amtColor,
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  }}
                >
                  {amtFormatted}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "9px 18px",
                }}
              >
                <span style={{ fontSize: "11px", color: "#475569" }}>Deposit date</span>
                <span style={{ fontSize: "12px", color: "#FFFFFF", fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)" }}>
                  {formatDate(depositDate)}
                </span>
              </div>
            </div>

            {/* Batch box */}
            <div
              style={{
                margin: "0 14px 14px",
                padding: "12px 14px",
                background: "rgba(26,69,255,0.06)",
                border: "1px solid rgba(59,130,246,0.2)",
                borderRadius: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "9px",
                  fontWeight: 600,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "6px",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <rect x="1.5" y="2.5" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="1.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="4" y1="1.5" x2="4" y2="3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="8" y1="1.5" x2="8" y2="3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                Auto-assigned to batch
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  marginBottom: "6px",
                }}
              >
                {result.batch_name}
              </div>
              <div style={{ fontSize: "11px", color: "#94A3B8", lineHeight: 1.55 }}>
                {result.batch_close_at ? (
                  <>
                    Batch closes{" "}
                    <strong style={{ color: "#FFFFFF" }}>
                      {new Date(result.batch_close_at).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      at 09:00 EAT
                    </strong>
                    . Shares will be purchased at that week's deployment NAV. Deposit statement will be generated after deployment.
                  </>
                ) : (
                  "Shares will be purchased at the deployment NAV once the batch closes. Deposit statement generated after deployment."
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              onClick={() => navigate(ROUTES.BATCH_DETAIL(result.batch_id))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 16px",
                borderRadius: "8px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94A3B8",
                fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
                fontSize: "12px",
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
              View batch
            </button>
            <button
              onClick={handleReset}
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
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#2E57FF";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 22px rgba(26,69,255,0.45)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#1A45FF";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(26,69,255,0.3)";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 2v9M2 6.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Form state ──

  const isExisting = lookupStatus === "found";
  const identityDone = lookupStatus === "found" || (lookupStatus === "new" && name.trim() && email.trim());
  const fundClassDone = !!(selectedFundId && selectedClassId);

  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        padding: "24px 32px 48px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
        color: "#FFFFFF",
      }}
    >
      {/* Breadcrumbs */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          fontSize: "11px",
          color: "#475569",
          marginBottom: "14px",
        }}
      >
        <Link
          to={ROUTES.INVESTORS}
          style={{ color: "#94A3B8", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#94A3B8")}
        >
          Investors
        </Link>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
          <path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Add investor</span>
      </div>

      {/* Page header */}
      <div style={{ marginBottom: "22px" }}>
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
          Add investor
        </h1>
        <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "4px" }}>
          Register a new client or add a deposit for an existing investor.
        </div>
      </div>

      {/* Form card */}
      <div
        style={{
          background: "rgba(16,24,45,0.72)",
          WebkitBackdropFilter: "blur(20px) saturate(150%)",
          backdropFilter: "blur(20px) saturate(150%)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        {/* ── Section 1: Investor Identity ── */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <SectionTitle
            step={1}
            label="Investor identity"
            done={!!identityDone}
            pill={
              lookupStatus === "found" ? (
                <DetectedPill label="Existing investor" />
              ) : lookupStatus === "new" ? (
                <DetectedPill label="New investor" />
              ) : undefined
            }
          />

          {/* Existing investor notice */}
          <AnimatePresence>
            {isExisting && foundInvestor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden", marginBottom: "14px" }}
              >
                <div
                  style={{
                    padding: "12px 14px",
                    background: "rgba(16,185,129,0.06)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: "10px",
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ color: "#10B981", flexShrink: 0, marginTop: "1px" }}>
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div style={{ fontSize: "12px", color: "rgba(167,243,208,0.95)", lineHeight: 1.55 }}>
                    <strong style={{ color: "#6EE7B7", fontWeight: 600 }}>
                      Client code {clientCode.trim()} found.
                    </strong>{" "}
                    Details have been auto-filled from their existing record. Only deposit information is required to add a new contribution.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Existing investor identity summary */}
          <AnimatePresence>
            {isExisting && foundInvestor && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden", marginBottom: "0" }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    background: "rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,rgba(16,185,129,0.3),rgba(16,185,129,0.1))",
                      border: "1px solid rgba(16,185,129,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#6EE7B7",
                      flexShrink: 0,
                    }}
                  >
                    {foundInvestor.investor_name
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF", marginBottom: "2px" }}>
                      {foundInvestor.investor_name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94A3B8", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)", fontSize: "10px" }}>
                        {foundInvestor.internal_client_code}
                      </span>
                      <span style={{ width: "2px", height: "2px", background: "#475569", borderRadius: "50%", flexShrink: 0 }} />
                      <span>{foundInvestor.investor_email}</span>
                      {foundInvestor.investor_phone && (
                        <>
                          <span style={{ width: "2px", height: "2px", background: "#475569", borderRadius: "50%", flexShrink: 0 }} />
                          <span>{foundInvestor.investor_phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setClientCode("");
                      setLookupStatus("idle");
                      setFoundInvestor(null);
                      setName("");
                      setEmail("");
                      setPhone("");
                    }}
                    style={{
                      fontSize: "10px",
                      color: "#3B82F6",
                      background: "transparent",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
                      transition: "background 0.15s",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.1)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLButtonElement).style.background = "transparent")
                    }
                  >
                    Use different code
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* New or idle: show code input + fields */}
          <AnimatePresence>
            {!isExisting && (
              <motion.div
                initial={false}
                animate={{ opacity: 1 }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                }}
              >
                {/* Client code — always visible */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={FIELD_LABEL}>
                    Client Code <span style={{ color: "#EF4444", marginLeft: "3px" }}>*</span>
                  </label>
                  <input
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                    placeholder="e.g. INV-001"
                    autoComplete="off"
                    style={{
                      ...FIELD_INPUT,
                      fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                  {/* Lookup status indicator */}
                  {lookupStatus !== "idle" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "10px",
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        color:
                          lookupStatus === "checking"
                            ? "#475569"
                            : lookupStatus === "new"
                              ? "#3B82F6"
                              : "#10B981",
                        marginTop: "2px",
                      }}
                    >
                      {lookupStatus === "checking" ? (
                        <>
                          <div
                            style={{
                              width: "10px",
                              height: "10px",
                              border: "1.5px solid rgba(255,255,255,0.1)",
                              borderTopColor: "#3B82F6",
                              borderRadius: "50%",
                              animation: "spin 0.8s linear infinite",
                            }}
                          />
                          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                          Checking…
                        </>
                      ) : lookupStatus === "new" ? (
                        <>
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M6 3.5v3M6 8.5v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                          Code is available — new investor
                        </>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Investor Name */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={FIELD_LABEL}>
                    Investor Name <span style={{ color: "#EF4444", marginLeft: "3px" }}>*</span>
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    autoComplete="off"
                    style={FIELD_INPUT}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                {/* Email */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={FIELD_LABEL}>
                    Email <span style={{ color: "#EF4444", marginLeft: "3px" }}>*</span>
                  </label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="investor@example.com"
                    autoComplete="off"
                    style={FIELD_INPUT}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>

                {/* Phone */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={FIELD_LABEL}>
                    Phone <span style={{ fontSize: "10px", color: "#475569", fontWeight: 400 }}>Optional</span>
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    autoComplete="off"
                    style={FIELD_INPUT}
                    onFocus={focusStyle}
                    onBlur={blurStyle}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* When existing: show client code field above the summary (for clarity) */}
          <AnimatePresence>
            {isExisting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: "none" }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── Section 2: Fund & Class ── */}
        <div
          style={{
            padding: "18px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <SectionTitle step={2} label="Fund & class" done={fundClassDone} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: "14px",
            }}
          >
            {/* Fund */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={FIELD_LABEL}>
                Fund <span style={{ color: "#EF4444", marginLeft: "3px" }}>*</span>
              </label>
              <select
                value={selectedFundId}
                onChange={(e) => setSelectedFundId(e.target.value ? Number(e.target.value) : "")}
                style={{
                  ...FIELD_SELECT,
                  backgroundImage:
                    FIELD_SELECT.backgroundImage +
                    ", rgba(0,0,0,0.25)",
                  background: `rgba(0,0,0,0.25) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 12px center`,
                }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              >
                <option value="">Select a fund…</option>
                {funds.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.fund_name} ({(f as CoreFund).fund_code ?? (f as FundSummaryFund).fund_code ?? ""})
                  </option>
                ))}
              </select>
            </div>

            {/* Share Class */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={FIELD_LABEL}>
                Share Class <span style={{ color: "#EF4444", marginLeft: "3px" }}>*</span>
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value ? Number(e.target.value) : "")}
                disabled={!selectedFundId || classesLoading}
                style={{
                  ...FIELD_SELECT,
                  background: `rgba(0,0,0,0.25) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 5L6 8L9 5' stroke='%2394A3B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 12px center`,
                  opacity: !selectedFundId ? 0.5 : 1,
                  cursor: !selectedFundId ? "not-allowed" : "pointer",
                }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              >
                <option value="">
                  {classesLoading ? "Loading…" : !selectedFundId ? "Select a fund first" : "Select a class…"}
                </option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.class_name} — {c.class_code}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency (auto) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={FIELD_LABEL}>
                Currency <span style={{ fontSize: "10px", color: "#475569", fontWeight: 400 }}>Auto</span>
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  background: "rgba(0,0,0,0.2)",
                  border: currency ? "1px solid rgba(255,255,255,0.1)" : "1px dashed rgba(255,255,255,0.1)",
                  fontSize: "12px",
                  color: currency ? "#FFFFFF" : "#475569",
                  minHeight: "41px",
                }}
              >
                <CurrencyBadge currency={currency} />
                {currency ? (
                  <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                    {currency === "KES" ? "Kenyan Shilling" : "US Dollar"}
                  </span>
                ) : (
                  <span>set by class</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: Deposit ── */}
        <div style={{ padding: "18px 22px" }}>
          <SectionTitle step={3} label="Deposit" done={!!depositComplete} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            {/* Deposit amount */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={FIELD_LABEL}>
                Deposit Amount <span style={{ color: "#EF4444", marginLeft: "3px" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: currency === "KES" ? "var(--color-kes)" : currency === "USD" ? "var(--color-usd)" : "#475569",
                    pointerEvents: "none",
                    paddingRight: "10px",
                    borderRight: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {currency ?? "—"}
                </span>
                <input
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                  onBlur={handleAmountBlur}
                  placeholder="0.00"
                  disabled={!currency}
                  style={{
                    ...FIELD_INPUT,
                    paddingLeft: "58px",
                    fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                    opacity: !currency ? 0.5 : 1,
                    cursor: !currency ? "not-allowed" : "text",
                  }}
                  onFocus={focusStyle}
                />
              </div>
              {!currency && (
                <div style={{ fontSize: "10px", color: "#475569" }}>
                  Currency prefix updates once a share class is selected.
                </div>
              )}
            </div>

            {/* Deposit date */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={FIELD_LABEL}>
                Deposit Date <span style={{ color: "#EF4444", marginLeft: "3px" }}>*</span>
              </label>
              <input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                style={{
                  ...FIELD_INPUT,
                  colorScheme: "dark",
                }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
              <div style={{ fontSize: "10px", color: "#475569" }}>Actual date client made the deposit.</div>
            </div>
          </div>

          {/* Batch callout */}
          <AnimatePresence>
            {batchLabel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: "hidden", marginTop: "14px" }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "flex-start",
                    padding: "10px 12px",
                    background: "rgba(59,130,246,0.06)",
                    border: "1px solid rgba(59,130,246,0.18)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    color: "#94A3B8",
                    lineHeight: 1.55,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ color: "#3B82F6", flexShrink: 0, marginTop: "1px" }}>
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>
                    Will be assigned to the open{" "}
                    <code
                      style={{
                        fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
                        fontSize: "10px",
                        color: "#FFFFFF",
                        background: "rgba(255,255,255,0.08)",
                        padding: "1px 5px",
                        borderRadius: "4px",
                      }}
                    >
                      {batchLabel}
                    </code>{" "}
                    batch. Deployment runs shortly after the batch closes on Thursday.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Form footer */}
        <div
          style={{
            padding: "16px 22px",
            background: "rgba(0,0,0,0.15)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: "#475569",
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              letterSpacing: "0.04em",
            }}
          >
            {canSubmit
              ? "Ready to submit"
              : isExisting
                ? "Adding new contribution for existing investor"
                : "All fields marked * are required"}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => navigate(-1)}
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
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: canSubmit ? "#1A45FF" : "rgba(255,255,255,0.06)",
                color: canSubmit ? "#fff" : "#475569",
                border: "none",
                fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: canSubmit ? "pointer" : "not-allowed",
                padding: "9px 16px",
                borderRadius: "8px",
                boxShadow: canSubmit ? "0 0 16px rgba(26,69,255,0.3)" : "none",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                if (canSubmit) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#2E57FF";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 22px rgba(26,69,255,0.45)";
                }
              }}
              onMouseLeave={(e) => {
                if (canSubmit) {
                  (e.currentTarget as HTMLButtonElement).style.background = "#1A45FF";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 16px rgba(26,69,255,0.3)";
                }
              }}
            >
              {submitting ? (
                <>
                  <div
                    style={{
                      width: "11px",
                      height: "11px",
                      border: "1.5px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Submitting…
                </>
              ) : (
                <>
                  {isExisting ? "Add deposit" : "Add investor"}
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
