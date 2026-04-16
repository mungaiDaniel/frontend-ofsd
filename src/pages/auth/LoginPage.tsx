import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { ROUTES } from "@/lib/constants";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";
  const stateEmail = (location.state as { email?: string })?.email || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: stateEmail,
    },
  });

  const onSubmit = async (data: LoginForm) => {
    clearError();
    const success = await login(data.email, data.password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-4"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div
        className="card shadow-lg rounded-4 border-0 p-4 p-md-5 bg-dark w-100"
        style={{ maxWidth: "450px" }}
      >
        {/* Logo */}
        <div className="d-flex justify-content-center mb-4">
          <img src="/NEW AIB AXYS AFRICA LOGO DARK BG.svg" alt="AIB AXYS Africa" className="h-10 w-auto" style={{ height: "40px" }} />
        </div>

        {/* Title */}
        <h1
          className="fs-4 fw-bold text-center mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          Sign in to OFDS
        </h1>
        <p
          className="text-center mb-4"
          style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}
        >
          Operations Fund Distribution System
        </p>

        {/* Error message */}
        {error && (
          <div
            className="rounded-md p-3 mb-4 text-sm border-l-2"
            style={{
              background: "var(--color-destructive-bg)",
              borderColor: "var(--color-destructive)",
              color: "var(--color-destructive)",
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mb-5">
          {/* Email */}
          <div>
            <label
              className="form-label text-muted small fw-bold mb-2 tracking-wide"
            >
              Email
            </label>
            <input
              type="email"
              {...register("email")}
              className="form-control py-3 border-secondary"
              placeholder="you@company.com"
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              className="form-label text-muted small fw-bold mb-2 tracking-wide"
            >
              Password
            </label>
            <div className="position-relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="form-control py-3 border-secondary"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="position-absolute end-0 top-50 translate-middle-y me-3 bg-transparent border-0 small text-muted"
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg rounded-pill w-100 fw-bold mt-4"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Register link */}
        <p
          className="text-sm text-center mt-10 mb-0"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Don't have an account?{" "}
          <Link
            to={ROUTES.REGISTER}
            className="font-medium"
            style={{ color: "var(--color-brand-400)" }}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
