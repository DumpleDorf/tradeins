import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SUPPORT_EMAIL = "exampleofsupportemail@tesla.com";

type ForgotPasswordInstructionsProps = {
  variant?: "default" | "hero";
  onBack?: () => void;
};

export function ForgotPasswordInstructions({
  variant = "default",
  onBack,
}: ForgotPasswordInstructionsProps) {
  const isHero = variant === "hero";

  return (
    <div className="mx-auto w-full max-w-md animate-slide-up">
      <div className="mb-6 text-center">
        <h1
          className={cn(
            "text-2xl font-semibold tracking-tight sm:text-3xl",
            isHero && "hero-text-shadow text-white"
          )}
        >
          Reset Password
        </h1>
        <p
          className={cn(
            "mt-2 text-sm sm:text-base",
            isHero ? "hero-text-shadow text-white/90" : "text-muted-foreground"
          )}
        >
          Password resets are handled by the Tesla trade-in team.
        </p>
      </div>

      <div
        className={cn(
          "space-y-4 rounded-sm border p-6 text-left text-sm",
          isHero
            ? "border-white/20 bg-black/40 text-white/90 backdrop-blur-sm"
            : "border-border bg-card text-muted-foreground"
        )}
      >
        <p className={isHero ? "text-white" : "text-foreground"}>
          To request a password reset, send an email to:
        </p>
        <p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Password%20Reset%20Request`}
            className={cn(
              "font-medium break-all hover:underline",
              isHero ? "hero-text-shadow text-tesla-red" : "text-tesla-red"
            )}
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p>Please include the following in your email:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>The email address on your account</li>
          <li>Your company name (for partner accounts)</li>
          <li>Your full name</li>
        </ul>
        <p>A team member will verify your details and reset your password.</p>
      </div>

      <div className="mt-6 text-center">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            className={cn(
              isHero &&
                "border-white/40 bg-black/30 text-white hover:bg-black/50 hover:text-white"
            )}
            onClick={onBack}
          >
            Back to sign in
          </Button>
        ) : (
          <Link
            href="/login"
            className={cn(
              "text-sm hover:underline",
              isHero ? "hero-text-shadow text-white/90" : "text-tesla-red"
            )}
          >
            Back to sign in
          </Link>
        )}
      </div>
    </div>
  );
}
