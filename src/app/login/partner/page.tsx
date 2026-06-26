import { Header } from "@/components/header";
import { LoginForm } from "@/components/login-form";
import { Disclaimer } from "@/components/disclaimer";

export default function PartnerLoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <LoginForm
          loginType="partner"
          title="Partner Login"
          subtitle="Browse and reserve certified trade-in inventory"
        />
        <div className="mx-auto mt-8 max-w-md">
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
