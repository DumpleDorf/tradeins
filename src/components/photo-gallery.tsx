"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { VehicleImage } from "@/components/vehicle-image";

export function PhotoGallery({ photos }: { photos: { url: string }[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-sm border border-border/80 bg-card/80 text-muted-foreground backdrop-blur-sm">
        No photos available
      </div>
    );
  }

  const active = photos[activeIndex];

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative aspect-[16/10] overflow-hidden rounded-sm border border-border/80 bg-muted",
          zoomed && "cursor-zoom-out"
        )}
        onClick={() => setZoomed(!zoomed)}
      >
        <VehicleImage
          src={active.url}
          alt="Vehicle photo"
          fill
          className={cn(
            "object-cover transition-transform duration-300",
            zoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
          )}
          sizes="(max-width: 768px) 100vw, 60vw"
          priority
        />
      </div>
      {photos.length > 1 && (
        <div className="filter-panel-scroll flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-sm border-2 transition-colors",
                index === activeIndex
                  ? "border-tesla-red"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <VehicleImage src={photo.url} alt="" fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
