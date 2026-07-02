import { Disclaimer } from "@/components/disclaimer";
import { HomeCta } from "@/components/home-cta";

export function HomeHero() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden">
      <video
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden
      >
        <source src="/videos/model3pbroll.mp4" type="video/mp4" />
      </video>

      <div className="pointer-events-none absolute inset-0 bg-black/55" aria-hidden />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-20">
        <p className="hero-text-shadow mb-4 text-sm uppercase tracking-[0.2em] text-tesla-red">
          Trade-In Program
        </p>
        <h1 className="hero-text-shadow text-4xl font-semibold tracking-tight text-white sm:text-6xl">
          Wholesale Portal
        </h1>
        <p className="hero-text-shadow mx-auto mt-6 max-w-xl text-lg text-white/90">
          Tesla employees list trade-in vehicles. Approved wholesale partners browse inventory
          and reserve vehicles for purchase.
        </p>

        <HomeCta />

        <div className="mx-auto mt-12 w-full max-w-lg">
          <Disclaimer variant="hero" />
        </div>
      </div>
    </main>
  );
}
