import { Header } from "@/components/header";
import { ForgotPasswordInstructions } from "@/components/forgot-password-instructions";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-md px-4 py-16">
        <ForgotPasswordInstructions />
      </main>
    </div>
  );
}
