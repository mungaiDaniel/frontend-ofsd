import { useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { ROUTES } from "@/lib/constants";

export default function CreditsPage() {
  const navigate = useNavigate();
  const fired = useRef(false);

  // Fire confetti on mount
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const colors = ["#1A45FF", "#10B981", "#3B82F6", "#F59E0B", "#FFFFFF"];

    // First burst
    confetti({
      particleCount: 120,
      spread: 90,
      startVelocity: 45,
      origin: { x: 0.5, y: 0 },
      colors,
      gravity: 0.9,
    });

    // Second burst after short delay
    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 120,
        startVelocity: 30,
        origin: { x: 0.3, y: 0.1 },
        colors,
        gravity: 0.8,
      });
    }, 250);

    setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 120,
        startVelocity: 30,
        origin: { x: 0.7, y: 0.1 },
        colors,
        gravity: 0.8,
      });
    }, 400);
  }, []);

  // Escape to go back
  useEffect(() => {
    const fromKonami = sessionStorage.getItem("credits_from_konami") === "1";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fromKonami) {
          sessionStorage.removeItem("credits_from_konami");
          navigate(-1);
        } else {
          navigate(ROUTES.OVERVIEW);
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [navigate]);

  const blocks = [
    {
      key: "product",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: "13px",
              color: "#3B82F6",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 600,
            }}
          >
            OFSD v2.0
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#94A3B8",
              fontStyle: "italic",
              lineHeight: 1.6,
            }}
          >
            Built with purpose. Deployed with precision. Hopefully no bugs. 🤞
          </div>
        </div>
      ),
    },
    {
      key: "sam",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#FFFFFF",
              textShadow: "0 0 20px rgba(26,69,255,0.5)",
              letterSpacing: "-0.02em",
            }}
          >
            Samuel Kinuthia
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#3B82F6",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 600,
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            }}
          >
            Frontend Engineer
          </div>
          <div style={{ fontSize: "13px", color: "#94A3B8", fontStyle: "italic" }}>
            The one who made it look good.
          </div>
        </div>
      ),
    },
    {
      key: "daniel",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#FFFFFF",
              textShadow: "0 0 20px rgba(16,185,129,0.5)",
              letterSpacing: "-0.02em",
            }}
          >
            Daniel Mungai
          </div>
          <div
            style={{
              fontSize: "11px",
              color: "#10B981",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 600,
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
            }}
          >
            Backend Engineer
          </div>
          <div style={{ fontSize: "13px", color: "#94A3B8", fontStyle: "italic" }}>
            The one who made it actually work.
          </div>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D1526",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: "var(--font-sans, 'Plus Jakarta Sans', sans-serif)",
        color: "#FFFFFF",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ width: "100%", maxWidth: "600px" }}>
        {/* Top section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", marginBottom: "36px" }}
        >
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "48px",
              fontStyle: "italic",
              color: "#FFFFFF",
              marginBottom: "14px",
              lineHeight: 1.1,
            }}
          >
            You found it.
          </div>
          <div style={{ fontSize: "15px", color: "#94A3B8", marginBottom: "8px" }}>
            Congratulations — you've discovered the hidden credits page.
          </div>
          <div style={{ fontSize: "12px", color: "#475569", fontStyle: "italic" }}>
            Only a true explorer finds this. Well done.
          </div>
        </motion.div>

        {/* Credits glass card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: "rgba(16,24,45,0.85)",
            WebkitBackdropFilter: "blur(20px)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "20px",
            padding: "40px 48px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
            marginBottom: "28px",
          }}
        >
          {blocks.map((block, i) => (
            <motion.div
              key={block.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.2 + i * 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {block.content}
              {i < blocks.length - 1 && (
                <div
                  style={{
                    height: "1px",
                    background: "rgba(255,255,255,0.07)",
                    margin: "24px 0",
                  }}
                />
              )}
            </motion.div>
          ))}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            style={{
              marginTop: "28px",
              paddingTop: "20px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: "11px",
              color: "#475569",
              textAlign: "center",
              letterSpacing: "0.04em",
            }}
          >
            AI BAXYS Africa — April 2026
          </motion.div>
        </motion.div>

        {/* Bottom links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <Link
            to={ROUTES.OVERVIEW}
            style={{
              fontSize: "12px",
              color: "#94A3B8",
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#FFFFFF")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#94A3B8")}
          >
            ← Back to app
          </Link>
          <div
            style={{
              marginTop: "8px",
              fontSize: "10px",
              color: "#475569",
            }}
          >
            Press Escape to close
          </div>
        </motion.div>
      </div>
    </div>
  );
}
