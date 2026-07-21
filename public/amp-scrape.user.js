// ==UserScript==
// @name         Tesla Trade-Ins — AMP acquisition scrape
// @namespace    https://www.teslatradeins.com.au
// @version      1.4.0
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
    "Registration Document",
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
      "max-width:380px",
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
    panel.textContent = `${line}\n${panel.textContent}`.slice(0, 5000);
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

  function waitForImgLoad(img, timeoutMs = 10000) {
    if (img.complete && img.naturalWidth > 0) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        img.removeEventListener("load", onLoad);
        img.removeEventListener("error", onError);
        resolve(ok);
      };
      const onLoad = () => finish(img.naturalWidth > 0);
      const onError = () => finish(false);
      img.addEventListener("load", onLoad);
      img.addEventListener("error", onError);
      window.setTimeout(() => finish(img.complete && img.naturalWidth > 0), timeoutMs);
    });
  }

  async function captureViaCanvas(img) {
    const ok = await waitForImgLoad(img, 12000);
    if (!ok || !img.naturalWidth || !img.naturalHeight) {
      throw new Error(`Image not ready (${img.naturalWidth}x${img.naturalHeight})`);
    }

    // Draw a fresh Image from the same src while the blob is still valid.
    const clone = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Clone image failed to load"));
      image.src = img.currentSrc || img.src;
    });

    const canvas = document.createElement("canvas");
    canvas.width = clone.naturalWidth || img.naturalWidth;
    canvas.height = clone.naturalHeight || img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.drawImage(clone, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const contentBase64 = dataUrl.split(",")[1];
    if (!contentBase64) throw new Error("Canvas capture empty");
    return { contentBase64, mimeType: "image/jpeg" };
  }

  async function captureViaDrawImage(img) {
    const ok = await waitForImgLoad(img, 12000);
    if (!ok || !img.naturalWidth) {
      throw new Error(`DOM image not ready (${img.naturalWidth}x${img.naturalHeight})`);
    }
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const contentBase64 = dataUrl.split(",")[1];
    if (!contentBase64) throw new Error("Canvas capture empty");
    return { contentBase64, mimeType: "image/jpeg" };
  }

  async function captureImage(img) {
    try {
      return await captureViaDrawImage(img);
    } catch (firstError) {
      debug(
        `Direct canvas failed (${firstError instanceof Error ? firstError.message : "error"}), trying clone…`
      );
      return await captureViaCanvas(img);
    }
  }

  async function uploadPhoto(origin, jobId, photo) {
    const res = await fetch(`${origin}/api/ziplabs/jobs/${jobId}/photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photo }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`photo upload failed (${res.status}): ${body.slice(0, 160)}`);
    }
  }

  function listTiles() {
    return [...document.querySelectorAll("#current-files-tab .tile-wrapper, .tile-wrapper")];
  }

  function isExcludedTitle(title) {
    return !title || EXCLUDED.has(title);
  }

  function isPdfOnlyTile(wrapper) {
    const hasPdf = Boolean(wrapper.querySelector("iframe.pdf-preview, .pdf-container"));
    const hasImg = Boolean(wrapper.querySelector("img.tile-asset-img"));
    return hasPdf && !hasImg;
  }

  async function scrollTileIntoView(wrapper) {
    try {
      wrapper.scrollIntoView({ block: "center", inline: "nearest" });
    } catch {
      // ignore
    }
    const root =
      document.querySelector("#current-files-tab") ||
      document.querySelector(".tile-container") ||
      document.scrollingElement;
    // Gentle scroll nudge only — never click tiles.
    if (root) {
      root.scrollTop += 1;
      root.scrollTop -= 1;
    }
    await sleep(350);
  }

  async function waitForTileImage(wrapper, title, timeoutMs = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const img = wrapper.querySelector("img.tile-asset-img");
      if (img?.src) {
        const ready = await waitForImgLoad(img, 4000);
        if (ready && img.naturalWidth > 0) return img;
      }
      await scrollTileIntoView(wrapper);
      await sleep(400);
    }
    return null;
  }

  async function collectPhotos(origin, jobId) {
    const photos = [];
    const failures = [];
    const seenTitles = [];
    const capturedKeys = new Set();

    await waitFor("#current-files-tab .tile-wrapper, .tile-wrapper", 60000);
    await sleep(1200);

    // Pass 1: scroll through the list a few times so lazy thumbnails hydrate (no clicks).
    for (let pass = 0; pass < 8; pass += 1) {
      const wrappers = listTiles();
      const imageCount = document.querySelectorAll(
        "#current-files-tab img.tile-asset-img, .tile-wrapper img.tile-asset-img"
      ).length;
      debug(`Hydrate pass ${pass + 1}: tiles=${wrappers.length}, images=${imageCount}`);

      for (const wrapper of wrappers) {
        await scrollTileIntoView(wrapper);
      }

      const root =
        document.querySelector("#current-files-tab") ||
        document.querySelector(".tile-container");
      if (root) {
        root.scrollTop = 0;
        await sleep(300);
        root.scrollTop = root.scrollHeight;
      }
      await sleep(700);
    }

    // Pass 2: capture each eligible tile that has a loaded image.
    const wrappers = listTiles();
    debug(`Collecting from ${wrappers.length} document tiles…`);

    for (const wrapper of wrappers) {
      const title = (wrapper.querySelector(".title-header")?.textContent || "").trim();
      const fileName = (
        wrapper.querySelector(".tile-name")?.textContent || `${title || "document"}.jpg`
      ).trim();
      const key = `${title}::${fileName}`;

      if (!seenTitles.includes(title || "(untitled)")) {
        seenTitles.push(title || "(untitled)");
      }

      if (isExcludedTitle(title)) {
        debug(`Skip excluded/empty: ${title || "(untitled)"}`);
        continue;
      }

      if (isPdfOnlyTile(wrapper)) {
        debug(`Skip PDF-only tile: ${title}`);
        continue;
      }

      if (capturedKeys.has(key)) continue;

      await scrollTileIntoView(wrapper);
      const img = await waitForTileImage(wrapper, title, 18000);
      if (!img) {
        failures.push(`${title}: no loaded image element`);
        debug(`Skip (no loaded image): ${title}`);
        continue;
      }

      try {
        const captured = await captureImage(img);
        const photo = {
          title,
          fileName,
          mimeType: captured.mimeType,
          contentBase64: captured.contentBase64,
        };
        await uploadPhoto(origin, jobId, photo);
        photos.push(photo);
        capturedKeys.add(key);
        debug(`Uploaded photo ${photos.length}: ${title}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "photo failed";
        failures.push(`${title}: ${message}`);
        debug(`Photo failed: ${title} — ${message}`);
      }
    }

    // Pass 3: one more retry only for failed non-excluded image titles.
    if (failures.length > 0) {
      debug(`Retrying ${failures.length} failed photo(s)…`);
      for (const wrapper of listTiles()) {
        const title = (wrapper.querySelector(".title-header")?.textContent || "").trim();
        const fileName = (
          wrapper.querySelector(".tile-name")?.textContent || `${title || "document"}.jpg`
        ).trim();
        const key = `${title}::${fileName}`;
        if (isExcludedTitle(title) || capturedKeys.has(key) || isPdfOnlyTile(wrapper)) {
          continue;
        }

        await scrollTileIntoView(wrapper);
        const img = await waitForTileImage(wrapper, title, 12000);
        if (!img) continue;

        try {
          const captured = await captureImage(img);
          const photo = {
            title,
            fileName,
            mimeType: captured.mimeType,
            contentBase64: captured.contentBase64,
          };
          await uploadPhoto(origin, jobId, photo);
          photos.push(photo);
          capturedKeys.add(key);
          debug(`Uploaded photo ${photos.length} (retry): ${title}`);
        } catch (error) {
          debug(
            `Retry failed: ${title} — ${error instanceof Error ? error.message : "error"}`
          );
        }
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

  window.addEventListener("hashchange", () => {
    void tick();
  });
  setInterval(() => {
    void tick();
  }, 1000);
  void tick();
})();
