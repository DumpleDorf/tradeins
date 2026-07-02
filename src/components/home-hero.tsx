"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Disclaimer } from "@/components/disclaimer";
import { LoadingSpinner } from "@/components/loading-overlay";
import { LoginForm } from "@/components/login-form";
import { Button } from "@/components/ui/button";
import { getDashboardPath } from "@/lib/rbac";

export function HomeHero() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (searchParams.get("signin") === "1") {
      setShowLogin(true);
    }
  }, [searchParams]);

  const isLoggedIn = !!session?.user;

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
        {status === "loading" ? (
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="sm" />
            <p className="hero-text-shadow text-sm text-white/70">Loading...</p>
          </div>
        ) : showLogin && !isLoggedIn ? (
          <LoginForm
            variant="hero"
            onCancel={() => setShowLogin(false)}
          />
        ) : (
          <>
            <p className="hero-text-shadow mb-4 text-sm uppercase tracking-[0.2em] text-tesla-red">
              Trade-In Program
            </p>
            <h1 className="hero-text-shadow text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              Wholesale Portal
            </h1>
            <p className="hero-text-shadow mx-auto mt-6 max-w-xl text-lg text-white/90">
              Tesla employees list trade-in vehicles. Approved wholesale partners browse
              inventory and purchase vehicles for your company.
            </p>

            {isLoggedIn ? (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Link href={getDashboardPath(session.user.role)}>
                  <Button size="lg" className="min-w-[200px]">
                    Go to Dashboard
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-[140px] border-white/40 bg-black/30 text-white hover:bg-black/50 hover:text-white"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="mt-10 flex items-center justify-center">
                <Button size="lg" className="min-w-[200px]" onClick={() => setShowLogin(true)}>
                  Sign In
                </Button>
              </div>
            )}

            <div className="mx-auto mt-12 w-full max-w-lg">
              <Disclaimer variant="hero" />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
