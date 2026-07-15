import { Suspense } from "react";
import TeslaReservationsPage from "./reservations-client";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TeslaReservationsPage />
    </Suspense>
  );
}
