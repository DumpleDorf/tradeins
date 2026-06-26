import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SERVICE_HISTORY_OPTIONS,
  VEHICLE_DAMAGE_OPTIONS,
  type VehicleDetails,
} from "@/lib/vehicle";

export const vehicleSelectClassName =
  "flex h-10 w-full rounded-sm border border-border bg-card px-3 text-sm";

type VehicleFormFieldsProps = {
  defaultValues?: Partial<VehicleDetails>;
  idPrefix?: string;
  showPhotos?: boolean;
  photosRequired?: boolean;
};

export function VehicleFormFields({
  defaultValues,
  idPrefix = "",
  showPhotos = true,
  photosRequired = false,
}: VehicleFormFieldsProps) {
  const fieldId = (name: string) => `${idPrefix}${name}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={fieldId("vin")}>VIN</Label>
        <Input
          id={fieldId("vin")}
          name="vin"
          defaultValue={defaultValues?.vin}
          minLength={11}
          maxLength={17}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("licensePlateNumber")}>License Plate Number</Label>
        <Input
          id={fieldId("licensePlateNumber")}
          name="licensePlateNumber"
          defaultValue={defaultValues?.licensePlateNumber}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("year")}>Year</Label>
        <Input
          id={fieldId("year")}
          name="year"
          type="number"
          defaultValue={defaultValues?.year}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("make")}>Make</Label>
        <Input id={fieldId("make")} name="make" defaultValue={defaultValues?.make} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("model")}>Model</Label>
        <Input id={fieldId("model")} name="model" defaultValue={defaultValues?.model} required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={fieldId("trim")}>Trim</Label>
        <Input id={fieldId("trim")} name="trim" defaultValue={defaultValues?.trim} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("odometer")}>Odometer (km)</Label>
        <Input
          id={fieldId("odometer")}
          name="odometer"
          type="number"
          min={0}
          defaultValue={defaultValues?.odometer}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("numberOfKeys")}>Number of Keys</Label>
        <Input
          id={fieldId("numberOfKeys")}
          name="numberOfKeys"
          type="number"
          min={0}
          max={10}
          defaultValue={defaultValues?.numberOfKeys}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("vehicleDamage")}>Vehicle Damage</Label>
        <select
          id={fieldId("vehicleDamage")}
          name="vehicleDamage"
          className={vehicleSelectClassName}
          defaultValue={defaultValues?.vehicleDamage ?? "No"}
          required
        >
          {VEHICLE_DAMAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("serviceHistory")}>Service History</Label>
        <select
          id={fieldId("serviceHistory")}
          name="serviceHistory"
          className={vehicleSelectClassName}
          defaultValue={defaultValues?.serviceHistory ?? SERVICE_HISTORY_OPTIONS[0]}
          required
        >
          {SERVICE_HISTORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={fieldId("vehicleNotes")}>Vehicle Notes</Label>
        <textarea
          id={fieldId("vehicleNotes")}
          name="vehicleNotes"
          rows={4}
          defaultValue={defaultValues?.vehicleNotes}
          required
          className="flex w-full rounded-sm border border-border bg-card px-3 py-2 text-sm"
        />
      </div>
      {showPhotos && (
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={fieldId("photos")}>
            {photosRequired ? "Photos" : "Add photos (optional)"}
          </Label>
          <Input
            id={fieldId("photos")}
            name="photos"
            type="file"
            accept="image/*"
            multiple
            required={photosRequired}
          />
        </div>
      )}
    </div>
  );
}
