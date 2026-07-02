import { Suspense } from "react";
import { Header } from "@/components/header";
import { HomeHero } from "@/components/home-hero";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Suspense fallback={null}>
        <HomeHero />
      </Suspense>
    </div>
  );
}
