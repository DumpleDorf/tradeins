// ==UserScript==
// @name         Tesla Trade-Ins — AMP acquisition scrape
// @namespace    https://www.teslatradeins.com.au
// @version      1.3.0
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

  async function blobToBase64(blob) {
    const buffer = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async function waitForImageReady(img, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (img.src && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        return true;
      }
      try {
        if (typeof img.decode === "function") {
          await img.decode();
          if (img.naturalWidth > 0) return true;
        }
      } catch {
        // keep waiting
      }
      await sleep(200);
    }
    return img.complete && img.naturalWidth > 0;
  }

  async function captureViaCanvas(img) {
    const ready = await waitForImageReady(img);
    if (!ready) {
      throw new Error("Image never finished loading in DOM");
    }
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unsupported");
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const base64 = dataUrl.split(",")[1];
    if (!base64) throw new Error("Canvas capture empty");
    return { contentBase64: base64, mimeType: "image/jpeg" };
  }

  async function captureViaFetch(img) {
    const res = await fetch(img.src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    if (!blob.type.startsWith("image/") && blob.size === 0) {
      throw new Error(`Not an image (${blob.type || "unknown"})`);
    }
    // Some blob responses have empty type but are still images.
    const mimeType = blob.type.startsWith("image/") ? blob.type : "image/jpeg";
    return { contentBase64: await blobToBase64(blob), mimeType };
  }

  async function captureImage(img) {
    // Prefer canvas first — blob: URLs often revoke / fail to re-fetch on later AMP pages.
    try {
      return await captureViaCanvas(img);
    } catch (canvasError) {
      debug(
        `Canvas capture failed (${canvasError instanceof Error ? canvasError.message : "error"}), trying fetch…`
      );
      return await captureViaFetch(img);
    }
  }

  async function ensureTileImage(wrapper, title) {
    const findImg = () => wrapper.querySelector("img.tile-asset-img");

    let img = findImg();
    if (img?.src) {
      await waitForImageReady(img, 5000);
      if (img.naturalWidth > 0) return img;
    }

    // Click the asset/card to force AMP to hydrate the thumbnail.
    const clickTargets = [
      wrapper.querySelector(".tds-card-asset"),
      wrapper.querySelector(".tds-card"),
      wrapper.querySelector(".pdf-click-catcher"),
      wrapper,
    ].filter(Boolean);

    for (const target of clickTargets) {
      try {
        target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      } catch {
        try {
          target.click();
        } catch {
          // ignore
        }
      }
      await sleep(600);
      img = findImg();
      if (img?.src) {
        const ready = await waitForImageReady(img, 6000);
        if (ready) return img;
      }
    }

    // Final wait loop — lazy images sometimes appear after neighboring tiles load.
    for (let i = 0; i < 20; i += 1) {
      img = findImg();
      if (img?.src) {
        const ready = await waitForImageReady(img, 2000);
        if (ready) return img;
      }
      await sleep(300);
    }

    debug(`No image element after retries: ${title}`);
    return null;
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

  async function collectPhotos(origin, jobId) {
    const photos = [];
    const failures = [];
    const seenTitles = [];

    // Wait until tiles exist.
    await waitFor("#current-files-tab .tile-wrapper, .tile-wrapper", 60000);
    await sleep(1000);

    // Process tiles one-by-one: scroll into view → force image → capture immediately.
    // Re-query each loop because AMP may virtualize/replace nodes.
    const processed = new Set();
    let idleRounds = 0;

    while (idleRounds < 3) {
      const wrappers = [
        ...document.querySelectorAll("#current-files-tab .tile-wrapper, .tile-wrapper"),
      ];
      let madeProgress = false;

      debug(`Tile pass: ${wrappers.length} tiles, ${processed.size} processed, ${photos.length} photos`);

      for (let index = 0; index < wrappers.length; index += 1) {
        const wrapper = wrappers[index];
        const title = (wrapper.querySelector(".title-header")?.textContent || "").trim();
        const fileName = (
          wrapper.querySelector(".tile-name")?.textContent || `${title || "document"}.jpg`
        ).trim();
        const key = `${title}::${fileName}`;

        if (!seenTitles.includes(title || "(untitled)")) {
          seenTitles.push(title || "(untitled)");
        }
        if (processed.has(key)) continue;
        processed.add(key);
        madeProgress = true;

        if (!title || EXCLUDED.has(title)) {
          debug(`Skip excluded/empty: ${title || "(untitled)"}`);
          continue;
        }

        // Skip obvious PDFs with no image opportunity later if still no img.
        const hasPdf = Boolean(wrapper.querySelector("iframe.pdf-preview, .pdf-container"));

        try {
          wrapper.scrollIntoView({ block: "center", inline: "nearest" });
          await sleep(250);

          const img = await ensureTileImage(wrapper, title);
          if (!img) {
            if (hasPdf) {
              debug(`Skip PDF-only tile: ${title}`);
            } else {
              failures.push(`${title}: no image element`);
              debug(`Skip (no image element): ${title}`);
            }
            continue;
          }

          const captured = await captureImage(img);
          const photo = {
            title,
            fileName,
            mimeType: captured.mimeType,
            contentBase64: captured.contentBase64,
          };

          await uploadPhoto(origin, jobId, photo);
          photos.push(photo);
          debug(`Uploaded photo ${photos.length}: ${title}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : "photo failed";
          failures.push(`${title}: ${message}`);
          debug(`Photo failed: ${title} — ${message}`);
        }
      }

      if (!madeProgress) {
        idleRounds += 1;
      } else {
        idleRounds = 0;
      }

      // Scroll container to encourage more lazy tiles, then re-scan once more.
      const root =
        document.querySelector("#current-files-tab") ||
        document.querySelector(".tile-container");
      if (root) root.scrollTop = root.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(800);
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
            "No vehicle photos could be captured from Customer Documents (blob fetch/canvas failed or images never loaded).",
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
