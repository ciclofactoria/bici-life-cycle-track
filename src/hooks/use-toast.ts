
import * as React from "react"

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

// This is a convenience export
export const toast = (params: Omit<Toast, "id">) => {
  // In real usage, you'd want to ensure ToastProvider is mounted high up
  if (typeof window !== "undefined") {
    // Small hack to trigger toasts globally
    // @ts-ignore
    window.__GLOBAL_TOAST__?.(params);
  }
};

// Save the global ref for the global toast helper
if (typeof window !== "undefined") {
  // @ts-ignore
  window.__GLOBAL_TOAST__ = undefined;
  // To use, one can do:
  // -- in the ToastProvider effect:
  //   useEffect(() => { window.__GLOBAL_TOAST__ = showToast; }, [showToast]);
}

