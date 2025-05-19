
// En lugar de exportar directamente de @/hooks/use-toast
// Exportamos directamente del módulo de shadcn/ui para evitar dependencias circulares
export { toast, useToast, ToastProvider } from "@/components/ui/toast";

