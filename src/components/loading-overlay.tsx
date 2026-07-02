type LoadingOverlayProps = {
  show: boolean;
  label?: string;
};

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" }) {
  const barCount = size === "sm" ? 3 : 5;
  const dimensions = size === "sm" ? "h-6 gap-1" : "h-11 gap-1.5";

  return (
    <div className={`loading-bars flex items-end justify-center ${dimensions}`} aria-hidden>
      {Array.from({ length: barCount }).map((_, index) => (
        <span
          key={index}
          className="loading-bar w-1.5 rounded-full bg-tesla-red sm:w-2"
          style={{ animationDelay: `${index * 0.12}s` }}
        />
      ))}
    </div>
  );
}

export function LoadingOverlay({ show, label = "Loading..." }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className="loading-overlay-backdrop fixed inset-0 z-[100] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="loading-overlay-panel flex flex-col items-center gap-5 rounded-sm border border-border/80 bg-card/90 px-10 py-8 shadow-2xl backdrop-blur-md">
        <div className="loading-overlay-track relative">
          <LoadingSpinner />
          <span className="loading-overlay-sweep absolute inset-0 rounded-sm" aria-hidden />
        </div>
        <p className="loading-overlay-label text-sm font-medium tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
