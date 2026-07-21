// ==UserScript==
// @name         Tesla Trade-Ins — AMP acquisition scrape
// @namespace    https://www.teslatradeins.com.au
// @version      1.2.0
// @description  Scrape AMP acquisition fields/photos for Trade-Ins ZipLabs import jobs.
// @match        https://amp.tesla.com/acquisition/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function teslaTradeinsAmpScrape() {
  const EXCLUDED = new Set([
    "Ownership Transfer Document",
    "Release of Liability",
    "Registration",
  ]);

  let activeJobId = null;
  let running = false;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function readJobFromHash() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return {
      jobId: hash.get("teslatradeinsJob"),
      origin: hash.get("teslatradeinsOrigin"),
    };
  }

  function ensureDebugPanel() {
    let panel = document.getElementById("teslatradeins-amp-debug");
    if (panel) return panel;
    panel = document.createElement("div");
    panel.id = "teslatradeins-amp-debug";
    panel.style.cssText = [
      "position:fixed",
      "right:12px",
      "bottom:12px",
      "z-index:2147483647",
      "max-width:360px",
      "max-height:45vh",
      "overflow:auto",
      "padding:12px 14px",
      "border-radius:8px",
      "background:#111",
      "color:#fff",
      "font:12px/1.4 ui-sans-serif,system-ui,sans-serif",
      "box-shadow:0 8px 24px rgba(0,0,0,.35)",
      "white-space:pre-wrap",
    ].join(";");
    panel.textContent = "Trade-Ins AMP scrape: idle";
    document.documentElement.appendChild(panel);
    return panel;
  }

  function debug(message) {
    const panel = ensureDebugPanel();
    const line = `[${new Date().toLocaleTimeString()}] ${message}`;
    panel.textContent = `${line}\n${panel.textContent}`.slice(0, 4000);
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

  async function fetchBlobWithRetry(src, attempts = 3) {
    let lastError;
    for (let i = 0; i < attempts; i += 1) {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (!blob.type.startsWith("image/")) {
          throw new Error(`Not an image (${blob.type || "unknown"})`);
        }
        return blob;
      } catch (error) {
        lastError = error;
        await sleep(400 * (i + 1));
      }
    }
    throw lastError || new Error("Failed to fetch image blob");
  }

  function findScrollRoot() {
    return (
      document.querySelector("#current-files-tab") ||
      document.querySelector(".tile-container") ||
      document.scrollingElement ||
      document.documentElement
    );
  }

  async function revealAllDocumentTiles() {
    const root = findScrollRoot();
    let stableRounds = 0;
    let lastCount = -1;

    for (let i = 0; i < 40 && stableRounds < 4; i += 1) {
      const wrappers = document.querySelectorAll("#current-files-tab .tile-wrapper, .tile-wrapper");
      const images = document.querySelectorAll(
        "#current-files-tab img.tile-asset-img, .tile-wrapper img.tile-asset-img"
      );
      const count = wrappers.length;
      debug(`Loading documents… tiles=${count}, images=${images.length}`);

      if (root instanceof Element) {
        root.scrollTop = root.scrollHeight;
      }
      window.scrollTo(0, document.body.scrollHeight);

      // Nudge each tile into view so lazy thumbnails hydrate.
      wrappers.forEach((wrapper, index) => {
        try {
          wrapper.scrollIntoView({ block: index % 2 === 0 ? "start" : "end", inline: "nearest" });
        } catch {
          // ignore
        }
      });

      await sleep(700);

      if (count === lastCount && images.length > 0) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
        lastCount = count;
      }
    }

    if (root instanceof Element) {
      root.scrollTop = 0;
    }
    window.scrollTo(0, 0);
    await sleep(500);
  }

  async function collectPhotos(origin, jobId) {
    const photos = [];
    const failures = [];
    const seenTitles = [];
    const wrappers = [
      ...document.querySelectorAll("#current-files-tab .tile-wrapper, .tile-wrapper"),
    ];

    debug(`Collecting from ${wrappers.length} document tiles…`);

    for (const wrapper of wrappers) {
      const title = (wrapper.querySelector(".title-header")?.textContent || "").trim();
      const fileName =
        (wrapper.querySelector(".tile-name")?.textContent || `${title || "document"}.jpg`).trim();
      seenTitles.push(title || "(untitled)");

      if (!title || EXCLUDED.has(title)) {
        debug(`Skip excluded/empty: ${title || "(untitled)"}`);
        continue;
      }

      const img = wrapper.querySelector("img.tile-asset-img");
      if (!img?.src) {
        failures.push(`${title}: no img.tile-asset-img`);
        debug(`Skip (no image element): ${title}`);
        continue;
      }

      try {
        const blob = await fetchBlobWithRetry(img.src);
        const contentBase64 = await blobToBase64(blob);
        const photo = {
          title,
          fileName,
          mimeType: blob.type || "image/jpeg",
          contentBase64,
        };

        // Upload one photo at a time to avoid huge JSON payloads.
        if (origin && jobId) {
          const res = await fetch(`${origin}/api/ziplabs/jobs/${jobId}/photo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photo }),
          });
          if (!res.ok) {
            const body = await res.text();
            throw new Error(`photo upload failed (${res.status}): ${body.slice(0, 160)}`);
          }
          debug(`Uploaded photo ${photos.length + 1}: ${title}`);
        }

        photos.push(photo);
      } catch (error) {
        const message = error instanceof Error ? error.message : "photo failed";
        failures.push(`${title}: ${message}`);
        debug(`Photo failed: ${title} — ${message}`);
      }
    }

    return { photos, failures, seenTitles };
  }

  async function report(origin, jobId, payload) {
    const hasOpener = Boolean(window.opener && !window.opener.closed);
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
      // Strip bulky base64 from complete payload — photos already uploaded individually.
      const slim = {
        ...payload,
        photos: Array.isArray(payload.photos)
          ? payload.photos.map(({ title, fileName, mimeType }) => ({
              title,
              fileName,
              mimeType,
              contentBase64: "",
            }))
          : [],
      };
      const res = await fetch(`${origin}/api/ziplabs/jobs/${jobId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slim),
      });
      if (!res.ok) {
        throw new Error(`Failed to complete job (${res.status})`);
      }
    }
  }

  async function scrapeJob(jobId, origin) {
    running = true;
    ensureDebugPanel();
    debug(`Starting job ${jobId}`);

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
      debug(`Fields ready: ${fields.make} ${fields.model} / VIN ${fields.vin || "(missing)"}`);

      const docsLink =
        document.getElementById(
          "acquisition-management-admin-tool-acquisition-managment-sidebar-route-customer-documents-link"
        ) || document.querySelector('a[href="/customer-documents"]');

      if (!docsLink) {
        throw new Error("Customer Documents link not found");
      }
      docsLink.click();
      debug("Opened Customer Documents");

      const docsReady = await waitFor(
        "#current-files-tab .tile-wrapper, .tile-wrapper img.tile-asset-img, .tile-wrapper",
        60000
      );
      if (!docsReady) {
        throw new Error("Customer Documents tiles did not load");
      }

      await revealAllDocumentTiles();
      const { photos, failures, seenTitles } = await collectPhotos(origin, jobId);

      debug(
        `Done collecting: ${photos.length} photo(s). Titles seen: ${seenTitles.join(", ")}`
      );

      await report(origin, jobId, {
        ok: true,
        fields,
        photos,
        debug: {
          tileTitles: seenTitles,
          photoTitles: photos.map((photo) => photo.title),
          failures,
        },
      });
      debug(`Reported success with ${photos.length} photo(s)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AMP scrape failed";
      debug(`FAILED: ${message}`);
      await report(origin, jobId, { ok: false, error: message });
    } finally {
      running = false;
    }
  }

  async function tick() {
    const { jobId, origin } = readJobFromHash();
    if (!jobId || !origin) return;
    if (jobId === activeJobId || running) return;
    activeJobId = jobId;
    await scrapeJob(jobId, origin);
  }

  // Re-run when the shared AMP window navigates to the next RN/job.
  window.addEventListener("hashchange", () => {
    void tick();
  });
  setInterval(() => {
    void tick();
  }, 1000);
  void tick();
})();
