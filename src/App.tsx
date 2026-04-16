import { RouterProvider } from "react-router-dom";
import { router } from "@/routes";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import { Toaster } from "sonner";
import { PendingEmailsBadge } from "@/components/ui/PendingEmailsBadge";

/**
 * App root — wraps the entire application in context providers.
 *
 * Provider order (outermost → innermost):
 * 1. AuthProvider — token state, login/logout, role
 * 2. UIProvider — sidebar collapse, mobile menu, theme
 * 3. RouterProvider — React Router with all route definitions
 */
export default function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <RouterProvider router={router} />
        <PendingEmailsBadge />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-bg-overlay)",
              border: "1px solid var(--color-border-subtle)",
              color: "var(--color-text-primary)",
              fontSize: "13px",
            },
          }}
        />
      </UIProvider>
    </AuthProvider>
  );
}

