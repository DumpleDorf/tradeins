"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "postLoginEntrance";

export function markPostLoginEntrance() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // sessionStorage may be unavailable
  }
}

type Phase = "idle" | "enter" | "exit";

/**
 * Brief post-login overlay: logo settle → content cue → dismiss.
 * Triggered once via sessionStorage from LoginForm after successful auth.
 */
export function PostLoginEntrance() {
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    let flag = false;
    try {
      flag = sessionStorage.getItem(STORAGE_KEY) === "1";
      if (flag) sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (!flag) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      return;
    }

    setPhase("enter");
    const exitTimer = window.setTimeout(() => setPhase("exit"), 1100);
    const doneTimer = window.setTimeout(() => setPhase("idle"), 1600);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "idle") return null;

  return (
    <div
      className={cn(
        "post-login-entrance fixed inset-0 z-[300] flex items-center justify-center",
        phase === "exit" && "post-login-entrance--exit"
      )}
      aria-hidden
    >
      <div className="post-login-entrance-panel flex flex-col items-center gap-3 px-8 py-6">
        <div className="post-login-entrance-logo brand-title">
          <span className="brand-title-word post-login-entrance-word">Tesla</span>
          <span className="brand-title-word brand-title-trade post-login-entrance-word">
            Trade-Ins
          </span>
        </div>
        <p className="post-login-entrance-subtitle text-sm tracking-wide text-muted-foreground">
          Welcome back
        </p>
      </div>
    </div>
  );
}
