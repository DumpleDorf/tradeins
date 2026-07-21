// ==UserScript==
// @name         Tesla Trade-Ins — AMP acquisition scrape
// @namespace    https://www.teslatradeins.com.au
// @version      1.1.0
// @description  Scrape AMP acquisition fields/photos for Trade-Ins ZipLabs import jobs.
// @match        https://amp.tesla.com/acquisition/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(async function teslaTradeinsAmpScrape() {
  const EXCLUDED = new Set([
    "Ownership Transfer Document",
    "Release of Liability",
    "Registration",
  ]);

  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const jobId = hash.get("teslatradeinsJob");
  const origin = hash.get("teslatradeinsOrigin");
  const hasOpener = Boolean(window.opener && !window.opener.closed);

  if (!jobId && !hasOpener) {
    return;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function inputValue(name) {
    const el = document.querySelector(`[name="${name}"]`);
    if (!el) return "";
    if (el instanceof HTMLSelectElement) return el.value || "";
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      return el.value || "";
    }
    return "";
  }

  async function waitFor(selector, timeoutMs) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const node = document.querySelector(selector);
      if (node) return node;
      await sleep(250);
    }
    return null;
  }

  async function blobToBase64(blob) {
    const buffer = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async function report(payload) {
    if (hasOpener) {
      try {
        window.opener.postMessage(
          { source: "tesla-tradeins-amp-scrape", ampUrl: location.href, ...payload },
          "*"
        );
      } catch {
        // ignore
      }
    }

    if (jobId && origin) {
      await fetch(`${origin}/api/ziplabs/jobs/${jobId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
  }

  try {
    const vinReady = await waitFor('input[name="vin"]', 60000);
    if (!vinReady) {
      throw new Error("AMP vehicle form did not load (vin field missing).");
    }
    await sleep(1500);

    const fields = {
      vin: inputValue("vin"),
      licensePlateNumber: inputValue("registrationNumber"),
      year: inputValue("year"),
      make: inputValue("make"),
      model: inputValue("model"),
      trim: inputValue("trim"),
      odometer: inputValue("currentOdometer"),
      finalOffer: inputValue("finalOffer"),
      numberOfKeys: inputValue("keyCount"),
      isDamage: inputValue("isDamage"),
      serviceHistory: inputValue("serviceHistory"),
      vehicleNotes: inputValue("vehicleNotes"),
    };

    const docsLink =
      document.getElementById(
        "acquisition-management-admin-tool-acquisition-managment-sidebar-route-customer-documents-link"
      ) || document.querySelector('a[href="/customer-documents"]');

    if (docsLink) {
      docsLink.click();
    }

    await waitFor("#current-files-tab .tile-wrapper, .tile-wrapper img.tile-asset-img", 45000);
    await sleep(1500);

    const photos = [];
    for (const wrapper of document.querySelectorAll(".tile-wrapper")) {
      const title = (wrapper.querySelector(".title-header")?.textContent || "").trim();
      if (!title || EXCLUDED.has(title)) continue;

      const img = wrapper.querySelector("img.tile-asset-img");
      if (!img || !img.src) continue;

      try {
        const res = await fetch(img.src);
        const blob = await res.blob();
        if (!blob.type.startsWith("image/")) continue;
        const contentBase64 = await blobToBase64(blob);
        const fileName =
          (wrapper.querySelector(".tile-name")?.textContent || `${title}.jpg`).trim() ||
          `${title}.jpg`;
        photos.push({
          title,
          fileName,
          mimeType: blob.type || "image/jpeg",
          contentBase64,
        });
      } catch (photoError) {
        console.warn("[teslatradeins] Failed to read document image", title, photoError);
      }
    }

    await report({ ok: true, fields, photos });
  } catch (error) {
    await report({
      ok: false,
      error: error instanceof Error ? error.message : "AMP scrape failed",
    });
  }
})();
