import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

type VehicleImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

export function VehicleImage({ src, alt, className, fill, sizes, priority, loading }: VehicleImageProps) {
  if (src.startsWith("data:") || src.startsWith("blob:")) {
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={cn("absolute inset-0 h-full w-full object-cover", className)}
        />
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      sizes={sizes}
      priority={priority}
      loading={loading}
    />
  );
}
