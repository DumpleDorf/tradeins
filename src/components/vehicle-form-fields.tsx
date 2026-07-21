import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AU_STATES,
  SERVICE_HISTORY_OPTIONS,
  VEHICLE_DAMAGE_OPTIONS,
  type VehicleDetails,
} from "@/lib/vehicle";
import {
  formatPhotoSize,
  MAX_VEHICLE_PHOTO_BYTES,
  VEHICLE_PHOTO_ACCEPT,
} from "@/lib/vehicle-photos";

export const vehicleSelectClassName =
  "flex h-10 w-full rounded-sm border border-border bg-card px-3 text-sm";

export function RequiredAsterisk() {
  return (
    <span className="text-red-500" aria-hidden="true">
      *
    </span>
  );
}

export function RequiredFieldsHint() {
  return (
    <p className="text-sm text-muted-foreground">
      Fields marked with a <span className="text-red-500">*</span> are mandatory.
    </p>
  );
}

type VehicleFormFieldsProps = {
  defaultValues?: Partial<VehicleDetails>;
  idPrefix?: string;
  showPhotos?: boolean;
  photosRequired?: boolean;
  /** When true, RN Number (primary key) cannot be changed. */
  rnReadOnly?: boolean;
};

export function VehicleFormFields({
  defaultValues,
  idPrefix = "",
  showPhotos = true,
  photosRequired = false,
  rnReadOnly = false,
}: VehicleFormFieldsProps) {
  const fieldId = (name: string) => `${idPrefix}${name}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={fieldId("id")}>
          Vehicle RN <RequiredAsterisk />
        </Label>
        <Input
          id={fieldId("id")}
          name="id"
          defaultValue={defaultValues?.id}
          placeholder="RN126870852"
          pattern="[Rr][Nn]\d+"
          title="Vehicle RN must look like RN126870852"
          required
          readOnly={rnReadOnly}
          className={rnReadOnly ? "bg-muted" : undefined}
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={fieldId("vin")}>
          VIN <RequiredAsterisk />
        </Label>
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
        <Label htmlFor={fieldId("licensePlateNumber")}>
          License Plate Number <RequiredAsterisk />
        </Label>
        <Input
          id={fieldId("licensePlateNumber")}
          name="licensePlateNumber"
          defaultValue={defaultValues?.licensePlateNumber}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("year")}>
          Year <RequiredAsterisk />
        </Label>
        <Input
          id={fieldId("year")}
          name="year"
          type="number"
          defaultValue={defaultValues?.year}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("make")}>
          Make <RequiredAsterisk />
        </Label>
        <Input id={fieldId("make")} name="make" defaultValue={defaultValues?.make} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("model")}>
          Model <RequiredAsterisk />
        </Label>
        <Input id={fieldId("model")} name="model" defaultValue={defaultValues?.model} required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={fieldId("trim")}>
          Trim <RequiredAsterisk />
        </Label>
        <Input id={fieldId("trim")} name="trim" defaultValue={defaultValues?.trim} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("odometer")}>
          Odometer (km) <RequiredAsterisk />
        </Label>
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
        <Label htmlFor={fieldId("price")}>
          Price (AUD) <RequiredAsterisk />
        </Label>
        <Input
          id={fieldId("price")}
          name="price"
          type="number"
          min={0}
          step={1}
          defaultValue={defaultValues?.price ?? 0}
          required
        />
        <p className="text-xs text-muted-foreground">
          Indicative wholesale price. Enter 0 if the vehicle is unpriced.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("site")}>
          Site <RequiredAsterisk />
        </Label>
        <Input
          id={fieldId("site")}
          name="site"
          defaultValue={defaultValues?.site}
          placeholder="Ex. Alexandria"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("state")}>
          State <RequiredAsterisk />
        </Label>
        <select
          id={fieldId("state")}
          name="state"
          className={vehicleSelectClassName}
          defaultValue={defaultValues?.state || ""}
          required
        >
          <option value="" disabled />
          {AU_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("numberOfKeys")}>
          Number of Keys <RequiredAsterisk />
        </Label>
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
        <Label htmlFor={fieldId("vehicleDamage")}>
          Vehicle Damage <RequiredAsterisk />
        </Label>
        <select
          id={fieldId("vehicleDamage")}
          name="vehicleDamage"
          className={vehicleSelectClassName}
          defaultValue={defaultValues?.vehicleDamage ?? ""}
          required
        >
          <option value="" disabled />
          {VEHICLE_DAMAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={fieldId("serviceHistory")}>
          Service History <RequiredAsterisk />
        </Label>
        <select
          id={fieldId("serviceHistory")}
          name="serviceHistory"
          className={vehicleSelectClassName}
          defaultValue={defaultValues?.serviceHistory ?? ""}
          required
        >
          <option value="" disabled />
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
          className="flex w-full rounded-sm border border-border bg-card px-3 py-2 text-sm"
        />
      </div>
      {showPhotos && (
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={fieldId("photos")}>
            Photos {photosRequired ? <RequiredAsterisk /> : null}
          </Label>
          <Input
            id={fieldId("photos")}
            name="photos"
            type="file"
            accept={VEHICLE_PHOTO_ACCEPT}
            multiple
            required={photosRequired}
          />
          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, or GIF. Max {formatPhotoSize(MAX_VEHICLE_PHOTO_BYTES)} per image.
            If an upload fails, resize or compress large photos and try again.
          </p>
        </div>
      )}
    </div>
  );
}
