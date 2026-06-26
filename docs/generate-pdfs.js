const path = require("path");
const { mdToPdf } = require("md-to-pdf");

const docs = [
  { input: "01-platform-overview.md", output: "Tesla-Trade-Ins-Platform-Overview.pdf" },
  { input: "02-partner-manual.md", output: "Tesla-Trade-Ins-Partner-Manual.pdf" },
  { input: "03-tesla-staff-manual.md", output: "Tesla-Trade-Ins-Tesla-Staff-Manual.pdf" },
];

const docsDir = __dirname;
const cssPath = path.join(docsDir, "styles.css");

async function build() {
  for (const doc of docs) {
    const inputPath = path.join(docsDir, doc.input);
    const outputPath = path.join(docsDir, doc.output);
    console.log(`Generating ${doc.output}...`);

    const pdf = await mdToPdf(
      { path: inputPath },
      {
        dest: outputPath,
        css: cssPath,
        pdf_options: {
          format: "A4",
          margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
          printBackground: true,
        },
        launch_options: { args: ["--no-sandbox"] },
      }
    );

    if (pdf) {
      console.log(`  ✓ ${outputPath}`);
    } else {
      console.error(`  ✗ Failed: ${doc.output}`);
    }
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
