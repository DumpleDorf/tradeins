"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ListingsPageActions() {
  const { data: session } = useSession();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  async function handleDeleteAll() {
    if (
      !window.confirm(
        "Delete ALL vehicle listings? This also removes photos and reservations. This cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/vehicles/delete-all", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert(typeof data.error === "string" ? data.error : "Failed to delete listings");
        return;
      }
      router.refresh();
      window.location.reload();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {isSuperAdmin ? (
        <Button
          type="button"
          variant="destructive"
          disabled={deleting}
          onClick={handleDeleteAll}
        >
          {deleting ? "Deleting…" : "Delete all listings"}
        </Button>
      ) : null}

      <span className="inline-flex cursor-not-allowed" title="manual vehicle listing disabled">
        <Button
          type="button"
          disabled
          tabIndex={-1}
          className="pointer-events-none shadow-md shadow-tesla-red/20 opacity-50"
          aria-disabled="true"
        >
          New Listing
        </Button>
      </span>
    </div>
  );
}
