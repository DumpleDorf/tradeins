"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RangeSliderProps = {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  formatValue?: (value: number) => string;
  className?: string;
};

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  formatValue = (v) => String(v),
  className,
}: RangeSliderProps) {
  const [localValue, setLocalValue] = useState(value);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const clampPair = useCallback(
    (next: [number, number]): [number, number] => {
      const low = Math.min(next[0], next[1]);
      const high = Math.max(next[0], next[1]);
      return [Math.max(min, Math.min(max, low)), Math.max(min, Math.min(max, high))];
    },
    [min, max]
  );

  const range = max - min || 1;
  const lowPercent = ((localValue[0] - min) / range) * 100;
  const highPercent = ((localValue[1] - min) / range) * 100;

  function updateAtIndex(index: 0 | 1, raw: number) {
    const next: [number, number] = [...localValue] as [number, number];
    next[index] = raw;
    const clamped = clampPair(next);
    setLocalValue(clamped);
    onChange(clamped);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatValue(localValue[0])}</span>
        <span>{formatValue(localValue[1])}</span>
      </div>
      <div ref={trackRef} className="relative h-6">
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-tesla-red/80"
          style={{ left: `${lowPercent}%`, right: `${100 - highPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={(e) => updateAtIndex(0, Number(e.target.value))}
          className="range-thumb absolute inset-0 z-20 w-full cursor-pointer appearance-none bg-transparent"
          aria-label="Minimum value"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={(e) => updateAtIndex(1, Number(e.target.value))}
          className="range-thumb absolute inset-0 z-30 w-full cursor-pointer appearance-none bg-transparent"
          aria-label="Maximum value"
        />
      </div>
    </div>
  );
}
