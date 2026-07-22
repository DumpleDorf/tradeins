"use client";

import { useState } from "react";
import Link from "next/link";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getDashboardPath } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { ForgotPasswordInstructions } from "@/components/forgot-password-instructions";
import { markPostLoginEntrance } from "@/components/post-login-entrance";

type LoginFormProps = {
  title?: string;
  subtitle?: string;
  variant?: "default" | "hero";
  onCancel?: () => void;
};

export function LoginForm({
  title = "Sign In",
  subtitle = "Access the Tesla Trade-In Wholesale Portal",
  variant = "default",
  onCancel,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const isHero = variant === "hero";

  if (showForgotPassword) {
    return (
      <ForgotPasswordInstructions
        variant={variant}
        onBack={() => setShowForgotPassword(false)}
      />
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    const session = await getSession();
    const role = session?.user?.role;
    if (!role) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    const callbackUrl = searchParams.get("callbackUrl");
    const safeCallback =
      callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : getDashboardPath(role);

    markPostLoginEntrance();
    router.push(safeCallback);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md animate-slide-up">
      <div className="mb-8 text-center">
        <h1
          className={cn(
            "text-3xl font-semibold tracking-tight",
            isHero && "hero-text-shadow text-white"
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            "mt-2",
            isHero ? "hero-text-shadow text-white/90" : "text-muted-foreground"
          )}
        >
          {subtitle}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className={cn(
          "space-y-4 rounded-sm border p-6",
          isHero
            ? "border-white/20 bg-black/40 backdrop-blur-sm"
            : "border-border bg-card"
        )}
      >
        {error && (
          <div className="rounded-sm bg-red-500/20 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-2 text-left">
          <Label htmlFor="email" className={isHero ? "text-white" : undefined}>
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={isHero ? "border-white/20 bg-black/30 text-white placeholder:text-white/50" : undefined}
          />
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="password" className={isHero ? "text-white" : undefined}>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className={isHero ? "border-white/20 bg-black/30 text-white placeholder:text-white/50" : undefined}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-center text-sm">
          {isHero ? (
            <button
              type="button"
              className="hero-text-shadow text-white/90 hover:text-white hover:underline"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot password?
            </button>
          ) : (
            <Link href="/forgot-password" className="text-tesla-red hover:underline">
              Forgot password?
            </Link>
          )}
        </p>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full",
              isHero &&
                "border-white/40 bg-black/30 text-white hover:bg-black/50 hover:text-white"
            )}
            onClick={onCancel}
            disabled={loading}
          >
            Back
          </Button>
        )}
      </form>
    </div>
  );
}
