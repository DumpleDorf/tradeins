import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatMileage, formatPrice } from "@/lib/utils";
import { StatusBadge } from "@/components/disclaimer";

type VehicleCardProps = {
  vehicle: {
    id: string;
    year: number;
    make: string;
    model: string;
    mileage: number;
    conditionGrade: number;
    listPrice: string | number;
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
            <Image
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
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{formatMileage(vehicle.mileage)}</span>
            <span>Grade {vehicle.conditionGrade}/5</span>
          </div>
          <p className="text-lg font-semibold text-tesla-red">
            {formatPrice(vehicle.listPrice)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">indicative</span>
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
