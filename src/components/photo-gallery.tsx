"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VehicleImage } from "@/components/vehicle-image";

/** Matches `Header` inner height (`h-16`). Overlay starts below so the navbar stays sharp. */
const NAVBAR_OFFSET_CLASS = "top-16";

type Photo = { url: string };

export function PhotoGallery({ photos }: { photos: Photo[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const count = photos.length;
  const active = photos[activeIndex];

  const goTo = useCallback(
    (index: number) => {
      if (count === 0) return;
      setActiveIndex(((index % count) + count) % count);
    },
    [count]
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setLightboxOpen(false);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [lightboxOpen, goPrev, goNext]);

  useEffect(() => {
    const container = thumbnailsRef.current;
    if (!container) return;
    const thumb = container.children[activeIndex] as HTMLElement | undefined;
    thumb?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex]);

  function onTouchStart(event: TouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: TouchEvent) {
    if (touchStartX.current == null || count < 2) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta > 0) goPrev();
    else goNext();
  }

  if (count === 0) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-sm border border-border/80 bg-card/80 text-muted-foreground backdrop-blur-sm sm:aspect-[16/9]">
        No photos available
      </div>
    );
  }

  const lightbox =
    lightboxOpen && portalReady
      ? createPortal(
          <div
            className={cn(
              "fixed inset-x-0 bottom-0 z-[210] flex items-center justify-center p-3 sm:p-6",
              NAVBAR_OFFSET_CLASS
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
          >
            {/* Dim + blur page content under the navbar only */}
            <button
              type="button"
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              aria-label="Close photo viewer"
              onClick={() => setLightboxOpen(false)}
            />

            <div
              className="relative z-10 flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-sm border border-border/80 bg-card shadow-2xl"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-card px-3 py-2.5 sm:px-4">
                <p className="text-sm font-medium text-foreground">
                  {activeIndex + 1} / {count}
                </p>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  className="rounded-sm border border-border/80 bg-muted/60 p-2 text-foreground transition-colors hover:bg-muted"
                  aria-label="Close photo viewer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black/40 px-12 py-4 sm:px-16 sm:py-6">
                {count > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-sm border border-border/60 bg-card/90 p-2 text-foreground transition-colors hover:bg-card sm:left-3"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-sm border border-border/60 bg-card/90 p-2 text-foreground transition-colors hover:bg-card sm:right-3"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                <div className="relative h-[min(62vh,32rem)] w-full sm:h-[min(68vh,36rem)]">
                  <VehicleImage
                    src={active.url}
                    alt={`Vehicle photo ${activeIndex + 1} of ${count}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    priority
                  />
                </div>
              </div>

              {count > 1 && (
                <div className="filter-panel-scroll flex shrink-0 justify-center gap-2 overflow-x-auto border-t border-border/80 bg-card px-3 py-3 sm:px-4">
                  {photos.map((photo, index) => (
                    <button
                      key={`lb-${photo.url}-${index}`}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={cn(
                        "relative h-12 w-[4.5rem] shrink-0 overflow-hidden rounded-sm border-2 transition-all sm:h-14 sm:w-20",
                        index === activeIndex
                          ? "border-tesla-red opacity-100"
                          : "border-transparent opacity-50 hover:opacity-90"
                      )}
                    >
                      <VehicleImage
                        src={photo.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-[4/3] overflow-hidden rounded-sm border border-border/80 bg-muted sm:aspect-[16/10]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 z-0"
          aria-label="Open photo fullscreen"
        >
          <VehicleImage
            src={active.url}
            alt={`Vehicle photo ${activeIndex + 1} of ${count}`}
            fill
            className="object-cover transition-opacity duration-200"
            sizes="(max-width: 768px) 100vw, 60vw"
            priority
          />
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/55 to-transparent px-3 pb-3 pt-10">
          <div className="flex items-end justify-between gap-3">
            <p className="text-xs font-medium text-white/90 sm:text-sm">
              {activeIndex + 1} / {count}
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-white/20 bg-black/40 px-2 py-1 text-xs text-white/90 backdrop-blur-sm">
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
              View larger
            </span>
          </div>
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-sm border border-border/60 bg-card/80 p-2 text-foreground opacity-90 backdrop-blur-sm transition-opacity hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-sm border border-border/60 bg-card/80 p-2 text-foreground opacity-90 backdrop-blur-sm transition-opacity hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          ref={thumbnailsRef}
          className="filter-panel-scroll flex gap-2 overflow-x-auto pb-1"
          role="listbox"
          aria-label="Photo thumbnails"
        >
          {photos.map((photo, index) => (
            <button
              key={`${photo.url}-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-sm border-2 transition-all sm:h-[4.5rem] sm:w-28",
                index === activeIndex
                  ? "border-tesla-red opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <VehicleImage
                src={photo.url}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="112px"
              />
            </button>
          ))}
        </div>
      )}

      {lightbox}
    </div>
  );
}
