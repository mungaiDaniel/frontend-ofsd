import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { setTokens } from "@/lib/auth";
import { ROUTES } from "@/lib/constants";

// ── DEV ONLY — remove before production ──
const DEV_CREDENTIALS = {
  email: "sk@horizonafrica.com",
  password: "devpreview123",
};
// ─────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px",
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px", fontSize: "13px", color: "var(--color-text-primary)",
  outline: "none", fontFamily: "var(--font-sans)",
  boxSizing: "border-box",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
      {children}
    </label>
  );
}

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/overview";
  const stateEmail = (location.state as { email?: string })?.email || "";

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: stateEmail || DEV_CREDENTIALS.email,
      password: DEV_CREDENTIALS.password,
    },
  });

  const handleDevPreview = () => {
    setTokens("dev-preview-token", "dev-preview-refresh", "super_admin", "Sam (Dev)");
    navigate(ROUTES.OVERVIEW, { replace: true });
  };

  const onSubmit = async (data: LoginForm) => {
    clearError();
    const success = await login(data.email, data.password);
    if (success) navigate(from, { replace: true });
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px", background: "var(--color-bg-base)",
    }}>
      <div style={{
        width: "100%", maxWidth: "420px",
        background: "rgba(16,24,45,0.72)",
        backdropFilter: "blur(20px) saturate(150%)",
        WebkitBackdropFilter: "blur(20px) saturate(150%)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "20px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        padding: "36px 32px",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <img src="/logo.webp" alt="AIB AXYS Africa" style={{ height: "36px", objectFit: "contain" }} />
        </div>

        <h1 style={{ fontSize: "20px", fontWeight: 700, textAlign: "center", color: "var(--color-text-primary)", letterSpacing: "-0.02em", marginBottom: "4px" }}>
          Sign in to OFSD
        </h1>
        <p style={{ fontSize: "13px", textAlign: "center", color: "var(--color-text-secondary)", marginBottom: "28px" }}>
          Offshore Fund System & Distribution
        </p>

        {error && (
          <div style={{
            padding: "10px 14px", marginBottom: "20px", borderRadius: "8px",
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
            fontSize: "13px", color: "#F87171",
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ marginBottom: "16px" }}>
            <Label>Email</Label>
            <input type="email" {...register("email")} placeholder="you@company.com" autoComplete="email" autoFocus style={inputStyle} />
            {errors.email && <p style={{ fontSize: "11px", color: "#F87171", marginTop: "4px" }}>{errors.email.message}</p>}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <Label>Password</Label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} {...register("password")} placeholder="Password" autoComplete="current-password" style={inputStyle} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} style={{
                position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", fontSize: "11px", color: "var(--color-text-tertiary)", cursor: "pointer",
              }}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <p style={{ fontSize: "11px", color: "#F87171", marginTop: "4px" }}>{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "11px", borderRadius: "10px",
            background: "#1A45FF", border: "none", color: "#fff",
            fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, boxShadow: "0 0 20px rgba(26,69,255,0.35)",
          }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ fontSize: "12px", textAlign: "center", color: "var(--color-text-tertiary)", marginTop: "20px", marginBottom: 0 }}>
          Don't have an account?{" "}
          <Link to={ROUTES.REGISTER} style={{ color: "#60A5FA", textDecoration: "none", fontWeight: 500 }}>
            Register
          </Link>
        </p>

        {/* DEV PREVIEW */}
        <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "2px 10px", borderRadius: "100px",
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
            fontSize: "9px", fontWeight: 600, color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.08em",
            marginBottom: "10px",
          }}>
            Dev only
          </span>
          <br />
          <button type="button" onClick={handleDevPreview} style={{
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
            color: "#F59E0B", fontSize: "11px", fontWeight: 500,
            padding: "7px 16px", borderRadius: "8px", cursor: "pointer",
          }}>
            Skip to UI preview (no backend)
          </button>
          <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginTop: "6px" }}>
            Injects a fake session · mock data active
          </div>
        </div>
      </div>
    </div>
  );
}
