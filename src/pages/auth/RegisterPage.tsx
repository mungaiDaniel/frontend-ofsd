import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/lib/constants";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(3, "Full name is required")
      .regex(/^[a-zA-Z\s\-']+$/, "Letters, spaces, hyphens, and apostrophes only")
      .refine((val) => val.trim().split(/\s+/).length >= 2, "Must be at least two words"),
    email: z.string().email("Valid email is required"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(/[@$!%*?&]/, "Must contain a special character (@$!%*?&)"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

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

export default function RegisterPage() {
  const { register: registerUser, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    clearError();
    const success = await registerUser(data.name, data.email, data.password);
    if (success) navigate(ROUTES.LOGIN, { replace: true, state: { email: data.email } });
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
          Create account
        </h1>
        <p style={{ fontSize: "13px", textAlign: "center", color: "var(--color-text-secondary)", marginBottom: "28px" }}>
          Request access to OFSD
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
          <div style={{ marginBottom: "14px" }}>
            <Label>Full name</Label>
            <input {...register("name")} placeholder="Jane Doe" autoComplete="name" autoFocus style={inputStyle} />
            {errors.name && <p style={{ fontSize: "11px", color: "#F87171", marginTop: "4px" }}>{errors.name.message}</p>}
          </div>

          <div style={{ marginBottom: "14px" }}>
            <Label>Email</Label>
            <input type="email" {...register("email")} placeholder="you@company.com" autoComplete="email" style={inputStyle} />
            {errors.email && <p style={{ fontSize: "11px", color: "#F87171", marginTop: "4px" }}>{errors.email.message}</p>}
          </div>

          <div style={{ marginBottom: "14px" }}>
            <Label>Password</Label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} {...register("password")} placeholder="Min 8 chars, upper, lower, number, symbol" autoComplete="new-password" style={inputStyle} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} tabIndex={-1} style={{
                position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", fontSize: "11px", color: "var(--color-text-tertiary)", cursor: "pointer",
              }}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <p style={{ fontSize: "11px", color: "#F87171", marginTop: "4px" }}>{errors.password.message}</p>}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <Label>Confirm password</Label>
            <input type="password" {...register("confirmPassword")} placeholder="Re-enter password" autoComplete="new-password" style={inputStyle} />
            {errors.confirmPassword && <p style={{ fontSize: "11px", color: "#F87171", marginTop: "4px" }}>{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", padding: "11px", borderRadius: "10px",
            background: "#1A45FF", border: "none", color: "#fff",
            fontSize: "13px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1, boxShadow: "0 0 20px rgba(26,69,255,0.35)",
          }}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={{ fontSize: "12px", textAlign: "center", color: "var(--color-text-tertiary)", marginTop: "20px", marginBottom: 0 }}>
          Already have an account?{" "}
          <Link to={ROUTES.LOGIN} style={{ color: "#60A5FA", textDecoration: "none", fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
