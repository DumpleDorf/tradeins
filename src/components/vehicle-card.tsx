import Link from "next/link";
import { VehicleImage } from "@/components/vehicle-image";
import { Card, CardContent } from "@/components/ui/card";
import { formatOdometer, cn } from "@/lib/utils";
import { formatVehicleLocation, formatVehiclePrice } from "@/lib/vehicle";
import { StatusBadge } from "@/components/disclaimer";

type VehicleCardProps = {
  vehicle: {
    id: string;
    year: number;
    make: string;
    model: string;
    trim: string;
    odometer: number;
    price: number;
    site?: string;
    state?: string;
    licensePlateNumber: string;
    status?: string;
    photos: { url: string }[];
  };
  href: string;
  showStatus?: boolean;
  compact?: boolean;
};

export function VehicleCard({ vehicle, href, showStatus, compact }: VehicleCardProps) {
  const imageUrl = vehicle.photos[0]?.url;

  return (
    <Link href={href} className="group flex h-full animate-stagger-in flex-col">
      <Card className="flex h-full flex-col overflow-hidden border-border/80 bg-card/80 backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-tesla-red/50 group-hover:shadow-lg group-hover:shadow-tesla-red/10">
        <div
          className={cn(
            "relative shrink-0 overflow-hidden bg-muted",
            compact ? "aspect-square" : "aspect-[16/10]"
          )}
        >
          {imageUrl ? (
            <VehicleImage
              src={imageUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes={compact ? "(max-width: 768px) 50vw, 20vw" : "(max-width: 768px) 100vw, 33vw"}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <CardContent className={cn("flex flex-1 flex-col gap-1.5", compact ? "p-3" : "gap-2 p-4")}>
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn("line-clamp-1 font-semibold", compact && "text-sm")}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            {showStatus && vehicle.status && <StatusBadge status={vehicle.status} />}
          </div>
          <p
            className={cn(
              "line-clamp-2 text-muted-foreground",
              compact ? "min-h-[2.25rem] text-xs" : "min-h-[2.5rem] text-sm"
            )}
          >
            {vehicle.trim || "\u00A0"}
          </p>
          <p className={cn("font-semibold", compact ? "text-base" : "text-lg")}>
            {formatVehiclePrice(vehicle.price)}
          </p>
          <div
            className={cn(
              "mt-auto flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground",
              compact ? "text-xs" : "text-sm"
            )}
          >
            <span>{formatOdometer(vehicle.odometer)}</span>
            <span>Plate {vehicle.licensePlateNumber}</span>
            {formatVehicleLocation(vehicle.site, vehicle.state) !== "—" ? (
              <span>{formatVehicleLocation(vehicle.site, vehicle.state)}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
