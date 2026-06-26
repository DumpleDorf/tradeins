import Link from "next/link";
import { VehicleImage } from "@/components/vehicle-image";
import { Card, CardContent } from "@/components/ui/card";
import { formatOdometer } from "@/lib/utils";
import { formatVehiclePrice } from "@/lib/vehicle";
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
    licensePlateNumber: string;
    status?: string;
    photos: { url: string }[];
  };
  href: string;
  showStatus?: boolean;
};

export function VehicleCard({ vehicle, href, showStatus }: VehicleCardProps) {
  const imageUrl = vehicle.photos[0]?.url;

  return (
    <Link href={href} className="group block animate-fade-in">
      <Card className="overflow-hidden group-hover:border-tesla-red/50">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {imageUrl ? (
            <VehicleImage
              src={imageUrl}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <CardContent className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            {showStatus && vehicle.status && <StatusBadge status={vehicle.status} />}
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">{vehicle.trim}</p>
          {vehicle.price > 0 && (
            <p className="text-lg font-semibold">{formatVehiclePrice(vehicle.price)}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{formatOdometer(vehicle.odometer)}</span>
            <span>Plate {vehicle.licensePlateNumber}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
