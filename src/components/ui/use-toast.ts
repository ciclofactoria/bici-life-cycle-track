
// Re-export toast functionality from sonner for direct usage
import { toast as sonnerToast, type ToastT } from "sonner";

// Extendemos el tipo para incluir nuestra propiedad variant
export type ExtendedToastT = ToastT & {
  variant?: "default" | "destructive" | "warning";
};

// Personalizamos la función toast para soportar nuestra propiedad variant
export const toast = (
  message: string, 
  options?: ExtendedToastT
) => {
  return sonnerToast(message, options);
};

// Re-export the toast components from our UI library
export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction } from "@/components/ui/toast";
export type { ToastProps, ToastActionElement } from "@/components/ui/toast";

// Re-export the useToast hook from our implementation
export { useToast } from "@/hooks/use-toast";
