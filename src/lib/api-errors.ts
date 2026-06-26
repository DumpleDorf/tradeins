export function formatApiError(
  data: unknown,
  fallback = "Something went wrong. Check all fields."
): string {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const payload = data as { error?: unknown };
  if (typeof payload.error === "string") {
    return payload.error;
  }

  if (payload.error && typeof payload.error === "object") {
    const flat = payload.error as {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
    };
    const messages: string[] = [];

    if (flat.formErrors?.length) {
      messages.push(...flat.formErrors);
    }

    for (const [field, msgs] of Object.entries(flat.fieldErrors ?? {})) {
      if (msgs?.length) {
        messages.push(`${field}: ${msgs.join(", ")}`);
      }
    }

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  return fallback;
}
