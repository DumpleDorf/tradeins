import { PhotoGallery } from "@/components/photo-gallery";
import { StatusBadge } from "@/components/disclaimer";
import { getVehicleDetailRows, formatVehiclePrice, type VehicleDetails } from "@/lib/vehicle";

type VehicleDetailContentProps = {
  vehicle: VehicleDetails & {
    photos: { url: string }[];
    status?: string;
    listedBy?: { name: string };
  };
  statusBadge?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
};

export function VehicleDetailContent({
  vehicle,
  statusBadge,
  subtitle,
  actions,
  sidebar,
}: VehicleDetailContentProps) {
  const badgeStatus = statusBadge ?? vehicle.status;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            {badgeStatus && <StatusBadge status={badgeStatus} />}
          </div>
          {vehicle.price > 0 ? (
            <p className="text-2xl font-semibold text-tesla-red sm:text-3xl">
              {formatVehiclePrice(vehicle.price)}
            </p>
          ) : (
            <p className="text-lg font-medium text-muted-foreground sm:text-xl">Unpriced</p>
          )}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {vehicle.listedBy && (
            <p className="text-sm text-muted-foreground">Listed by {vehicle.listedBy.name}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <PhotoGallery photos={vehicle.photos} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Vehicle details
            </h2>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {getVehicleDetailRows(vehicle).map(([label, value]) => (
                <div key={label} className={label === "Trim" ? "sm:col-span-2" : undefined}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-sm border border-border/80 bg-card/80 p-5 backdrop-blur-sm">
            <h2 className="mb-3 font-semibold">Vehicle notes</h2>
            <div className="filter-panel-scroll max-h-48 overflow-y-auto pr-1">
              <p className="text-sm leading-relaxed text-muted-foreground">{vehicle.vehicleNotes}</p>
            </div>
          </div>

          {sidebar}
        </div>
      </div>
    </div>
  );
}
