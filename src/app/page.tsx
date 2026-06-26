import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";

export default function HomePage() {
  return (
    <div className="min-h-screen tesla-gradient">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center animate-slide-up">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-tesla-red">
            Trade-In Program
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Wholesale Portal
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Tesla employees list trade-in vehicles. Approved wholesale partners
            browse inventory and reserve vehicles for purchase.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/login/partner">
              <Button size="lg" className="min-w-[200px]">
                Partner Login
              </Button>
            </Link>
            <Link href="/login/tesla">
              <Button size="lg" variant="outline" className="min-w-[200px]">
                Tesla Employee Login
              </Button>
            </Link>
          </div>

          <div className="mx-auto mt-12 max-w-lg">
            <Disclaimer />
          </div>
        </div>
      </main>
    </div>
  );
}
