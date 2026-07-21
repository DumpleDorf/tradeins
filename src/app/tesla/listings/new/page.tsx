import { redirect } from "next/navigation";

/** Manual vehicle listing is disabled — ZipLabs sync will create listings. */
export default function NewListingPage() {
  redirect("/tesla/listings");
}
