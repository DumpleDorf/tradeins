"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "postLoginEntrance";
const EVENT_NAME = "post-login-entrance";

export function markPostLoginEntrance() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // sessionStorage may be unavailable
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

function consumeFlag(): boolean {
  try {
    const flag = sessionStorage.getItem(STORAGE_KEY) === "1";
    if (flag) sessionStorage.removeItem(STORAGE_KEY);
    return flag;
  } catch {
    return false;
  }
}

type Phase = "idle" | "enter" | "exit";

/**
 * Brief post-login overlay: logo settle → content cue → dismiss.
 * Triggered once via sessionStorage + custom event from LoginForm after successful auth.
 *
 * Providers stay mounted across client navigations, so a mount-only sessionStorage
 * read never sees the flag set just before router.push. The custom event starts the
 * entrance immediately; the mount check covers hard navigations / full reloads.
 */
export function PostLoginEntrance() {
  const [phase, setPhase] = useState<Phase>("idle");
  const runningRef = useRef(false);

  useEffect(() => {
    let exitTimer: number | undefined;
    let doneTimer: number | undefined;

    function startEntrance() {
      if (runningRef.current) return;
      if (!consumeFlag()) return;

      runningRef.current = true;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setPhase("enter");

      // Reduced motion: brief static welcome. Full motion: ~1.6s.
      const exitMs = reduced ? 400 : 1100;
      const doneMs = reduced ? 700 : 1600;

      exitTimer = window.setTimeout(() => setPhase("exit"), exitMs);
      doneTimer = window.setTimeout(() => {
        setPhase("idle");
        runningRef.current = false;
      }, doneMs);
    }

    window.addEventListener(EVENT_NAME, startEntrance);
    startEntrance();

    return () => {
      window.removeEventListener(EVENT_NAME, startEntrance);
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
      if (doneTimer !== undefined) window.clearTimeout(doneTimer);
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
      <div className="post-login-entrance-panel flex flex-col items-center gap-4 px-10 py-8">
        <div className="post-login-entrance-logo brand-title">
          <span className="brand-title-word post-login-entrance-word">Tesla</span>
          <span className="brand-title-word brand-title-trade post-login-entrance-word">
            Trade-Ins
          </span>
        </div>
        <p className="post-login-entrance-subtitle text-base tracking-wide text-white/80">
          Welcome back
        </p>
      </div>
    </div>
  );
}
