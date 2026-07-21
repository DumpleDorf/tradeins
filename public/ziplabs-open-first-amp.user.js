// ==UserScript==
// @name         Tesla Trade-Ins — Open first ZipLabs AMPLink
// @namespace    https://www.teslatradeins.com.au
// @version      1.0.0
// @description  On the ZipLabs wholesale dashboard, wait for the table and open the first AMPLink.
// @match        https://ziplabs.teslamotors.com/superset/dashboard/69331/*
// @match        https://ziplabs.teslamotors.com/superset/dashboard/69331/
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(async function openFirstZiplabsAmpLink() {
  function findFirstAmpLink() {
    return (
      document.querySelector(
        'tr.tablev2-first-row a[href*="amp.tesla.com/acquisition/"]'
      ) ||
      document.querySelector('a[href*="amp.tesla.com/acquisition/"]')
    );
  }

  for (let attempt = 0; attempt < 120; attempt += 1) {
    const link = findFirstAmpLink();
    const href = link && link.getAttribute("href");
    if (href) {
      const absolute = new URL(href, window.location.origin).href;
      window.open(absolute, "_blank", "noopener,noreferrer");
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.warn(
    "[teslatradeins] Could not find an AMPLink on the ZipLabs report after waiting."
  );
})();
