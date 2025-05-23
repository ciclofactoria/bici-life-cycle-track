
import * as React from "react"
import { toast as sonnerToast } from "sonner";

// Basic context for toasts
const ToastContext = React.createContext<
  | {
      toasts: Toast[];
      showToast: (toast: Omit<Toast, "id">) => void;
    }
  | undefined
>(undefined);

type Toast = {
  id: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "warning";
};

let toastCount = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback(
    (toastParams: Omit<Toast, "id">) => {
      const id = String(++toastCount);
      setToasts((prev) => [...prev, { ...toastParams, id }]);
      // Optionally auto-dismiss after 4s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  // Set up global toast reference
  React.useEffect(() => {
    // @ts-ignore
    window.__GLOBAL_TOAST__ = showToast;
    return () => {
      // @ts-ignore
      window.__GLOBAL_TOAST__ = undefined;
    };
  }, [showToast]);

  const value = React.useMemo(() => ({ toasts, showToast }), [toasts, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return {
    toasts: context.toasts,
    toast: context.showToast,
  };
}

// For backward compatibility
export const toast = sonnerToast;
