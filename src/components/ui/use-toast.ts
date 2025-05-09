
import { useToast as useToastHook, toast } from "@/hooks/use-toast"; 

// Re-export the hooks and functions to maintain backward compatibility
export const useToast = useToastHook;
export { toast };
