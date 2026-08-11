import { toast } from "@/components/ui/use-toast";

// One-line toast confirmation for clinician actions. Bottom of screen,
// dark background (existing Toaster), 3-second auto-dismiss.
export function notify(title, description) {
  const t = toast({ title, description });
  setTimeout(() => t.dismiss(), 3000);
}