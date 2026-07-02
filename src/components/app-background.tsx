export function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="app-bg-base absolute inset-0" />
      <div className="app-bg-grid absolute inset-0 opacity-[0.35]" />
      <div className="app-bg-glow app-bg-glow-a absolute -left-1/4 top-0 h-[520px] w-[520px] rounded-full" />
      <div className="app-bg-glow app-bg-glow-b absolute -right-1/4 top-1/3 h-[480px] w-[480px] rounded-full" />
      <div className="app-bg-glow app-bg-glow-c absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full" />
    </div>
  );
}
