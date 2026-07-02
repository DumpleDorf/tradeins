type LoadingOverlayProps = {
  show: boolean;
  label?: string;
};

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" }) {
  const dimension = size === "sm" ? "h-6 w-6" : "h-11 w-11";
  const innerInset = size === "sm" ? "inset-1" : "inset-[0.35rem]";
  const dotSize = size === "sm" ? "h-1.5 w-1.5" : "h-[0.4rem] w-[0.4rem]";

  return (
    <div className={`loading-spinner ${dimension}`} aria-hidden>
      <span className="loading-spinner-orbit absolute inset-0 rounded-full border-2 border-transparent" />
      <span
        className={`loading-spinner-orbit loading-spinner-orbit--reverse absolute rounded-full border-2 border-transparent ${innerInset}`}
      />
      <span className={`loading-spinner-dot absolute left-1/2 top-1/2 rounded-full ${dotSize}`} />
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
      <div className="loading-overlay-panel flex flex-col items-center gap-4 rounded-sm border border-border/80 bg-card/90 px-10 py-8 shadow-2xl backdrop-blur-md">
        <LoadingSpinner />
        <p className="loading-overlay-label text-sm font-medium tracking-wide text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
