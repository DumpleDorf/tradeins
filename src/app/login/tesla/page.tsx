import { Header } from "@/components/header";
import { LoginForm } from "@/components/login-form";
import { Disclaimer } from "@/components/disclaimer";

export default function TeslaLoginPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <LoginForm
          loginType="tesla"
          title="Tesla Employee Login"
          subtitle="Access the wholesale listing and approval dashboard"
        />
        <div className="mx-auto mt-8 max-w-md">
          <Disclaimer variant="listing" />
        </div>
      </main>
    </div>
  );
}
