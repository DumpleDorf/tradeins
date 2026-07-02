"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Star } from "lucide-react";
import { VehicleImage } from "@/components/vehicle-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatPhotoSize,
  MAX_VEHICLE_PHOTO_BYTES,
  VEHICLE_PHOTO_ACCEPT,
} from "@/lib/vehicle-photos";

export type ManagedPhoto = {
  id: string;
  url: string;
};

export type UploadPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

type ListingPhotoManagerProps = {
  photos: ManagedPhoto[];
  onChange: (photos: ManagedPhoto[]) => void;
  onRemove: (photoId: string) => void;
  emptyMessage?: string;
};

export function ListingPhotoManager({
  photos,
  onChange,
  onRemove,
  emptyMessage = "No photos on this listing.",
}: ListingPhotoManagerProps) {
  function movePhoto(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= photos.length) return;
    const next = [...photos];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onChange(next);
  }

  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Drag order with the arrows. The first photo is used as the cover image in search
        results and listings.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={cn(
              "overflow-hidden rounded-sm border bg-card",
              index === 0 ? "border-tesla-red/50 ring-1 ring-tesla-red/20" : "border-border"
            )}
          >
            <div className="relative aspect-[16/10] bg-muted">
              <VehicleImage
                src={photo.url}
                alt=""
                fill
                className="object-cover"
                sizes="240px"
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-sm bg-tesla-red px-2 py-1 text-xs font-medium text-white">
                  <Star className="h-3 w-3 fill-current" />
                  Cover
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 p-2">
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => movePhoto(index, -1)}
                  disabled={index === 0}
                  aria-label="Move photo earlier"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => movePhoto(index, 1)}
                  disabled={index === photos.length - 1}
                  aria-label="Move photo later"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onRemove(photo.id)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ListingPhotoUploadProps = {
  photos: UploadPhoto[];
  onChange: (photos: UploadPhoto[]) => void;
};

export function ListingPhotoUpload({ photos, onChange }: ListingPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    };
  }, []);

  function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;

    const added = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    onChange([...photos, ...added]);
    e.target.value = "";
  }

  function handleRemove(photoId: string) {
    const photo = photos.find((item) => item.id === photoId);
    if (photo) {
      URL.revokeObjectURL(photo.previewUrl);
    }
    onChange(photos.filter((item) => item.id !== photoId));
  }

  function handleReorder(managed: ManagedPhoto[]) {
    onChange(managed.map((item) => photos.find((photo) => photo.id === item.id)!));
  }

  return (
    <div className="space-y-3 rounded-sm border border-border/80 bg-card/80 p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">Photos</h2>
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Add photos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={VEHICLE_PHOTO_ACCEPT}
          multiple
          className="hidden"
          onChange={handleAdd}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, WebP, or GIF. Max {formatPhotoSize(MAX_VEHICLE_PHOTO_BYTES)} per image. If an
        upload fails, resize or compress large photos and try again.
      </p>
      <ListingPhotoManager
        photos={photos.map((photo) => ({ id: photo.id, url: photo.previewUrl }))}
        onChange={handleReorder}
        onRemove={handleRemove}
        emptyMessage="No photos added yet. Add at least one photo — the first image becomes the cover."
      />
    </div>
  );
}
