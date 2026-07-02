import { Loader2 } from "lucide-react";

type LoadingOverlayProps = {
  show: boolean;
  label?: string;
};

export function LoadingOverlay({ show, label = "Loading..." }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-sm border border-border bg-card px-8 py-6 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-tesla-red" aria-hidden />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
