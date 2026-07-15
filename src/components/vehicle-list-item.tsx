import Link from "next/link";
import { VehicleImage } from "@/components/vehicle-image";
import { formatOdometer } from "@/lib/utils";
import { formatVehicleLocation, formatVehiclePrice } from "@/lib/vehicle";
import { StatusBadge } from "@/components/disclaimer";

type VehicleListItemProps = {
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
};

export function VehicleListItem({ vehicle, href, showStatus }: VehicleListItemProps) {
  const imageUrl = vehicle.photos[0]?.url;

  return (
    <Link
      href={href}
      className="group flex animate-stagger-in gap-4 overflow-hidden rounded-sm border border-border/80 bg-card/80 p-3 backdrop-blur-sm transition-all duration-300 hover:border-tesla-red/50 hover:shadow-lg hover:shadow-tesla-red/10 sm:gap-5 sm:p-4"
    >
      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-sm bg-muted sm:h-28 sm:w-40">
        {imageUrl ? (
          <VehicleImage
            src={imageUrl}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="160px"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No photo
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 sm:gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate font-semibold">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {showStatus && vehicle.status && <StatusBadge status={vehicle.status} />}
        </div>
        <p className="line-clamp-1 text-sm text-muted-foreground">{vehicle.trim}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{formatOdometer(vehicle.odometer)}</span>
          <span>Plate {vehicle.licensePlateNumber}</span>
          {formatVehicleLocation(vehicle.site, vehicle.state) !== "—" ? (
            <span>{formatVehicleLocation(vehicle.site, vehicle.state)}</span>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center self-center">
        <p className="text-base font-semibold sm:text-lg">{formatVehiclePrice(vehicle.price)}</p>
      </div>
    </Link>
  );
}
