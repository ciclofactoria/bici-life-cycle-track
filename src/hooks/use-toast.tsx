
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
  title?: string;
  description?: string;
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

  return (
    <ToastContext.Provider value={{ toasts, showToast }}>
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

// Export a standalone toast function for direct usage
export const toast = (params: Omit<Toast, "id">) => {
  // Use sonner toast for simpler implementation without context dependency
  sonnerToast(params.title || "", {
    description: params.description,
    action: params.action,
  });
  
  // Also try to use the context-based toast if available
  if (typeof window !== "undefined") {
    // @ts-ignore
    window.__GLOBAL_TOAST__?.(params);
  }
};
