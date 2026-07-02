import { Header } from "@/components/header";
import { HomeHero } from "@/components/home-hero";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <HomeHero />
    </div>
  );
}
