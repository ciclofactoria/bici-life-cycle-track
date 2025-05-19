
// This file should re-export the toast functionality
// We're removing the circular dependency by properly organizing exports

import { toast as sonnerToast } from "sonner";
export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction } from "@/components/ui/toast";
export type { ToastProps, ToastActionElement } from "@/components/ui/toast";

// Re-export the toast function from sonner for direct usage
export const toast = sonnerToast;

// Re-export useToast hook from our hook implementation
export { useToast } from "@/hooks/use-toast";
