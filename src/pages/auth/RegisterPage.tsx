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
      .regex(
        /^[a-zA-Z\s\-']+$/,
        "Name can only contain letters, spaces, hyphens, and apostrophes"
      )
      .refine(
        (val) => val.trim().split(/\s+/).length >= 2,
        "Full name must contain at least two words"
      ),
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

export default function RegisterPage() {
  const { register: registerUser, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    clearError();
    const success = await registerUser(data.name, data.email, data.password);
    if (success) {
      navigate(ROUTES.LOGIN, { replace: true, state: { email: data.email } });
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-4 py-5"
      style={{ background: "var(--color-bg-base)" }}
    >
      <div
        className="card shadow-lg rounded-4 border-0 p-4 p-md-5 bg-dark w-100 my-4"
        style={{ maxWidth: "450px" }}
      >
        <div className="d-flex justify-content-center mb-4">
          <img src="/NEW AIB AXYS AFRICA LOGO DARK BG.svg" alt="AIB AXYS Africa" className="h-10 w-auto" style={{ height: "40px" }} />
        </div>

        <h1
          className="fs-4 fw-bold text-center mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          Create account
        </h1>
        <p
          className="text-center mb-4"
          style={{ color: "var(--color-text-secondary)", fontSize: "14px" }}
        >
          Register for OFDS access
        </p>

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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-5">
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold mb-2">
                  Full name
                </label>
                <input
                  {...register("name")}
                  className="form-control py-3 border-secondary"
                  placeholder="David Rashid Herbling"
                  autoComplete="name"
                  autoFocus
                />
                {errors.name && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.name.message}</p>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="form-control py-3 border-secondary"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.email.message}</p>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label text-muted small fw-bold mb-2">
                  Password
                </label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className="form-control py-3 border-secondary"
                    placeholder="Min 8 chars, upper, lower, number, special"
                    autoComplete="new-password"
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
                  <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.password.message}</p>
                )}
              </div>

              <div className="mb-4">
                <label className="form-label text-muted small fw-bold mb-2">
                  Confirm password
                </label>
                <input
                  type="password"
                  {...register("confirmPassword")}
                  className="form-control py-3 border-secondary"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-xs mt-1" style={{ color: "var(--color-destructive)" }}>{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg rounded-pill w-100 fw-bold mt-2"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="text-sm text-center mt-10" style={{ color: "var(--color-text-tertiary)" }}>
              Already have an account?{" "}
              <Link to={ROUTES.LOGIN} className="font-medium" style={{ color: "var(--color-brand-400)" }}>
                Sign in
              </Link>
            </p>
      </div>
    </div>
  );
}
