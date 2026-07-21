// ==UserScript==
// @name         Tesla Trade-Ins — AMP acquisition scrape
// @namespace    https://www.teslatradeins.com.au
// @version      1.5.3
// @description  Scrape AMP acquisition fields/photos for Trade-Ins ZipLabs import jobs. Only uploads allowlisted photo tiles (vehicle photos + Damage_*), excluding customer documents. Closes the AMP tab when the scrape finishes (success or failure).
// @match        https://amp.tesla.com/acquisition/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function teslaTradeinsAmpScrape() {
  /** Tile titles / labels we scrape. Everything else (customer docs) is skipped. */
  const ALLOWED_TITLES = [
    "Odometer",
    "IntFrontSeats",
    "ExtDriverSide",
    "ExtPassengerSide",
    "FrontAngle",
    "ReverseAngle",
  ];
  const ALLOWED_TITLE_NORMALIZED = ALLOWED_TITLES.map((name) => name.toLowerCase());

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
      "max-width:420px",
      "max-height:50vh",
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
    panel.textContent = `${line}\n${panel.textContent}`.slice(0, 8000);
  }

  function formatError(error) {
    if (!error) return "unknown error";
    if (!(error instanceof Error)) return String(error);
    const bits = [
      `name=${error.name || "Error"}`,
      `message=${error.message || "(empty)"}`,
    ];
    if ("cause" in error && error.cause) {
      bits.push(`cause=${formatError(error.cause)}`);
    }
    if (error.stack) {
      bits.push(`stack=${error.stack.split("\n").slice(0, 3).join(" | ")}`);
    }
    return bits.join("; ");
  }

  function describeImg(img) {
    if (!img) return "img=<none>";
    const src = img.currentSrc || img.src || "";
    const srcKind = src.startsWith("blob:")
      ? "blob"
      : src.startsWith("data:")
        ? "data"
        : src.startsWith("http")
          ? "http"
          : src
            ? "other"
            : "empty";
    return [
      `complete=${img.complete}`,
      `natural=${img.naturalWidth}x${img.naturalHeight}`,
      `display=${img.width}x${img.height}`,
      `srcKind=${srcKind}`,
      `src=${src.slice(0, 96)}`,
    ].join(", ");
  }

  /** Diagnostic only — does not use the bytes. Shows whether blob: URL is still readable. */
  async function probeBlobUrl(img) {
    const src = img?.currentSrc || img?.src || "";
    if (!src.startsWith("blob:")) {
      return `probe=skipped (not blob, kind=${src ? src.slice(0, 16) : "empty"})`;
    }
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      return `probe=ok status=${res.status} type=${blob.type || "?"} size=${blob.size}`;
    } catch (error) {
      return `probe=FAILED ${formatError(error)}`;
    }
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

  function tileKey(wrapper) {
    const title = (wrapper.querySelector(".title-header")?.textContent || "").trim();
    const fileName = (
      wrapper.querySelector(".tile-name")?.textContent || `${title || "document"}.jpg`
    ).trim();
    return { title, fileName, key: `${title}::${fileName}` };
  }

  function normalizeLabel(value) {
    return String(value || "").trim().toLowerCase();
  }

  /** Allowlisted vehicle photos only — equals/contains known names, or Damage_* prefix. */
  function isAllowedPhotoLabel(label) {
    const normalized = normalizeLabel(label);
    if (!normalized) return false;
    if (normalized.startsWith("damage_")) return true;
    return ALLOWED_TITLE_NORMALIZED.some(
      (name) => normalized === name || normalized.includes(name)
    );
  }

  function isAllowedTile(wrapper) {
    const { title, fileName } = tileKey(wrapper);
    const fileStem = fileName.replace(/\.[^.]+$/, "");
    return isAllowedPhotoLabel(title) || isAllowedPhotoLabel(fileStem);
  }

  /**
   * Capture pixels from an already-decoded <img> in the DOM.
   * Never re-fetch blob: URLs — AMP revokes them and fetch then fails with "Failed to fetch".
   */
  function captureFromDomImage(img, maxEdge = 1600, quality = 0.85) {
    if (!img || !img.naturalWidth || !img.naturalHeight) {
      throw new Error(`Image not decoded (${img?.naturalWidth || 0}x${img?.naturalHeight || 0})`);
    }

    let width = img.naturalWidth;
    let height = img.naturalHeight;
    if (Math.max(width, height) > maxEdge) {
      const scale = maxEdge / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.drawImage(img, 0, 0, width, height);

    let dataUrl;
    try {
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    } catch (error) {
      throw new Error(
        `Canvas tainted/blocked (${error instanceof Error ? error.message : "error"})`
      );
    }

    const contentBase64 = dataUrl.split(",")[1];
    if (!contentBase64) throw new Error("Canvas capture empty");
    return { contentBase64, mimeType: "image/jpeg" };
  }

  async function uploadPhoto(origin, jobId, photo) {
    const payload = JSON.stringify({ photo });
    const bytesApprox = payload.length;
    const kb = Math.round(bytesApprox / 1024);
    debug(
      `UPLOAD start title=${photo.title} mime=${photo.mimeType} payload≈${kb}KB url=${origin}/api/ziplabs/jobs/${jobId}/photo`
    );

    let lastError;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const res = await fetch(`${origin}/api/ziplabs/jobs/${jobId}/photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        if (!res.ok) {
          const body = await res.text();
          throw new Error(
            `HTTP ${res.status} ${res.statusText || ""} body=${body.slice(0, 200)}`
          );
        }
        debug(`UPLOAD ok title=${photo.title} attempt=${attempt}`);
        return;
      } catch (error) {
        lastError = error;
        debug(
          `UPLOAD FAIL attempt ${attempt}/3 title=${photo.title} — ${formatError(error)}`
        );
        await sleep(500 * attempt);
      }
    }
    throw new Error(`UPLOAD exhausted — ${formatError(lastError)}`);
  }

  function listTiles() {
    return [...document.querySelectorAll("#current-files-tab .tile-wrapper, .tile-wrapper")];
  }

  async function scrollTileIntoView(wrapper) {
    try {
      wrapper.scrollIntoView({ block: "center", inline: "nearest" });
    } catch {
      // ignore
    }
    await sleep(200);
  }

  async function tryCaptureTile(wrapper, origin, jobId, capturedKeys, photos, failures) {
    const { title, fileName, key } = tileKey(wrapper);
    if (capturedKeys.has(key)) return false;
    if (!isAllowedTile(wrapper)) return false;

    const img = wrapper.querySelector("img.tile-asset-img");
    if (!img?.src) return false;
    if (!(img.complete && img.naturalWidth > 0)) {
      debug(`SKIP not-ready title=${title} — ${describeImg(img)}`);
      return false;
    }

    debug(`CAPTURE try title=${title} — ${describeImg(img)}`);

    let captured;
    try {
      captured = captureFromDomImage(img);
      debug(
        `CAPTURE ok title=${title} base64Chars=${captured.contentBase64.length} mime=${captured.mimeType}`
      );
    } catch (captureError) {
      const probe = await probeBlobUrl(img);
      const message = `CAPTURE fail — ${formatError(captureError)} | ${describeImg(img)} | ${probe}`;
      const entry = `${title}: ${message}`;
      if (!failures.includes(entry)) failures.push(entry);
      debug(`Photo failed: ${title} — ${message}`);
      return false;
    }

    try {
      const photo = {
        title,
        fileName,
        mimeType: captured.mimeType,
        contentBase64: captured.contentBase64,
      };
      await uploadPhoto(origin, jobId, photo);
      photos.push(photo);
      capturedKeys.add(key);
      for (let i = failures.length - 1; i >= 0; i -= 1) {
        if (failures[i].startsWith(`${title}:`)) failures.splice(i, 1);
      }
      debug(
        `Uploaded photo ${photos.length}: ${title} (${img.naturalWidth}x${img.naturalHeight})`
      );
      return true;
    } catch (uploadError) {
      const message = `UPLOAD fail — ${formatError(uploadError)}`;
      const entry = `${title}: ${message}`;
      if (!failures.includes(entry)) failures.push(entry);
      debug(`Photo failed: ${title} — ${message}`);
      return false;
    }
  }

  async function collectPhotos(origin, jobId) {
    const photos = [];
    const failures = [];
    const seenTitles = [];
    const capturedKeys = new Set();

    await waitFor("#current-files-tab .tile-wrapper, .tile-wrapper", 60000);
    await sleep(800);

    /**
     * Critical: capture each image AS SOON as it is decoded.
     * Waiting through long hydrate passes lets AMP revoke blob: URLs; later fetch/clone then
     * fails with "Failed to fetch". Drawing the live <img> immediately avoids that.
     */
    let stableRounds = 0;
    let lastSignature = "";

    for (let pass = 1; pass <= 40 && stableRounds < 5; pass += 1) {
      const wrappers = listTiles();
      for (const wrapper of wrappers) {
        const { title } = tileKey(wrapper);
        if (title && !seenTitles.includes(title)) seenTitles.push(title);
      }

      const imageNodes = [
        ...document.querySelectorAll(
          "#current-files-tab img.tile-asset-img, .tile-wrapper img.tile-asset-img"
        ),
      ];
      const readyImages = imageNodes.filter((img) => img.complete && img.naturalWidth > 0);

      debug(
        `Pass ${pass}: tiles=${wrappers.length}, imgs=${imageNodes.length}, ready=${readyImages.length}, uploaded=${photos.length}`
      );

      // Capture every ready eligible tile immediately.
      for (const wrapper of wrappers) {
        await tryCaptureTile(wrapper, origin, jobId, capturedKeys, photos, failures);
      }

      // Scroll to encourage remaining lazy thumbnails — no clicks.
      for (const wrapper of wrappers) {
        const { key } = tileKey(wrapper);
        if (!isAllowedTile(wrapper) || capturedKeys.has(key)) continue;
        await scrollTileIntoView(wrapper);
        await tryCaptureTile(wrapper, origin, jobId, capturedKeys, photos, failures);
      }

      const root =
        document.querySelector("#current-files-tab") ||
        document.querySelector(".tile-container");
      if (root) {
        root.scrollTop = Math.min(root.scrollTop + 240, root.scrollHeight);
      }

      const signature = `${wrappers.length}:${readyImages.length}:${photos.length}`;
      if (signature === lastSignature) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
        lastSignature = signature;
      }

      await sleep(450);
    }

    // Final sweep top-to-bottom.
    for (const wrapper of listTiles()) {
      await scrollTileIntoView(wrapper);
      await tryCaptureTile(wrapper, origin, jobId, capturedKeys, photos, failures);
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
        "#current-files-tab .tile-wrapper, .tile-wrapper",
        60000
      );
      if (!docsReady) {
        throw new Error("Customer Documents tiles did not load");
      }

      const { photos, failures, seenTitles } = await collectPhotos(origin, jobId);
      debug(
        `Done collecting: ${photos.length} photo(s). Titles seen: ${seenTitles.join(", ")}`
      );
      if (failures.length) {
        debug(`Failures: ${failures.join(" | ")}`);
      }

      if (photos.length === 0) {
        await report(origin, jobId, {
          ok: false,
          error:
            "No vehicle photos could be captured from Customer Documents (images never loaded or capture failed).",
          debug: { tileTitles: seenTitles, photoTitles: [], failures },
        });
        debug("FAILED: 0 photos captured");
        return;
      }

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
      try {
        await report(origin, jobId, { ok: false, error: message });
      } catch (reportError) {
        debug(`Report failed: ${formatError(reportError)}`);
      }
    } finally {
      running = false;
      debug("Closing AMP tab");
      try {
        window.close();
      } catch {
        // ignore — some browsers ignore close if the tab was not script-opened
      }
    }
  }

  async function tick() {
    const { jobId, origin } = readJobFromHash();
    if (!jobId || !origin) return;
    if (jobId === activeJobId || running) return;
    activeJobId = jobId;
    await scrapeJob(jobId, origin);
  }

  window.addEventListener("hashchange", () => {
    void tick();
  });
  setInterval(() => {
    void tick();
  }, 1000);
  void tick();
})();
